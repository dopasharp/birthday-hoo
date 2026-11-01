const $=s=>document.querySelector(s);
const guest=new URLSearchParams(location.search).get('name')?.trim().slice(0,30)||'홍길동';
$('#birthday-name').textContent=$('#hero-name').textContent=guest;
const dateParam=new URLSearchParams(location.search).get('date');
if(dateParam){
 const match=/^(\d{4})[-.](\d{2})[-.](\d{2})$/.exec(dateParam);
 if(match){
  const [,year,month,day]=match;
  const parsed=new Date(`${year}-${month}-${day}T00:00:00Z`);
  if(Number(year)>0&&!Number.isNaN(parsed.getTime())&&parsed.getUTCFullYear()===Number(year)&&parsed.getUTCMonth()+1===Number(month)&&parsed.getUTCDate()===Number(day)){
   $('.birthday-date').textContent=`${year}.${month}.${day}`;
   $('.birthday-date').setAttribute('datetime',`${year}-${month}-${day}`);
  }
 }
}

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
 if(blows<=2){document.body.classList.add('flaring');window.dispatchEvent(new Event('candle-flare'));subtitle('후~');later(()=>document.body.classList.remove('flaring'),1800);}
 else finish();
}
function finish(){stopMic();setPhase('final');window.DopaSharp?.track('game_complete',{blows});later(()=>{$('#finale').hidden=false;},4200);document.body.classList.remove('flaring');document.body.classList.add('blown');subtitle('소원이 이뤄집니다~~');$('#celebration').textContent=`${guest} 님의 모든 날이 오늘처럼 빛나길`;$('#permission-retry').hidden=true;}
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
 const t=time-4.8;if(t<0)return '';
 const line=[...lyricLines].reverse().find(l=>t>=l.at);const age=t-line.at;
 let index=0;return Array.from(line.text).map(char=>{
   if(char===' ')return index>0?' ':'';
   const cue=line.name?(index<4?[0,.23,.46,.92][index]:1.38+(index-4)*Math.min(.2,1.1/Math.max(1,Array.from(guest).length))):line.offsets[Math.min(index,line.offsets.length-1)];
   index++;return age>=cue?char:'';
 }).join('').trimEnd();
}
function startLyrics(){
 cancelAnimationFrame(lyricFrame);let previous=null;
 function sync(){if(phase!=='song')return;const text=lyricText(soundtrack.currentTime);if(text!==previous){subtitle(text);previous=text;}lyricFrame=requestAnimationFrame(sync);}
 sync();
}
// Real audience recording, preloaded locally; a four-second excerpt with a soft tail.
let applauseGain,applauseSource,applauseBuffer;
const applauseData=fetch('assets/applause-crowd.mp3',{signal:AbortSignal.timeout(8000)})
 .then(response=>{if(!response.ok)throw new Error('Applause unavailable');return response.arrayBuffer();}).catch(()=>null);
async function loadApplause(){
 if(applauseBuffer)return applauseBuffer;
 const data=await applauseData;if(!data||!audio||leaving)return null;
 try{applauseBuffer=await audio.decodeAudioData(data.slice(0));return applauseBuffer;}catch{return null;}
}
async function playApplause(){
 const buffer=await loadApplause();if(!buffer||!audio||audio.state!=='running'||leaving)return;
 const source=audio.createBufferSource(),volume=audio.createGain(),envelope=audio.createGain();
 const offset=1,duration=Math.min(4,buffer.duration-offset);if(duration<=0)return;
 source.buffer=buffer;applauseSource=source;applauseGain=volume;
 volume.gain.value=soundtrack.muted?0:.8;
 const now=audio.currentTime;envelope.gain.setValueAtTime(0,now);
 envelope.gain.linearRampToValueAtTime(1,now+.18);
 envelope.gain.setValueAtTime(1,now+duration-1.3);
 envelope.gain.linearRampToValueAtTime(0,now+duration);
 source.connect(envelope);envelope.connect(volume);volume.connect(audio.destination);
 await new Promise(resolve=>{source.onended=()=>{source.disconnect();envelope.disconnect();volume.disconnect();applauseSource=null;applauseGain=null;resolve();};source.start(now,offset,duration);});
}
async function ready(){
 if(phase!=='song')return;setPhase('wish');cancelAnimationFrame(lyricFrame);
 document.body.classList.add('wish-preamble');subtitle('');
 await playApplause();if(leaving||phase!=='wish')return;
 subtitle('소원을 빌고');later(()=>{if(phase!=='wish')return;document.body.classList.remove('wish-preamble');subtitle('후~');startMic();},3500);
}
soundtrack.addEventListener('ended',ready);
soundtrack.addEventListener('error',()=>{if(phase==='song'){subtitle('음악을 불러오지 못했어요. 화면을 새로고침해주세요.');}});
async function begin(){if(phase!=='intro'||starting)return;starting=true;
 try{session('playback');const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('Safari나 Chrome에서 다시 열어주세요.');audio??=new Context();void loadApplause();soundtrack.currentTime=0;await Promise.all([audio.resume(),soundtrack.play()]);setPhase('song');window.DopaSharp?.track('game_start');$('#sound span').textContent='sound on';$('#sound').setAttribute('aria-pressed','true');startLyrics();}
 catch(e){$('.entry-instruction').textContent='소리를 재생하려면 화면을 다시 두 번 터치해주세요';}finally{starting=false;}}
const entry=$('.party-announcement');let lastTap=0;
entry.addEventListener('pointerup',e=>{if(e.button!==0||!e.isPrimary)return;const now=performance.now();if(lastTap&&now-lastTap<380){lastTap=0;begin();}else lastTap=now;});
entry.addEventListener('dblclick',begin);
entry.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();begin();}});
$('#sound').addEventListener('click',()=>{soundtrack.muted=!soundtrack.muted;if(applauseGain)applauseGain.gain.setTargetAtTime(soundtrack.muted?0:.8,audio.currentTime,.025);$('#sound span').textContent=soundtrack.muted?'sound off':'sound on';$('#sound').setAttribute('aria-pressed',String(!soundtrack.muted));});
$('#permission-retry').addEventListener('click',startMic);
// Finale: send the same party to a friend with ?name=, or start over.
$('#finale-send').addEventListener('submit',e=>{e.preventDefault();const input=$('#friend-name'),name=input.value.trim().slice(0,30);if(!name){input.focus();return;}
 const url=new URL(location.pathname,location.origin);url.searchParams.set('name',name);
 window.DopaSharp?.track('share_click',{method:'birthday_link'});
 window.DopaSharp?.share({title:`${name} 님, 생일 축하해요 🎂`,text:`🎂 ${name} 님을 위한 생일 파티가 준비됐어요. 소원 빌고 촛불을 불어주세요!`,url:url.href},`${name} 님을 위한 축하 링크를 복사했어요.`);});
$('#finale-again').addEventListener('click',()=>{window.DopaSharp?.track('game_retry');location.reload();});
if(isSecureContext&&navigator.mediaDevices?.getUserMedia)requestMicrophone().then(capture=>{if(capture&&phase==='wish')startMic();}).catch(()=>{});
window.addEventListener('pagehide',()=>{leaving=true;cancelAnimationFrame(lyricFrame);soundtrack.pause();applauseSource?.stop();stopMic();timers.forEach(clearTimeout);audio?.close();});
