import React, { useEffect, useMemo, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";

const initialStages = [
  { id: 1, name: "Library", riddle: "Thousands of stories live here, but silence is the rule. Find the place where knowledge fills the shelves.", location: "Library", points: 10 },
  { id: 2, name: "Permit Office", riddle: "Before an official activity can begin, permission is often needed. Find the office that helps make it possible.", location: "Permit Office", points: 10 },
  { id: 3, name: "Animation Lab", riddle: "Where still images come alive and imagination becomes motion, your next clue is waiting.", location: "Animation Lab", points: 10 },
  { id: 4, name: "Sports Office", riddle: "Before the game begins, permission matters. Find the office connected with sports and football activities.", location: "Sports Office", points: 10 },
  { id: 5, name: "Final Control Desk", riddle: "Your final destination is where the organizers are waiting to verify the treasure.", location: "Final Control Desk", points: 10 },
];
const tokenFor = (team, stage) => `${team.id}-R${stage.id}`.toUpperCase();
const demoMembers = [
  { id: "T001-M1", name: "Ayesha Rahman", pin: "1001" },
  { id: "T001-M2", name: "Nafis Ahmed", pin: "1002" },
  { id: "T001-M3", name: "Maliha Islam", pin: "1003" },
  { id: "T001-M4", name: "Samin Hasan", pin: "1004" },
  { id: "T001-M5", name: "Raisa Khan", pin: "1005" },
];
const seedTeams = [
  { id: "THT-001", name: "The Clue Crew", password: "team123", stage: 1, completed: [], members: demoMembers },
  { id: "THT-002", name: "Campus Explorers", password: "team123", stage: 1, completed: [], members: demoMembers.map((m,i)=>({...m,id:`T002-M${i+1}`})) },
  { id: "THT-003", name: "The Brainy Bunch", password: "team123", stage: 1, completed: [], members: demoMembers.map((m,i)=>({...m,id:`T003-M${i+1}`})) },
];
const seed = () => ({ teams: seedTeams, stages: initialStages, penalties: {} });
function readData() {
  try { return JSON.parse(localStorage.getItem("campusQuestData")) || seed(); }
  catch { return seed(); }
}
function saveData(data) { localStorage.setItem("campusQuestData", JSON.stringify(data)); }
function Icon({ children }) { return <span className="icon">{children}</span>; }

function App() {
  const [data, setData] = useState(readData);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("campusQuestUser")) || null; } catch { return null; }
  });
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [loginId, setLoginId] = useState("THT-001");
  const [password, setPassword] = useState("team123");
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => saveData(data), [data]);
  useEffect(() => { if (user) sessionStorage.setItem("campusQuestUser", JSON.stringify(user)); else sessionStorage.removeItem("campusQuestUser"); }, [user]);
  useEffect(() => { if (!toast) return; const t=setTimeout(()=>setToast(""),2600); return ()=>clearTimeout(t); }, [toast]);

  const currentTeam = data.teams.find(t => t.id === user?.teamId);
  const notify = (message) => setToast(message);
  const login = (event) => {
    event.preventDefault();
    if (adminMode) {
      if (loginId === "admin" && password === "admin12345") { setUser({ role: "admin" }); setPage("admin"); }
      else notify("Incorrect admin credentials.");
      return;
    }
    const team = data.teams.find(t => t.id.toLowerCase() === loginId.trim().toLowerCase() && t.password === password);
    if (!team) return notify("Team ID or password is incorrect.");
    setUser({ role: "team", teamId: team.id }); setPage("dashboard");
  };
  const logout = () => { setUser(null); setPage("dashboard"); setAdminMode(false); };
  const updateTeam = (teamId, updater) => setData(old => ({...old, teams: old.teams.map(t => t.id === teamId ? updater(t) : t)}));
  const completeStage = (token) => {
    if (!currentTeam) return { ok:false, message:"Please log in again." };
    const normalized = token.trim().toLowerCase();
    let owner=null, stage=null;
    for (const t of data.teams) for (const s of data.stages) {
      if (tokenFor(t,s).toLowerCase()===normalized) { owner=t; stage=s; break; }
    }
    if (!stage) return { ok:false, message:"That QR code is not recognized." };
    if (owner.id !== currentTeam.id) return { ok:false, message:"This QR code belongs to another team." };
    if (currentTeam.completed.includes(stage.id)) return { ok:false, message:"Your team has already completed this checkpoint." };
    if (stage.id !== currentTeam.stage) return { ok:false, message:"This is not your next checkpoint. Follow the riddles in order." };
    updateTeam(currentTeam.id, t => ({...t, completed:[...t.completed,stage.id], stage:Math.min(data.stages.length+1,t.stage+1)}));
    return { ok:true, message:`Checkpoint ${stage.id} completed! +${stage.points} points.` };
  };
  const addStage = (stage) => {
    const name = stage.name.trim();
    if (!name) return { ok:false, message:"Location name is required." };
    const nextId = data.stages.length ? Math.max(...data.stages.map(s=>s.id))+1 : 1;
    const newStage = { id:nextId, name, location: stage.location?.trim() || name, riddle: stage.riddle.trim(), points: Math.max(1, Number(stage.points)||10) };
    setData(old => ({...old, stages:[...old.stages, newStage]}));
    return { ok:true, stage:newStage };
  };
  const deleteStage = (stageId) => {
    setData(old => ({
      ...old,
      stages: old.stages.filter(s=>s.id!==stageId),
      teams: old.teams.map(t=>({...t, completed:t.completed.filter(id=>id!==stageId)})),
    }));
  };
  const addTeam = (team) => {
    const id = team.id.trim();
    if (!id) return { ok:false, message:"Team ID is required." };
    if (data.teams.some(t=>t.id.toLowerCase()===id.toLowerCase())) return { ok:false, message:"That team ID already exists." };
    const memberCount = Math.max(1, Math.min(10, Number(team.memberCount)||5));
    const members = Array.from({length:memberCount},(_,i)=>({ id:`${id}-M${i+1}`, name:team.memberNames?.[i]?.trim() || `Member ${i+1}`, pin:String(Math.floor(1000+Math.random()*9000)) }));
    const newTeam = { id, name: team.name.trim()||id, password: team.password.trim()||"team123", stage:1, completed:[], members };
    setData(old => ({...old, teams:[...old.teams, newTeam]}));
    return { ok:true, team:newTeam };
  };
  const deleteTeam = (teamId) => {
    setData(old => {
      const { [teamId]:_pen, ...penalties } = old.penalties;
      return { ...old, teams: old.teams.filter(t=>t.id!==teamId), penalties };
    });
  };
  const scoreFor = (team) => team.completed.reduce((sum,id)=>sum+(data.stages.find(s=>s.id===id)?.points||0),0) - (data.penalties[team.id]||0);
  const leaderboard = useMemo(()=>[...data.teams].sort((a,b)=>scoreFor(b)-scoreFor(a)||b.completed.length-a.completed.length),[data]);
  const resetDemo = () => { const fresh=seed();setData(fresh);notify("Demo progress has been reset."); };

  if (!user) return <Login adminMode={adminMode} setAdminMode={setAdminMode} loginId={loginId} setLoginId={setLoginId} password={password} setPassword={setPassword} login={login} toast={toast}/>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">CQ</div><div><b>Campus Quest</b><small>TREASURE HUNT</small></div></div>
      <div className="side-label">{user.role === "admin" ? "ORGANIZER" : "PLAYER MENU"}</div>
      {user.role === "admin" ? <>
        <SideButton active={page==="admin"} onClick={()=>setPage("admin")} icon="▦">Overview</SideButton>
        <SideButton active={page==="checkpoints"} onClick={()=>setPage("checkpoints")} icon="⌗">Checkpoints & QR</SideButton>
        <SideButton active={page==="teams"} onClick={()=>setPage("teams")} icon="♟">Teams</SideButton>
        <SideButton active={page==="leaderboard"} onClick={()=>setPage("leaderboard")} icon="♛">Leaderboard</SideButton>
      </> : <>
        <SideButton active={page==="dashboard"} onClick={()=>setPage("dashboard")} icon="⌂">Dashboard</SideButton>
        <SideButton active={page==="scan"} onClick={()=>setPage("scan")} icon="▦">Scan QR code</SideButton>
        <SideButton active={page==="leaderboard"} onClick={()=>setPage("leaderboard")} icon="♛">Leaderboard</SideButton>
      </>}
      <div className="sidebar-bottom"><div className="help-card"><span>✦</span><b>Need a hint?</b><small>Visit the event control desk for help.</small></div><button className="nav-item logout" onClick={logout}><span>↪</span> Log out</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="mobile-brand">CQ <b>Campus Quest</b></div><div className="event-label"><span className="live-dot"></span> EVENT IN PROGRESS</div><div className="profile"><div className="avatar">{user.role==="admin"?"A":currentTeam?.name?.[0]||"T"}</div><div><b>{user.role==="admin"?"Organizer":currentTeam?.name}</b><small>{user.role==="admin"?"Admin account":currentTeam?.id}</small></div></div></header>
      <div className="content">
        {user.role==="admin" ? (
          page==="checkpoints" ? <Checkpoints data={data} setData={setData} notify={notify} addStage={addStage} deleteStage={deleteStage}/> :
          page==="teams" ? <Teams data={data} notify={notify} addTeam={addTeam} deleteTeam={deleteTeam}/> :
          page==="leaderboard" ? <Leaderboard teams={leaderboard} scoreFor={scoreFor} totalStages={data.stages.length}/> :
          <Admin data={data} leaderboard={leaderboard} scoreFor={scoreFor} setPage={setPage} resetDemo={resetDemo}/>
        ) : (
          page==="scan" ? <Scanner data={data} currentTeam={currentTeam} completeStage={completeStage} notify={notify} setPage={setPage}/> :
          page==="leaderboard" ? <Leaderboard teams={leaderboard} scoreFor={scoreFor} totalStages={data.stages.length}/> :
          <Dashboard team={currentTeam} stages={data.stages} score={scoreFor(currentTeam)} setPage={setPage}/>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </main>
  </div>;
}
function SideButton({active,onClick,icon,children}) { return <button className={`nav-item ${active?"active":""}`} onClick={onClick}><span>{icon}</span>{children}</button>; }

function Login({adminMode,setAdminMode,loginId,setLoginId,password,setPassword,login,toast}) {
  return <div className="login-screen"><div className="login-left"><div className="login-brand"><div className="brand-mark">CQ</div><span>CAMPUS QUEST</span></div><div className="login-copy"><span className="eyebrow light">THE CAMPUS IS YOUR PLAYGROUND</span><h1>Think fast.<br/><em>Find the treasure.</em></h1><p>Follow the clues, explore your campus and work together to reach the final checkpoint.</p><div className="login-features"><span>✦ 5 rounds</span><span>♟ Team challenge</span><span>♛ Live leaderboard</span></div></div><div className="login-footer">A campus adventure begins here.</div></div><div className="login-right"><div className="login-form-wrap"><div className="form-top"><span className="eyebrow">WELCOME BACK</span><h2>{adminMode?"Organizer login":"Team login"}</h2><p>Enter your credentials to continue your adventure.</p></div>{toast&&<div className="inline-toast">{toast}</div>}<form onSubmit={login}><label>{adminMode?"Username":"Team ID"}</label><input value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder={adminMode?"admin":"e.g. THT-001"}/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password"/><button className="primary-btn full-btn">{adminMode?"Sign in as organizer":"Enter the game"} <span>→</span></button></form><div className="demo-credentials"><b>DEMO CREDENTIALS</b><p>{adminMode?"Username: admin · Password: admin12345":"Team: THT-001 · Password: team123"}</p></div><button className="text-button" onClick={()=>{setAdminMode(!adminMode);setLoginId(adminMode?"THT-001":"admin");setPassword(adminMode?"team123":"admin12345");}}>{adminMode?"← Back to team login":"Organizer? Sign in here"}</button></div></div></div>;
}
function Dashboard({team,stages,score,setPage}) {
  if(!team) return <div className="panel">Team not found. Please log out and sign in again.</div>;
  const total=stages.length, done=team.completed.length, next=stages.find(s=>s.id===team.stage);
  return <>
    <div className="page-intro"><div><span className="eyebrow">YOUR MISSION STARTS HERE</span><h1>Welcome, {team.name.split(" ")[0]} <span className="wave">✦</span></h1><p>Stay sharp, work together and follow every clue to the treasure.</p></div><div className="team-pill"><span className="team-icon">♟</span><div><small>YOUR TEAM</small><b>{team.id}</b></div></div></div>
    <div className="stat-grid"><Stat icon="⌖" label="Current stage" value={`${Math.min(team.stage,total)} / ${total}`} detail="Keep moving forward"/><Stat icon="✓" label="Completed" value={`${done} / ${total}`} detail="Checkpoints cleared"/><Stat icon="♛" label="Your points" value={score} detail="Total earned points"/></div>
    <div className="dashboard-grid"><section className="card next-card"><div className="card-heading"><div><span className="eyebrow">UP NEXT</span><h2>{next?"Your next clue":"Treasure completed!"}</h2></div><span className="clue-icon">✧</span></div>{next?<><div className="riddle-text">{next.riddle}</div><div className="clue-meta"><span>♛ {next.points} points</span></div><button className="primary-btn" onClick={()=>setPage("scan")}>Scan checkpoint QR <span>→</span></button></>:<div className="success-note">All checkpoints cleared. Visit the control desk for final verification.</div>}</section>
      <section className="card team-card"><div className="card-heading"><div><span className="eyebrow">THE CREW</span><h2>Your team members</h2></div><span className="count-pill">{String(team.members.length).padStart(2,"0")} MEMBERS</span></div><div className="member-list">{team.members.map((m,i)=><div className="member-row" key={m.id}><div className={`member-avatar color-${i+1}`}>{m.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div className="member-info"><b>{m.name}</b><small>{m.id}</small></div><span className="member-check">{team.completed.length>i?"✓":"•"}</span></div>)}</div></section></div>
    <section className="card progress-card"><div className="card-heading"><div><span className="eyebrow">YOUR JOURNEY</span><h2>Checkpoint progress</h2></div><b className="progress-percent">{Math.round(done/total*100)}%</b></div><div className="progress-bar"><span style={{width:`${done/total*100}%`}}/></div></section>
  </>;
}
function Stat({icon,label,value,detail}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{detail}</small></div>; }

function Scanner({data,currentTeam,completeStage,notify,setPage}) {
  const [manualToken,setManualToken]=useState("");
  const [scanResult,setScanResult]=useState(null);
  const [camera,setCamera]=useState(false);
  useEffect(()=>{
    if(!camera)return;
    const scanner=new Html5QrcodeScanner("qr-reader",{fps:10,qrbox:{width:230,height:230},rememberLastUsedCamera:true},false);
    scanner.render(decoded=>{
      setManualToken(decoded.includes("token=")?new URL(decoded).searchParams.get("token"):decoded);
      setCamera(false);scanner.clear().catch(()=>{});
    },()=>{});
    return ()=>{scanner.clear().catch(()=>{});};
  },[camera]);
  const submit=()=>{
    const token=manualToken.includes("token=")?new URL(manualToken).searchParams.get("token"):manualToken;
    const result=completeStage(token);setScanResult(result);
  };
  return <><div className="page-intro"><div><span className="eyebrow">CHECKPOINT VALIDATION</span><h1>Scan & discover</h1><p>Scan the QR code at your current location to unlock the next clue.</p></div><div className="stage-chip">STAGE {String(currentTeam?.stage||1).padStart(2,"0")} / {String(data.stages.length).padStart(2,"0")}</div></div>
    <div className="scanner-layout"><section className="card scanner-main"><div className="scanner-title"><div className="scanner-icon">▦</div><div><h2>QR code scanner</h2><p>Point your camera at the checkpoint QR code.</p></div></div><div className="scanner-window">{camera?<div id="qr-reader"/>:<div className="scanner-placeholder"><div className="scan-frame"><span>▦</span></div><b>Ready to scan?</b><small>Allow camera access when your browser asks.</small><button className="primary-btn" onClick={()=>setCamera(true)}>Open camera scanner</button></div>}</div><div className="or-divider"><span>OR ENTER TOKEN MANUALLY</span></div><input className="token-input" value={manualToken} onChange={e=>setManualToken(e.target.value)} placeholder={`Enter checkpoint token e.g. ${currentTeam?.id||"THT-001"}-R1`}/><button className="primary-btn full-btn" onClick={submit} disabled={!manualToken}>Verify checkpoint <span>→</span></button>{scanResult&&<div className={`scan-feedback ${scanResult.ok?"good":"bad"}`}>{scanResult.ok?"✓":"!"} {scanResult.message}{scanResult.ok&&<button onClick={()=>setPage("dashboard")}> View dashboard →</button>}</div>}</section><aside className="card scan-help"><span className="eyebrow">HOW IT WORKS</span><h2>Two simple steps</h2><div className="how-row"><span>01</span><div><b>Find the checkpoint</b><small>Use the riddle on your dashboard to locate the QR code.</small></div></div><div className="how-row"><span>02</span><div><b>Scan the QR code</b><small>Any team member can scan the code placed at the correct campus location.</small></div></div></aside></div></>;
}
function Leaderboard({teams,scoreFor,totalStages}) { return <><div className="page-intro"><div><span className="eyebrow">THE RACE TO THE TREASURE</span><h1>Leaderboard</h1><p>See how every team is performing in the hunt.</p></div><div className="stage-chip">LIVE RANKING</div></div><section className="card table-card"><div className="table-heading"><div><h2>Team standings</h2><p>Ranked by points and completed checkpoints.</p></div><span className="count-pill">{teams.length} TEAMS</span></div><div className="table-scroll"><table><thead><tr><th>RANK</th><th>TEAM</th><th>CHECKPOINTS</th><th>POINTS</th><th>STATUS</th></tr></thead><tbody>{teams.map((t,i)=><tr key={t.id}><td><span className={`rank rank-${i+1}`}>{String(i+1).padStart(2,"0")}</span></td><td><b>{t.name}</b><small>{t.id}</small></td><td>{t.completed.length} / {totalStages}</td><td><b>{scoreFor(t)}</b></td><td><span className={`table-status ${t.stage>totalStages?"finished":"playing"}`}>{t.stage>totalStages?"Completed":"In progress"}</span></td></tr>)}</tbody></table></div></section></>; }
function Admin({data,leaderboard,scoreFor,setPage,resetDemo}) {
  const total=leaderboard.reduce((n,t)=>n+t.completed.length,0);
  return <><div className="page-intro"><div><span className="eyebrow">ORGANIZER CONTROL CENTER</span><h1>Game overview</h1><p>Monitor the treasure hunt and track team progress.</p></div><button className="outline-btn" onClick={resetDemo}>↻ Reset demo</button></div><div className="stat-grid"><Stat icon="♟" label="Registered teams" value={data.teams.length} detail="Demo teams loaded"/><Stat icon="⌗" label="Checkpoints" value={data.stages.length} detail="QR locations"/><Stat icon="✓" label="Completed scans" value={total} detail="Across all teams"/></div><div className="dashboard-grid"><section className="card"><div className="card-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Manage your game</h2></div></div><div className="admin-actions"><button onClick={()=>setPage("checkpoints")}><span>⌗</span><b>Checkpoints & QR codes</b><small>View tokens and QR codes</small><i>→</i></button><button onClick={()=>setPage("teams")}><span>♟</span><b>Teams</b><small>Register teams and PINs</small><i>→</i></button><button onClick={()=>setPage("leaderboard")}><span>♛</span><b>View leaderboard</b><small>Check team rankings</small><i>→</i></button></div></section><section className="card"><span className="eyebrow">EVENT SNAPSHOT</span><h2>Game configuration</h2><div className="config-row"><span>Game duration</span><b>90 minutes</b></div><div className="config-row"><span>Team size</span><b>5 members</b></div><div className="config-row"><span>Points per checkpoint</span><b>10 points</b></div><div className="config-row"><span>Game status</span><span className="table-status playing">Demo active</span></div></section></div><section className="card"><div className="card-heading"><div><span className="eyebrow">TEAM MONITOR</span><h2>Team progress</h2></div><button className="text-button" onClick={()=>setPage("leaderboard")}>See all standings →</button></div>{leaderboard.map(t=><div className="admin-team-row" key={t.id}><div className="team-mini-avatar">{t.name[0]}</div><div className="member-info"><b>{t.name}</b><small>{t.id}</small></div><div className="mini-progress"><span style={{width:`${t.completed.length/data.stages.length*100}%`}}/></div><b className="team-points">{scoreFor(t)} pts</b></div>)}</section></>;
}
function Checkpoints({data,setData,notify,addStage,deleteStage}) {
  const [copied,setCopied]=useState("");
  const [form,setForm]=useState({name:"",riddle:"",points:10});
  const [teamId,setTeamId]=useState(data.teams[0]?.id||"");
  const [confirmId,setConfirmId]=useState(null);
  const canvasRefs=React.useRef({});
  const team=data.teams.find(t=>t.id===teamId);
  const copy=(token)=>{navigator.clipboard?.writeText(token);setCopied(token);notify("Token copied.");};
  const download=(stage,token)=>{
    const canvas=canvasRefs.current[stage.id];
    if(!canvas) return;
    const link=document.createElement("a");
    link.href=canvas.toDataURL("image/png");
    link.download=`${token}.png`;
    link.click();
  };
  const submit=(e)=>{
    e.preventDefault();
    const result=addStage(form);
    if(!result.ok){notify(result.message);return;}
    notify(`Checkpoint "${result.stage.name}" added.`);
    setForm({name:"",riddle:"",points:10});
  };
  const remove=(stage)=>{
    deleteStage(stage.id);
    notify(`Checkpoint "${stage.name}" removed.`);
    setConfirmId(null);
  };
  return <><div className="page-intro"><div><span className="eyebrow">GAME SETUP</span><h1>Checkpoints & QR codes</h1><p>Each team gets its own unique QR code per round — no two teams share a code.</p></div><span className="stage-chip">{String(data.stages.length).padStart(2,"0")} ROUNDS</span></div>
    <section className="card">
      <div className="card-heading"><div><span className="eyebrow">NEW ROUND</span><h2>Add a checkpoint</h2></div></div>
      <form onSubmit={submit}>
        <div className="verify-fields">
          <div><label>Location name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Main Gate" required/></div>
          <div><label>Points</label><input type="number" min="1" value={form.points} onChange={e=>setForm({...form,points:e.target.value})}/></div>
          <div><label>Riddle</label><input value={form.riddle} onChange={e=>setForm({...form,riddle:e.target.value})} placeholder="Clue players must solve" required/></div>
        </div>
        <button className="primary-btn" type="submit">+ Add checkpoint</button>
      </form>
    </section>
    <section className="card">
      <div className="card-heading"><div><span className="eyebrow">VIEW QR CODES FOR</span><h2>Pick a team</h2></div><select value={teamId} onChange={e=>setTeamId(e.target.value)}>{data.teams.map(t=><option value={t.id} key={t.id}>{t.name} · {t.id}</option>)}</select></div>
    </section>
    {!team ? <div className="panel">Create a team first to generate its QR codes.</div> :
    <div className="checkpoint-grid">{data.stages.map(s=>{const token=tokenFor(team,s);return <div className="card checkpoint-card" key={s.id}><div className="checkpoint-card-top"><span className="eyebrow">ROUND {String(s.id).padStart(2,"0")}</span><span className="points-tag">+{s.points} PTS</span></div><h2>{s.location}</h2><p>{s.riddle}</p><div className="fake-qr"><QRCodeCanvas ref={el=>canvasRefs.current[s.id]=el} value={token} size={132} level="H" includeMargin /></div><div className="token-line"><code>{token}</code><button onClick={()=>copy(token)}>{copied===token?"Copied":"Copy token"}</button></div><button className="outline-btn" onClick={()=>download(s,token)}>⭳ Download PNG</button>
      {confirmId===s.id ? <div className="token-line"><button className="outline-btn" onClick={()=>remove(s)}>Confirm delete</button><button className="text-button" onClick={()=>setConfirmId(null)}>Cancel</button></div>
        : <button className="text-button" onClick={()=>setConfirmId(s.id)}>Delete checkpoint</button>}
    </div>;})}</div>}</>;
}
function Teams({data,notify,addTeam,deleteTeam}) {
  const emptyForm={id:"",name:"",password:"team123",memberCount:5,memberNames:Array(5).fill("")};
  const [form,setForm]=useState(emptyForm);
  const [revealed,setRevealed]=useState(null);
  const [confirmId,setConfirmId]=useState(null);
  const setMemberCount=(value)=>{
    const count=Math.max(1,Math.min(10,Number(value)||1));
    const memberNames=Array.from({length:count},(_,i)=>form.memberNames[i]||"");
    setForm({...form,memberCount:value,memberNames});
  };
  const setMemberName=(i,value)=>{
    const memberNames=[...form.memberNames];
    memberNames[i]=value;
    setForm({...form,memberNames});
  };
  const submit=(e)=>{
    e.preventDefault();
    const result=addTeam(form);
    if(!result.ok){notify(result.message);return;}
    notify(`Team ${result.team.id} created.`);
    setRevealed(result.team);
    setForm(emptyForm);
  };
  const remove=(team)=>{
    deleteTeam(team.id);
    notify(`Team ${team.id} deleted.`);
    setConfirmId(null);
    if(revealed?.id===team.id) setRevealed(null);
  };
  return <><div className="page-intro"><div><span className="eyebrow">GAME SETUP</span><h1>Teams</h1><p>Register teams and generate member PINs.</p></div><span className="stage-chip">{data.teams.length} TEAMS</span></div>
    <div className="dashboard-grid">
      <section className="card">
        <div className="card-heading"><div><span className="eyebrow">NEW TEAM</span><h2>Add a team</h2></div></div>
        <form onSubmit={submit}>
          <div className="verify-fields">
            <div><label>Team ID</label><input value={form.id} onChange={e=>setForm({...form,id:e.target.value})} placeholder="e.g. THT-004" required/></div>
            <div><label>Team name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Code Breakers" required/></div>
            <div><label>Password</label><input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="team123"/></div>
            <div><label>Number of members</label><input type="number" min="1" max="10" value={form.memberCount} onChange={e=>setMemberCount(e.target.value)}/></div>
          </div>
          <label>Member names</label>
          <div className="verify-fields">
            {form.memberNames.map((name,i)=><div key={i}><input value={name} onChange={e=>setMemberName(i,e.target.value)} placeholder={`Member ${i+1} name`}/></div>)}
          </div>
          <button className="primary-btn full-btn" type="submit">Create team <span>→</span></button>
        </form>
        {revealed && <div className="scan-feedback good">✓ Created {revealed.id} / {revealed.password}. Member PINs: {revealed.members.map(m=>`${m.id}:${m.pin}`).join(", ")}</div>}
      </section>
      <section className="card">
        <div className="card-heading"><div><span className="eyebrow">REGISTERED</span><h2>All teams</h2></div></div>
        {data.teams.map(t=><div className="admin-team-row" key={t.id}><div className="team-mini-avatar">{t.name[0]}</div><div className="member-info"><b>{t.name}</b><small>{t.id} · {t.members.length} members</small></div>
          {confirmId===t.id ? <><button className="outline-btn" onClick={()=>remove(t)}>Confirm delete</button><button className="text-button" onClick={()=>setConfirmId(null)}>Cancel</button></>
            : <button className="text-button" onClick={()=>setConfirmId(t.id)}>Delete</button>}
        </div>)}
      </section>
    </div>
  </>;
}
export default App;
