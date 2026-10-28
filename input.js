export class Input{
 constructor(canvas,onPause){
  this.keys=new Set();this.pointers=new Map();this.jumpQueued=false;this.enabled=false;
  const controls={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump'};
  window.addEventListener('keydown',e=>{if(e.code==='Escape'){if(!e.repeat)onPause();return;}const c=controls[e.code];if(!c||!this.enabled)return;if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;e.preventDefault();if(!e.repeat&&!this.held('jump')&&c==='jump')this.jumpQueued=true;this.keys.add(e.code);});
  window.addEventListener('keyup',e=>{if(controls[e.code]&&this.enabled)e.preventDefault();this.keys.delete(e.code);});
  window.addEventListener('blur',()=>{this.clear();onPause(true);});
  document.querySelectorAll('[data-control]').forEach(button=>{
   button.addEventListener('pointerdown',e=>{e.preventDefault();if(!this.enabled)return;button.setPointerCapture(e.pointerId);const c=button.dataset.control;if(c==='jump'&&!this.held('jump'))this.jumpQueued=true;this.pointers.set(e.pointerId,c);button.classList.add('pressed');});
   const release=e=>{this.pointers.delete(e.pointerId);if(![...this.pointers.values()].includes(button.dataset.control))button.classList.remove('pressed');};
   button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  this.controls=controls;
 }
 held(action){return [...this.keys].some(k=>this.controls[k]===action)||[...this.pointers.values()].includes(action);}
 consumeJump(){const v=this.jumpQueued;this.jumpQueued=false;return v;}
 clear(){this.keys.clear();this.pointers.clear();this.jumpQueued=false;document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));}
}
