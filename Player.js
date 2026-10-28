import {moveAndCollide} from './collision.js';
export class Player{
 constructor(){this.reset();}
 reset(){Object.assign(this,{x:80,y:452,w:28,h:44,vx:0,vy:0,grounded:false,facing:1,walk:0});}
 update(dt,input,solids){
  const dir=Number(input.held('right'))-Number(input.held('left'));
  const target=dir*300,accel=this.grounded?2400:1800;
  this.vx+=Math.max(-accel*dt,Math.min(accel*dt,target-this.vx));
  if(dir)this.facing=dir;
  if(input.consumeJump()&&this.grounded){this.vy=-660;this.grounded=false;}
  this.vy=Math.min(950,this.vy+1700*dt);moveAndCollide(this,solids,dt);
  this.x=Math.max(0,Math.min(2132,this.x));this.walk+=Math.abs(this.vx)*dt*.045;
 }
 draw(ctx,t){
  ctx.save();ctx.translate(Math.round(this.x+14),Math.round(this.y));ctx.scale(this.facing,1);
  const step=this.grounded?Math.sin(this.walk)*3:2;
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  r(-15,17,10,19,'#774b37');r(-14,18,8,3,'#e3bc73');
  r(-9,31,7,10+step,'#263a53');r(3,31,7,10-step,'#263a53');
  r(-10,39+step,9,5,'#182b35');r(3,39-step,10,5,'#182b35');
  r(-10,16,21,19,'#deac4e');r(-10,27,21,5,'#b37638');r(-2,17,4,16,'#f7dc8d');
  r(9,20,5,12,'#f0bb8d');r(-7,4,18,14,'#f0bb8d');r(5,9,3,3,'#243747');
  r(-9,1,21,7,'#284c5d');r(-12,6,27,4,'#397287');r(1,1,5,6,'#e9c572');
  ctx.restore();
 }
}
