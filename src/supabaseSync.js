// supabaseSync.js
// Drop-in Supabase sync layer for RankKeeper.
// Mirrors every localStorage write to Supabase silently.
// The app continues to work from localStorage — Supabase is the backup/sync layer.
// Add to src/ folder and import in App.jsx.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://vxrsvhgdzqauofhsazkf.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnN2aGdkenFhdW9maHNhemtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODQxNzgsImV4cCI6MjA5NjM2MDE3OH0._5nxN5r0bCAog8FIJ3w-cOvJezsXDr6Rt9-xG6Sk4PM'

export const db = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── Belt helpers ─────────────────────────────────────────────────────────────
// Maps the app's rank strings to belt color strings for the students table
const RANK_TO_BELT = {
  'Beginner':  'White',
  '10th Kyu':  'White',
  '9th Kyu':   'White',
  '8th Kyu':   'Yellow',
  '7th Kyu':   'Yellow',
  '6th Kyu':   'Orange',
  '5th Kyu':   'Orange',
  '4th Kyu':   'Green',
  '3rd Kyu':   'Blue',
  '2nd Kyu':   'Purple',
  '1st Kyu':   'Brown',
  'Shodan':    'Black',
  'Nidan':     'Black',
  'Sandan':    'Black',
  'Yondan':    'Black',
  'Godan':     'Black',
}

function rankToBelt(rank) {
  return RANK_TO_BELT[rank] || 'White'
}

// ── Get current user (null if not logged in) ──────────────────────────────────
export async function getCurrentUser() {
  const { data: { session } } = await db.auth.getSession()
  return session?.user || null
}

// ── Sync roster to Supabase students table ────────────────────────────────────
// Called whenever persistStudents() runs in App.jsx
// roster = [{ id, name }]  (app's local format)
// history = [{ id, studentId, date, grade, result, rank, stripes, scores }]
export async function syncRoster(roster, history) {
  const user = await getCurrentUser()
  if (!user) return   // not logged in — skip silently

  // Build current rank + stripe state per student from history
  const rankOf    = {}
  const stripeOf  = {}
  roster.forEach(s => {
    const passes = history
      .filter(h => h.studentId === s.id && h.result === 'Pass')
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    rankOf[s.id] = passes.length ? passes[0].rank : 'Beginner'

    // Count stripes since last pass
    const sorted = history
      .filter(h => h.studentId === s.id)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
    let n = 0
    sorted.forEach(e => {
      if (e.result === 'Pass') n = 0
      else if (e.result === 'Stripe') n += (e.stripes || 1)
    })
    stripeOf[s.id] = n > 0
  })

  // Upsert each student — uses local id as the lookup key via a unique constraint
  // We store the app's local uid in an `app_id` column so we can match records
  for (const s of roster) {
    const belt = rankToBelt(rankOf[s.id] || 'Beginner')
    await db.from('students').upsert(
      {
        app_id:     s.id,
        dojo_id:    user.id,
        name:       s.name,
        belt:       belt,
        has_stripe: stripeOf[s.id] || false,
        active:     true,
      },
      { onConflict: 'app_id' }
    )
  }
}

// ── Sync a single rank test result to rank_tests ──────────────────────────────
// Called after recordResult() in App.jsx
// entry = the history object just pushed
export async function syncRankTest(entry) {
  const user = await getCurrentUser()
  if (!user) return

  // Look up the Supabase student id from app_id
  const { data: studentRow } = await db
    .from('students')
    .select('id')
    .eq('app_id', entry.studentId)
    .single()

  if (!studentRow) return   // student not synced yet — will catch on next full sync

  const result = entry.result === 'Pass'   ? 'pass'
               : entry.result === 'Stripe' ? 'stripe'
               : entry.result === 'Refer'  ? 'fail'   // Refer treated as fail for records
               : 'fail'

  await db.from('rank_tests').insert({
    student_id:   studentRow.id,
    dojo_id:      user.id,
    tested_belt:  rankToBelt(entry.rank || 'Beginner'),
    result:       result,
    test_date:    entry.date,
    notes:        entry.note || null,
    score:        null,       // app doesn't capture numeric score yet — placeholder
    tester_id:    null,
  })

  // If pass — update belt on students table
  if (result === 'pass') {
    await db.from('students').update({
      belt:       rankToBelt(entry.rank),
      has_stripe: false,
    }).eq('app_id', entry.studentId)
  }

  // If stripe — set stripe flag
  if (result === 'stripe') {
    await db.from('students').update({ has_stripe: true })
      .eq('app_id', entry.studentId)
  }
}

// ── Full load from Supabase on startup ────────────────────────────────────────
// Returns { roster, history } in the app's local format, or null if not logged in
// The app should prefer localStorage if it has data — this is a fallback/merge
export async function loadFromSupabase() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data: students } = await db
    .from('students')
    .select('*')
    .eq('dojo_id', user.id)
    .eq('active', true)
    .order('name')

  if (!students?.length) return null

  const { data: tests } = await db
    .from('rank_tests')
    .select('*')
    .eq('dojo_id', user.id)
    .order('test_date', { ascending: true })

  // Convert back to app format
  const roster = students.map(s => ({ id: s.app_id || s.id, name: s.name }))

  const history = (tests || []).map(t => {
    const student = students.find(s => s.id === t.student_id)
    const appResult = t.result === 'pass' ? 'Pass' : t.result === 'stripe' ? 'Stripe' : 'Refer'
    return {
      id:          t.id,
      studentId:   student?.app_id || t.student_id,
      studentName: student?.name || '',
      date:        t.test_date,
      grade:       t.tested_belt,   // approximate — grade key not stored in rank_tests
      result:      appResult,
      rank:        t.tested_belt,
      stripes:     t.result === 'stripe' ? 1 : 0,
      note:        t.notes || '',
    }
  })

  return { roster, history }
}
