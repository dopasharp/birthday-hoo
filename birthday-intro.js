// Name reveal follows the existing party phase; audio and scene timing stay together.
(() => {
  const name = document.querySelector('#birthday-name');
  const recipient = document.querySelector('.birthday-recipient');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animations=[];
  function reveal() {
    animations.forEach(a=>a.cancel());animations=[];
    const text=name.textContent;
    const letters=Array.from(text);
    recipient.classList.toggle('long-name',letters.length>8);
    name.setAttribute('aria-label',text);
    name.replaceChildren(...letters.map(letter=>{const span=document.createElement('span');span.className='name-letter';span.textContent=letter;span.setAttribute('aria-hidden','true');return span;}));
    if(reduced)return;
    Array.from(name.children).forEach((span,i)=>animations.push(span.animate([
      {opacity:0,transform:'translateY(18px)',filter:'blur(5px)'},
      {opacity:1,transform:'translateY(0)',filter:'blur(0)'}
    ],{duration:850,delay:650+i*Math.min(75,1000/letters.length),easing:'cubic-bezier(.16,1,.3,1)',fill:'both'})));
  }
  if(document.body.dataset.phase==='intro') reveal();
  new MutationObserver(()=>{if(document.body.dataset.phase==='intro')reveal();else{animations.forEach(a=>a.cancel());animations=[];}}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});
})();
