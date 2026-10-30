const $=s=>document.querySelector(s);
const guest=new URLSearchParams(location.search).get('name')?.trim().slice(0,30)||'홍길동';
$('#birthday-name').textContent=$('#hero-name').textContent=guest;
let phase='intro',audio,stream,micRequest,frame,leaving=false,starting=false,detecting=false,blows=0;
const soundtrack=new Audio('assets/birthday-party.wav');soundtrack.preload='auto';
const timers=new Set();
function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);}
function setPhase(p){phase=p;document.body.dataset.phase=p;}
function subtitle(text){$('#step').textContent=text;}
function session(type){try{if(navigator.audioSession)navigator.audioSession.type=type;}catch{}}
async function requestMicrophone(){
 if(stream?.getAudioTracks().some(t=>t.readyState==='live'))return stream;
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('마이크를 사용하려면 HTTPS 주소로 열어주세요.');
 if(!micRequest)micRequest=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(s=>{if(leaving||phase==='final'){s.getTracks().forEach(t=>t.stop());return null;}s.getTracks().forEach(t=>t.enabled=false);stream=s;return s;}).finally(()=>micRequest=null);
 return micRequest;
}
function micError(error){$('#permission-retry').setAttribute('title',error.message||'마이크 연결을 확인해주세요');$('#permission-retry').hidden=false;}
function stopMic(){cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=null;detecting=false;}
function blow(){
 if(phase!=='wish')return;
 blows++;
 if(blows===1){document.body.classList.add('flaring');window.dispatchEvent(new Event('candle-flare'));subtitle('후~');later(()=>document.body.classList.remove('flaring'),1800);}
 else finish();
}
function finish(){stopMic();setPhase('final');document.body.classList.remove('flaring');document.body.classList.add('blown');subtitle('소원이 이뤄집니다~~');$('#celebration').textContent=`${guest} 님의 모든 날이 오늘처럼 빛나길`;$('#permission-retry').hidden=true;}
async function startMic(){
 if(phase!=='wish'||detecting||document.body.classList.contains('wish-preamble'))return;detecting=true;
 try{
 session('play-and-record');await audio.resume();const capture=await requestMicrophone();if(!capture||phase!=='wish'){detecting=false;return;}
 capture.getTracks().forEach(t=>t.enabled=true);$('#permission-retry').hidden=true;
 const source=audio.createMediaStreamSource(capture),analyser=audio.createAnalyser();analyser.fftSize=1024;source.connect(analyser);
 const samples=new Float32Array(analyser.fftSize);let sum=0,count=0,baseline=0,calibrationUntil=performance.now()+700,last=performance.now(),high=0,quiet=0,armed=true,firstAt=0;
 function detect(now){if(phase!=='wish')return;const dt=Math.min(now-last,60);last=now;analyser.getFloatTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((s,n)=>s+n*n,0)/samples.length);
 if(now<calibrationUntil){sum+=rms;count++;baseline=sum/count;}else{const threshold=Math.max(.045,baseline*3);
 if(!armed){quiet=rms<threshold*.65?quiet+dt:0;if(quiet>=450&&now-firstAt>1800){armed=true;high=0;}}
 else{high=rms>threshold?high+dt:Math.max(0,high-dt*2);if(high>=220){armed=false;quiet=0;firstAt=now;blow();if(phase==='final'){source.disconnect();return;}}}}
 frame=requestAnimationFrame(detect);}
 frame=requestAnimationFrame(detect);
 }catch(e){stopMic();if(phase==='wish')micError(e);}
}
// Cue times follow the melody in birthday-party.wav (4.8 s entrance).
let lyricFrame;
const lyricLines=[
 {at:0,text:'생일 축하합니다~',offsets:[0,.23,.46,.92,1.38,1.61,1.84,2.18]},
 {at:2.76,text:'생일 축하합니다~',offsets:[0,.23,.46,.92,1.38,1.61,1.84,2.18]},
 {at:5.52,text:`사랑하는 ${guest}♥`,name:true},
 {at:8.74,text:'생일 축하합니다~',offsets:[0,.23,.46,.92,1.38,1.61,1.84,2.18]}
];
function lyricText(time){
 const t=time-4.8;if(t<0)return '♪';
 const line=[...lyricLines].reverse().find(l=>t>=l.at);const age=t-line.at;
 let index=0;return Array.from(line.text).map(char=>{
   if(char===' ')return index>0?' ':'';
   const cue=line.name?(index<4?[0,.23,.46,.92][index]:1.38+(index-4)*Math.min(.2,1.1/Math.max(1,Array.from(guest).length))):line.offsets[Math.min(index,line.offsets.length-1)];
   index++;return age>=cue?char:'';
 }).join('').trimEnd();
}
function startLyrics(){
 cancelAnimationFrame(lyricFrame);let previous='';
 function sync(){if(phase!=='song')return;const text=lyricText(soundtrack.currentTime);if(text!==previous){subtitle(text);previous=text;}lyricFrame=requestAnimationFrame(sync);}
 sync();
}
function ready(){if(phase!=='song')return;setPhase('wish');cancelAnimationFrame(lyricFrame);document.body.classList.add('wish-preamble');subtitle('소원을 빌고');later(()=>{if(phase!=='wish')return;document.body.classList.remove('wish-preamble');subtitle('후~');startMic();},1500);}
soundtrack.addEventListener('ended',ready);
soundtrack.addEventListener('error',()=>{if(phase==='song'){subtitle('음악을 불러오지 못했어요. 화면을 새로고침해주세요.');}});
async function begin(){if(phase!=='intro'||starting)return;starting=true;
 try{session('playback');const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('Safari나 Chrome에서 다시 열어주세요.');audio??=new Context();soundtrack.currentTime=0;await Promise.all([audio.resume(),soundtrack.play()]);setPhase('song');$('#sound span').textContent='sound on';$('#sound').setAttribute('aria-pressed','true');startLyrics();}
 catch(e){$('.entry-instruction').textContent='소리를 재생하려면 화면을 다시 두 번 터치해주세요';}finally{starting=false;}}
const entry=$('.party-announcement');let lastTap=0;
entry.addEventListener('pointerup',e=>{if(e.button!==0||!e.isPrimary)return;const now=performance.now();if(lastTap&&now-lastTap<380){lastTap=0;begin();}else lastTap=now;});
entry.addEventListener('dblclick',begin);
entry.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();begin();}});
$('#sound').addEventListener('click',()=>{soundtrack.muted=!soundtrack.muted;$('#sound span').textContent=soundtrack.muted?'sound off':'sound on';$('#sound').setAttribute('aria-pressed',String(!soundtrack.muted));});
$('#permission-retry').addEventListener('click',startMic);
if(isSecureContext&&navigator.mediaDevices?.getUserMedia)requestMicrophone().then(capture=>{if(capture&&phase==='wish')startMic();}).catch(()=>{});
window.addEventListener('pagehide',()=>{leaving=true;cancelAnimationFrame(lyricFrame);soundtrack.pause();stopMic();timers.forEach(clearTimeout);audio?.close();});
