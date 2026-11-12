const assert=require("node:assert/strict");
const listeners={};
const root={isConnected:true,innerHTML:""};
global.window={};
global.document={
  getElementById(id){assert.equal(id,"app");return root},
  addEventListener(name,callback){listeners[name]=callback},
  hidden:false
};
global.localStorage={getItem(){return null},setItem(){}};
global.setInterval=()=>1;
require("../game.js");
assert.match(root.innerHTML,/この役職で出勤する/);
function click(act,id){
 listeners.click({target:{closest(sel){assert.equal(sel,"[data-act]");return {dataset:{act,id},disabled:false}}}});
}
for(const id of ["rookie","staff","lead","manager","director","executive"]){
 click("role",id);click("start");
 assert.match(root.innerHTML,/生産性（自称）/);
 assert.match(root.innerHTML,/calendar/);
 click("skill");
 for(let i=0;i<15;i++){
  if(root.innerHTML.includes("role=\"dialog\"")&&root.innerHTML.includes("会議が終わりません"))click("choice",1);
  else if(root.innerHTML.includes("最後の盤面を見る"))break;
  else click("slam");
 }
 if(root.innerHTML.includes("最後の盤面を見る")){
  click("review");
  assert.match(root.innerHTML,/評価を見る/);
  click("result");
  assert.match(root.innerHTML,/今週の勤務評価/);
 }
}
console.log("PASS: role selection, play, skill, event and result/review flows");
