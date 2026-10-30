import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
const host=document.querySelector('.flame-stage');
try{
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);host.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1536,1024,0,.1,100);camera.position.z=10;
const fragment=`varying vec2 vUv;uniform float time;uniform float seed;uniform float alive;
void main(){vec2 uv=vUv;float y=uv.y;float bend=(sin(time*8.+seed)*.07+sin(time*17.+seed*4.)*.025)*y*y;float x=uv.x-.5-bend;float width=.24*pow(max(0.,sin(y*3.14159)),.7)*(1.-y*.65);float edge=1.-smoothstep(width*.65,width,abs(x));float a=edge*smoothstep(0.,.12,y)*(1.-smoothstep(.88,1.,y))*alive;vec3 color=mix(vec3(1.,.34,.035),vec3(1.,.91,.56),1.-smoothstep(.02,.16,abs(x)));color=mix(color,vec3(.25,.42,1.),(1.-smoothstep(.04,.18,y))*.6);gl_FragColor=vec4(color,a);}`;
const flames=[];[[604,325],[692,311],[762,279],[855,310],[935,326]].forEach(([x,y],i)=>{const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},seed:{value:i*2.71},alive:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:fragment});const f=new THREE.Mesh(new THREE.PlaneGeometry(62,94),mat);f.position.set(x,1024-y+37,0);scene.add(f);flames.push(f);});
const clock=new THREE.Clock();let offAt=null,frame;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){renderer.setSize(host.clientWidth,host.clientHeight);}new ResizeObserver(resize).observe(host);resize();
function render(){const t=clock.getElapsedTime();if(document.body.classList.contains('blown')&&offAt===null)offAt=t;flames.forEach((f,i)=>{f.material.uniforms.time.value=reduced?0:t;const life=offAt===null?1:Math.max(0,1-(t-offAt-i*.07)*3);f.material.uniforms.alive.value=life;f.scale.y=(reduced?1:1+Math.sin(t*11+i)*.04+Math.sin(t*19+i)*.025)*Math.max(.01,life);});renderer.render(scene,camera);frame=requestAnimationFrame(render);}render();window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);renderer.dispose();});
}catch(e){console.warn('실시간 촛불 효과를 불러오지 못했습니다.',e);}
