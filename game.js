/* CALENDAR CRUSH — zero-dependency GitHub Pages edition */
(() => {
"use strict";
const ROWS = 12, COLS = 7, DAYS = ["月","火","水","木","金","土","日"];
const ROLES = [
 {id:"rookie",icon:"🎓",name:"新卒",stars:"★☆☆☆☆",fill:8,interrupt:.06,skill:"新人特権",skillText:"『まだ分かりません』で残業時間を短縮",quote:"とりあえず参加して勉強して"},
 {id:"staff",icon:"💻",name:"一般社員",stars:"★★☆☆☆",fill:16,interrupt:.11,skill:"集中モード",skillText:"会議を断って集中時間を確保",quote:"空いてるならこれお願い"},
 {id:"lead",icon:"🛠️",name:"PL・リーダー",stars:"★★★☆☆",fill:24,interrupt:.16,skill:"アサイン調整",skillText:"会議を移して穴を広げる",quote:"ちょっと仕様確認したいんですが"},
 {id:"manager",icon:"📊",name:"課長",stars:"★★★★☆",fill:30,interrupt:.22,skill:"部下に委任",skillText:"予定を4マス消せるが信頼を失う",quote:"今日中に承認お願いします"},
 {id:"director",icon:"👔",name:"部長",stars:"★★★★★",fill:37,interrupt:.27,skill:"部長権限",skillText:"一番混んだ時間帯を強制キャンセル",quote:"全部把握してるよね？"},
 {id:"executive",icon:"👑",name:"役員",stars:"★★★★★+",fill:44,interrupt:.33,skill:"鶴の一声",skillText:"2時間分を消し、部下にしわ寄せ",quote:"あとは現場で調整して"}
];
const TYPES = [
 {id:"routine",name:"毎週の定例",short:"定例",color:"#ff8da4",effect:"来週も同じ時間にお願いします"},
 {id:"root",name:"根回しの根回し",short:"根回",color:"#ed88c9",effect:"事前調整のための事前調整"},
 {id:"ai",name:"AI活用検討",short:"AI",color:"#76a0fa",effect:"AIで業務効率化を検討する会議"},
 {id:"one",name:"1on1",short:"1on1",color:"#a38cfa",effect:"雑談という名の重要業務"},
 {id:"quick",name:"ちょっと5分だけ",short:"5分",color:"#f7a35b",effect:"結局30分を超えました"},
 {id:"urgent",name:"至急MTG",short:"至急",color:"#ff7964",effect:"至急と言われると断れない"},
 {id:"strategy",name:"経営戦略会議",short:"経営",color:"#74c6a0",effect:"今日の結論は次回持ち越し"},
 {id:"minutes",name:"議事録すり合わせ",short:"議事",color:"#78c6c8",effect:"議事録の議事録が必要"},
 {id:"reduction",name:"会議削減検討会",short:"削減",color:"#e3c35f",effect:"会議削減のための会議を追加"},
 {id:"agenda",name:"アジェンダ未定",short:"？？",color:"#9faac7",effect:"何のための会議かは当日のお楽しみ"},
 {id:"boss",name:"役員臨時報告",short:"役員",color:"#ad7ae0",effect:"役員がお見えになるまで待機"}
];
const SHAPES = [
 [[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0],[1,0],[1,1]],
 [[0,1],[0,1],[1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]
];
const PLANS = [
 {name:"家族と夕食",time:"19:00",at:1140,icon:"🍚"},
 {name:"友人と飲み会",time:"20:00",at:1200,icon:"🍻"},
 {name:"子どもとお風呂",time:"19:30",at:1170,icon:"🛁"},
 {name:"趣味のゲーム時間",time:"20:00",at:1200,icon:"🎮"},
 {name:"パートナーと映画",time:"18:30",at:1110,icon:"🎬"}
];
const $ = document.getElementById("app");
const random = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = arr => arr[random(0,arr.length-1)];
const blank = () => Array.from({length:ROWS},()=>Array(COLS).fill(null));
const escapeHtml = text => String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let S = {phase:"select",selected:"staff",sound:false,best:0};
try{S.best=Number(localStorage.getItem("calendar-crush-best")||0)||0}catch(e){}
let audioContext=null;
function beep(f=540,t=.055){
 if(!S.sound)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  audioContext ||= new C();
  const osc=audioContext.createOscillator(),g=audioContext.createGain();
  osc.type="triangle";osc.frequency.value=f;g.gain.setValueAtTime(.04,audioContext.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+t);
  osc.connect(g);g.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+t);
 }catch(e){}
}
function log(msg){S.notices.unshift(msg);S.notices=S.notices.slice(0,12)}
function toast(msg){S.toast=msg;S.toastUntil=Date.now()+1800}
function role(){return ROLES.find(r=>r.id===S.roleId)||ROLES[1]}
function plan(){return PLANS[Math.min(S.dayIndex,4)]}
function clock(minutes){
 let day=Math.floor(minutes/1440), hh=Math.floor(minutes%1440/60),mm=minutes%60;
 return (day?"翌":"")+String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0");
}
function typeBy(id){return TYPES.find(t=>t.id===id)||TYPES[0]}
function newPiece(def){
 const shape=SHAPES[random(0,SHAPES.length-1)].map(row=>row.slice());
 return {def:def||pick(TYPES),shape,x:Math.floor((COLS-shape[0].length)/2),y:-shape.length};
}
function valid(piece,dx=0,dy=0,shape=piece.shape){
 for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c]){
  const x=piece.x+c+dx,y=piece.y+r+dy;
  if(x<0||x>=COLS||y>=ROWS)return false;
  if(y>=0&&S.board[y][x])return false;
 }
 return true;
}
function projected(piece){let y=0;while(valid(piece,0,y+1))y++;return y}
function rotate(p){
 const h=p.shape.length,w=p.shape[0].length;
 const next=Array.from({length:w},(_,i)=>Array.from({length:h},(_,j)=>p.shape[h-1-j][i]));
 for(const ox of [0,-1,1,-2,2]){
  if(valid(p,ox,0,next)){p.x+=ox;p.shape=next;beep(740);break}
 }
}
function initialBoard(r){
 const board=blank();
 const bottomRows=Math.min(ROWS-4,Math.max(2,Math.ceil(r.fill/(COLS-1))));
 let placed=0,attempts=0;
 while(placed<r.fill&&attempts++<500){
  const y=random(ROWS-bottomRows,ROWS-1),x=random(0,COLS-1);
  if(board[y][x])continue;
  if(board[y].filter(Boolean).length>=COLS-1)continue;
  const def=pick(TYPES);
  board[y][x]={type:def.id,name:def.short,color:def.color};
  placed++;
 }
 return board;
}
function startGame(id){
 const r=ROLES.find(x=>x.id===id)||ROLES[1],best=S.best,sound=S.sound;
 S={best,sound,phase:"play",selected:r.id,roleId:r.id,board:initialBoard(r),
  next:newPiece(),piece:null,hold:null,holdUsed:false,score:0,cleared:0,stress:10+r.fill/4,
  work:12,company:50,home:80,team:80,mail:30,turns:0,dayIndex:0,dayTurns:0,
  overtime:0,lateCount:0,canceled:0,choicePending:false,event:null,eventSeen:Array(5).fill(false),
  notices:[],toast:"",toastUntil:0,skillUses:1,finishReason:""};
 log(r.icon+" "+r.name+"として出勤。カレンダーが既に埋まっています。");
 log("上司「"+"仕事は自分で調整して"+"」");
 spawn();render();
}
function spawn(){
 S.piece=S.next;S.next=newPiece();S.holdUsed=false;
 if(!valid(S.piece)){finish("これ以上、会議をねじ込めません。");return false}
 return true;
}
function addOvertime(mins){S.overtime=Math.max(0,S.overtime+mins)}
function randomIntrusion(){
 if(Math.random()>role().interrupt||S.phase!=="play")return;
 const empties=[];
 for(let y=4;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!S.board[y][x])empties.push([x,y]);
 if(!empties.length)return;
 const [x,y]=pick(empties),def=pick([TYPES[4],TYPES[5],TYPES[10]]);
 S.board[y][x]={type:def.id,name:def.short,color:def.color};
 S.stress=Math.min(100,S.stress+3);addOvertime(7);
 log("📞 突然の横入り：『今ちょっといい？』");
 toast("👔 上司の横入り！");
}
function advanceDay(){
 if(S.phase!=="play"||S.dayTurns<6)return;
 const old=plan();
 if(!S.eventSeen[S.dayIndex]&&1080+S.overtime<=old.at)S.home=Math.min(100,S.home+4);
 S.dayIndex++;S.dayTurns=0;S.overtime=0;
 if(S.dayIndex>=5){finish("やっと金曜日が終わりました。");return}
 log(DAYS[S.dayIndex]+"曜日。新しい予定が続々届きました。");
 toast(DAYS[S.dayIndex]+"曜日スタート！休みはまだ遠い");
}
function checkNight(){
 const p=plan();
 if(S.dayIndex>4||S.eventSeen[S.dayIndex]||1080+S.overtime<p.at)return false;
 S.eventSeen[S.dayIndex]=true;
 S.event={day:DAYS[S.dayIndex],plan:p,forecast:clock(1080+S.overtime)};
 S.phase="event";beep(280,.22);return true;
}
function applyEffect(type){
 if(type.id==="one"){S.stress=Math.max(0,S.stress-12);S.home=Math.min(100,S.home+2);log("🤝 1on1：部下の話を聞いて少し回復")}
 if(type.id==="ai"){S.mail=Math.min(100,S.mail+25);S.work=Math.max(0,S.work-1);log("🤖 AI活用を検討しました。資料だけ増えました")}
 if(type.id==="quick"){addOvertime(24);S.stress+=7;toast("⏰『5分だけ』が30分延長！")}
 if(type.id==="urgent"){S.score+=75;S.stress+=7;log("🚨 『至急』という言葉に逆らえない")}
 if(type.id==="routine"&&Math.random()<.21){S.stress+=6;addOvertime(12);log("🔁 定例が増殖！来週も同じ時間に確定")}
 if(type.id==="reduction"){S.stress+=4;addOvertime(18);log("📋 会議削減のための追加会議を設定しました");toast("会議削減会議が増えました")}
 if(type.id==="strategy"){S.company=Math.min(100,S.company+3);addOvertime(15);log("👔 結論は次回に持ち越し")}
 if(type.id==="agenda"){S.stress+=5;log("❓ 結局、何の会議だったのでしょうか")}
 if(type.id==="boss"){S.company=Math.min(100,S.company+4);S.stress+=5;addOvertime(19)}
}
function clearRows(){
 let n=0;
 for(let y=ROWS-1;y>=0;y--)if(S.board[y].every(Boolean)){
  S.board.splice(y,1);S.board.unshift(Array(COLS).fill(null));n++;y++;
 }
 if(n){
  S.cleared+=n;S.score+=600*n*n;S.mail=Math.min(100,S.mail+30*n);
  S.stress=Math.max(0,S.stress-8*n);S.work=Math.min(100,S.work+8*n);
  log("🎉 "+n+"時間分の会議が全部消えました！");
  toast(n+"時間消滅！ 生産性（自称）爆上がり！");
  beep(970,.14);
  if(Math.random()<.36){
   addOvertime(13);S.stress+=4;log("📩『会議がなくなったので資料作成お願いします』");
  }
 }
 return n;
}
function lockPiece(){
 if(!S.piece||S.phase!=="play")return;
 const p=S.piece;
 for(let y=0;y<p.shape.length;y++)for(let x=0;x<p.shape[y].length;x++)if(p.shape[y][x]){
  const r=p.y+y,c=p.x+x;
  if(r<0){finish("予定があふれました。今週はもう無理です。");return}
  S.board[r][c]={type:p.def.id,name:p.def.short,color:p.def.color};
 }
 S.turns++;S.dayTurns++;S.score+=40+random(0,35);S.stress=Math.min(100,S.stress+2+Math.floor(role().fill/13));
 S.company=Math.min(100,S.company+2);
 S.work=Math.max(0,S.work-1);
 addOvertime(random(6,16)+Math.floor(role().fill/11)*3);
 applyEffect(p.def);
 clearRows();
 if(Math.random()<.16){S.score+=25;log("📢 発言者全員『認識合ってます』で終了")}
 S.piece=null;
 if(S.stress>=100){finish("社会ストレスが100%に達しました。");return}
 if(!spawn())return;
 if(checkNight()){render();return}
 randomIntrusion();
 advanceDay();
 render();
}
function drop(hard){
 if(!S.piece||S.phase!=="play")return;
 if(hard){
  const dist=projected(S.piece);S.piece.y+=dist;
  S.score+=dist*2;beep(340,.07);lockPiece();return;
 }
 if(valid(S.piece,0,1)){S.piece.y++;if(!hard)render()}
 else lockPiece();
}
function move(dx){
 if(S.phase==="play"&&S.piece&&valid(S.piece,dx,0)){
  S.piece.x+=dx;beep(600,.03);render();
 }
}
function hold(){
 if(S.phase!=="play"||S.holdUsed)return;
 const type=S.piece.def;
 if(S.hold){S.piece=newPiece(S.hold);S.hold=type}
 else{S.hold=type;S.piece=S.next;S.next=newPiece()}
 S.holdUsed=true;
 if(!valid(S.piece)){finish("保留した会議に居場所がありません。");return}
 log("📥『一旦持ち帰ります』で会議を入れ替え");beep(710);render();
}
function removeRow(row){
 S.board.splice(row,1);S.board.unshift(Array(COLS).fill(null));
 S.cleared++;S.score+=400;S.work=Math.min(100,S.work+7);
}
function busiestRow(){
 let best=0,count=-1;
 for(let y=0;y<ROWS;y++){let c=S.board[y].filter(Boolean).length;if(c>count){count=c;best=y}}
 return [best,count];
}
function email(){
 if(S.phase!=="play")return;
 if(S.mail<100){toast("✉️ メール砲は "+S.mail+"% 充電中");render();return}
 S.mail=0;
 const [y,n]=busiestRow();
 if(n){removeRow(y);S.stress=Math.max(0,S.stress-15);log("✉️ 『それメールでよくない？』で"+n+"件の会議が消滅");toast("✉️ それメールでよくない？ 砲！");beep(1100,.23)}
 else toast("削除する会議すらない……");
 if(!S.piece||!valid(S.piece)){finish("会議を消したのに新しい会議が置けません。");return}
 render();
}
function skill(){
 if(S.phase!=="play")return;
 if(S.skillUses<=0){toast("役職スキルは使用済みです");render();return}
 S.skillUses--;
 switch(S.roleId){
  case "rookie":addOvertime(-40);S.stress=Math.max(0,S.stress-15);log("🎓 新人特権『まだ分かりません』");break;
  case "staff":addOvertime(-35);S.stress=Math.max(0,S.stress-11);S.work=Math.min(100,S.work+12);log("💻 通知を切って集中作業しました");break;
  case "lead":{
   let moved=false;
   for(let tries=0;tries<30;tries++){
    const y=random(3,ROWS-1),x=random(0,COLS-1),nx=x+(Math.random()<.5?-1:1);
    if(nx>=0&&nx<COLS&&S.board[y][x]&&!S.board[y][nx]){S.board[y][nx]=S.board[y][x];S.board[y][x]=null;moved=true;break}
   }
   if(!moved)addOvertime(-20);
   log("🛠️ PLがアサイン調整。会議を移動");break
  }
  case "manager":{
   const cells=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(S.board[y][x])cells.push([y,x]);
   for(let i=0;i<Math.min(4,cells.length);i++){const idx=random(0,cells.length-1),[y,x]=cells.splice(idx,1)[0];S.board[y][x]=null}
   S.team=Math.max(0,S.team-15);S.company+=2;log("📊 部下に会議を委任。部下は困惑している");break
  }
  case "director":{const [y,n]=busiestRow();if(n)removeRow(y);S.home=Math.min(100,S.home+2);log("👔 部長権限で"+n+"件を一括キャンセル");break}
  case "executive":{
   for(let i=0;i<2;i++){const [y,n]=busiestRow();if(n)removeRow(y)}
   S.team=Math.max(0,S.team-28);S.company=Math.min(100,S.company+10);
   log("👑 鶴の一声『現場で調整しておいて』");break;
  }
 }
 if(S.piece&&!valid(S.piece)){S.piece.y=-S.piece.shape.length;S.piece.x=Math.floor((COLS-S.piece.shape[0].length)/2)}
 toast(role().icon+" "+role().skill+" 発動！");beep(870,.19);render();
}
function choose(index){
 if(S.phase!=="event")return;
 const opts=[
  {name:"すみません、帰ります！",company:-14,home:12,team:0,delay:-25,cancel:0,log:"上司『え、まだ話してるんだけど？』"},
  {name:"プライベート予定をキャンセル",company:12,home:-27,team:0,delay:20,cancel:1,log:"家族『……わかった』"},
  {name:"明日の予定にリスケ",company:2,home:-10,team:0,delay:-12,cancel:0,log:"上司『じゃあ土曜の朝で』"},
  {name:"部下に引き継ぐ",company:4,home:6,team:-23,delay:-30,cancel:0,log:"部下『えっ、聞いてないです』"}
 ],c=opts[index]||opts[0];
 S.company=Math.min(100,Math.max(0,S.company+c.company));
 S.home=Math.min(100,Math.max(0,S.home+c.home));
 S.team=Math.min(100,Math.max(0,S.team+c.team));
 addOvertime(c.delay);S.canceled+=c.cancel;S.lateCount++;
 log("💬 "+c.log);toast(c.log);
 S.event=null;S.phase="play";
 if(S.home<=0){finish("家庭内の信用残高がなくなりました。");return}
 advanceDay();render();
}
function finish(reason){
 if(S.phase==="result"||S.phase==="review")return;
 S.finishReason=reason;S.phase="result";
 if(S.score>S.best){S.best=S.score;try{localStorage.setItem("calendar-crush-best",String(S.best))}catch(e){}}
 beep(220,.3);render();
}
function grade(value){return value>=90?"S":value>=77?"A":value>=62?"B":value>=45?"C":"D"}
function matrixMarkup(p){
 if(!p)return "";
 let arr=Array.from({length:4},()=>Array(4).fill(0));
 for(let r=0;r<p.shape.length;r++)for(let c=0;c<p.shape[r].length;c++)arr[r][c]=p.shape[r][c];
 return arr.flat().map(v=>'<span class="nextPixel" style="background:'+(v?p.def.color:"transparent")+'"></span>').join("");
}
function boardMarkup(){
 const active=new Map(),ghost=new Set();
 if(S.piece){
  const p=S.piece,dy=projected(p);
  for(let r=0;r<p.shape.length;r++)for(let c=0;c<p.shape[r].length;c++)if(p.shape[r][c]){
   const y=p.y+r,x=p.x+c;if(y>=0&&y<ROWS)active.set(y+":"+x,p.def);
   if(y+dy>=0&&y+dy<ROWS)ghost.add((y+dy)+":"+x);
  }
 }
 let html="";
 for(let y=0;y<ROWS;y++){
  html+='<div class="hour">'+String(9+y).padStart(2,"0")+':00</div>';
  for(let x=0;x<COLS;x++){
   const key=y+":"+x,p=active.get(key),v=S.board[y][x],cellClass="cell "+(y%2?"alt ":"")+(x>=5?"weekend ":"")+(ghost.has(key)&&!v&&!p?"ghost":"");
   html+='<div class="'+cellClass+'" role="gridcell" aria-label="'+DAYS[x]+'曜'+(9+y)+'時 '+(p?"落下中 "+p.name:v?v.name:"空き")+'">';
   const block=p?{name:p.short,color:p.color}:v;
   if(block)html+='<div class="block '+(p?"active":"locked")+'" style="background:'+block.color+'"><span>'+escapeHtml(block.name)+'</span></div>';
   html+='</div>';
  }
 }
 return html;
}
function sideMarkup(){
 const r=role(),current=plan();
 return '<aside class="sidebar">'+
 '<div class="sideCard"><h2>🗓️ 今日の退勤戦線</h2><div class="lifeRow">'+current.icon+' '+current.name+'<b>'+current.time+'</b></div><p>会議を入れるたび帰宅時間が後ろ倒し。消えた会議は戻らなくても、失った時間は戻りません。</p>'+
 '<div class="sideValue"><span>🏢 会社の評価</span><b>'+Math.floor(S.company)+'/100</b></div><div class="ratingBar"><i style="width:'+S.company+'%"></i></div>'+
 '<div class="sideValue"><span>🏠 家庭の評価</span><b>'+Math.floor(S.home)+'/100</b></div><div class="ratingBar"><i class="home" style="width:'+S.home+'%"></i></div>'+
 '<div class="sideValue"><span>💻 実際の成果</span><b>'+Math.floor(S.work)+'/100</b></div><div class="ratingBar"><i style="width:'+S.work+'%;background:#7da2ee"></i></div>'+
 '<p>🏅 '+r.name+'スキル：'+r.skill+' ('+S.skillUses+'回)<br>'+r.skillText+'</p><button class="miniButton" data-act="skill">⚡ スキル発動（S）</button></div>'+
 '<div class="sideCard notice"><h2>💬 社内の出来事</h2>'+S.notices.slice(0,6).map(t=>'<div class="noticeItem">'+escapeHtml(t)+'</div>').join("")+'</div>'+
 '<div class="sideFooter">← → 移動 / ↑ 回転 / ↓ 早送り / Space ねじ込む<br>C 保留 / E メール砲 / S 役職スキル / P 一時停止</div></aside>';
}
function gameMarkup(){
 const r=role(),p=plan(),forecast=clock(1080+S.overtime),danger=1080+S.overtime>=p.at;
 return '<div class="shell"><header class="siteHeader">'+
 '<div class="logo">📆</div><div class="brand"><strong>会議ねじこみパニック！</strong><small>CALENDAR CRUSH</small></div>'+
 '<div class="headerRight"><span class="miniCount">🏢'+Math.floor(S.company)+' 🏠'+Math.floor(S.home)+'</span><button class="smallToggle" data-act="sound" aria-label="サウンド切り替え">♫ '+(S.sound?"ON":"OFF")+'</button></div></header>'+
 '<section class="metrics" aria-label="ゲームの状況"><div class="metric"><div class="metricLabel">🏆 生産性（自称）</div><div class="metricValue">'+String(S.score).padStart(5,"0")+'</div></div>'+
 '<div class="metric"><div class="metricLabel">🧹 消滅した時間帯</div><div class="metricValue">'+S.cleared+'<span> 時間</span></div></div>'+
 '<div class="metric"><div class="stressHead"><span class="metricLabel">😵 社畜ストレス</span><b>'+Math.round(S.stress)+'%</b></div><div class="stressTrack"><div class="stressFill" style="width:'+S.stress+'%"></div></div></div></section>'+
 '<main class="layout"><section class="gamePane" aria-label="ゲーム盤">'+
 '<div class="statusStrip"><span class="tag">'+r.name+'</span><span class="deadline" style="color:'+(danger?"#e85d60":"#7985a0")+'">⏰'+forecast+' → 🏠'+p.time+'</span>'+
 '<button class="miniButton" data-act="pause" '+(S.phase==="review"?"disabled":"")+'>Ⅱ 一時停止</button></div>'+
 '<div class="nextRow"><div class="nextCard"><div class="nextPiece">'+matrixMarkup(S.next)+'</div><div class="nextInfo"><span class="hint">NEXT</span><strong>'+escapeHtml(S.next.def.name)+'</strong></div></div>'+
 '<button class="squareAction" data-act="hold" '+(S.holdUsed||S.phase==="review"?"disabled":"")+'><span class="emoji">📥</span><small>'+(S.hold?"保留："+escapeHtml(S.hold.short):"保留")+'</small></button>'+
 '<button class="squareAction gold '+(S.mail>=100?"ready":"")+'" data-act="email" '+(S.phase==="review"?"disabled":"")+'><span class="emoji">✉️</span><small>'+(S.mail>=100?"発動OK":S.mail+"%")+'</small></button>'+
 '<button class="squareAction" data-act="skill" '+(!S.skillUses||S.phase==="review"?"disabled":"")+' title="'+r.skill+'"><span class="emoji">⚡</span><small>役職技</small></button></div>'+
 '<div class="days"><div class="dateBadge">'+(11+S.dayIndex)+'</div>'+DAYS.map((d,i)=>'<div class="day '+(i>=5?"weekend ":"")+(i===6?"sunday":"")+'">'+d+'</div>').join("")+'</div>'+
 '<div class="calendar" role="grid" aria-label="週のカレンダー">'+boardMarkup()+'</div>'+
 '<div class="boardHint">'+(S.phase==="review"?"最終盤面：すべての会議がここに残りました":S.toast&&Date.now()<S.toastUntil?escapeHtml(S.toast):"予定のない時間など、存在しない。")+'</div>'+
 '<div class="controls">'+(S.phase==="review"?'<div class="controlReview"><button data-act="result">📋 評価を見る</button><button class="primary" data-act="retry">🔁 もう一度</button></div>':
 '<button class="keyButton" data-act="left" aria-label="左に移動">←</button><button class="keyButton" data-act="rotate" aria-label="回転">↻</button>'+
 '<button class="keyButton" data-act="down" aria-label="下に移動">↓</button><button class="keyButton" data-act="right" aria-label="右に移動">→</button>'+
 '<button class="keyButton slam" data-act="slam" aria-label="ねじ込む">⋮<small>ねじ込む</small></button>')+'</div>'+
 (S.phase==="review"?'<div class="reviewBanner">📅 あなたが作った、地獄の1週間</div>':'')+
 '</section>'+sideMarkup()+'</main></div>';
}
function roleDialog(){
 return '<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-label="役職選択">'+
 '<div class="eyebrow">WELCOME TO THE CORPORATE JUNGLE</div><h1>📆 会議ねじこみパニック！</h1>'+
 '<div class="sub">埋まりすぎたカレンダーに、さらに会議をねじ込む。<br>一列そろえばその時間帯の会議が消滅。でも、仕事は消えません。</div>'+
 '<div class="roleGrid">'+ROLES.map(r=>'<button class="roleCard '+(S.selected===r.id?"active":"")+'" data-act="role" data-id="'+r.id+'"><span class="roleIcon">'+r.icon+'</span><span class="roleName">'+r.name+'</span><span class="roleStars">'+r.stars+'</span><span class="roleCaption">予定 '+r.fill+'件 / '+r.skill+'</span></button>').join("")+'</div>'+
 '<div class="callout">🗯️ 「'+escapeHtml(ROLES.find(r=>r.id===S.selected).quote)+'」<br>⚡ スキル：'+escapeHtml(ROLES.find(r=>r.id===S.selected).skillText)+'</div>'+
 '<button class="mainButton" data-act="start">この役職で出勤する →</button></section></div>';
}
function eventDialog(){
 const e=S.event||{day:DAYS[S.dayIndex],plan:plan(),forecast:clock(1080+S.overtime)};
 return '<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-label="夜の予定との衝突">'+
 '<div class="eyebrow">緊急イベント / '+e.day+'曜日</div><div class="eventHeading">📞</div><h2>会議が終わりません！</h2>'+
 '<div class="sub">本日の退勤見込みは <b>'+e.forecast+'</b>。<br><b>'+e.plan.time+' の「'+e.plan.icon+escapeHtml(e.plan.name)+'」</b>に間に合いません。<br>上司「最後に一点だけ確認させて」</div>'+
 [
 ["すみません、今日は帰ります！","会社評価 −14 ／ 家庭評価 +12"],
 ["プライベート予定をキャンセル","会社評価 +12 ／ 家庭評価 −27"],
 ["明日にリスケしましょう","休日にも仕事が侵食 ／ 家庭評価 −10"],
 ["部下に引き継ぎます！","家庭評価 +6 ／ チーム信頼 −23"]
 ].map((c,i)=>'<button class="choiceButton" data-act="choice" data-id="'+i+'">'+c[0]+'<small>'+c[1]+'</small></button>').join("")+
 '<div class="sub">どれを選んでも、誰かの時間が削られます。</div></section></div>';
}
function gradeComment(){
 if(S.company>=80&&S.home<50)return "多くの会議に参加し組織貢献が認められました。なお、家庭内での存在感は著しく低下しています。";
 if(S.work<20)return "会議参加率は優秀でしたが、成果物の提出が確認できません。来期に期待します。";
 if(S.home>75)return "仕事だけが人生ではないと気づいたようです。ただし上司は少し不満そうです。";
 return "『主体性を持って調整を』というコメントだけが、週報に残りました。";
}
function resultDialog(){
 return '<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-label="今週の勤務評価">'+
 '<div class="eyebrow">WEEKLY PERFORMANCE REVIEW</div><h2>📋 今週の勤務評価</h2><div class="sub">'+escapeHtml(S.finishReason)+'</div>'+
 '<div class="reportGrid"><div class="reportBox"><small>🏢 会社からの評価</small><strong>'+grade(S.company)+'</strong><small>'+Math.round(S.company)+'点</small></div>'+
 '<div class="reportBox"><small>🏠 家庭からの評価</small><strong class="homeGrade">'+grade(S.home)+'</strong><small>'+Math.round(S.home)+'点</small></div></div>'+
 '<div class="resultComment"><b>人事評価コメント</b><br>「'+gradeComment()+'」</div>'+
 '<div class="resultStats">生産性（自称） '+S.score+'点 ｜ 会議消去 '+S.cleared+'時間 ｜ 私用への影響 '+S.lateCount+'回 ｜ キャンセル '+S.canceled+'件<br>実際の成果 '+Math.round(S.work)+'点 ｜ チーム信頼 '+Math.round(S.team)+'点 ｜ 自己ベスト '+S.best+'点</div>'+
 '<div class="dialogActions"><button class="secondaryButton" data-act="review">📅 最後の盤面を見る</button><button class="mainButton" data-act="retry">🔁 もう一度</button></div></section></div>';
}
function pauseDialog(){
 return '<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-label="一時停止"><h2>☕ 一時停止</h2>'+
 '<div class="sub">ついに、休憩の予定が確保できました。<br>なお、上司には通知されません。</div>'+
 '<button class="mainButton" data-act="resume">仕事に戻る</button><button class="secondaryButton" data-act="roles">役職を変更する</button></section></div>';
}
function render(){
 if(!$.isConnected)return;
 if(S.phase==="select"){
  $.innerHTML='<div class="shell"><header class="siteHeader"><span class="logo">📆</span><div class="brand"><strong>会議ねじこみパニック！</strong><small>CALENDAR CRUSH</small></div></header></div>'+roleDialog();
  return;
 }
 $.innerHTML=gameMarkup()+(S.phase==="event"?eventDialog():S.phase==="result"?resultDialog():S.phase==="pause"?pauseDialog():"");
}
function action(name,id){
 switch(name){
 case "role":S.selected=id;render();break;
 case "start":startGame(S.selected);break;
 case "retry":startGame(S.roleId);break;
 case "roles":S.selected=S.roleId;S.phase="select";render();break;
 case "sound":S.sound=!S.sound;if(S.sound)beep(780);render();break;
 case "left":move(-1);break;case "right":move(1);break;
 case "rotate":if(S.phase==="play"){rotate(S.piece);render()}break;
 case "down":drop(false);break;case "slam":drop(true);break;
 case "hold":hold();break;case "email":email();break;case "skill":skill();break;
 case "pause":if(S.phase==="play"){S.phase="pause";render()}break;
 case "resume":if(S.phase==="pause"){S.phase="play";render()}break;
 case "choice":choose(Number(id));break;
 case "review":if(S.phase==="result"){S.phase="review";render()}break;
 case "result":if(S.phase==="review"){S.phase="result";render()}break;
 }
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-act]");if(!b||b.disabled)return;
 action(b.dataset.act,b.dataset.id);
});
document.addEventListener("keydown",e=>{
 const k=e.key.toLowerCase();
 if(["arrowleft","arrowright","arrowup","arrowdown"," ","spacebar"].includes(k))e.preventDefault();
 if(S.phase==="pause"){if(k==="p"||k==="escape")action("resume");return}
 if(S.phase!=="play")return;
 if(k==="arrowleft"||k==="a")action("left");
 else if(k==="arrowright"||k==="d")action("right");
 else if(k==="arrowup"||k==="w")action("rotate");
 else if(k==="arrowdown")action("down");
 else if(k===" "||k==="spacebar")action("slam");
 else if(k==="c")action("hold");
 else if(k==="e")action("email");
 else if(k==="s")action("skill");
 else if(k==="p"||k==="escape")action("pause");
});
setInterval(()=>{if(S.phase==="play"&&S.piece)drop(false)},880);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&S.phase==="play"){S.phase="pause";render()}});
render();
})();