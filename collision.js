export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
// Sweep along each axis, using both old and new edges.
export function moveAndCollide(body,solids,dt){
 const oldX=body.x,dx=body.vx*dt;body.x+=dx;
 for(const s of solids){if(body.y+body.h<=s.y||body.y>=s.y+s.h)continue;
  if(dx>0&&oldX+body.w<=s.x&&body.x+body.w>=s.x){body.x=Math.min(body.x,s.x-body.w);body.vx=0;}
  else if(dx<0&&oldX>=s.x+s.w&&body.x<=s.x+s.w){body.x=Math.max(body.x,s.x+s.w);body.vx=0;}}
 const oldY=body.y,dy=body.vy*dt;body.y+=dy;body.grounded=false;
 for(const s of solids){if(body.x+body.w<=s.x||body.x>=s.x+s.w)continue;
  if(dy>=0&&oldY+body.h<=s.y+.01&&body.y+body.h>=s.y){body.y=Math.min(body.y,s.y-body.h);body.vy=0;body.grounded=true;}
  else if(dy<0&&oldY>=s.y+s.h-.01&&body.y<=s.y+s.h){body.y=Math.max(body.y,s.y+s.h);body.vy=0;}}
}
