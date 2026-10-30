// Slowly drifting individual paper pieces and notes. No burst emitter.
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced)return;
 const canvas=document.createElement('canvas');canvas.className='party-atmosphere';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx)return;
 let width=innerWidth,height=innerHeight,last=performance.now(),nextPaper=0,nextNote=0,frame,finalSince=0;
 const particles=[],colors=['#e8bc7d','#f1b6be','#f8e7c9','#b87c96'];
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
 window.addEventListener('resize',resize);resize();
 function paper(scattered=false){const size=3+Math.random()*5;return {kind:'paper',x:Math.random()*width,y:scattered?Math.random()*height:-20,speed:18+Math.random()*22,drift:(Math.random()-.5)*22,size,angle:Math.random()*6.28,spin:(Math.random()-.5)*1.6,phase:Math.random()*6.28,color:colors[Math.floor(Math.random()*colors.length)],opacity:.35+Math.random()*.4};}
 for(let i=0;i<22;i++)particles.push(paper(true));
 function note(){const side=Math.random()<.5;return {kind:'note',x:width*(side?.08+Math.random()*.22:.7+Math.random()*.22),y:height*(.75+Math.random()*.22),speed:21+Math.random()*22,drift:side?8+Math.random()*13:-8-Math.random()*13,size:20+Math.random()*27,angle:(Math.random()-.5)*.3,phase:Math.random()*6.28,color:colors[Math.floor(Math.random()*3)],age:0,life:7+Math.random()*5,glyph:['♪','♫','♩','♬'][Math.floor(Math.random()*4)]};}
 function draw(now){const dt=Math.min((now-last)/1000,.05);last=now;const t=now/1000,phase=document.body.dataset.phase;
 if(phase==='final'&&!finalSince){finalSince=now;particles.length=0;for(let i=0;i<48;i++)particles.push({kind:'star',x:Math.random()*width,y:Math.random()*height,size:1+Math.random()*2.7,phase:Math.random()*6.28,speed:.6+Math.random()*1.6});}
 if(phase!=='final'&&now>nextPaper&&particles.length<100){particles.push(paper());nextPaper=now+(phase==='final'&&now-finalSince<6000?90:240)+Math.random()*360;}
 if(phase==='song'&&now>nextNote){particles.push(note());nextNote=now+450+Math.random()*550;}
 ctx.clearRect(0,0,width,height);
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];
 if(p.kind==='star'){const fade=Math.min((now-finalSince)/1600,1);const pulse=Math.pow(.5+.5*Math.sin(t*p.speed+p.phase),3);ctx.save();ctx.globalAlpha=fade*(.12+pulse*.88);const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*6);glow.addColorStop(0,'#fff7dc');glow.addColorStop(.2,'#ebc98788');glow.addColorStop(1,'#ebc98700');ctx.fillStyle=glow;ctx.fillRect(p.x-p.size*6,p.y-p.size*6,p.size*12,p.size*12);ctx.strokeStyle='#fff3ce';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x-p.size*2,p.y);ctx.lineTo(p.x+p.size*2,p.y);ctx.moveTo(p.x,p.y-p.size*3);ctx.lineTo(p.x,p.y+p.size*3);ctx.stroke();ctx.restore();
 }else if(p.kind==='paper'){p.y+=p.speed*dt;p.x+=(p.drift+Math.sin(t*.7+p.phase)*13)*dt;p.angle+=p.spin*dt;if(p.y>height+30||p.x<-60||p.x>width+60){particles.splice(i,1);continue;}
 ctx.save();ctx.translate(p.x+Math.sin(t*1.1+p.phase)*10,p.y);ctx.rotate(p.angle);ctx.scale(Math.max(.12,Math.abs(Math.cos(t*1.8+p.phase))),1);ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size*.3,p.size,p.size*.6);ctx.restore();
 }else{p.age+=dt;p.y-=p.speed*dt;p.x+=p.drift*dt;if(p.age>p.life){particles.splice(i,1);continue;}const fade=Math.min(p.age/1.3,1,(p.life-p.age)/2);ctx.save();ctx.translate(p.x+Math.sin(t*.8+p.phase)*20,p.y);ctx.rotate(p.angle+Math.sin(t*.6+p.phase)*.14);ctx.globalAlpha=Math.max(0,fade)*.42*(phase==='song'?1:Math.max(0,1-p.age/p.life));ctx.fillStyle=p.color;ctx.font=`${p.size}px Georgia,serif`;ctx.fillText(p.glyph,0,0);ctx.restore();}}
 frame=requestAnimationFrame(draw);}
 frame=requestAnimationFrame(draw);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);});
})();
