/* PAR ORDO GO — GREAT DOOR V1
   Opening door, firelight scene, heavy revolving cards, plank tab change and the visit moment.
   QR, registration, visits and API logic stay in index.html; this file only adds motion. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),mix=(a,b,k)=>a+(b-a)*k;
const ss=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
const E={out3:k=>1-Math.pow(1-k,3),io3:k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,back:k=>{const c=1.70158;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)}};
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(_){}};
const ABORT={abort:true},noAbort=e=>{if(e!==ABORT)console.error(e)};
let tasks=[],token=0,lastDt=.016;
function tl(ms,fn,ease){
  const tk=token;
  return new Promise((res,rej)=>{
    const t0=performance.now();
    tasks.push(now=>{
      if(tk!==token){rej(ABORT);return false}
      const k=ms<=0?1:clamp((Math.max(now,t0)-t0)/ms);
      if(fn)fn(ease?ease(k):k,k);
      if(k>=1){res();return false}
      return true;
    });
    wake();
  });
}
const wait=ms=>tl(ms);
const later=(ms,f)=>{wait(ms).then(f).catch(noAbort)};
const View={W:innerWidth,H:innerHeight,read(){const c=$('#veil');this.W=c.clientWidth||innerWidth;this.H=c.clientHeight||innerHeight}};
const rect=el=>{const r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2,b:r.bottom,r:r.right}};

/* ---------- power levels: 3 full, 2 lighter background, 1 static background, 0 no effects ---------- */
const Perf={level:3,hint:3,known:false,n:0,bad:0,skip:12,lastDown:0,openBad:0,key:'po_go_perf',near:0,strikes:0,capped:false,
  init(){
    const iOS=/iP(hone|ad|od)/.test(navigator.userAgent||''),cores=navigator.hardwareConcurrency||4,mem=navigator.deviceMemory||4,save=!!(navigator.connection&&navigator.connection.saveData);
    let l=3;
    if(!iOS){if(cores<=4||mem<=3)l=1;if(cores<=2||mem<=1)l=0}
    if(save)l=Math.min(l,1);
    if(reduce)l=0;
    this.hint=l;
    let st=null;try{st=JSON.parse(localStorage.getItem(this.key))}catch(_){}
    let up=false;
    if(st&&typeof st.l==='number'){this.known=true;let v=st.l;if(Date.now()-st.t>2592e5&&v<l){v++;up=true}l=Math.min(l,v)}
    this.level=l;if(up)this.save();
    Particles.max=[60,300,700,1400][l];
    this.apply(true);
  },
  save(){try{localStorage.setItem(this.key,JSON.stringify({l:this.level,t:Date.now()}))}catch(_){}},
  veilRes(){return[1,1,1.25,1.5][this.level]},
  openRes(){return[1,1.25,1.75,2.5][this.level]},
  apply(first){
    const L=this.level;document.body.dataset.perf=String(L);pScale=[0,.3,.6,1][L];
    if(first)return;
    if(L>=2){World.Q=L===3?1:.7;World.resize()}else World.disable();
    Veil.setRes(this.veilRes());
  },
  bench(){
    const gl=World.gl,pr=World.pr;if(!gl||!pr)return;
    const S=512,px=new Uint8Array(4);World.cv.width=World.cv.height=S;gl.viewport(0,0,S,S);gl.clearColor(0,0,0,1);
    gl.useProgram(pr.p);if(pr.u.R)gl.uniform2f(pr.u.R,S,S);if(pr.u.T)gl.uniform1f(pr.u.T,3.3);setU(gl,pr,World.u);
    const run=fn=>{let best=1e9;for(let i=0;i<3;i++){const t0=performance.now();fn();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);best=Math.min(best,performance.now()-t0)}return best};
    const base=run(()=>gl.clear(gl.COLOR_BUFFER_BIT)),full=run(()=>drawQuad(gl,World.quad,pr)),perMP=Math.max(0,full-base)/(S*S/1e6);
    World.resize();
    if(perMP>35)this.level=Math.min(this.level,1);else if(perMP>12)this.level=Math.min(this.level,2);
    this.save();
  },
  down(now){if(this.level<=0)return;this.level--;this.lastDown=now;this.skip=20;this.save();this.apply()},
  clear(){this.n=this.bad=this.near=0},
  /* A steady 30 fps is either the OS capping rAF (battery saver) or a saturated GPU: time one real frame to tell which. */
  gpuBound(){
    const gl=World.gl;if(!gl||World.off||!World.ready||World.paused)return null;
    const px=new Uint8Array(4),sync=()=>gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
    sync();const t0=performance.now();World.draw(t0/1000);sync();
    return performance.now()-t0>9;
  },
  sample(dt,now){
    if(this.skip>0){this.skip--;return}
    if(dt>.25)return;
    if(abortOpening){if(dt>.05)this.openBad++;if(this.openBad>=12){this.openBad=0;const a=abortOpening;if(this.level>0){this.level--;this.lastDown=now;this.save();this.apply()}this.clear();this.strikes=0;this.skip=20;a();return}}
    this.n++;if(dt>.0225)this.bad++;if(dt>.05)this.bad++;if(dt>.028&&dt<.039)this.near++;
    if(this.n<36)return;
    const r=this.bad/this.n,steady=this.near/this.n>=.8;this.clear();
    if(r<=.34){this.strikes=0;return}
    if(now-this.lastDown<1400)return;
    if(steady){
      if(this.capped||abortOpening)return;
      const g=this.gpuBound();
      if(g===true)this.down(now);else if(g===false)this.capped=true;
      return;
    }
    if(r>.75||++this.strikes>=2){this.strikes=0;this.down(now)}
  }
};
let abortOpening=null;

/* ---------- shaders ---------- */
const VS_QUAD='attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const GC=`precision highp float;varying vec2 v;uniform vec2 R;uniform float T;
float sst(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
float h(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+3.7;a*=.5;}return s;}
vec2 cov(vec2 uv){float ra=R.x/R.y,ia=780./1698.;vec2 u=uv-.5;if(ra>ia)u.y*=ia/ra;else u.x*=ra/ia;u+=.5;return vec2(u.x,1.-u.y);}
`;
const FS_WORLD=GC+`uniform sampler2D P;uniform float Z,G,D0;uniform vec2 PX;
void main(){
 vec2 asp=R/min(R.x,R.y);
 vec2 uv=(v-.5)/Z+.5+PX;
 vec3 c=texture2D(P,cov(uv)).rgb;
 float l=dot(c,vec3(.3,.59,.11));
 float fl=.84+.3*n(vec2(T*2.7,3.))+.07*sin(T*11.+n(uv*4.)*6.);
 c*=mix(.84,fl*1.2,sst(.1,.55,l));
 vec2 d=(uv-vec2(.8,.865))*asp;
 float a=atan(d.y,d.x),r=length(d);
 float ray=pow(n(vec2(a*6.+T*.18,T*.1)),2.)*.8+pow(n(vec2(a*15.-T*.25,7.)),3.)*.9;
 c+=vec3(1.,.58,.2)*ray*sst(1.7,.0,r)*(.2+G*1.2);
 vec2 q=(v-.5)*asp*vec2(1.5,1.)+vec2(0.,-T*.09);
 float f=fbm(q*1.2+fbm(q*1.7+T*.05)*.8);
 c=mix(c,vec3(.95,.7,.48)*(.6+G*.6),sst(.42,.92,f)*.36);
 c+=vec3(1.,.72,.4)*G*.35;
 gl_FragColor=vec4(c*D0,1.);
}`;
const FS_VEIL=GC+`uniform sampler2D DT,LG;uniform float A,LK,RAY,RF,RH,PL,ALPHA,XS,DA;uniform vec2 O,SHK,RC;
void main(){
 vec2 p=(v-.5)*2.+SHK;
 vec2 dp=vec2(p.x*XS,p.y);
 vec3 c=vec3(0.);float a=0.;
 float cA=cos(A),sA=sin(A),gp=1.-cA;
 if(A<2.25){
  float D=1.7;
  float sL=(dp.x+1.)/(cA-sA*dp.x/D);float yL=(1.+sL*sA/D)*dp.y;
  float sR=(1.-dp.x)/(cA+sA*dp.x/D);float yR=(1.+sR*sA/D)*dp.y;
  float s=-1.,Y=0.,u=0.;
  if(sL>=0.&&sL<=1.&&abs(yL)<=1.){s=sL;Y=yL;u=sL*.5;}
  else if(sR>=0.&&sR<=1.&&abs(yR)<=1.){s=sR;Y=yR;u=1.-sR*.5;}
  if(s>=0.){
   vec3 w=texture2D(DT,vec2(u,.5-Y*.5)).rgb;
   float fl=.98+.04*n(vec2(T*3.,1.));
   float sh=mix(1.,.42,clamp(sA,0.,1.));
   float low=.94+.06*sst(.35,-1.,Y);
   w*=sh*low*fl;
   w+=vec3(1.,.5,.16)*LK*exp(-(1.-s)*(30.-26.*clamp(gp,0.,1.)))*.75;
   w+=vec3(1.,.42,.12)*LK*exp(-(Y+1.)*9.)*.8;
   w+=vec3(1.,.66,.28)*sst(.975,1.,s)*(LK*.5+.2);
   c=w;a=1.;
  }else if(abs(dp.x)>1.){a=1.-sst(.2,2.1,A);c=vec3(.012,.01,.008)*a;}
  if(A<.2){
   c+=vec3(1.,.74,.4)*LK*exp(-abs(dp.x)*(58.-A*220.))*1.45;
   c+=vec3(1.,.62,.3)*LK*LK*exp(-abs(p.y-.12)*40.)*sst(1.2,.0,abs(p.x))*.7;
  }
 }
 if(RAY>.001){
  vec2 q=p-RC;
  float r=length(q*vec2(.62,1.));
  float an=atan(q.x,q.y);
  float bm=pow(n(vec2(an*5.5+T*.2,T*.16)),1.6)+.55*pow(n(vec2(an*15.-T*.3,T*.1+5.)),2.6);
  float wd=sst(gp*1.2+.18,gp*.2-.02,abs(dp.x-RC.x)/(.42+abs(p.y)*.5));
  float hl=RH>0.?sst(RH*.72,RH*1.3,r):1.;
  c+=vec3(1.,.66,.3)*bm*wd*sst(1.8,.05,r)*RAY*1.5*hl;
  c+=vec3(1.,.9,.72)*exp(-r*r*(18.-13.*clamp(gp,0.,1.)))*RAY*RF*hl;
 }
 if(PL>.001&&PL<1.999){
  float NP=9.;
  float xx=(p.x*.5+.5)*NP;
  float i=floor(xx);
  float lx=fract(xx)*2.-1.;
  float xc=(i+.5)/NP*2.-1.;
  float dl=abs(xc-(O.x*2.-1.))*.32;
  float ph=PL<1.?(1.-clamp(PL*1.64-dl,0.,1.))*1.5708:-clamp((PL-1.)*1.64-dl,0.,1.)*1.5708;
  float cp=cos(ph),sp=sin(ph);
  if(abs(lx)<=cp+.001&&cp>.012){
   float lu=lx/cp;
   float yy=p.y/(1.+lu*sp*.2);
   if(abs(yy)<=1.){
    vec2 tu=vec2((xc+lu/NP)*.5+.5,.5-yy*.5);
    vec3 w=texture2D(DT,tu).rgb;
    vec2 lq=vec2(tu.x-.5,(tu.y-.44)/DA)/.2559;
    float ll=length(lq);
    if(ll<1.){vec4 lt=texture2D(LG,lq*.5+.5);w=mix(w,lt.rgb,lt.a*sst(1.,.985,ll));}
    w*=.5+.5*cp;
    w*=1.-sst(.86,1.,abs(lu))*.6*(1.-cp);
    w+=vec3(1.,.62,.25)*sst(.9,1.,abs(lu))*(1.-cp)*.9;
    c=w;a=1.;
   }
  }
 }
 gl_FragColor=vec4(c,a)*ALPHA;
}`;
const VS_PT='attribute vec4 a;attribute vec4 c;attribute vec2 e;uniform vec2 R;varying vec4 C;varying vec2 E;varying float K;void main(){C=c;E=e;K=a.w;gl_Position=vec4(a.x/R.x*2.-1.,1.-a.y/R.y*2.,0.,1.);gl_PointSize=a.z;}';
const FS_PT=`precision mediump float;varying vec4 C;varying vec2 E;varying float K;
float sst(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
void main(){vec2 u=gl_PointCoord-.5;float a;float d=length(u)*2.;
 if(K<.5){a=1.-sst(0.,1.,d);a*=a;}
 else if(K<2.5){a=sst(1.,0.,d);a=a*a*(3.-2.*a)*.8;}
 else{a=sst(.88,.96,d)*sst(1.,.96,d);}
 gl_FragColor=vec4(C.rgb*C.a*a,C.a*a*E.y);}`;

function prog(gl,vs,fs){
  const mk=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vs));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  const u={},c=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<c;i++){const nm=gl.getActiveUniform(p,i).name;u[nm]=gl.getUniformLocation(p,nm)}
  return{p,u};
}
function setU(gl,pr,vals){for(const k in pr.u){const v=vals[k];if(v===undefined)continue;const l=pr.u[k];if(typeof v==='number')gl.uniform1f(l,v);else if(v.length===2)gl.uniform2f(l,v[0],v[1])}}
function mkTex(gl,unit){
  const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
  return t;
}
function mkQuad(gl){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);return b}
function drawQuad(gl,q,pr){gl.useProgram(pr.p);gl.bindBuffer(gl.ARRAY_BUFFER,q);const a=gl.getAttribLocation(pr.p,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}


/* ---------- firelight scene behind the app ---------- */
const World={cv:$('#world'),gl:null,pr:null,quad:null,tex:null,u:{Z:1,G:0,D0:1,PX:[0,0]},Q:1,ready:false,paused:false,off:false,shown:false,
  init(){
    if(Perf.level<2){this.off=true;return}
    const gl=this.gl=this.cv.getContext('webgl',{alpha:false,antialias:false});
    if(!gl){this.off=true;return}
    this.cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.gl=null;this.disable()});
    try{this.pr=prog(gl,VS_QUAD,FS_WORLD)}catch(e){console.warn(e);this.off=true;return}
    this.quad=mkQuad(gl);this.tex=mkTex(gl,0);gl.useProgram(this.pr.p);if(this.pr.u.P)gl.uniform1i(this.pr.u.P,0);
    const im=new Image();im.onload=()=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);this.ready=true};im.src='assets/bg-banya.jpg';
    this.Q=Perf.level===3?1:.7;
    this.resize();
  },
  resize(){if(this.off||!this.gl)return;const d=Math.min(devicePixelRatio||1,1.2)*this.Q;this.cv.width=Math.max(2,Math.round(View.W*d));this.cv.height=Math.max(2,Math.round(View.H*d));this.gl.viewport(0,0,this.cv.width,this.cv.height)},
  draw(t){
    if(this.off||!this.ready||this.paused)return;
    const gl=this.gl,pr=this.pr;gl.useProgram(pr.p);
    if(pr.u.R)gl.uniform2f(pr.u.R,this.cv.width,this.cv.height);
    if(pr.u.T)gl.uniform1f(pr.u.T,t%1000);
    setU(gl,pr,this.u);drawQuad(gl,this.quad,pr);
    if(!this.shown){this.shown=true;this.cv.classList.add('on');document.body.classList.add('world-on')}
  },
  disable(){this.off=true;this.shown=false;this.cv.classList.remove('on');document.body.classList.remove('world-on')}
};

/* ---------- particles ---------- */
const Particles={list:[],max:1400,
  add(o){if(this.list.length>=this.max)return;this.list.push(Object.assign({x:0,y:0,vx:0,vy:0,ax:0,ay:0,drag:0,age:0,life:1,s0:4,s1:4,r:1,g:.75,b:.4,a0:1,kind:0,blend:0,env:0,delay:0},o));wake()},
  tick(dt){const L=this.list;let w=0;for(let i=0;i<L.length;i++){const p=L[i];if(p.delay>0){p.delay-=dt;L[w++]=p;continue}p.age+=dt;if(p.age>=p.life)continue;p.vx+=p.ax*dt;p.vy+=p.ay*dt;if(p.drag){const d=Math.exp(-p.drag*dt);p.vx*=d;p.vy*=d}p.x+=p.vx*dt;p.y+=p.vy*dt;L[w++]=p}L.length=w}
};
let pScale=1;
function sparks(x,y,c,o={}){if(Perf.level<1)return;for(let i=0,m=Math.round(c*pScale);i<m;i++){const an=rnd(6.283),sp=rnd(o.v0||60,o.v1||420);Particles.add({x:x+rnd(-(o.sx||0),o.sx||0),y:y+rnd(-(o.sy||0),o.sy||0),vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-(o.up||60),ay:o.g===undefined?260:o.g,drag:o.drag===undefined?1.6:o.drag,life:rnd(.5,o.life||1.3),s0:rnd(1.8,o.size||4.6),s1:.6,g:rnd(.55,.85),b:rnd(.15,.38),delay:rnd(o.spread||0)})}}
function puffs(x,y,c,o={}){if(Perf.level<1)return;const l=o.l||1.4,s=o.s||60,v=o.v||40;for(let i=0,m=Math.round(c*pScale);i<m;i++)Particles.add({x:x+rnd(-(o.sx||0),o.sx||0),y:y+rnd(-(o.sy||0),o.sy||0),vx:rnd(-v,v),vy:rnd(-v,v)-(o.up||30),drag:.8,life:rnd(l*.7,l*1.2),s0:rnd(s*.5,s),s1:rnd(s*1.6,s*2.6),r:.97,g:.86,b:.72,a0:o.a||.16,kind:2,blend:1,env:1,delay:rnd(o.spread||0)})}
function ringFx(x,y,o={}){if(Perf.level<1)return;Particles.add({x,y,life:o.life||.6,s0:o.s0||20,s1:o.s1||260,g:.82,b:.5,a0:o.a||.9,kind:3})}
function dust(x,y,w,c=14){if(Perf.level<1)return;for(let i=0,m=Math.round(c*pScale);i<m;i++)Particles.add({x:x+rnd(-w/2,w/2),y:y+rnd(-2,4),vx:rnd(-50,50),vy:rnd(-70,-8),drag:2.4,ay:12,life:rnd(.5,1.1),s0:rnd(10,26),s1:rnd(30,70),r:.9,g:.72,b:.5,a0:.2,kind:2,blend:1,env:1})}

/* ---------- door, planks and particles above the app ---------- */
const Veil={cv:$('#veil'),gl:null,pr:null,pt:null,quad:null,buf:null,arr:null,maxP:256,on:false,clean:false,hasDoor:false,res:1,u:{A:2.3,LK:0,RAY:0,RF:1.15,RH:0,PL:0,ALPHA:1,XS:1,DA:.46,O:[.5,.5],SHK:[0,0],RC:[0,.14]},
  init(){
    const gl=this.gl=this.cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});
    if(!gl)return;
    this.cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.gl=null;this.hasDoor=false;this.on=false;this.clean=true;this.cv.style.visibility='hidden';Particles.list.length=0;if(abortOpening)abortOpening()});
    try{this.pr=prog(gl,VS_QUAD,FS_VEIL);this.pt=prog(gl,VS_PT,FS_PT)}catch(e){console.warn(e);this.gl=null;return}
    this.quad=mkQuad(gl);this.maxP=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]||256;
    this.arr=new Float32Array(Particles.max*10);
    this.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bufferData(gl.ARRAY_BUFFER,this.arr.byteLength,gl.DYNAMIC_DRAW);
    this.tex=mkTex(gl,0);this.logoTex=mkTex(gl,1);gl.useProgram(this.pr.p);if(this.pr.u.DT)gl.uniform1i(this.pr.u.DT,0);if(this.pr.u.LG)gl.uniform1i(this.pr.u.LG,1);
    const lg=new Image();lg.onload=()=>{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.logoTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,lg);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.activeTexture(gl.TEXTURE0)};lg.src='assets/par-ordo-logo.webp';
    this.setRes(Perf.veilRes());
  },
  setRes(r){if(!this.gl)return;this.res=r;const d=Math.min(devicePixelRatio||1,r);this.cv.width=Math.max(2,Math.round(View.W*d));this.cv.height=Math.max(2,Math.round(View.H*d));this.gl.viewport(0,0,this.cv.width,this.cv.height)},
  setDoor(c){
    const gl=this.gl;if(!gl)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
    gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    const an=gl.getExtension('EXT_texture_filter_anisotropic');if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    this.hasDoor=true;
  },
  draw(t){
    const gl=this.gl;if(!gl)return;const L=Particles.list;
    if(!this.on&&!L.length){if(!this.clean){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);this.clean=true;this.cv.style.visibility='hidden'}return}
    if(this.clean){this.clean=false;this.cv.style.visibility=''}gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    if(this.on){
      gl.disable(gl.BLEND);gl.useProgram(this.pr.p);
      if(this.pr.u.R)gl.uniform2f(this.pr.u.R,this.cv.width,this.cv.height);
      if(this.pr.u.T)gl.uniform1f(this.pr.u.T,t%1000);
      setU(gl,this.pr,this.u);drawQuad(gl,this.quad,this.pr);
    }
    if(L.length){
      const q=this.cv.width/View.W,a=this.arr;let c=0;
      for(const p of L){if(p.delay>0)continue;const k=p.age/p.life,sz=Math.min(mix(p.s0,p.s1,k)*q,this.maxP),al=p.a0*(p.env?Math.pow(Math.sin(Math.PI*k),.7):1-k);let i=c*10;a[i++]=p.x*q;a[i++]=p.y*q;a[i++]=sz;a[i++]=p.kind;a[i++]=p.r;a[i++]=p.g;a[i++]=p.b;a[i++]=al;a[i++]=0;a[i++]=p.blend;c++}
      if(c){
        gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.pt.p);
        gl.uniform2f(this.pt.u.R,this.cv.width,this.cv.height);
        gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bufferSubData(gl.ARRAY_BUFFER,0,a.subarray(0,c*10));
        const A=gl.getAttribLocation(this.pt.p,'a'),C=gl.getAttribLocation(this.pt.p,'c'),X=gl.getAttribLocation(this.pt.p,'e');
        gl.enableVertexAttribArray(A);gl.vertexAttribPointer(A,4,gl.FLOAT,false,40,0);
        gl.enableVertexAttribArray(C);gl.vertexAttribPointer(C,4,gl.FLOAT,false,40,16);
        gl.enableVertexAttribArray(X);gl.vertexAttribPointer(X,2,gl.FLOAT,false,40,32);
        gl.drawArrays(gl.POINTS,0,c);
      }
    }
  }};
let doorP=null;
function loadDoor(){
  if(!doorP)doorP=new Promise(res=>{const i=new Image();i.onload=async()=>{try{await i.decode()}catch(_){}res(i)};i.onerror=()=>res(null);i.src='assets/door-marble.webp'});
  return doorP;
}
async function ensureDoor(){
  if(!Veil.gl)return false;if(Veil.hasDoor)return true;
  const im=await loadDoor();if(!im)return false;
  const r=View.W/View.H;Veil.u.XS=r>.56?r/.56:1;Veil.u.DA=Math.min(r,.56);
  let src=im;
  if(Perf.level<=1){const c=document.createElement('canvas');c.width=512;c.height=1024;c.getContext('2d').drawImage(im,0,0,512,1024);src=c}
  Veil.setDoor(src);return true;
}
let shk=0,shkX=0,shkY=0;
const shake=a=>{if(Perf.level>=1){shk=Math.max(shk,a);wake()}};
const mainEl=$('main');

/* ---------- revolving card deck ---------- */
const Deck=(function(){
  const deck=$('#deck'),stage=$('#deckStage');
  if(!deck||!stage)return{tick(){},refresh(){},goTo(){},busy(){return false},vel:()=>0};
  const slabs=[...deck.children],N=slabs.length,dots=$$('#pager i');
  slabs.forEach(s=>{const o=document.createElement('i');o.className='orn';o.setAttribute('aria-hidden','true');s.prepend(o)});
  let pos=0,vel=0,target=0,w=270,step=292,active=-1,drag=null,moved=false,moving=false,lastKey='',refitT=0;
  const zs=slabs.map(()=>0),dims=slabs.map(()=>-1);
  const probe=document.createElement('div');probe.style.cssText='position:fixed;left:-9px;top:0;width:1px;height:100vh;height:100svh;visibility:hidden;pointer-events:none';document.body.append(probe);
  const natural=()=>{stage.style.setProperty('--slab-h','auto');const h=Math.max(...slabs.map(s=>s.offsetHeight));stage.style.removeProperty('--slab-h');return h};
  const docTop=el=>{let y=0;for(let e=el;e;e=e.offsetParent)y+=e.offsetTop;return y};
  const fitText=(el,min)=>{if(!el)return;el.style.removeProperty('font-size');const w=el.clientWidth,sw=el.scrollWidth;if(w>0&&sw>w){const fs=parseFloat(getComputedStyle(el).fontSize);el.style.setProperty('font-size',Math.max(min,Math.floor(fs*w/sw*10)/10)+'px','important')}};
  function fit(force){
    const home=$('#home');if(!home||home.hidden)return;
    const svh=probe.offsetHeight||innerHeight,key=innerWidth+'x'+svh;
    if(!force&&key===lastKey)return;lastKey=key;
    const b=document.body,nav=$('nav[role="tablist"]'),pager=$('#pager'),navH=nav&&nav.offsetHeight?nav.offsetHeight:76;
    const avail=()=>svh-navH-docTop(deck)-9-17-(pager?pager.offsetHeight:14)-6;
    b.classList.remove('fit-1','fit-2','fit-3','fit-4','fit-5');
    fitText($('#qrbtn b'),14);fitText($('#qrbtn span'),9.5);
    let need=natural();
    for(let i=1;i<=5&&avail()<need+4;i++){b.classList.add('fit-'+i);need=natural()}
    const h=Math.max(need+4,Math.min(avail(),392));
    document.documentElement.style.setProperty('--slab-h',Math.round(h)+'px');
    measure();
  }
  const wrap=d=>((d+N/2)%N+N)%N-N/2;
  const measure=()=>{w=slabs[0].offsetWidth||270;step=w+22};
  function paint(){
    const R=w*.925;let best=0,bd=9;
    slabs.forEach((s,i)=>{
      const d=wrap(i-pos),a=Math.abs(d);if(a<bd){bd=a;best=i}
      s.style.transform='translate3d(-50%,0,0) translateZ('+(-R).toFixed(1)+'px) rotateY('+(d*70).toFixed(2)+'deg) translateZ('+R.toFixed(1)+'px)';
      s.style.opacity=a<1?1-a*.1:Math.max(0,(1.5-a)*1.8);
      const z=a<.5?3:a<1.2?2:1;if(z!==zs[i]){zs[i]=z;s.style.zIndex=String(z)}
      const dm=Math.round(Math.max(0,1-a*1.5)*20)/20;if(dm!==dims[i]){dims[i]=dm;s.style.setProperty('--dim',String(dm))}
    });
    if(best!==active){active=best;slabs.forEach((s,i)=>{const on=i===best;s.classList.toggle('active',on);s.setAttribute('aria-hidden',String(!on));$$('button',s).forEach(b=>b.tabIndex=on?0:-1)});dots.forEach((p,i)=>p.classList.toggle('on',i===best))}
  }
  function snap(){const r=rect(deck);dust(r.cx,r.b-14,r.w*.72,12);shake(2.2);buzz(10)}
  function tick(dt){
    if(!moving&&!drag)return;
    if(!drag){const h=dt/2;for(let i=0;i<2;i++){vel+=((target-pos)*64-vel*15)*h;pos+=vel*h}
      if(Math.abs(target-pos)<.012&&Math.abs(vel)<.3){moving=false;pos=target;vel=0;snap()}}
    paint();
  }
  const go=delta=>{target=Math.round(target)+delta;moving=true;buzz(8);wake()};
  deck.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    drag={x0:e.clientX,y0:e.clientY,p0:pos,last:pos,v:0,id:e.pointerId,on:false};moved=false;wake();
  });
  addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;
    if(!drag.on){
      if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){drag=null;return}
      if(Math.abs(dx)<8)return;
      drag.on=true;moved=true;moving=true;deck.classList.add('is-dragging');try{deck.setPointerCapture(e.pointerId)}catch(_){}
    }
    pos=drag.p0-dx/step;const iv=(pos-drag.last)/Math.max(.008,lastDt);drag.last=pos;drag.v=drag.v*.6+iv*.4;vel=drag.v;
  },{passive:true});
  function release(e,cancel){
    if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;deck.classList.remove('is-dragging');
    if(d.on&&!cancel){const off=pos-d.p0;let n=Math.abs(off)>.2||Math.abs(d.v)>.8?(off>0?1:-1):0;if(Math.abs(d.v)>.8&&Math.sign(d.v)!==Math.sign(off))n=0;target=Math.round(d.p0)+n;if(n)buzz(8);moving=true;wake()}
    else if(d.on){moving=true;wake()}
    else if(!cancel){const el=document.elementFromPoint(e.clientX,e.clientY),sl=el&&el.closest('.slab'),i=sl?slabs.indexOf(sl):-1;if(i>=0&&i!==active)go(Math.round(wrap(i-pos)))}
  }
  addEventListener('pointerup',e=>release(e,false));
  addEventListener('pointercancel',e=>release(e,true));
  deck.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true);
  deck.setAttribute('tabindex','0');
  deck.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){go(1);e.preventDefault()}if(e.key==='ArrowLeft'){go(-1);e.preventDefault()}});
  dots.forEach((d,i)=>d.addEventListener('click',()=>go(Math.round(wrap(i-pos)))));
  addEventListener('resize',()=>{fit(false);measure();paint()},{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(()=>{measure();paint()}).observe(deck);
  new MutationObserver(()=>{clearTimeout(refitT);refitT=setTimeout(()=>{fit(true);paint()},140)}).observe(deck,{childList:true,subtree:true,characterData:true});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{fit(true);paint()});
  measure();fit(true);paint();
  return{tick,refresh(){measure();fit(true);paint()},goTo(i){const d=Math.round(wrap(i-pos));if(d)go(d)},busy:()=>moving||!!drag,vel:()=>vel};
})();
window.__poDeckRefresh=Deck.refresh;

/* ---------- entrance: each block lands with weight ---------- */
function entry(list,o={}){
  if(reduce)return;
  if(Perf.level<1){list.filter(Boolean).forEach((el,i)=>el.animate([{opacity:0},{opacity:1}],{duration:240,delay:i*24,fill:'backwards'}));return}
  list.filter(Boolean).forEach((el,i)=>{
    const delay=(o.delay||0)+i*100;
    el.animate([
      {opacity:0,transform:'translateY(-54px) scale(1.05)',easing:'cubic-bezier(.55,0,.85,.4)'},
      {opacity:1,transform:'translateY(0) scale(1)',offset:.56,easing:'ease-out'},
      {transform:'translateY(-6px)',offset:.76,easing:'ease-in'},
      {transform:'none'}
    ],{duration:640,delay,fill:'backwards'});
    later(delay+350,()=>{const r=rect(el);if(r.h<1)return;dust(r.cx,r.b,r.w,o.light?7:13);sparks(r.cx,r.b,o.light?2:5,{sx:r.w/2,v0:30,v1:150,life:.7});shake(o.light?1.1:2.1);buzz(6)});
  });
}
const visibleSection=()=>$('main section:not([hidden])');
const itemsOf=sec=>sec?[...sec.children]:[];

/* ---------- press ---------- */
document.addEventListener('pointerdown',e=>{
  if(reduce||Perf.level<1||$('#intro'))return;
  if(e.target.closest('input,textarea,select'))return;
  const el=e.target.closest('button,.slab.active,#poSmartInvite');if(!el)return;
  const big=el.id==='qrbtn'||el.classList.contains('cta')||el.classList.contains('primary');
  el.animate([{scale:'1'},{scale:'.955',offset:.2},{scale:'1'}],{duration:540,easing:'cubic-bezier(.2,.8,.2,1)'});
  ringFx(e.clientX,e.clientY,{s1:big?300:190,life:.65});
  if(big)ringFx(e.clientX,e.clientY,{s0:10,s1:170,life:.5,a:.6});
  sparks(e.clientX,e.clientY,big?16:8,{v0:40,v1:300,life:.8});
  if(big)shake(1.6);
  buzz(big?12:6);
},{passive:true});

/* ---------- plank change between screens ---------- */
let planksBusy=false,climax=false;
async function planks(originX,swap){
  planksBusy=true;
  try{
    const U=Veil.u;U.O=[originX,.5];U.A=2.3;U.RAY=0;U.PL=.0011;Veil.on=true;
    await tl(340,k=>{U.PL=Math.max(.0011,k)},E.io3);
    shake(3);buzz(12);dust(View.W/2,View.H,View.W,16);
    swap();
    tl(480,k=>{U.PL=1+k*.998},E.io3).then(()=>{U.PL=0;if(!climax)Veil.on=false}).catch(noAbort);
  }finally{planksBusy=false}
}
const navEl=$('nav[role="tablist"]');
let bypass=false;
if(navEl)navEl.addEventListener('click',e=>{
  if(bypass)return;
  const b=e.target.closest('button');if(!b)return;
  if(planksBusy){e.stopPropagation();e.preventDefault();return}
  if(b.getAttribute('aria-selected')==='true'||!Veil.hasDoor||Perf.level<1)return;
  e.stopPropagation();e.preventDefault();
  const r=rect(b);
  planks(r.cx/View.W,()=>{bypass=true;b.click();bypass=false;Deck.refresh();entry(itemsOf(visibleSection()),{light:true})}).catch(noAbort);
},true);
if(typeof window.enterApp==='function'){
  const enterOrig=window.enterApp;
  window.enterApp=function(u,fresh){
    if(!Veil.hasDoor||Perf.level<1||planksBusy)return enterOrig(u,fresh);
    const btn=$('#regbtn'),x=btn?rect(btn).cx/View.W:.5;
    planks(x,()=>{enterOrig(u,fresh);Deck.refresh();entry(itemsOf(visibleSection()),{light:true})}).catch(noAbort);
  };
}

/* ---------- QR opens like a small door ---------- */
function placeOver(el,target){el.style.left=target.offsetLeft+'px';el.style.top=target.offsetTop+'px';el.style.width=target.offsetWidth+'px';el.style.height=target.offsetHeight+'px'}
function whenQrReady(cb){
  const q=$('#qr');let done=false;const go=()=>{if(done)return;done=true;mo.disconnect();cb()};
  const mo=new MutationObserver(()=>{if(q.querySelector('img,canvas'))go()});mo.observe(q,{childList:true,subtree:true});
  if(q.querySelector('img,canvas'))go();setTimeout(go,1500);
}
const qrBtn=$('#qrbtn');
if(qrBtn)qrBtn.addEventListener('click',()=>{
  const m=$('#modal'),sheet=$('.sheet'),q=$('#qr');
  if(!m.classList.contains('open')||Perf.level<1)return;
  m.animate([{opacity:0},{opacity:1}],{duration:280});
  sheet.animate([{opacity:0,transformOrigin:'left center',transform:'perspective(900px) rotateY(-82deg)'},{opacity:1,transformOrigin:'left center',transform:'perspective(900px) rotateY(0)'}],{duration:660,easing:'cubic-bezier(.3,1.1,.4,1)'});
  $$('.qr-doors,.qr-ok',sheet).forEach(e=>e.remove());
  const d=document.createElement('div');d.className='qr-doors';d.innerHTML='<i></i><i></i>';placeOver(d,q);sheet.append(d);
  whenQrReady(()=>{const o={duration:820,delay:120,easing:'cubic-bezier(.55,.05,.2,1)',fill:'both'};d.firstChild.animate([{transform:'rotateY(0)'},{transform:'rotateY(-118deg)'}],o);d.lastChild.animate([{transform:'rotateY(0)'},{transform:'rotateY(118deg)'}],o).onfinish=()=>d.remove()});
});

/* ---------- the moment the visit is accepted ---------- */
function celebrate(){
  const m=$('#modal'),q=$('#qr'),sheet=$('.sheet');
  if(!m.classList.contains('open'))return;
  const ok=document.createElement('div');ok.className='qr-ok';ok.setAttribute('role','status');
  ok.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.500 12.500 3 3 6-6.500"/></svg>Визит записан';
  placeOver(ok,q);sheet.append(ok);
  if(!reduce)ok.animate([{opacity:0,transform:'scale(1.25)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.2,1.3,.3,1)'});
  buzz(40);
  const r=rect(q);
  if(Veil.gl&&Perf.level>=1){
    World.paused=false;climax=true;
    const U=Veil.u;U.A=2.3;U.PL=0;U.RF=.9;U.RH=.56;U.RC=[r.cx/View.W*2-1,1-r.cy/View.H*2];Veil.on=true;
    sparks(r.cx,r.cy,190,{v0:100,v1:800,up:30,g:200,drag:1.2,life:1.7});ringFx(r.cx,r.cy,{s1:520,life:.9});shake(9);
    tl(1400,k=>{U.RAY=Math.sin(Math.PI*k)*1.15;World.u.G=Math.sin(Math.PI*k)*.7}).then(()=>{U.RAY=0;U.RF=1.15;U.RH=0;U.RC=[0,.14];World.u.G=0;Veil.on=false;climax=false}).catch(noAbort);
  }
  setTimeout(async()=>{
    ok.remove();
    if(m.classList.contains('open')&&typeof closeQr==='function')closeQr();
    Deck.goTo(1);
    try{if(typeof refreshGoAccount==='function')await refreshGoAccount(true)}catch(_){}
    setTimeout(()=>{const ring=$('#dots');if(ring&&!reduce){const b=rect(ring);ringFx(b.cx,b.cy,{s1:280});sparks(b.cx,b.cy,50,{v0:60,v1:360,life:1});shake(3)}},1500);
  },2500);
}
let pollT=0,pollBase=null;
async function pollOnce(){
  if(!$('#modal').classList.contains('open')||typeof goApi!=='function')return;
  try{const d=await goApi('/api/go/me'),c=Number(d.visitCount||0);if(pollBase===null)pollBase=c;else if(c>pollBase){stopPoll();celebrate()}}catch(_){}
}
function startPoll(){stopPoll();pollBase=null;pollOnce();pollT=setInterval(pollOnce,4000)}
function stopPoll(){clearInterval(pollT);pollT=0}
window.__poAmbientPause=()=>{World.paused=true;startPoll()};
window.__poAmbientResume=()=>{World.paused=false;stopPoll();wake()};

/* ---------- opening ---------- */
const reveal0=()=>{document.body.classList.add('ready');Deck.refresh();entry(itemsOf(visibleSection()),{delay:40});if(navEl&&!document.body.classList.contains('noauth')&&!reduce)navEl.animate([{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'none'}],{duration:520,delay:560,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})};
function playOpening(force){
  const intro=$('#intro');
  if(!intro){reveal0();return}
  let finished=false,revealed=false,target=null,restore=()=>{};
  const reveal=()=>{if(revealed)return;revealed=true;document.body.classList.remove('door-wait');reveal0()};
  const afterRes=()=>Veil.setRes(Perf.veilRes());
  const finish=fade=>{
    if(finished)return;finished=true;abortOpening=null;token++;clearTimeout(safety);
    restore();Veil.on=false;Veil.u.A=2.3;Veil.u.RAY=0;Veil.u.LK=0;World.u.Z=1;World.u.D0=1;World.u.G=0;afterRes();reveal();
    if(fade){intro.classList.add('out');intro.style.opacity=0;setTimeout(()=>intro.remove(),480)}else intro.remove();
  };
  let seen=false;try{seen=sessionStorage.getItem('po_go_intro')==='1'}catch(_){}
  let safety=0;
  if(!force&&(seen||reduce||Perf.level<1||!Veil.gl||document.hidden)){intro.remove();reveal();if(Perf.level>=1)setTimeout(ensureDoor,700);return}
  try{sessionStorage.setItem('po_go_intro','1')}catch(_){}
  document.body.classList.add('door-wait');
  safety=setTimeout(()=>finish(true),9000);
  const skip=$('#skip');if(skip)skip.onclick=()=>finish(true);
  (async()=>{
    const ready=await Promise.race([ensureDoor(),new Promise(r=>setTimeout(()=>r(false),2600))]);
    if(!ready){finish(true);return}
    Veil.setRes(Perf.openRes());Veil.on=true;Veil.u.A=0;abortOpening=()=>finish(true);Perf.skip=14;Perf.openBad=0;
    const U=Veil.u,W0=World.u,w=View.W,h=View.H,doorW=Math.min(w,h*.56),s=2*262/1024*doorW,x0=w/2-s/2,y0=h*.44-s/2;
    const logo=$('#doorLogo');logo.style.width=logo.style.height=s+'px';logo.style.transform='translate3d('+x0+'px,'+y0+'px,0)';
    W0.Z=1.4;W0.D0=0;U.A=0;U.LK=0;U.RAY=0;U.PL=0;U.ALPHA=1;Veil.on=true;
    await wait(40);
    intro.classList.add('live');
    logo.style.opacity=1;logo.animate([{opacity:0,transform:'translate3d('+x0+'px,'+y0+'px,0) scale(.94)'},{opacity:1,transform:'translate3d('+x0+'px,'+y0+'px,0)'}],{duration:460,easing:'ease-out'});
    await tl(620,k=>{U.LK=.2*k});
    sparks(w/2,h,20,{sx:w*.45,v0:10,v1:90,up:170,g:-30,drag:.4,life:2.2,spread:.8});
    await tl(420,k=>{U.LK=.2+.8*k*k;W0.D0=k*.24});
    ringFx(w/2,h*.44,{s0:s*.8,s1:s*1.7,life:.7,a:.7});
    buzz(25);shake(7);
    await tl(200,k=>{U.A=.05*E.back(k)});
    puffs(w/2,h*.48,90,{sx:w*.1,sy:h*.36,v:300,up:40,l:1.9,s:130,a:.2,spread:.95});
    sparks(w/2,h*.5,110,{sy:h*.34,v0:120,v1:760,up:40,g:90,drag:1.2,life:1.9,spread:.6});
    let flown=false;
    await tl(1600,(e,k)=>{
      U.A=.05+2.25*E.io3(k);U.RAY=Math.sin(Math.PI*Math.min(1,k*1.2))*1.5;W0.D0=mix(.24,1,ss(.04,.5,k));W0.Z=mix(1.4,1,E.out3(k));U.LK=1-k;W0.G=Math.sin(Math.PI*k)*.55;
      if(!flown&&k>.52){
        flown=true;
        const img=$('main section:not([hidden]) .top img');
        if(img){const t=rect(img);target=img;img.style.opacity=0;restore=()=>{img.style.opacity=''};
          intro.classList.add('iris');
          reveal();
          logo.animate([{transform:'translate3d('+x0+'px,'+y0+'px,0) scale(1)'},{transform:'translate3d('+t.x+'px,'+t.y+'px,0) scale('+(t.w/s)+')'}],{duration:760,easing:'cubic-bezier(.6,.02,.2,1)',fill:'forwards'}).onfinish=()=>{
            restore();restore=()=>{};logo.style.visibility='hidden';ringFx(t.cx,t.cy,{s1:130,life:.55});sparks(t.cx,t.cy,18,{v0:40,v1:220,life:.8});buzz(10);
          };
        }else{intro.classList.add('iris');reveal();logo.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'})}
      }
    });
    W0.G=0;W0.Z=1;W0.D0=1;U.RAY=0;U.A=2.3;Veil.on=false;
    await wait(180);
    finish(false);
  })().catch(e=>{if(e!==ABORT){console.error(e);finish(true)}});
}
window.__poPlayDoor=()=>{playOpening(true)};

/* ---------- loop: the interface runs at the screen's own rate, the background is capped ---------- */
let lastT=0,wAcc=0,looping=false,idleFor=0;
function wake(){idleFor=0;if(!looping){looping=true;lastT=0;Perf.skip=Math.max(Perf.skip,3);requestAnimationFrame(loop)}}
function loop(now){
  if(document.hidden){lastT=0;looping=false;return}
  const raw=lastT?(now-lastT)/1000:.016,dt=Math.min(.05,raw);lastT=now;lastDt=dt;
  const cur=tasks;tasks=[];for(const f of cur)if(f(now))tasks.push(f);
  if(shk>.05){shkX=rnd(-shk,shk);shkY=rnd(-shk,shk);if(mainEl)mainEl.style.transform='translate3d('+shkX.toFixed(1)+'px,'+shkY.toFixed(1)+'px,0)';Veil.u.SHK=[shkX/View.W*2,shkY/View.H*2];shk*=Math.exp(-dt*9);if(shk<=.05){shkX=shkY=0;if(mainEl)mainEl.style.transform='';Veil.u.SHK=[0,0]}}
  Deck.tick(dt);
  Particles.tick(dt);
  World.u.PX=[Deck.vel()*.002,0];
  const busy=tasks.length>0||Veil.on||Particles.list.length>0||Deck.busy()||shk>.05;
  idleFor=busy?0:idleFor+dt;
  wAcc+=dt;
  const cap=abortOpening?0:idleFor>8?.05:Perf.level===3?.0333:.0416;
  if(wAcc>=cap){wAcc=0;World.draw(now/1000)}
  Veil.draw(now/1000);
  Perf.sample(raw,now);
  const worldLive=!World.off&&World.gl&&!World.paused;
  if(busy||worldLive||(Veil.gl&&!Veil.clean))requestAnimationFrame(loop);else looping=false;
}
document.addEventListener('visibilitychange',()=>{lastT=0;Perf.skip=20;if(!document.hidden)wake()});
let lastW=innerWidth;
addEventListener('resize',()=>{View.read();if(innerWidth===lastW)return;lastW=innerWidth;World.resize();Veil.setRes(Veil.res)},{passive:true});

View.read();
Perf.init();
World.init();
if(!Perf.known&&!World.off&&World.gl&&World.pr){Perf.bench();Perf.apply()}
Veil.init();
wake();
playOpening(false);
})();
