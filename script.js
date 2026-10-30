const $ = s => document.querySelector(s);
const guest = new URLSearchParams(location.search).get('name')?.trim().slice(0, 30) || '홍길동';
$('#guest').textContent = $('#birthday-name').textContent = $('#hero-name').textContent = guest;
let audio, master, muted = true, phase = 'welcome', stream, frame;
const soundtrack = new window.Audio('assets/birthday-party.wav');
soundtrack.preload = 'auto';
function audioSession(type) { try { if(navigator.audioSession) navigator.audioSession.type=type; } catch {} }
async function enableAudio() {
  audioSession('playback');
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) throw new Error('이 브라우저는 오디오 재생을 지원하지 않아요.');
  if (!audio || audio.state === 'closed') {
    audio = new Audio();
    master = audio.createGain();
    const compressor = audio.createDynamicsCompressor();
    master.connect(compressor);compressor.connect(audio.destination);
  }
  await audio.resume();
  if (audio.state !== 'running') throw new Error('소리 버튼을 한 번 더 눌러주세요.');
}
function soundState() {
  $('#sound span').textContent = muted ? 'sound off' : 'sound on';
  $('#sound').setAttribute('aria-pressed', String(!muted));
  $('#sound').setAttribute('aria-label', muted ? '소리 켜기 및 테스트' : '소리 끄기');
}
const timers = new Set();
function later(fn, ms) { const id = setTimeout(() => {timers.delete(id);fn();}, ms);timers.add(id); }
function setPhase(value) { phase=value;document.body.dataset.phase=value; }
function confetti(count=80) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for(let i=0;i<count;i++) {const bit=document.createElement('i');bit.className='confetti';bit.style.cssText=`left:${Math.random()*100}%;background:${['#ec8a63','#e1ba56','#8cae9c','#96b7d2','#c396b1'][i%5]};animation-delay:${Math.random()*.6}s;border-radius:${i%3?'2px':'50%'}`;document.body.append(bit);later(()=>bit.remove(),4500);}
}
function note(frequency, at, duration, volume=.12, type='triangle') {
  if (!soundtrack.paused && !soundtrack.ended) return;
  const oscillator=audio.createOscillator(), envelope=audio.createGain();
  oscillator.type=type;oscillator.frequency.value=frequency;
  envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(volume,at+.015);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
  oscillator.connect(envelope);envelope.connect(master);oscillator.start(at);oscillator.stop(at+duration+.03);
}
function entryMusic() {
  const now=audio.currentTime;
  for(let i=0;i<24;i++) {note([261.63,329.63,392,523.25,392,329.63][i%6],now+i*.18,.17,.09);if(i%2===0)note(i%4===0?130.81:196,now+i*.18,.2,.1,'sine');}
}
function birthdaySong() {
  setPhase('song');confetti(55);
  const melody=[['G',.5],['G',.5],['A',1],['G',1],['C',1],['B',2],['G',.5],['G',.5],['A',1],['G',1],['D',1],['C',2],['G',.5],['G',.5],['g',1],['E',1],['C',1],['B',1],['A',2],['F',.5],['F',.5],['E',1],['C',1],['D',1],['C',2]];
  const hz={G:392,A:440,B:493.88,C:523.25,D:587.33,E:659.25,F:698.46,g:783.99};
  const beat=.46, now=audio.currentTime+.2;let elapsed=0;
  melody.forEach(([pitch,length])=>{note(hz[pitch],now+elapsed,beat*length*.9,.13);note(hz[pitch]/2,now+elapsed,beat*length*.85,.045,'sine');elapsed+=beat*length;});
  for(let i=0;i<Math.ceil(elapsed/beat);i++)note([130.81,164.81,196,164.81][Math.floor(i/4)%4],now+i*beat,.25,.065,'sine');
  const lyrics=['생일 축하합니다 ♪','생일 축하합니다 ♫',`사랑하는 ${guest} 님!`,'생일 축하합니다!'];
  [0,6,12,19].forEach((index,n)=>later(()=>$('#step').textContent=lyrics[n],melody.slice(0,index).reduce((sum,n)=>sum+n[1]*beat,0)*1000));
  const duration=(elapsed+.3)*1000;const start=performance.now();
  function progress(){const ratio=Math.min((performance.now()-start)/duration,1);$('.song-progress span').style.width=`${ratio*100}%`;$('.song-progress').setAttribute('aria-valuenow',String(Math.round(ratio*100)));if(phase==='song'&&ratio<1)requestAnimationFrame(progress);}
  progress();later(ready,duration);
}
function ready(){setPhase('wish');$('#step').textContent='이제 눈을 감고, 소원을 빌어주세요.';$('#blow').disabled=false;$('#button-text').textContent='소원을 빌고, 후—';$('#mic').hidden=false;
  if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){$('#mic').disabled=true;$('#mic').textContent='마이크는 HTTPS 접속이 필요해요';$('#hint').textContent='현재 와이파이 HTTP 주소에서는 마이크가 차단돼요. 후— 버튼은 사용할 수 있어요.';}
  else $('#hint').textContent='마이크로 직접 불거나, 버튼으로 촛불을 꺼보세요.';
}
function stopMic(){cancelAnimationFrame(frame);stream?.getTracks().forEach(track=>track.stop());stream=null;}
function finish(){if(phase!=='wish')return;stopMic();setPhase('final');document.body.classList.add('blown');$('.candles').setAttribute('aria-label','불이 꺼진 생일 초 5개');$('#mic').hidden=true;$('#step').textContent='소원이 이뤄졌습니다!!';$('#celebration').textContent=`${guest} 님의 새로운 한 해가 반짝이길 ✦`;$('#hint').textContent='생일 축하합니다. 오늘은 온전히 당신의 날이에요.';$('#button-text').textContent='파티 한 번 더!';confetti(140);[523.25,659.25,783.99,1046.5].forEach((f,i)=>note(f,audio.currentTime+i*.13,.8,.1));}
$('#start').addEventListener('click',async()=>{
  if(phase!=='welcome')return;
  audioSession('playback');soundtrack.muted=false;soundtrack.currentTime=0;
  const playback = soundtrack.play();
  try { await Promise.all([enableAudio(),playback]);muted=false;master.gain.setValueAtTime(1.8,audio.currentTime);soundState(); }
  catch (error) { soundtrack.pause();$('.opening small').textContent='음악 재생이 차단됐어요. Safari 또는 Chrome에서 다시 시작해주세요.';return; }
  setPhase('intro');$('#sound span').textContent=muted?'sound off':'sound on';$('#sound').setAttribute('aria-pressed',String(!muted));entryMusic();confetti(110);later(()=>confetti(65),2000);later(birthdaySong,4600);
});
$('#blow').addEventListener('click',()=>{if(phase==='final')location.reload();else finish();});
$('#sound').addEventListener('click',async()=>{
  try {
    await enableAudio();muted=!muted;
    soundtrack.muted=muted;
    master.gain.setTargetAtTime(muted?0:1.8,audio.currentTime,.025);soundState();
    if(!muted) [523.25,659.25,783.99].forEach((f,i)=>note(f,audio.currentTime+.03+i*.16,.35,.18));
  } catch(error) { $('#sound span').textContent='다시 눌러주세요';$('#sound').setAttribute('title',error.message); }
});
$('#mic').addEventListener('click',async()=>{
  if(phase!=='wish')return;$('#mic').disabled=true;
  try{
    if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('HTTPS 주소로 접속해야 마이크를 사용할 수 있어요.');
    audioSession('play-and-record');
    await audio.resume();
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    if(phase!=='wish'){stopMic();return;}
    const source=audio.createMediaStreamSource(stream), analyser=audio.createAnalyser();analyser.fftSize=1024;source.connect(analyser);const samples=new Float32Array(analyser.fftSize);let baseline=0, calibration=0, sustained=0;
    $('#hint').textContent='잠깐 조용히 기다렸다가…';
    function detect(){if(phase!=='wish')return;analyser.getFloatTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((s,n)=>s+n*n,0)/samples.length);if(calibration<45){baseline+=rms;calibration++;if(calibration===45)$('#hint').textContent='지금 마이크에 후— 불어주세요!';}else{const threshold=Math.max(.045,baseline/45*3);sustained=rms>threshold?sustained+1:Math.max(0,sustained-2);if(sustained>=16){finish();return;}}frame=requestAnimationFrame(detect);}
    detect();later(()=>{if(stream){stopMic();$('#hint').textContent='버튼으로도 촛불을 끌 수 있어요.';$('#mic').disabled=false;}},20000);
  }catch(error){stopMic();$('#mic').disabled=false;$('#hint').textContent=error.name==='NotAllowedError'?'마이크 권한이 거부됐어요. 브라우저 사이트 설정에서 마이크를 허용해주세요.':error.message || '마이크를 사용할 수 없어요. 버튼으로 후— 해주세요.';}
});
window.addEventListener('pagehide',()=>{soundtrack.pause();stopMic();timers.forEach(clearTimeout);audio?.close();});
