import React, { useState, useEffect, useRef, useMemo } from "react";
import { Settings, ClipboardList, Printer, Plus, Trash2, RotateCcw, Check, ChevronDown, UserRound, Eraser, GraduationCap, Mail, ChevronRight, CircleCheck, Upload, Download } from "lucide-react";
import { syncRoster, syncRankTest } from './supabaseSync'

/* ====================================================================
   JKA HQ Kyu/Dan Grading Guideline (effective 1 April 2017)
   Default preset. Fully editable per dojo in Settings.
==================================================================== */
const JKA = [
  { grade: "10th Kyu", from: "Beginner", to: "10th Kyu",
    kihon: ["Chudan Choku-zuki", "Jodan Age-uke", "Chudan Soto-uke", "Gedan Barai", "Mae-geri (Heisoku-dachi, gedan kakiwake)"], kata: [], kumite: [] },
  { grade: "9th Kyu", from: "10th Kyu", to: "9th Kyu",
    kihon: ["Chudan Jun-zuki", "Jodan Age-uke", "Chudan Soto-uke", "Mae-geri (Zenkutsu-dachi, gedan kakiwake)"], kata: [], kumite: [] },
  { grade: "8th Kyu", from: "9th Kyu", to: "8th Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Jodan Age-uke (step in)", "Chudan Soto-uke (step in)", "Gedan Barai (step in)", "Kokutsu Shuto-uke (step in)", "Mae-geri / gedan kakiwake (step in)", "Yoko-geri Keage (Heisoku-dachi, R & L ×2)"],
    kata: ["Taikyoku Shodan"], kumite: ["Gohon Kumite — Jodan Jun-zuki", "Gohon Kumite — Chudan Jun-zuki"] },
  { grade: "7th Kyu", from: "8th Kyu", to: "7th Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Jodan Age-uke (step back)", "Chudan Soto-uke (step in)", "Chudan Uchi-uke (step back)", "Kokutsu Shuto-uke (step in)", "Mae-geri / gedan kakiwake (step in)", "Yoko-geri Keage (Kiba-dachi, R & L)"],
    kata: ["Heian Shodan"], kumite: ["Gohon Kumite — Jodan Jun-zuki", "Gohon Kumite — Chudan Jun-zuki"] },
  { grade: "6th Kyu", from: "7th Kyu", to: "6th Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Jodan Age-uke (step back)", "Chudan Soto-uke (step in)", "Chudan Uchi-uke (step back)", "Kokutsu Shuto-uke (step in)", "Mae-geri / gedan kakiwake (step in)", "Yoko-geri Keage (Kiba-dachi, R & L)", "Yoko-geri Kekomi (Kiba-dachi, R & L)"],
    kata: ["Heian Nidan"], kumite: ["Kihon Ippon Kumite — Jodan Jun-zuki (R & L)", "Kihon Ippon Kumite — Chudan Jun-zuki (R & L)"] },
  { grade: "5th Kyu", from: "6th Kyu", to: "5th Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Jodan Age-uke, Gyaku-zuki (step back)", "Chudan Soto-uke, Gyaku-zuki (step in)", "Chudan Uchi-uke, Chudan Gyaku-zuki (step back)", "Kokutsu Shuto-uke (step in)", "Mae-geri / gedan kakiwake (step in)", "Yoko-geri Keage (Kiba-dachi, R & L)", "Yoko-geri Kekomi (Kiba-dachi, R & L)"],
    kata: ["Heian Sandan"], kumite: ["Kihon Ippon Kumite — Jodan Jun-zuki (R & L)", "Kihon Ippon Kumite — Chudan Jun-zuki (R & L)", "Kihon Ippon Kumite — Chudan Mae-geri / gedan kakiwake (R & L)"] },
  { grade: "4th Kyu", from: "5th Kyu", to: "4th Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Jodan Age-uke, Gyaku-zuki (step back)", "Chudan Soto-uke, Gyaku-zuki (step in)", "Chudan Uchi-uke, Gyaku-zuki (step back)", "Kokutsu Shuto-uke, Zenkutsu Nukite (step in)", "Mae-geri / gedan kakiwake (step in)", "Yoko-geri Keage (Kiba-dachi, R & L)", "Yoko-geri Kekomi (Kiba-dachi, R & L)"],
    kata: ["Heian Yondan"], kumite: ["Kihon Ippon Kumite — Jodan Jun-zuki (R & L)", "Kihon Ippon Kumite — Chudan Jun-zuki (R & L)", "Kihon Ippon Kumite — Chudan Mae-geri (R & L)", "Kihon Ippon Kumite — Chudan Yoko-geri Kekomi (R & L)"] },
  { grade: "3rd Kyu", from: "4th Kyu", to: "3rd Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Jodan Age-uke, Gyaku-zuki (step back)", "Chudan Soto-uke, Gyaku-zuki (step in)", "Chudan Uchi-uke, Gyaku-zuki (step back)", "Kokutsu Shuto-uke, Zenkutsu Nukite (step in)", "Mae-geri / gedan kakiwake (step in)", "Ren-geri — gedan kakiwake, chudan, jodan (step in)", "Mawashi-geri", "Yoko-geri Keage (Kiba-dachi, R & L)", "Yoko-geri Kekomi (Kiba-dachi, R & L)"],
    kata: ["Heian Godan"], kumite: ["Kihon Ippon Kumite — Jodan Jun-zuki (R & L)", "Kihon Ippon Kumite — Chudan Jun-zuki (R & L)", "Kihon Ippon Kumite — Chudan Mae-geri (R & L)", "Kihon Ippon Kumite — Chudan Yoko-geri Kekomi (R & L)"] },
  { grade: "2nd Kyu", from: "3rd Kyu", to: "2nd Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Jodan Age-uke, Gyaku-zuki (step back)", "Chudan Soto-uke → Kiba-dachi, Yoko Enpi, Yoko Uraken Uchi (step in)", "Chudan Uchi-uke, Gyaku-zuki (step back)", "Kokutsu Shuto-uke, Zenkutsu Nukite (step in)", "Mae-geri / gedan kakiwake (step in)", "Ren-geri — gedan kakiwake, chudan, jodan (step in)", "Mawashi-geri (step in)", "Yoko-geri Keage (Kiba-dachi, R & L)", "Yoko-geri Kekomi (Zenkutsu-dachi)"],
    kata: ["Tekki Shodan"], kumite: ["Jiyu Ippon Kumite — Jodan Jun-zuki, Chudan Jun-zuki, Chudan Mae-geri, Chudan Yoko-geri Kekomi (right)"] },
  { grade: "1st Kyu", from: "2nd Kyu", to: "1st Kyu",
    kihon: ["Chudan Jun-zuki (step in)", "Sanbon Ren-zuki (step in)", "Jodan Age-uke, Gyaku-zuki (step back)", "Chudan Soto-uke, Yoko Enpi, Yoko Uraken Uchi (Zenkutsu → Kiba-dachi) (step in)", "Chudan Uchi-uke, Gyaku-zuki (step back)", "Kokutsu Shuto-uke, Zenkutsu Nukite (step in)", "Mae-geri / gedan kakiwake (step in)", "Ren-geri — gedan kakiwake, chudan, jodan (step in)", "Mawashi-geri (step in)", "Yoko-geri Keage (Kiba-dachi, R & L)", "Yoko-geri Kekomi (Zenkutsu-dachi)"],
    kata: ["Choice: Bassai Dai, Kanku Dai, Enpi or Jion"], kumite: ["Jiyu Ippon Kumite — Jodan Jun-zuki, Chudan Jun-zuki, Chudan Mae-geri, Chudan Yoko-geri Kekomi, Jodan Mawashi-geri (right)"] },
  { grade: "1st Dan (Shodan)", from: "1st Kyu", to: "Shodan", dan: "Min. age 16 · from 1st Kyu after required training (WKF / NF framework — verify)",
    kihon: ["Chudan Jun-zuki (step in)", "Sanbon Ren-zuki (step in)", "Jodan Age-uke, Gyaku-zuki (step back)", "Chudan Soto-uke, Yoko Enpi, Yoko Uraken Uchi, Gyaku-zuki (Zenkutsu → Kiba → Zenkutsu) (step in)", "Chudan Uchi-uke, Kizami-zuki, Gyaku-zuki (step back)", "Kokutsu Shuto-uke, Zenkutsu Nukite (step in)", "Mae-geri / gedan kakiwake (step in)", "Ren-geri — gedan kakiwake, chudan, jodan (step in)", "Mawashi-geri (step in)", "Yoko-geri Keage (Kiba-dachi, R & L)", "Yoko-geri Kekomi (Zenkutsu-dachi)"],
    kata: ["Choice: Bassai Dai, Kanku Dai, Enpi or Jion"], kumite: ["Jiyu Ippon Kumite (right, one side) — Jodan Jun-zuki, Chudan Jun-zuki, Chudan Mae-geri, Chudan Yoko-geri Kekomi, Chudan Mawashi-geri"] },
  { grade: "2nd Dan (Nidan)", from: "Shodan", to: "Nidan", dan: "Min. 2 years after 1st Dan (WKF / NF framework — verify)",
    kihon: ["Chudan Jun-zuki (step in)", "Sanbon Ren-zuki (step in)", "Age-uke, Soto-uke (same arm), Gyaku-zuki (step back)", "Uchi-uke, Kizami-zuki, Gyaku-zuki (Kokutsu → Zenkutsu) (step in)", "Kokutsu Shuto-uke, Kizami Mae-geri, Zenkutsu Nukite (step back)", "Ren-geri — gedan kakiwake, chudan, jodan (step in)", "Yoko-geri Keage & Kekomi (Kiba-dachi, alternate feet)", "Yoko-geri Kekomi (Zenkutsu-dachi) (step in)", "Mawashi-geri (step in)", "Age-uke, Mawashi-geri, Yoko Uraken Uchi, Chudan Jun-zuki (step back)"],
    kata: ["Student's favourite kata (tokui)"], kumite: ["Jiyu Kumite"] },
  { grade: "3rd Dan (Sandan)", from: "Nidan", to: "Sandan", dan: "Min. 3 years after 2nd Dan (WKF / NF framework — verify)",
    kihon: ["Jodan Kizami-zuki, Jodan Jun-zuki, Chudan Gyaku-zuki (free kamae) (step in)", "Jodan Age-uke, Chudan Soto-uke (same arm), Gyaku-zuki (step back)", "Chudan Uchi-uke, Kizami-zuki, Gyaku-zuki (Kokutsu → Zenkutsu) (step in)", "Kokutsu Shuto-uke, Kizami Mae-geri, Zenkutsu Nukite (step back)", "Age-uke (step in), Mawashi-geri, Yoko Uraken Uchi, Chudan Jun-zuki (step back)", "Mae-geri, Gyaku-zuki, Yoko-geri Kekomi, Gyaku-zuki, Mawashi-geri, Gyaku-zuki (alternate feet) (step in)"],
    kata: ["Student's favourite kata (tokui)"], kumite: ["Jiyu Kumite"] },
  { grade: "4th Dan (Yondan)", from: "Sandan", to: "Yondan", dan: "Min. 4 years after 3rd Dan (WKF / NF framework — verify)",
    kihon: ["Sanbon Ren-zuki (step in)", "Age-uke, Soto-uke (same arm), Gyaku-zuki (step back)", "Chudan Uchi-uke, Kizami-zuki, Gyaku-zuki (Kokutsu, Zenkutsu) (step in)", "Shuto-uke, Kizami Mae-geri, Zenkutsu Nukite (step back)", "Mae-geri, Jun-zuki (step in)", "Mae-geri, Gyaku-zuki (step in)", "Yoko-geri Kekomi, Gyaku-zuki (step in)", "Mawashi-geri, Gyaku-zuki (step in)", "Mae-geri, Yoko-geri Kekomi, Ushiro-geri (Zenkutsu-dachi, same feet R & L)"],
    kata: ["Examiner's choice: Heian Shodan – Tekki Nidan", "Student's favourite kata (tokui)"], kumite: ["Jiyu Kumite"] },
  { grade: "5th Dan (Godan)", from: "Yondan", to: "Godan", dan: "Min. 5 years after 4th Dan (WKF / NF framework — verify)",
    kihon: ["Sanbon Ren-zuki (step in)", "Age-uke, Soto-uke (same arm), Gyaku-zuki (step back)", "Chudan Uchi-uke, Kizami-zuki, Gyaku-zuki (Kokutsu, Zenkutsu) (step in)", "Shuto-uke, Kizami Mae-geri, Zenkutsu Nukite (step back)", "Mae-geri, Jodan Jun-zuki, Chudan Gyaku-zuki (step in)", "Yoko-geri Kekomi, Gyaku-zuki (step in)", "Mawashi-geri, Gyaku-zuki (step in)", "Mae-geri, Yoko-geri Kekomi, Mawashi-geri, Gyaku-zuki (alternate feet) (step in)", "Mae-geri, Yoko-geri Kekomi, Ushiro-geri (Zenkutsu-dachi, same foot R & L)"],
    kata: ["Examiner's choice: Heian Shodan – Tekki Sandan", "Student's favourite kata + Q&A"], kumite: ["Jiyu Kumite"] },
];

const KYU_LADDER = JKA.map((g) => ({ grade: g.grade, from: g.from, to: g.to, dan: g.dan || undefined, kihon: [], kata: [], kumite: [] }));
const PRESETS = {
  "JKA Shotokan": { complete: true, grades: JKA },
  "KUGB Shotokan": { complete: false, grades: KYU_LADDER },
  "SKIF Shotokan": { complete: false, grades: KYU_LADDER },
  "Wad\u014d-ry\u016b": { complete: false, grades: KYU_LADDER },
  "Custom / My Dojo": { complete: true, grades: JKA },
};

let _uid = 0;
const uid = () => `r${_uid++}${Date.now().toString(36).slice(-3)}`;
const today = () => new Date().toISOString().slice(0, 10);

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length);
  if (!lines.length) return [];
  const parseLine = (line) => {
    const out = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else { if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c; }
    }
    out.push(cur); return out.map((s) => s.trim());
  };
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
  return lines.slice(1).map((line) => { const cells = parseLine(line); const o = {}; headers.forEach((h, i) => { o[h] = cells[i] !== undefined ? cells[i] : ""; }); return o; });
}

function buildSyllabus(preset) {
  const out = {};
  preset.forEach((g) => {
    out[g.grade] = {
      from: g.from, to: g.to, dan: g.dan || null,
      sections: [
        { id: "kihon", title: "Kihon — Ido Kihon (Moving Basics)", items: g.kihon.map((t) => ({ id: uid(), text: t, on: true })) },
        { id: "kata", title: "Kata", items: g.kata.map((t) => ({ id: uid(), text: t, on: true })) },
        { id: "kumite", title: "Kumite", items: g.kumite.map((t) => ({ id: uid(), text: t, on: true })) },
      ],
    };
  });
  return out;
}

/* ---- persistence (artifact storage; acts as the database for this build) ---- */
const hasStore = () => typeof window !== "undefined" && !!window.localStorage;
async function loadKey(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
async function saveKey(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { console.error("save failed", e); return false; }
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Caveat:wght@600&display=swap');
:root{ --paper:#F4F1EA; --paper2:#ECE7DA; --ink:#22231E; --ink-soft:#5A5A50; --line:#D8D2C4; --crimson:#A8322A; --crimson-d:#8A2820; --indigo:#34435B; --gold:#B08B3E; }
.ng-root{ font-family:'Zen Kaku Gothic New',system-ui,sans-serif; color:var(--ink);
  background: radial-gradient(circle at 18% -10%, rgba(168,50,42,.05), transparent 55%), radial-gradient(circle at 110% 18%, rgba(52,67,91,.05), transparent 50%), var(--paper); min-height:100vh; }
.ng-serif{ font-family:'Shippori Mincho',Georgia,serif; }
.ng-fade{ opacity:0; transform:translateY(8px); animation:ngIn .5s cubic-bezier(.2,.7,.3,1) forwards; }
@keyframes ngIn{ to{ opacity:1; transform:none; } }
.ng-input,.ng-select{ background:#fff; border:1px solid var(--line); border-radius:9px; padding:10px 12px; font-size:14px; color:var(--ink); width:100%; outline:none; transition:border-color .15s,box-shadow .15s; font-family:inherit; }
.ng-input:focus,.ng-select:focus{ border-color:var(--indigo); box-shadow:0 0 0 3px rgba(52,67,91,.12); }
.ng-select{ appearance:none; padding-right:34px; cursor:pointer; }
.ng-btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; border:none; border-radius:10px; padding:11px 16px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:transform .08s, background .15s; }
.ng-btn:active{ transform:translateY(1px); }
.ng-btn-primary{ background:var(--crimson); color:#fff; box-shadow:0 2px 0 var(--crimson-d); }
.ng-btn-primary:hover{ background:var(--crimson-d); }
.ng-btn-ink{ background:var(--ink); color:var(--paper); }
.ng-btn-ghost{ background:#fff; color:var(--ink); border:1px solid var(--line); }
.ng-btn-ghost:hover{ border-color:var(--ink-soft); }
.ng-chip{ border:1px solid var(--line); background:#fff; border-radius:999px; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; color:var(--ink-soft); font-family:inherit; }
.ng-chip-on{ background:var(--ink); color:var(--paper); border-color:var(--ink); }
.ng-card{ background:rgba(255,255,255,.6); border:1px solid var(--line); border-radius:16px; }
.ng-check{ width:21px; height:21px; border-radius:6px; border:1.5px solid var(--line); background:#fff; display:grid; place-items:center; cursor:pointer; flex:none; transition:all .12s; }
.ng-check-on{ background:var(--crimson); border-color:var(--crimson); }
.ng-row-off{ opacity:.4; }
.lbl{ display:block; font-size:11px; font-weight:700; color:#5A5A50; letter-spacing:.07em; margin-bottom:6px; text-transform:uppercase; }
/* nav */
.nav-tab{ flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:9px 4px; border-radius:11px; cursor:pointer; border:none; background:transparent; color:var(--ink-soft); font-family:inherit; font-size:11.5px; font-weight:600; transition:all .15s; }
.nav-tab-on{ background:var(--ink); color:var(--paper); }
/* signature */
.sig-wrap{ border:1px dashed var(--ink-soft); border-radius:10px; background:#fff; position:relative; }
.sig-canvas{ width:100%; height:auto; display:block; touch-action:none; border-radius:10px; }
/* the sheet */
.sheet{ background:#fff; border:1px solid var(--line); box-shadow:0 18px 40px -24px rgba(34,35,30,.35); border-radius:6px; }
.sheet-inner{ border:2px solid var(--ink); }
.sheet-inner2{ border:1px solid var(--ink); margin:5px; padding:26px 28px; }
.sheet-sec{ font-family:'Shippori Mincho',serif; font-weight:700; letter-spacing:.02em; border-bottom:2px solid var(--ink); padding-bottom:4px; margin:16px 0 6px; font-size:15px; }
.sheet-item{ display:flex; justify-content:space-between; align-items:baseline; gap:14px; padding:7px 0; border-bottom:1px dotted var(--line); font-size:13.5px; }
.circle-opt{ font-family:'Shippori Mincho',serif; font-size:12.5px; letter-spacing:.02em; color:var(--ink); white-space:nowrap; flex:none; }
.circle-opt span{ padding:2px 9px; display:inline-block; }
.opt-pick{ border:1.7px solid var(--crimson); color:var(--crimson) !important; font-weight:700; border-radius:46% 44% 47% 43% / 47% 46% 44% 45%; }
.stamp{ border:2px solid var(--crimson); color:var(--crimson); border-radius:8px; font-family:'Shippori Mincho',serif; font-weight:700; padding:5px 11px; transform:rotate(-3deg); display:inline-block; font-size:13px; }
.dan-note{ background:#FBF6EC; border:1px solid var(--gold); border-radius:8px; padding:9px 12px; font-size:12.5px; color:#6B541F; }
.sig-line{ font-family:'Caveat',cursive; font-size:30px; line-height:1; color:var(--ink); }
@media print{
  .no-print{ display:none !important; }
  .ng-root{ background:#fff !important; }
  .sheet{ box-shadow:none !important; border:none !important; }
  .print-area{ margin:0 !important; max-width:none !important; }
  @page{ margin:13mm; }
}
@media (min-width:820px){ .two-col{ grid-template-columns:1fr 1fr !important; } }
`;

/* ---------- Signature pad ---------- */
function SignaturePad({ initial, onSave }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [hasInk, setHasInk] = useState(!!initial);

  useEffect(() => {
    const c = ref.current; const ctx = c.getContext("2d");
    ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#22231E";
    if (initial) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height); img.src = initial; }
  }, []);

  const posOf = (e) => {
    const c = ref.current; const r = c.getBoundingClientRect();
    const s = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: (s.clientX - r.left) * (c.width / r.width), y: (s.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; const { x, y } = posOf(e); const ctx = ref.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const { x, y } = posOf(e); const ctx = ref.current.getContext("2d"); ctx.lineTo(x, y); ctx.stroke(); dirty.current = true; setHasInk(true); };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); dirty.current = true; setHasInk(false); onSave(""); };
  const save = () => { onSave(ref.current.toDataURL("image/png")); dirty.current = false; };

  return (
    <div>
      <div className="sig-wrap">
        <canvas ref={ref} width={600} height={150} className="sig-canvas"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
        <button className="ng-btn ng-btn-ghost" style={{ padding: "8px 13px", fontSize: 13 }} onClick={clear}><Eraser size={15} /> Clear</button>
        <button className="ng-btn ng-btn-ink" style={{ padding: "8px 13px", fontSize: 13 }} onClick={save}><Check size={15} /> Save signature</button>
        <span style={{ fontSize: 12.5, color: hasInk ? "var(--indigo)" : "var(--ink-soft)", alignSelf: "center", marginLeft: "auto" }}>{hasInk ? "Signature on file" : "No signature yet"}</span>
      </div>
    </div>
  );
}

/* ====================================================================
   MAIN APP
==================================================================== */
export default function GradingApp() {
  const [screen, setScreen] = useState("settings");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("idle"); // idle|saving|saved|local

  const [sensei, setSensei] = useState({ name: "", title: "Sensei", dojo: "", system: "JKA Shotokan", scoring: "passrefer", signature: "" });
  const [syllabus, setSyllabus] = useState(() => buildSyllabus(PRESETS["JKA Shotokan"].grades));
  const [roster, setRoster] = useState([]);     // [{id, name}]
  const [history, setHistory] = useState([]);   // [{id, studentId, studentName, date, grade, result, rank, stripes}]

  // settings: which grade is being customised
  const [editGrade, setEditGrade] = useState("5th Kyu");
  // entry working selection
  const [selStudent, setSelStudent] = useState("");
  const [newName, setNewName] = useState("");
  const [newStartRank, setNewStartRank] = useState("Beginner");
  const [editingStudent, setEditingStudent] = useState(null); // {id, name} being edited
  const [overrideGrade, setOverrideGrade] = useState("");
  const [testDate, setTestDate] = useState(today());
  const [scores, setScores] = useState({}); // { itemId: "Pass"|"Refer"|"Fail" } — in-app data entry
  const [importMsg, setImportMsg] = useState("");

  const grades = Object.keys(syllabus);
  const gradesDesc = [...grades].reverse(); // senior-first display (… → 9th Kyu → 10th Kyu)

  /* ---- load on mount ---- */
  useEffect(() => {
    (async () => {
      if (hasStore()) {
        const s = await loadKey("gsb:sensei", null);
        const syl = await loadKey("gsb:syllabus", null);
        const st = await loadKey("gsb:students", null);
        if (s) setSensei((p) => ({ ...p, ...s }));
        if (syl) setSyllabus(syl);
        if (st) { setRoster(st.roster || []); setHistory(st.history || []); }
        setStatus("saved");
      } else { setStatus("local"); }
      setReady(true);
    })();
  }, []);

  /* ---- auto-persist sensei + syllabus (debounced) ---- */
  const firstSen = useRef(true), firstSyl = useRef(true);
  useEffect(() => {
    if (!ready || !hasStore()) return;
    if (firstSen.current) { firstSen.current = false; return; }
    setStatus("saving");
    const t = setTimeout(async () => { const ok = await saveKey("gsb:sensei", sensei); setStatus(ok ? "saved" : "local"); }, 500);
    return () => clearTimeout(t);
  }, [sensei, ready]);
  useEffect(() => {
    if (!ready || !hasStore()) return;
    if (firstSyl.current) { firstSyl.current = false; return; }
    setStatus("saving");
    const t = setTimeout(async () => { const ok = await saveKey("gsb:syllabus", syllabus); setStatus(ok ? "saved" : "local"); }, 600);
    return () => clearTimeout(t);
  }, [syllabus, ready]);

  const persistStudents = async (r, h) => {
    setRoster(r); setHistory(h);
    if (hasStore()) { setStatus("saving"); const ok = await saveKey("gsb:students", { roster: r, history: h }); setStatus(ok ? "saved" : "local"); }
    syncRoster(r, h).catch(() => {})
  };

  /* ---- syllabus editing ---- */
  const mutate = (fn) => setSyllabus((s) => {
    const copy = { ...s, [editGrade]: { ...s[editGrade], sections: s[editGrade].sections.map((sec) => ({ ...sec, items: [...sec.items] })) } };
    fn(copy[editGrade]); return copy;
  });
  const toggleItem = (secId, id) => mutate((g) => { const sec = g.sections.find((x) => x.id === secId); sec.items = sec.items.map((it) => it.id === id ? { ...it, on: !it.on } : it); });
  const editItem = (secId, id, text) => mutate((g) => { const sec = g.sections.find((x) => x.id === secId); sec.items = sec.items.map((it) => it.id === id ? { ...it, text } : it); });
  const addItem = (secId) => mutate((g) => { const sec = g.sections.find((x) => x.id === secId); sec.items = [...sec.items, { id: uid(), text: "", on: true }]; });
  const delItem = (secId, id) => mutate((g) => { const sec = g.sections.find((x) => x.id === secId); sec.items = sec.items.filter((it) => it.id !== id); });
  const resetGrade = () => { const fresh = buildSyllabus(PRESETS[sensei.system].grades)[editGrade]; setSyllabus((s) => ({ ...s, [editGrade]: { ...s[editGrade], sections: fresh.sections, dan: fresh.dan } })); };
  const changeSystem = (f) => {
    setSensei((p) => ({ ...p, system: f }));
    const next = buildSyllabus(PRESETS[f].grades); setSyllabus(next);
    if (!next[editGrade]) setEditGrade(Object.keys(next)[0]);
  };

  /* ---- rank logic ---- */
  const currentRank = (sid) => {
    const passes = history.filter((h) => h.studentId === sid && h.result === "Pass").sort((a, b) => (a.date < b.date ? 1 : -1));
    return passes.length ? passes[0].rank : "Beginner";
  };
  const stripesNow = (sid) => {
    const hs = history.filter((h) => h.studentId === sid).sort((a, b) => (a.date < b.date ? -1 : 1));
    let n = 0; hs.forEach((e) => { if (e.result === "Pass") n = 0; else if (e.result === "Stripe") n += (e.stripes || 1); }); return n;
  };
  const nextGradeKey = (sid) => { const cur = currentRank(sid); return grades.find((k) => syllabus[k].from === cur) || null; };

  const testingKey = selStudent ? (overrideGrade || nextGradeKey(selStudent)) : (overrideGrade || editGrade);
  const testing = testingKey ? syllabus[testingKey] : null;

  const addStudent = () => {
    const name = newName.trim(); if (!name) return;
    const id = uid(); const r = [...roster, { id, name }];
    let h = history;
    if (newStartRank && newStartRank !== "Beginner") {
      // Find the grade key whose .to matches the selected rank
      const gKey = grades.find((k) => syllabus[k].to === newStartRank) || newStartRank;
      h = [...history, { id: uid(), studentId: id, studentName: name, date: today(), grade: gKey, result: "Pass", rank: newStartRank, note: "starting rank" }];
    }
    setNewName(""); setNewStartRank("Beginner"); setSelStudent(id); setOverrideGrade("");
    persistStudents(r, h);
  };
  const removeStudent = (id) => {
    const r = roster.filter((s) => s.id !== id); const h = history.filter((e) => e.studentId !== id);
    if (selStudent === id) setSelStudent("");
    persistStudents(r, h);
  };
  const saveEditStudent = () => {
    if (!editingStudent || !editingStudent.name.trim()) return;
    const r = roster.map((s) => s.id === editingStudent.id ? { ...s, name: editingStudent.name.trim() } : s);
    const h = history.map((e) => e.studentId === editingStudent.id ? { ...e, studentName: editingStudent.name.trim() } : e);
    persistStudents(r, h);
    setEditingStudent(null);
  };
  const rankLookup = useMemo(() => {
    const m = { beginner: "Beginner" };
    grades.forEach((k) => { m[syllabus[k].to.toLowerCase()] = syllabus[k].to; m[k.toLowerCase()] = syllabus[k].to; });
    m["1st dan"] = "Shodan"; m["2nd dan"] = "Nidan"; m["3rd dan"] = "Sandan"; m["4th dan"] = "Yondan"; m["5th dan"] = "Godan";
    return m;
  }, [syllabus]);
  const normalizeRank = (raw) => { const k = (raw || "").toLowerCase().trim(); return rankLookup[k] || rankLookup[k.replace(/\s*\(.*\)/, "")] || null; };
  const importCSV = (text) => {
    const rows = parseCSV(text);
    const newR = [...roster], newH = [...history];
    const seen = new Set(roster.map((r) => r.name.toLowerCase().trim()));
    let added = 0, skipped = 0;
    rows.forEach((row) => {
      const name = (row.name || row.student || "").trim();
      if (!name || seen.has(name.toLowerCase())) { skipped++; return; }
      const id = uid(); newR.push({ id, name }); seen.add(name.toLowerCase());
      const rank = normalizeRank(row.current_rank || row.rank || row["current rank"]);
      if (rank && rank !== "Beginner") {
        const gKey = grades.find((k) => syllabus[k].to === rank) || rank;
        const date = ((row.date || "").trim()) || today();
        newH.push({ id: uid(), studentId: id, studentName: name, date, grade: gKey, result: "Pass", rank, note: "imported" });
      }
      added++;
    });
    persistStudents(newR, newH);
    setImportMsg(`Imported ${added} student${added !== 1 ? "s" : ""}${skipped ? `, skipped ${skipped} (blank or duplicate name)` : ""}.`);
  };
  const onCSVFile = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { try { importCSV(String(reader.result)); } catch (err) { setImportMsg("Could not read that file — make sure it's a .csv."); } };
    reader.readAsText(f); e.target.value = "";
  };
  const downloadTemplate = () => {
    const csv = "name,current_rank,date\nMaryam,3rd Kyu,2025-09-01\nJohn Smith,Beginner,\nAiko Tanaka,Shodan,2024-06-15\n";
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = "students-template.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { setImportMsg("Template columns: name, current_rank, date"); }
  };
  const [recStripes, setRecStripes] = useState(1);
  const recordResult = (result) => {
    if (!selStudent || !testing) return;
    const student = roster.find((r) => r.id === selStudent);
    const entry = { id: uid(), studentId: selStudent, studentName: student.name, date: testDate, grade: testingKey, result };
    if (result === "Pass") entry.rank = testing.to;
    else if (result === "Stripe") { entry.rank = currentRank(selStudent); entry.stripes = recStripes; }
    else entry.rank = currentRank(selStudent);
    entry.scores = { ...scores };
    persistStudents(roster, [...history, entry]);
    syncRankTest(entry).catch(() => {})
    setOverrideGrade(testingKey);
  };

  const studentHistory = (sid) => history.filter((h) => h.studentId === sid).sort((a, b) => (a.date < b.date ? 1 : -1));
  const allItems = (g) => g.sections.flatMap((sec) => sec.items.filter((it) => it.on && it.text.trim()).map((it) => it.id));

  /* ---- email body ---- */
  const emailBody = useMemo(() => {
    if (!testing) return "";
    const student = roster.find((r) => r.id === selStudent);
    const L = [];
    L.push(`${sensei.dojo || "[Dojo]"} — Grading Sheet`); L.push(`${sensei.system}`);
    L.push(`Grading: promotion from ${testing.from} to ${testing.to}`);
    if (testing.dan) L.push(`Eligibility: ${testing.dan}`);
    L.push(`Examiner: ${[sensei.title, sensei.name].filter(Boolean).join(" ") || "____"}    Date: ${testDate}`);
    L.push(`Student: ${student ? student.name : "____"}`); L.push("");
    testing.sections.forEach((sec) => {
      const on = sec.items.filter((it) => it.on && it.text.trim()); if (!on.length) return;
      L.push(sec.title.toUpperCase()); on.forEach((it) => L.push(`  \u2022 ${it.text}   [ Pass / Refer / Fail ]`)); L.push("");
    });
    L.push("Overall: Pass / Refer / Fail / Stripe");
    return L.join("\n");
  }, [testing, selStudent, sensei, testDate, roster]);
  const sendEmail = () => {
    const subj = `${sensei.dojo || "Dojo"} Grading Sheet \u2014 ${testing ? testing.to : ""}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(emailBody)}`;
  };

  const examiner = [sensei.title, sensei.name].filter(Boolean).join(" ");
  const lastEntry = selStudent ? history.filter((h) => h.studentId === selStudent && h.grade === testingKey).sort((a, b) => (a.date < b.date ? 1 : -1))[0] : null;
  const overallPick = lastEntry ? (lastEntry.result === "Stripe" ? "Stripe (½)" : lastEntry.result) : null;
  const statusText = { idle: "", saving: "Saving…", saved: "Saved to this device", local: "Not saved (no storage)" }[status];

  if (!ready) return (<div className="ng-root" style={{ display: "grid", placeItems: "center" }}><style>{css}</style><div style={{ color: "var(--ink-soft)" }}>Loading…</div></div>);

  return (
    <div className="ng-root">
      <style>{css}</style>

      {/* top bar */}
      <header className="no-print" style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(244,241,234,.9)", backdropFilter: "blur(6px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 18px", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ink)", color: "var(--paper)", display: "grid", placeItems: "center", flex: "none" }}><GraduationCap size={19} /></div>
          <div style={{ lineHeight: 1.15, flex: 1, minWidth: 0 }}>
            <div className="ng-serif" style={{ fontSize: 17, fontWeight: 700 }}>{sensei.dojo || "Your Dojo"}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{examiner ? examiner : "Set up your profile in Settings"} · {sensei.system}</div>
          </div>
          <span style={{ fontSize: 11, color: status === "local" ? "var(--crimson)" : "var(--ink-soft)" }}>{statusText}</span>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 14px 11px", display: "flex", gap: 7 }}>
          {[["settings", Settings, "Settings"], ["entry", UserRound, "Students"], ["assess", ClipboardList, "Assess"], ["print", Printer, "Print"]].map(([id, Icon, label]) => (
            <button key={id} className={`nav-tab ${screen === id ? "nav-tab-on" : ""}`} onClick={() => setScreen(id)}><Icon size={18} />{label}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "20px 18px 70px" }}>

        {/* ===================== SETTINGS ===================== */}
        {screen === "settings" && (
          <div className="ng-fade" style={{ display: "grid", gap: 16 }}>
            <div className="ng-card" style={{ padding: 18 }}>
              <SectionTitle icon={<UserRound size={16} />} title="Sensei & dojo" sub="One sensei per app — this name auto-fills every sheet." />
              <div style={{ display: "grid", gap: 12 }}>
                <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <div><label className="lbl">Sensei name</label><input className="ng-input" value={sensei.name} onChange={(e) => setSensei({ ...sensei, name: e.target.value })} placeholder="e.g. J. Touati" /></div>
                  <div><label className="lbl">Title / honorific</label><input className="ng-input" value={sensei.title} onChange={(e) => setSensei({ ...sensei, title: e.target.value })} placeholder="Sensei" /></div>
                </div>
                <div><label className="lbl">Dojo name</label><input className="ng-input" value={sensei.dojo} onChange={(e) => setSensei({ ...sensei, dojo: e.target.value })} placeholder="Dojo name" /></div>
                <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <div>
                    <label className="lbl">Grading system</label>
                    <div style={{ position: "relative" }}>
                      <select className="ng-select" value={sensei.system} onChange={(e) => changeSystem(e.target.value)}>{Object.keys(PRESETS).map((f) => <option key={f}>{f}</option>)}</select>
                      <ChevronDown size={16} style={{ position: "absolute", right: 11, top: 12, pointerEvents: "none", color: "var(--ink-soft)" }} />
                    </div>
                  </div>
                  <div>
                    <label className="lbl">Sheet scoring</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className={`ng-chip ${sensei.scoring === "passrefer" ? "ng-chip-on" : ""}`} onClick={() => setSensei({ ...sensei, scoring: "passrefer" })}>Circle P/R/F</button>
                      <button className={`ng-chip ${sensei.scoring === "score10" ? "ng-chip-on" : ""}`} onClick={() => setSensei({ ...sensei, scoring: "score10" })}>Score /10</button>
                    </div>
                  </div>
                </div>
                {!PRESETS[sensei.system].complete && <div className="dan-note" style={{ borderColor: "var(--crimson)", background: "#FBEFEE", color: "var(--crimson-d)" }}>Starter shell — requirements aren't bundled for this system yet. Edit each grade below, or load its official syllabus.</div>}
              </div>
            </div>

            {/* import students */}
            <div className="ng-card" style={{ padding: 18 }}>
              <SectionTitle title="Import students (CSV)" sub="Bulk-load your roster from a spreadsheet." />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label className="ng-btn ng-btn-ink" style={{ cursor: "pointer" }}><Upload size={16} /> Choose CSV file<input type="file" accept=".csv,text/csv" onChange={onCSVFile} style={{ display: "none" }} /></label>
                <button className="ng-btn ng-btn-ghost" onClick={downloadTemplate}><Download size={15} /> Template</button>
              </div>
              {importMsg && <p style={{ fontSize: 12.5, color: "var(--indigo)", fontWeight: 600, margin: "10px 0 0" }}>{importMsg}</p>}
              <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "8px 0 0", lineHeight: 1.45 }}>Columns: <strong>name</strong>, <strong>current_rank</strong>, optional <strong>date</strong>. Use rank names as the app does — Beginner, 10th Kyu … 1st Kyu, Shodan, Nidan. The current rank lets the app work out each student's next grade automatically.</p>
            </div>

            {/* signature */}
            <div className="ng-card" style={{ padding: 18 }}>
              <SectionTitle title="Digital signature" sub="Drawn once, saved, and auto-applied to the signature line on every sheet." />
              <SignaturePad initial={sensei.signature} onSave={(d) => setSensei({ ...sensei, signature: d })} />
            </div>

            {/* syllabus customisation */}
            <div className="ng-card" style={{ padding: 18 }}>
              <SectionTitle title="Customise requirements" sub="Per grade — toggle skills on/off, edit wording, or add your dojo's. Saved automatically." />
              <div style={{ position: "relative", marginBottom: 4 }}>
                <label className="lbl">Grade to edit</label>
                <select className="ng-select" value={editGrade} onChange={(e) => setEditGrade(e.target.value)}>{gradesDesc.map((g) => <option key={g}>{g}</option>)}</select>
                <ChevronDown size={16} style={{ position: "absolute", right: 11, bottom: 12, pointerEvents: "none", color: "var(--ink-soft)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", margin: "10px 0 4px" }}>
                <span className="ng-serif" style={{ fontWeight: 700, fontSize: 15 }}>{editGrade}</span>
                <button className="ng-btn ng-btn-ghost" style={{ marginLeft: "auto", padding: "6px 11px", fontSize: 12.5 }} onClick={resetGrade}><RotateCcw size={13} /> Reset grade</button>
              </div>
              {syllabus[editGrade].dan && <div className="dan-note" style={{ marginBottom: 8 }}>⚖ <strong>Dan eligibility (WKF framework):</strong> {syllabus[editGrade].dan}</div>}
              {syllabus[editGrade].sections.map((sec) => (
                <div key={sec.id} style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="ng-serif" style={{ fontWeight: 700, fontSize: 13.5 }}>{sec.title}</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{sec.items.filter((i) => i.on).length}/{sec.items.length}</span>
                    <button className="ng-btn ng-btn-ghost" style={{ marginLeft: "auto", padding: "5px 9px", fontSize: 12 }} onClick={() => addItem(sec.id)}><Plus size={13} /> Add</button>
                  </div>
                  {sec.items.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", fontStyle: "italic", margin: 0 }}>None preloaded for this grade — add your dojo's if needed.</p>}
                  <div style={{ display: "grid", gap: 6 }}>
                    {sec.items.map((it) => (
                      <div key={it.id} className={!it.on ? "ng-row-off" : ""} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div className={`ng-check ${it.on ? "ng-check-on" : ""}`} onClick={() => toggleItem(sec.id, it.id)}>{it.on && <Check size={14} color="#fff" strokeWidth={3} />}</div>
                        <input className="ng-input" style={{ padding: "8px 10px" }} value={it.text} placeholder="Technique / requirement" onChange={(e) => editItem(sec.id, it.id, e.target.value)} />
                        <button onClick={() => delItem(sec.id, it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", flex: "none", padding: 4 }}><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== ENTRY ===================== */}
        {screen === "entry" && (
          <div className="ng-fade" style={{ display: "grid", gap: 16 }}>
            <div className="ng-card" style={{ padding: 18 }}>
              <SectionTitle title="Add a student" sub="Each student carries their own rank history." />
              <div style={{ display: "flex", gap: 8 }}>
                <input className="ng-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New student name" onKeyDown={(e) => e.key === "Enter" && addStudent()} />
                <button className="ng-btn ng-btn-ink" style={{ flex: "none" }} onClick={addStudent}><Plus size={16} /> Add</button>
              </div>
              <div style={{ marginTop: 10 }}>
                <label className="lbl">Starting rank <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(default: Beginner / White belt)</span></label>
                <div style={{ position: "relative" }}>
                  <select className="ng-select" value={newStartRank} onChange={(e) => setNewStartRank(e.target.value)}>
                    <option value="Beginner">Beginner (White belt)</option>
                    {grades.map((g) => <option key={g} value={syllabus[g].to}>{syllabus[g].to}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: "absolute", right: 11, top: 12, pointerEvents: "none", color: "var(--ink-soft)" }} />
                </div>
              </div>
            </div>

            <div className="ng-card" style={{ padding: 18 }}>
              <SectionTitle title="Set up a grading" sub="Pick a student — their next rank is worked out from their history." />
              <div style={{ position: "relative", marginBottom: 12 }}>
                <label className="lbl">Student</label>
                <select className="ng-select" value={selStudent} onChange={(e) => { setSelStudent(e.target.value); setOverrideGrade(""); setScores({}); }}>
                  <option value="">— Select student —</option>
                  {roster.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={16} style={{ position: "absolute", right: 11, bottom: 12, pointerEvents: "none", color: "var(--ink-soft)" }} />
              </div>

              {selStudent && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "var(--paper2)", borderRadius: 11, padding: "12px 14px" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, letterSpacing: ".05em" }}>CURRENT RANK</div>
                      <div className="ng-serif" style={{ fontSize: 18, fontWeight: 700 }}>{currentRank(selStudent)}{stripesNow(selStudent) > 0 && <span style={{ color: "var(--crimson)", fontSize: 14 }}> + {stripesNow(selStudent)} stripe{stripesNow(selStudent) > 1 ? "s" : ""}</span>}</div>
                    </div>
                    <ChevronRight size={20} style={{ color: "var(--crimson)" }} />
                    <div>
                      <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, letterSpacing: ".05em" }}>TESTING FOR</div>
                      <div className="ng-serif" style={{ fontSize: 18, fontWeight: 700, color: "var(--crimson-d)" }}>{testing ? testing.to : "Top rank reached"}</div>
                    </div>
                  </div>

                  <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    <div>
                      <label className="lbl">Grade (override if needed)</label>
                      <div style={{ position: "relative" }}>
                        <select className="ng-select" value={overrideGrade || (nextGradeKey(selStudent) || "")} onChange={(e) => { setOverrideGrade(e.target.value); setScores({}); }}>
                          {gradesDesc.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: "absolute", right: 11, top: 12, pointerEvents: "none", color: "var(--ink-soft)" }} />
                      </div>
                    </div>
                    <div><label className="lbl">Test date</label><input className="ng-input" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} /></div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="ng-btn ng-btn-primary" onClick={() => setScreen("assess")} disabled={!testing}><ClipboardList size={16} /> Continue to assessment</button>
                    <button className="ng-btn ng-btn-ghost" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setEditingStudent(roster.find(s => s.id === selStudent))}><UserRound size={14} /> Edit student</button>
                  </div>

                  {/* inline edit form */}
                  {editingStudent?.id === selStudent && (
                    <div style={{ background: "var(--paper2)", borderRadius: 11, padding: "14px", display: "grid", gap: 10 }}>
                      <label className="lbl" style={{ marginBottom: 0 }}>Edit student name</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="ng-input" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && saveEditStudent()} autoFocus />
                        <button className="ng-btn ng-btn-ink" style={{ flex: "none" }} onClick={saveEditStudent}><Check size={15} /> Save</button>
                        <button className="ng-btn ng-btn-ghost" style={{ flex: "none" }} onClick={() => setEditingStudent(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* history */}
                  {studentHistory(selStudent).length > 0 && (
                    <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                      <label className="lbl">Rank history</label>
                      <div style={{ display: "grid", gap: 5 }}>
                        {studentHistory(selStudent).map((e) => (
                          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px dotted var(--line)" }}>
                            <span><strong>{e.result === "Pass" ? e.rank : e.result === "Stripe" ? `Stripe ×${e.stripes || 1}` : e.result}</strong> <span style={{ color: "var(--ink-soft)" }}>· {e.grade}</span></span>
                            <span style={{ color: "var(--ink-soft)" }}>{e.date}</span>
                          </div>
                        ))}
                      </div>
                      <button className="ng-btn ng-btn-ghost" style={{ marginTop: 10, padding: "7px 12px", fontSize: 12.5, color: "var(--crimson)" }} onClick={() => removeStudent(selStudent)}><Trash2 size={14} /> Delete student & history</button>
                    </div>
                  )}
                </div>
              )}
              {roster.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", margin: "4px 0 0" }}>Add your first student above to begin.</p>}
            </div>
          </div>
        )}

        {/* ===================== ASSESS ===================== */}
        {screen === "assess" && (
          <div className="ng-fade" style={{ display: "grid", gap: 16 }}>
            {!testing ? (
              <div className="ng-card" style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)" }}>Pick a student on the Students screen first.</div>
            ) : (
              <>
                <div className="ng-card" style={{ padding: 18 }}>
                  <SectionTitle title="Assessment" sub={`${(roster.find((r) => r.id === selStudent) || {}).name || "Student"} · testing for ${testing.to} · ${testDate}`} />
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <button className="ng-btn ng-btn-ghost" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setScores(allItems(testing).reduce((a, id) => ({ ...a, [id]: "Pass" }), {}))}>Mark all Pass</button>
                    <button className="ng-btn ng-btn-ghost" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setScores({})}>Clear</button>
                  </div>
                </div>

                {testing.sections.map((sec) => {
                  const items = sec.items.filter((it) => it.on && it.text.trim());
                  if (!items.length) return null;
                  return (
                    <div key={sec.id} className="ng-card" style={{ padding: 18 }}>
                      <div className="ng-serif" style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>{sec.title}</div>
                      <div style={{ display: "grid", gap: 9 }}>
                        {items.map((it) => (
                          <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingBottom: 7, borderBottom: "1px dotted var(--line)" }}>
                            <span style={{ flex: 1, minWidth: 150, fontSize: 13.5 }}>{it.text}</span>
                            <div style={{ display: "flex", gap: 6 }}>
                              {["Pass", "Refer", "Fail"].map((r) => {
                                const on = scores[it.id] === r;
                                const col = r === "Pass" ? "#2F7D52" : r === "Refer" ? "#B08B3E" : "#A8322A";
                                return <button key={r} onClick={() => setScores((s) => ({ ...s, [it.id]: on ? undefined : r }))}
                                  style={{ border: `1.5px solid ${on ? col : "var(--line)"}`, background: on ? col : "#fff", color: on ? "#fff" : "var(--ink-soft)", borderRadius: 999, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{r}</button>;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="ng-card" style={{ padding: 18 }}>
                  <label className="lbl">Record overall result (saves a dated line to their record)</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button className="ng-btn ng-btn-ink" onClick={() => { recordResult("Pass"); setScreen("print"); }}><CircleCheck size={15} /> Pass → {testing.to}</button>
                    <button className="ng-btn ng-btn-ghost" onClick={() => recordResult("Stripe")}>Stripe (½)</button>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <button className="ng-btn ng-btn-ghost" style={{ padding: "7px 11px" }} onClick={() => setRecStripes((n) => Math.max(1, n - 1))}>−</button>
                      <span style={{ minWidth: 22, textAlign: "center", fontSize: 13, fontWeight: 600 }}>{recStripes}</span>
                      <button className="ng-btn ng-btn-ghost" style={{ padding: "7px 11px" }} onClick={() => setRecStripes((n) => Math.min(4, n + 1))}>+</button>
                    </span>
                    <button className="ng-btn ng-btn-ghost" onClick={() => recordResult("Refer")}>Refer</button>
                    <button className="ng-btn ng-btn-primary" style={{ marginLeft: "auto" }} onClick={() => setScreen("print")}><Printer size={16} /> Print sheet</button>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "8px 0 0" }}>The Pass / Refer / Fail marks above carry onto the printed sheet — the chosen result is circled. Anything left unmarked prints blank to circle by hand.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================== PRINT ===================== */}
        {screen === "print" && (
          <div className="ng-fade">
            <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <button className="ng-btn ng-btn-ghost" onClick={() => setScreen("entry")}>← Back to entry</button>
              <button className="ng-btn ng-btn-ghost" onClick={sendEmail} disabled={!testing}><Mail size={16} /> Email</button>
              <button className="ng-btn ng-btn-primary" onClick={() => window.print()} disabled={!testing}><Printer size={16} /> Print</button>
            </div>

            {!testing ? (
              <div className="ng-card" style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)" }}>Select a student on the Entry screen to generate a sheet.</div>
            ) : (
              <div className="print-area sheet">
                <div className="sheet-inner"><div className="sheet-inner2">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11.5, letterSpacing: ".18em", color: "var(--crimson)", fontWeight: 700 }}>{sensei.system.toUpperCase()}</div>
                      <h2 className="ng-serif" style={{ fontSize: 25, fontWeight: 700, margin: "3px 0 0" }}>Grading Sheet</h2>
                      <div style={{ fontSize: 14.5, color: "var(--ink-soft)", marginTop: 2 }}>Promotion from {testing.from} to {testing.to}</div>
                    </div>
                    <div className="stamp">{testing.to}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", marginTop: 15, fontSize: 13.5, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
                    <Field label="Dojo" value={sensei.dojo} />
                    <Field label="Examiner" value={examiner} />
                    <Field label="Student" value={(roster.find((r) => r.id === selStudent) || {}).name || ""} />
                    <Field label="Date" value={testDate} />
                  </div>

                  {testing.dan && <div className="dan-note" style={{ marginTop: 11 }}>Eligibility (WKF framework): {testing.dan}</div>}

                  {testing.sections.map((sec) => {
                    const items = sec.items.filter((it) => it.on && it.text.trim());
                    if (!items.length) return null;
                    return (
                      <div key={sec.id}>
                        <div className="sheet-sec">{sec.title}</div>
                        {items.map((it) => (
                          <div className="sheet-item" key={it.id}>
                            <span>{it.text}</span>
                            <span className="circle-opt">{sensei.scoring === "passrefer"
                              ? ["Pass", "Refer", "Fail"].map((r) => <span key={r} className={scores[it.id] === r ? "opt-pick" : ""}>{r}</span>)
                              : "____ / 10"}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 18, borderTop: "2px solid var(--ink)", paddingTop: 11, fontSize: 13.5 }}>
                    <div style={{ marginBottom: 14 }}><strong>Overall result:</strong> &nbsp;<span className="circle-opt">{["Pass", "Refer", "Fail", "Stripe (½)"].map((r) => <span key={r} className={overallPick === r ? "opt-pick" : ""}>{r}</span>)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ minHeight: 38, borderBottom: "1px solid var(--ink)", display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                          {sensei.signature ? <img src={sensei.signature} alt="signature" style={{ height: 40, objectFit: "contain" }} /> : <span className="sig-line">{sensei.name}</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3 }}>Examiner — {examiner || "signature"}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--ink-soft)", fontStyle: "italic" }}>JKA HQ Kyu/Dan Grading Guideline (1 Apr 2017). Belt colours & exact requirements vary by national body / dojo.</div>
                </div></div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="ng-serif" style={{ fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>{icon}{title}</div>
      {sub && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "3px 0 0", lineHeight: 1.45 }}>{sub}</p>}
    </div>
  );
}
function Field({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", color: "#5A5A50", textTransform: "uppercase", flex: "none" }}>{label}</span>
      <span style={{ borderBottom: "1px solid var(--line)", flex: 1, minHeight: 17, fontSize: 13.5 }}>{value}</span>
    </div>
  );
}
