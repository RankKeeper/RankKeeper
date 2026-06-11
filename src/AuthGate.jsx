import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
import App from "./App.jsx";

const paper = "#F4F1EA";
const ink = "#22231E";
const crimson = "#A8322A";
const muted = "#6b6a63";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');
.rk-auth-wrap { min-height: 100vh; background: ${paper}; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: ${ink}; }
.rk-card { width: 100%; max-width: 380px; background: #fff; border: 1px solid #e6e1d6; border-radius: 16px; padding: 32px 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); }
.rk-logo { width: 72px; height: 72px; display: block; margin: 0 auto 14px; border-radius: 14px; }
.rk-title { font-family: 'Shippori Mincho', serif; font-weight: 700; font-size: 26px; text-align: center; margin: 0 0 4px; letter-spacing: 0.5px; color: ${ink}; }
.rk-sub { text-align: center; color: ${muted}; font-size: 14px; margin: 0 0 24px; }
.rk-label { display: block; font-size: 13px; font-weight: 500; margin: 0 0 6px; color: ${ink}; }
.rk-input { width: 100%; box-sizing: border-box; padding: 11px 13px; border: 1px solid #d8d2c5; border-radius: 10px; font-size: 15px; background: ${paper}; color: ${ink}; margin-bottom: 16px; font-family: inherit; }
.rk-input:focus { outline: none; border-color: ${crimson}; background: #fff; }
.rk-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; background: ${crimson}; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
.rk-btn:disabled { opacity: 0.6; cursor: default; }
.rk-toggle { text-align: center; margin-top: 18px; font-size: 14px; color: ${muted}; }
.rk-toggle button { background: none; border: none; color: ${crimson}; font-weight: 600; cursor: pointer; font-size: 14px; font-family: inherit; padding: 0; }
.rk-msg { background: #fbeae8; border: 1px solid #f0c4be; color: #8a2b22; padding: 10px 12px; border-radius: 9px; font-size: 13px; margin-bottom: 16px; }
.rk-topbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: ${paper}; border-bottom: 1px solid #e0dacd; font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; font-size: 13px; color: ${muted}; }
.rk-topbar button { background: none; border: 1px solid #d8d2c5; border-radius: 8px; padding: 5px 12px; font-size: 13px; cursor: pointer; color: ${ink}; font-family: inherit; }
.rk-center { min-height: 100vh; background: ${paper}; display: flex; align-items: center; justify-content: center; font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: ${muted}; }
`;

export default function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(false);

  const [mode, setMode] = useState("login");
  const [showHome, setShowHome] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    let cancelled = false;
    setCheckingProfile(true);
    supabase
      .from("profiles")
      .select("access_status, access_until")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) { setProfile(data); setCheckingProfile(false); }
      });
    return () => { cancelled = true; };
  }, [session]);

  function switchMode(next) {
    setMode(next);
    setMsg(null);
    setPassword("");
    setPassword2("");
  }

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setMsg(null);

    if (mode === "signup") {
      if (password.length < 6) {
        setMsg("Password must be at least 6 characters.");
        return;
      }
      if (password !== password2) {
        setMsg("Passwords don't match — please re-enter them.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setEmail("");
    setPassword("");
    setPassword2("");
  }

  const hasAccess =
    profile &&
    (profile.access_status === "lifetime" ||
      ((profile.access_status === "active" || profile.access_status === "trial") &&
        (!profile.access_until || new Date(profile.access_until) > new Date())));

  if (loading) {
    return (<><style>{styles}</style><div className="rk-center">Loading…</div></>);
  }

  if (!session) {
    return (
      <>
        <style>{styles}</style>
        <div className="rk-auth-wrap">
          <div className="rk-card">
            <img className="rk-logo" src="/icon-512.png" alt="RankKeeper" />
            <h1 className="rk-title">RankKeeper</h1>
            <p className="rk-sub">{mode === "signup" ? "Create your account" : "Sign in to continue"}</p>
            {msg && <div className="rk-msg">{msg}</div>}
            <form onSubmit={handleSubmit}>
              <label className="rk-label">Email</label>
              <input
                className="rk-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label className="rk-label">Password</label>
              <input
                className="rk-input"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {mode === "signup" && (
                <>
                  <label className="rk-label">Confirm password</label>
                  <input
                    className="rk-input"
                    type="password"
                    autoComplete="new-password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                  />
                </>
              )}
              <button className="rk-btn" type="submit" disabled={busy}>
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>
            <div className="rk-toggle">
              {mode === "signup" ? (
                <>Already have an account? <button onClick={() => switchMode("login")}>Log in</button></>
              ) : (
                <>Need an account? <button onClick={() => switchMode("signup")}>Sign up</button></>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (checkingProfile) {
    return (<><style>{styles}</style><div className="rk-center">Checking your account…</div></>);
  }

  if (!hasAccess) {
    return (
      <>
        <style>{styles}</style>
        <div className="rk-auth-wrap">
          <div className="rk-card">
            <img className="rk-logo" src="/icon-512.png" alt="RankKeeper" />
            <h1 className="rk-title">RankKeeper</h1>
            <p className="rk-sub">Your account is set up, but doesn't have access yet.</p>
            <div style={{ fontSize: 14, color: muted, lineHeight: 1.6, textAlign: "center", marginBottom: 22 }}>
              A subscription is required to use RankKeeper. Subscription options are coming soon. If you believe you should already have access, log out and back in to refresh.
            </div>
            <button className="rk-btn" onClick={logout}>Log out</button>
          </div>
        </div>
      </>
    );
  }

  if (showHome) {
    return (
      <>
        <style>{styles}</style>
        <style>{`
          .home{min-height:100dvh;background:linear-gradient(135deg,#002570 0%,#001845 60%,#000d2e 100%);color:#F0EDE6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;flex-direction:column;}
          .home-nav{padding:18px 20px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:0.5px solid rgba(212,175,55,0.2);}
          .home-wordmark{font-size:18px;font-weight:700;color:#fff;letter-spacing:-.01em;}
          .home-euc{font-size:11px;color:#D4AF37;letter-spacing:.06em;text-transform:uppercase;margin-top:1px;}
          .home-greeting{padding:16px 20px 6px;text-align:center;}
          .home-greeting h1{font-size:20px;font-weight:700;color:#fff;margin:0 0 4px;letter-spacing:-.02em;}
          .home-greeting p{font-size:14px;color:#8A8AAA;margin:0;}
          .home-cards{flex:1;display:flex;flex-direction:column;gap:12px;padding:16px 16px 24px;max-width:480px;margin:0 auto;width:100%;}
          .hcard{border-radius:16px;background:#1C1C2E;border:1px solid #2E2E42;overflow:hidden;display:flex;flex-direction:column;}
          .hcard-accent{height:3px;background:linear-gradient(90deg,#D4AF37,#F0D060);}
          .hcard-body{padding:14px 14px 10px;display:flex;gap:12px;align-items:flex-start;}
          .hcard-logo{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
          .hcard-logo img{width:100%;height:100%;object-fit:contain;padding:4px;}
          .hcard-info{flex:1;}
          .hcard-title{font-size:17px;font-weight:700;color:#fff;letter-spacing:-.02em;margin:0 0 3px;}
          .hcard-desc{font-size:12px;color:#8A8AAA;line-height:1.4;margin:0 0 8px;}
          .hcard-pills{display:flex;flex-wrap:wrap;gap:5px;}
          .hcard-pill{font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px;background:rgba(212,175,55,0.1);border:0.5px solid rgba(212,175,55,0.25);color:#D4AF37;}
          .hcard-footer{padding:0 14px 14px;}
          .hcard-btn{width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#D4AF37,#F0D060);color:#002570;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.01em;}
          .hcard-btn:active{opacity:.88;}
          .home-foot{padding:10px 20px 20px;text-align:center;border-top:0.5px solid rgba(255,255,255,0.06);}
          .home-foot span{font-size:11px;color:#8A8AAA;}
          .home-foot button{background:none;border:none;color:#D4AF37;font-size:11px;cursor:pointer;font-family:inherit;text-decoration:underline;padding:0;margin-left:4px;}
          @media(orientation:landscape){.home-cards{flex-direction:column;}}
        `}</style>
        <div className="home">
          <div className="home-nav">
            <div>
              <div className="home-wordmark">RankKeeper</div>
              <div className="home-euc">Education Under Construction</div>
            </div>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>{session.user.email}</span>
          </div>

          <div className="home-greeting">
            <h1>Welcome back, Sensei</h1>
            <p>What are we running today?</p>
          </div>

          <div className="home-cards">
            {/* RankKeeper card */}
            <div className="hcard">
              <div className="hcard-accent"/>
              <div className="hcard-body">
                <div className="hcard-logo" style={{background:"#F5F0E8"}}>
                  <img src="/icon-512.png" alt="RankKeeper"/>
                </div>
                <div className="hcard-info">
                  <div className="hcard-title">RankKeeper</div>
                  <div className="hcard-desc">Track student ranks, belt history, and progression across your dojo roster.</div>
                  <div className="hcard-pills">
                    <span className="hcard-pill">Rank tracking</span>
                    <span className="hcard-pill">Roster</span>
                    <span className="hcard-pill">Belt history</span>
                  </div>
                </div>
              </div>
              <div className="hcard-footer">
                <button className="hcard-btn" onClick={() => setShowHome(false)}>Enter RankKeeper →</button>
              </div>
            </div>

            {/* ScoreKeeper card */}
            <div className="hcard">
              <div className="hcard-accent"/>
              <div className="hcard-body">
                <div className="hcard-logo" style={{background:"#0a0a14"}}>
                  <img src="/scorekeeper-logo.png" alt="ScoreKeeper"/>
                </div>
                <div className="hcard-info">
                  <div className="hcard-title">ScoreKeeper</div>
                  <div className="hcard-desc">Run Kumite and Kata scoring sessions, brackets, and divisions for your dojo class.</div>
                  <div className="hcard-pills">
                    <span className="hcard-pill">Kumite</span>
                    <span className="hcard-pill">Kata</span>
                    <span className="hcard-pill">Divisions</span>
                    <span className="hcard-pill">WKF · NKF</span>
                  </div>
                </div>
              </div>
              <div className="hcard-footer">
                <button className="hcard-btn" onClick={() => window.location.href="/rankkeeper-tournament.html"}>Enter ScoreKeeper →</button>
              </div>
            </div>
          </div>

          <div className="home-foot">
            <span>Signed in as {session.user.email} ·</span>
            <button onClick={logout}>Sign out</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="rk-topbar">
        <span>Signed in as {session.user.email}</span>
        <button onClick={() => setShowHome(true)}>⌂ Home</button>
        <button onClick={logout}>Log out</button>
      </div>
      <App />
    </>
  );
}
