import {Player} from './Player.js';
import {Input} from './input.js';
import {overlap} from './collision.js';
const W=1100,H=640,STEP=1/120;
const assetNames={grass:'GRASS TILE',water:'WATER TILE',ground:'GROUND TILE',tree1:'TREE 1',tree2:'TREE 2',tree3:'TREE 3',house:'HOUSE 1',church:'CHURCH',detail:'GRASS DETAIL 1',rock:'WATER DETAIL 1',lily:'WATER DETAIL 5'};
const $=id=>document.getElementById(id);
export class Game{
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.ctx.imageSmoothingEnabled=false;
  this.state='ready';this.night=false;this.player=new Player();this.assets={};this.particles=[];this.best=0;this.bestTime=null;this.storageOK=true;
  try{const saved=JSON.parse(localStorage.getItem('village-post-record')||'null');if(saved&&typeof saved==='object'){this.best=Math.max(0,Math.min(3,Number(saved.score)||0));this.bestTime=Number.isFinite(saved.time)&&saved.time>0?saved.time:null;}}catch{this.storageOK=false;}
  this.platforms=[{x:290,y:440,w:180,h:155},{x:560,y:370,w:180,h:225},{x:840,y:410,w:180,h:185},{x:1110,y:335,w:190,h:260},{x:1410,y:400,w:190,h:195}];
  this.solids=[{x:0,y:500,w:230,h:160},...this.platforms,{x:1700,y:500,w:460,h:160}];
  this.hazard={x:230,y:582,w:1470,h:100};this.finish={x:1930,y:410,w:95,h:90};
  this.input=new Input(canvas,onlyPause=>{if(onlyPause){if(this.state==='running')this.setState('paused');}else this.togglePause();});
  $('start').onclick=()=>{if(this.state==='paused')this.setState('running');else if(this.state!=='running')this.restart();};
  $('pause').onclick=()=>this.togglePause();$('restart').onclick=()=>this.restart();
  $('primary').onclick=()=>this.state==='paused'?this.setState('running'):this.restart();
  $('theme').onclick=()=>{this.night=!this.night;$('theme').textContent=this.night?'☀ День':'☾ Ночь';};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.state==='running')this.setState('paused');this.input.clear();});
  this.resetWorld();this.syncUI();this.loadAssets();
  this.last=null;this.accumulator=0;this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
 }
 async loadAssets(){
  let loaded=0;const jobs=[];
  for(const mode of ['DAY','NIGHT'])for(const [key,name] of Object.entries(assetNames))jobs.push(new Promise(resolve=>{
   const image=new Image();image.onload=()=>{this.assets[key+mode]=image;loaded++;resolve();};image.onerror=()=>resolve();
   image.src='./TILESET VILLAGE TOP DOWN/'+encodeURIComponent(name+' - '+mode+'.png');
  }));
  await Promise.all(jobs);$('asset-status').textContent=loaded===jobs.length?'Оформление деревни загружено':`Спрайты: ${loaded}/${jobs.length} · отсутствующие заменены рисунком`;
 }
 resetWorld(){this.player.reset();this.coins=[{x:373,y:398,w:28,h:28},{x:923,y:368,w:28,h:28},{x:1493,y:358,w:28,h:28}].map(c=>({...c,collected:false}));this.score=0;this.time=0;this.camera=0;this.particles=[];this.toast='';this.toastTime=0;this.accumulator=0;}
 restart(){this.resetWorld();this.setState('running');}
 setState(state){this.state=state;this.input.clear();this.input.enabled=state==='running';this.last=null;this.accumulator=0;if(state==='running')this.canvas.focus({preventScroll:true});this.syncUI();}
 togglePause(){if(this.state==='running')this.setState('paused');else if(this.state==='paused')this.setState('running');}
 syncUI(){
  $('score').textContent=`${this.score} / 3`;$('best').textContent=`${this.best} / 3`+(this.bestTime?' · '+this.format(this.bestTime):'');
  $('time').textContent=this.format(this.time);$('overlay').hidden=this.state==='running';
  $('pause').disabled=!['running','paused'].includes(this.state);$('pause').textContent=this.state==='paused'?'▶ Продолжить':'Ⅱ Пауза';$('start').disabled=this.state==='running';
  const copy={ready:['МАЛЕНЬКОЕ БОЛЬШОЕ ПУТЕШЕСТВИЕ','Доставка до заката','Пять островов, три потерянные посылки и один дом, в котором тебя ждут. Перепрыгни реку — вода опасна!','Начать путешествие →'],paused:['МОЖНО ПЕРЕВЕСТИ ДУХ','Путешествие на паузе','Посылки никуда не денутся. Продолжай, когда будешь готов.','Продолжить →'],won:['ДОСТАВЛЕНО С ЗАБОТОЙ','Деревня благодарит тебя!',`Все три посылки дома. Время: ${this.format(this.time)}. Попробуй пройти маршрут быстрее!`,'Пройти ещё раз →'],lost:['НОВАЯ ПОПЫТКА — НОВАЯ ИСТОРИЯ','Осторожнее у воды',`Собрано посылок: ${this.score} из 3. Прыгай с края острова и отпускай кнопку прыжка перед следующим прыжком.`,'Попробовать снова →']};
  if(copy[this.state]){const c=copy[this.state];$('overline').textContent=c[0];$('title').textContent=c[1];$('message').textContent=c[2];$('primary').textContent=c[3];}
 }
 format(seconds){const s=Math.floor(seconds);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
 saveRecord(won=false){this.best=Math.max(this.best,this.score);if(won&&(this.bestTime===null||this.time<this.bestTime))this.bestTime=this.time;try{localStorage.setItem('village-post-record',JSON.stringify({score:this.best,time:this.bestTime}));}catch{this.storageOK=false;}}
 update(dt){
  this.time+=dt;this.player.update(dt,this.input,this.solids);this.camera=Math.max(0,Math.min(1060,this.player.x-W*.32));
  this.toastTime=Math.max(0,this.toastTime-dt);
  for(const c of this.coins)if(!c.collected&&overlap(this.player,c)){c.collected=true;this.score++;this.saveRecord();this.toast=this.score===3?'Все посылки найдены! К синему дому →':`Посылка ${this.score} / 3 найдена`;this.toastTime=2.2;for(let i=0;i<18;i++)this.particles.push({x:c.x+14,y:c.y+14,vx:(Math.random()-.5)*160,vy:-Math.random()*180,life:.65});}
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=400*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
  if(overlap(this.player,this.hazard)||this.player.y>H+80){this.saveRecord();this.setState('lost');return;}
  if(overlap(this.player,this.finish)){if(this.score===3){this.saveRecord(true);this.setState('won');return;}this.toast=`Для доставки нужны все посылки: ${this.score} / 3`;this.toastTime=.7;}
  this.syncUI();
 }
 frame(timestamp){
  const dt=this.last===null?0:Math.min(.05,Math.max(0,(timestamp-this.last)/1000));this.last=timestamp;
  if(this.state==='running'){this.accumulator+=dt;while(this.accumulator>=STEP&&this.state==='running'){this.accumulator-=STEP;this.update(STEP);}}
  this.render(timestamp/1000);requestAnimationFrame(this.frame);
 }
 image(key,x,y,w,h){const img=this.assets[key+(this.night?'NIGHT':'DAY')];if(!img)return false;this.ctx.drawImage(img,Math.round(x),Math.round(y),Math.round(w),Math.round(h));return true;}
 rect(x,y,w,h,c){this.ctx.fillStyle=c;this.ctx.fillRect(Math.round(x),Math.round(y),w,h);}
 render(realTime){
  const ctx=this.ctx,t=this.state==='running'?this.time:(this.time||0),night=this.night;ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,night?'#102437':'#81b9b0');sky.addColorStop(1,night?'#355363':'#decd9a');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=night?'#f3e6ae':'#fff0bd';ctx.beginPath();ctx.arc(900-this.camera*.04,105,30,0,Math.PI*2);ctx.fill();
  if(night){ctx.fillStyle='#e2e9cd';for(let i=0;i<45;i++)ctx.fillRect((i*139+30)%1100,35+(i*73)%215,2,2);}
  for(let layer=0;layer<3;layer++){ctx.fillStyle=night?['#1c3c48','#254953','#2d5558'][layer]:['#79a8a0','#64958d','#4d8076'][layer];ctx.beginPath();ctx.moveTo(0,H);for(let x=-100;x<=W+100;x+=40){const world=x+this.camera*(.08+layer*.08);ctx.lineTo(x,300+layer*60+Math.sin(world*.005+layer*2)*35+Math.cos(world*.012)*15);}ctx.lineTo(W,H);ctx.fill();}
  ctx.save();ctx.translate(-Math.round(this.camera),0);
  this.rect(0,578,2160,62,night?'#123e52':'#2f7390');
  for(let x=0;x<2160;x+=64){this.image('water',x,584,64,64);this.rect(x+Math.sin(t*1.6+x)*5,592+(x%3)*7,26,2,night?'#407585':'#84b6bb');}
  this.image('rock',775,600,26,26);this.image('lily',1345,607,28,22);
  for(const s of this.solids){
   this.rect(s.x,s.y+12,s.w,s.h,night?'#302c3d':'#705043');
   ctx.save();ctx.beginPath();ctx.rect(s.x,s.y+15,s.w,s.h);ctx.clip();for(let x=s.x;x<s.x+s.w;x+=32)for(let y=s.y+15;y<s.y+s.h;y+=32){if(!this.image('ground',x,y,32,32)){this.rect(x+4,y+5,23,13,night?'#413947':'#8b6550');this.rect(x+7,y+20,17,2,'#352d36');}}ctx.restore();
   this.rect(s.x,s.y,s.w,15,night?'#236a59':'#6caa50');for(let x=s.x;x<s.x+s.w;x+=32){const width=Math.min(32,s.x+s.w-x);const im=this.assets['grass'+(night?'NIGHT':'DAY')];if(im)ctx.drawImage(im,0,0,im.width*(width/32),im.height,x,s.y,width,15);}
   this.rect(s.x,s.y+s.h-5,s.w,5,'#182e3455');
  }
  this.image('tree1',0,380,91,120);this.image('tree2',600,278,73,94);this.image('tree3',1130,238,80,100);this.image('tree1',2045,371,96,133);
  if(!this.image('church',130,398,85,102)){this.rect(145,428,55,72,'#c9b490');this.roof(138,429,69,35,'#397c82');}
  for(const [x,y] of [[315,420],[710,351],[865,391],[1263,316],[1540,381],[1760,480]])this.image('detail',x,y,23,23);
  if(!this.image('house',1898,365,155,137)){this.rect(1910,411,131,89,'#ddc99b');this.roof(1897,414,157,64,'#357c9a');this.rect(1958,453,31,47,'#4d454a');this.rect(1924,432,22,23,'#f5cf70');}
  const unlocked=this.score===3;ctx.fillStyle=unlocked?'#f7d275':'#b8c8ba';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(unlocked?'ДОСТАВИТЬ ↓':'ДОМ · НУЖНЫ 3 ПОСЫЛКИ',1975,348);
  if(unlocked){ctx.fillStyle='#f3d17633';ctx.fillRect(1940,410,65,90);}
  this.sign(150,500,'СТАРТ →');this.sign(1720,500,'ДОМ →');
  for(const c of this.coins)if(!c.collected){const bob=Math.sin(t*3+c.x)*3;ctx.fillStyle='#f9d57926';ctx.beginPath();ctx.arc(c.x+14,c.y+14+bob,24,0,Math.PI*2);ctx.fill();this.rect(c.x,c.y+bob,28,25,'#795337');this.rect(c.x+2,c.y+2+bob,24,21,'#e3b86c');this.rect(c.x+11,c.y+2+bob,5,21,'#fff0bd');this.rect(c.x+2,c.y+10+bob,24,4,'#f5daa2');this.rect(c.x+5,c.y+4+bob,4,4,'#fff1cf');}
  if(this.player.grounded){ctx.fillStyle='#132f3466';ctx.beginPath();ctx.ellipse(this.player.x+14,this.player.y+44,18,4,0,0,Math.PI*2);ctx.fill();}
  this.player.draw(ctx,t);for(const p of this.particles){ctx.globalAlpha=Math.max(0,p.life/.65);this.rect(p.x,p.y,4,4,'#ffe1a0');}ctx.globalAlpha=1;
  ctx.restore();
  const progress=Math.min(1,this.player.x/1975);this.rect(24,612,1052,3,'#ffffff20');this.rect(24,612,Math.round(1052*progress),3,'#e9c572');
  if(this.toastTime>0){ctx.font='bold 15px system-ui';ctx.textAlign='center';const tw=ctx.measureText(this.toast).width;this.rect(W/2-tw/2-20,55,tw+40,40,'#102b31e8');ctx.fillStyle='#f6d78c';ctx.fillText(this.toast,W/2,81);}
 }
 roof(x,y,w,h,color){const c=this.ctx;c.fillStyle=color;c.beginPath();c.moveTo(x,y);c.lineTo(x+w/2,y-h);c.lineTo(x+w,y);c.fill();}
 sign(x,y,text){this.rect(x+24,y-38,5,38,'#704f3c');this.rect(x,y-55,76,25,'#dcc494');const c=this.ctx;c.fillStyle='#3c4e48';c.font='bold 9px system-ui';c.textAlign='center';c.fillText(text,x+38,y-39);}
}
