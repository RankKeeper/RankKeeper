// supabaseSync.js
// Uses the shared supabase client so the session is always available.

import { supabase as db } from './supabaseClient.js'

const RANK_TO_BELT = {
  'Beginner':  'White',
  '10th Kyu':  'White',  '9th Kyu':   'White',
  '8th Kyu':   'Yellow', '7th Kyu':   'Yellow',
  '6th Kyu':   'Orange', '5th Kyu':   'Orange',
  '4th Kyu':   'Green',
  '3rd Kyu':   'Blue',
  '2nd Kyu':   'Purple',
  '1st Kyu':   'Brown',
  'Shodan':    'Black',  'Nidan':     'Black',
  'Sandan':    'Black',  'Yondan':    'Black',
  'Godan':     'Black',  'Rokudan':   'Black',
  'Shichidan': 'Black',  'Hachidan':  'Black',
  'Kudan':     'Black',
}

function rankToBelt(rank) {
  return RANK_TO_BELT[rank] || 'White'
}

async function getCurrentUser() {
  const { data: { session } } = await db.auth.getSession()
  return session?.user || null
}

export async function syncRoster(roster, history) {
  const user = await getCurrentUser()
  if (!user) return

  const rankOf = {}
  const stripeOf = {}
  roster.forEach(s => {
    const passes = history
      .filter(h => h.studentId === s.id && h.result === 'Pass')
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    rankOf[s.id] = passes.length ? passes[0].rank : 'Beginner'

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

export async function syncRankTest(entry) {
  const user = await getCurrentUser()
  if (!user) return

  const { data: studentRow } = await db
    .from('students')
    .select('id')
    .eq('app_id', entry.studentId)
    .single()

  if (!studentRow) return

  const result = entry.result === 'Pass'   ? 'pass'
               : entry.result === 'Stripe' ? 'stripe'
               : 'fail'

  await db.from('rank_tests').insert({
    student_id:   studentRow.id,
    dojo_id:      user.id,
    tested_belt:  rankToBelt(entry.rank || 'Beginner'),
    result:       result,
    test_date:    entry.date,
    notes:        entry.note || null,
    score:        null,
    tester_id:    null,
  })

  if (result === 'pass') {
    await db.from('students').update({
      belt:       rankToBelt(entry.rank),
      has_stripe: false,
    }).eq('app_id', entry.studentId)
  }

  if (result === 'stripe') {
    await db.from('students').update({ has_stripe: true })
      .eq('app_id', entry.studentId)
  }
}

export async function loadFromSupabase() {
  const user = await getCurrentUser()
  if (!user) { console.log('[sync] no user session'); return null }

  const { data: students, error: sErr } = await db
    .from('students')
    .select('*')
    .eq('dojo_id', user.id)
    .eq('active', true)
    .order('name')

  if (sErr) { console.error('[sync] students fetch error:', sErr); return null }
  console.log('[sync] students from Supabase:', students?.length)
  if (!students?.length) return null

  const { data: tests, error: tErr } = await db
    .from('rank_tests')
    .select('*')
    .eq('dojo_id', user.id)
    .order('test_date', { ascending: true })

  if (tErr) console.error('[sync] rank_tests fetch error:', tErr)

  // Include dob in roster so cross-device gets full student data
  const roster = students.map(s => ({ id: s.app_id || s.id, name: s.name, dob: s.dob || null }))

  const history = (tests || []).map(t => {
    const student = students.find(s => s.id === t.student_id)
    const appResult = t.result === 'pass' ? 'Pass' : t.result === 'stripe' ? 'Stripe' : 'Refer'
    return {
      id:          t.id,
      studentId:   student?.app_id || t.student_id,
      studentName: student?.name || '',
      date:        t.test_date,
      grade:       t.tested_belt,
      result:      appResult,
      rank:        t.tested_belt,
      stripes:     t.result === 'stripe' ? 1 : 0,
      note:        t.notes || '',
    }
  })

  return { roster, history }
}
