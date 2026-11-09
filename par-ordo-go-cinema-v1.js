/* PAR ORDO GO — CINEMA V1
   Opening film, living particle layer, 3D card deck and press motion.
   Everything heavy runs on the GPU; the page's QR/API/account code is untouched. */
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ss=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const lowPower=(navigator.hardwareConcurrency||4)<=4||(navigator.deviceMemory||4)<=3;
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(_){}};

function program(gl,vs,fs){
  const mk=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vs));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  const u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<n;i++){const name=gl.getActiveUniform(p,i).name.replace('[0]','');u[name]=gl.getUniformLocation(p,name)}
  return{p,u};
}

/* ================= OPENING FILM =================
   thread & ring → anamorphic flare → fire bloom reveals the banya →
   scene lifts away → title behind a glass ring → camera flies through the ring into the app */
const QUAD_VS='attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const FILM_FS=`precision highp float;varying vec2 v;
uniform vec2 R,RC;uniform float T,BOOM,DIS,SLIDE,TI,GLI,RA,RR,RTH,ROT,IRIS,FLARE,INNER;uniform sampler2D A,P;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
vec3 photo(vec2 uv){float ra=R.x/R.y,ia=780./1698.;vec2 u=uv-.5;if(ra>ia)u.y*=ia/ra;else u.x*=ra/ia;u+=.5;return texture2D(P,vec2(u.x,1.-u.y)).rgb;}
vec4 title(vec2 uv){return texture2D(A,vec2(uv.x,1.-uv.y));}
vec3 scene(vec2 uv,vec2 p){
  float m=min(R.x,R.y);
  vec3 c=vec3(.016,.013,.012)+vec3(.20,.10,.04)*smoothstep(.9,-.2,length(p-vec2(-.1,-1.05)))*.55;
  c+=vec3(.05,.035,.02)*smoothstep(1.2,0.,length(p-vec2(.2,.6)));
  if(TI>.001){
    float band=floor(uv.y*54.),t=floor(T*16.);
    float d=(h(vec2(band,t))-.5)*GLI*.26;
    vec2 tu=uv+vec2(d,(1.-TI)*-.34);
    float s=GLI*.018+.0009;
    vec4 a=title(tu+vec2(s,0.)),b=title(tu),e=title(tu-vec2(s,0.));
    vec3 tc=vec3(a.r,b.g,e.b);float al=max(a.a,max(b.a,e.a))*smoothstep(0.,.5,TI);
    c=mix(c,tc,al);
  }
  if(SLIDE<1.){
    vec2 pu=uv;pu.y-=SLIDE*1.12;
    float vis=smoothstep(-.002,.004,pu.y);
    if(vis>0.&&DIS>.001){
      float th=mix(1.25,-.25,DIS);
      float f=fbm(pu*vec2(R.x/R.y,1.)*7.+vec2(T*.15,0.))+.28-length(p)*.14;
      float mk=smoothstep(th,th+.13,f);
      vec3 ph=photo(pu)*1.12;
      c=mix(c,ph,mk*vis);
      c+=vec3(1.5,.75,.2)*mk*(1.-mk)*3.4*vis;
    }
    c+=vec3(1.,.62,.26)*exp(-abs(pu.y)*70.)*step(.001,SLIDE)*.9;
  }
  if(BOOM>.001){
    vec2 q=p-vec2(0.,.07);q.y+=fbm(q*2.+T*.5)*.14-.07;
    float d=length(q*vec2(.82,1.75));
    float nz=fbm(q*5.2+vec2(T*.9,-T*1.3));
    float rr=mix(.05,.56,BOOM);
    float cl=smoothstep(rr,rr*.12,d+(nz-.5)*.34);
    float ar=.5+.5*sin(d*44.-T*13.+nz*7.);
    vec3 fc=mix(vec3(1.,.36,.05),vec3(1.,.72,.2),smoothstep(.1,.55,cl));
    fc=mix(fc,vec3(1.,.93,.86),smoothstep(.55,.98,cl));
    fc=mix(fc,vec3(1.,.72,.86),smoothstep(.3,.9,nz)*.3);
    c=mix(c,fc*(1.15+ar*.28),cl*BOOM);
    c+=vec3(.9,.45,.12)*smoothstep(1.2,0.,d)*.34*BOOM;
  }
  return c;
}
void main(){
  float m=min(R.x,R.y);vec2 uv=v,p=(v-.5)*R/m;
  vec3 c=scene(uv,p);float a=1.;
  vec2 q=p-RC;float ca=max(abs(cos(ROT)),.14);vec2 qq=vec2(q.x/ca,q.y);float L=length(qq);
  float dr=L-RR;
  if(RA>.001){
    float t2=dr/RTH;
    if(abs(t2)<1.){
      float nz=sqrt(1.-t2*t2);vec2 nxy=normalize(qq+1e-5)*t2;nxy.x*=ca;
      vec2 off=-nxy*(.05+RTH*.55)*vec2(m/R.x,m/R.y)*2.;
      float rd=.055*RTH/.05;
      vec3 rf=vec3(scene(uv+off*(1.+rd),p).r,scene(uv+off,p).g,scene(uv+off*(1.-rd),p).b);
      float fr=pow(1.-nz,1.7);
      vec3 iri=.5+.5*cos(6.283*(fr*1.25+L*1.4+T*.16+atan(q.y,q.x)*.12+vec3(0.,.33,.67)));
      iri=mix(iri,vec3(1.,.78,.42),.42);
      float sp=pow(max(dot(normalize(vec3(nxy,nz)),normalize(vec3(-.45,.6,.66))),0.),42.);
      vec3 g=rf*.82+iri*fr*1.25+vec3(1.,.96,.86)*sp*1.6+vec3(.06,.05,.05);
      float e=smoothstep(1.,.86,abs(t2));
      c=mix(c,g,RA*e);
    }
    if(INNER>.001){
      float ang=atan(q.y,q.x);
      float gl=pow(.5+.5*cos(ang-T*2.3),16.);
      vec3 ic=.5+.5*cos(6.283*(ang*.16+T*.4+vec3(.0,.33,.67)));
      c+=(vec3(1.,.8,.5)+ic*2.4*gl)*exp(-abs(dr)/(RTH*1.6))*gl*.9*INNER;
      float r2=abs(L-RR*.62)-RTH*.22;
      c+=vec3(1.,.72,.34)*smoothstep(.0035,0.,r2)*.8*INNER;
      vec2 s=qq/RR;float g2=0.;
      for(int i=0;i<3;i++){float x0=(float(i)-1.)*.2;float w=x0+.055*sin(s.y*10.+T*2.+float(i));
        g2+=smoothstep(.024,.0,abs(s.x-w))*smoothstep(.34,.26,abs(s.y));}
      c+=vec3(1.,.74,.32)*g2*INNER;
    }
    if(IRIS>0.)a=smoothstep(RR-RTH*.9-.006,RR-RTH*.9,L);
  }
  if(FLARE>.001){
    float y=p.y+.42;
    float st=exp(-abs(y)*46.)*smoothstep(.72,.05,abs(p.x));
    vec3 ch=.55+.55*cos(p.x*17.+T*2.+vec3(0.,2.1,4.2));
    c+=(ch*.9+vec3(1.,.72,.42))*st*FLARE;
    c+=vec3(.8,.42,.16)*exp(-abs(y)*7.)*smoothstep(.8,.0,abs(p.x))*FLARE*.28;
  }
  c*=mix(1.,smoothstep(1.55,.34,length(p)),.46);
  gl_FragColor=vec4(c*a,a);
}`;
const FILM_PT_VS=`precision highp float;attribute vec4 a;
uniform vec2 R,RC;uniform float T,B,AMB,SLIDE,DP;varying vec3 c;varying float k,al,rs;
const float PI2=6.28318;
void main(){
  float m=min(R.x,R.y),kd=floor(a.w),z=fract(a.w)*10.;vec2 p=vec2(0.);float s=1.;al=0.;c=vec3(1.,.75,.38);k=0.;
  float bt=max(B,0.);
  if(kd<.5){ // dust orbiting the ring
    float an=a.x*PI2+T*(.2+a.y*.5),r=.1+(a.y-.5)*.035;
    p=RC+vec2(cos(an),sin(an))*r;p+=vec2(cos(an),sin(an))*(1.-exp(-bt*3.))*(.45+a.z);
    s=1.+a.z*1.4;al=(.35+.6*a.z)*min(1.,T*1.5)*(B>0.?exp(-bt*1.8):1.);
  }else if(kd<1.5){ // the thread: two strands crossing beneath the ring
    float u=a.x,side=a.y>.5?1.:-1.;
    float y=RC.y-.095-u*1.08;
    float x=side*(.13*sin(u*5.1)+.05*u)+.006*sin(u*40.+T*2.);
    p=vec2(x+RC.x+.012*sin(T*.9+u*5.),y);
    float draw=smoothstep(u,u+.1,T*.72+.05);
    s=.8+a.z*.7;al=.62*draw*(B>0.?exp(-bt*4.):1.);c=mix(vec3(1.,.88,.72),vec3(1.,.62,.3),a.z);
  }else if(kd<2.5){ // gold dust low in the frame
    float tw=.5+.5*sin(T*(1.5+a.z*4.)+a.x*40.);
    p=vec2((a.x-.5)*(.5+a.y*.42),-1.02+a.y*a.y*.8+mod(T*.02*(a.z+.3),.1));
    p+=normalize(p+vec2(.0,.3)+1e-4)*(1.-exp(-bt*2.2))*(.2+a.z*.9);
    s=.9+a.z*1.6;al=(.2+.75*tw)*min(1.,T*.8)*(B>0.?exp(-bt*1.35):1.);c=mix(vec3(1.,.74,.26),vec3(.95,.92,.4),a.y);
  }else if(kd<3.5){ // the burst
    float an=a.x*PI2,sp=(.25+a.y*a.y*1.35);
    vec2 d=vec2(cos(an),sin(an)*.72);float f=1.-exp(-bt*(2.4+a.z*1.6));
    p=vec2(0.,.07)+d*sp*f;p.y-=bt*bt*.05*(.3+a.z);p.y+=bt*.05;
    float life=2.1*(.45+a.z*.55);
    s=1.+a.z*2.2;al=B>0.?smoothstep(0.,.05,bt)*smoothstep(life,life*.35,bt):0.;
    c=mix(vec3(1.,.56,.14),vec3(1.,.86,.45),a.y);
  }else if(kd<4.5){ // leaves of the venik climbing as columns
    float col=a.x<.34?-.34:(a.x<.68?.37:(a.y-.5)*1.06);
    float hgt=a.x<.68?(.25+a.y*1.15):(a.y*.4);
    float gr=smoothstep(0.,1.05,bt-(a.y*.25));
    float sway=sin(T*1.7+a.z*9.)*.012;
    p=vec2(col+(a.z-.5)*(.18+.12*(1.-a.y))+sway,-1.05+hgt*gr);
    s=1.8+a.z*2.5;k=1.;rs=a.z*PI2+T*.4;
    al=(B>0.?smoothstep(.05,.45,bt):0.)*.95;
    c=mix(vec3(.45,.62,.1),vec3(1.,.74,.14),a.z*a.z*1.2);
  }else{ // steam feathers top right
    float st=floor(a.x*11.)/11.,u=fract(a.x*11.);
    float an=2.2+st*1.05+.05*sin(T*1.2+st*9.);
    p=vec2(.62,.98)+vec2(cos(an),sin(an))*(.03+u*.32)*(.7+st*.6);
    p.x+=sin(u*5.+T)*.007;
    s=1.;al=(1.-u)*(.25+.6*a.z)*min(1.,T*.8)*(B>0.?exp(-bt*2.5):1.);c=vec3(1.,.93,.82);
  }
  p.y+=SLIDE*2.5;
  vec2 cl=p*2.*m/R;gl_Position=vec4(cl,0.,1.);gl_PointSize=max(s*DP*(m/390.),.5)*1.7;
  if(al<=.002)gl_Position=vec4(2.,2.,0.,1.);
}`;
const FILM_PT_FS=`precision mediump float;varying vec3 c;varying float k,al,rs;
void main(){vec2 u=gl_PointCoord-.5;float d;
  if(k>.5){float s_=sin(rs),c_=cos(rs);u=vec2(u.x*c_-u.y*s_,u.x*s_+u.y*c_);d=length(u*vec2(1.,2.3));d=smoothstep(.5,.34,d);}
  else{d=length(u);d=smoothstep(.5,0.,d);d*=d;}
  gl_FragColor=vec4(c*al*d,0.);
}`;

function titleCanvas(w,h){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  const m=Math.min(w,h),fs=m*.235,x=w*.075,cy=h*.5;
  const lines=['ПАР','ОРДО','GO'];
  g.font=`700 ${fs}px Georgia,"Noto Serif","Iowan Old Style",serif`;g.textBaseline='middle';
  const gr=g.createLinearGradient(0,cy-fs*1.5,0,cy+fs*1.5);gr.addColorStop(0,'#fff2d6');gr.addColorStop(.55,'#ffd48c');gr.addColorStop(1,'#ff9f4a');
  g.fillStyle=gr;
  lines.forEach((t,i)=>g.fillText(t,x,cy+(i-1)*fs*1.06));
  g.font=`600 ${m*.033}px system-ui,-apple-system,sans-serif`;g.fillStyle='#e9d6b5';
  try{g.letterSpacing=(m*.012)+'px'}catch(_){}
  g.fillText('МУЖСКАЯ БАНЯ',x+m*.005,cy+fs*2.1);
  g.fillStyle='#f6c878';g.fillRect(x+m*.005,cy+fs*1.84,m*.1,Math.max(1,m*.0035));
  return cv;
}

function playIntro(onReveal,onDone){
  const intro=$('#intro');let finished=false,revealed=false;
  const reveal=()=>{if(!revealed){revealed=true;onReveal()}};
  const finish=(fade)=>{if(finished)return;finished=true;reveal();
    if(fade){intro.classList.add('out');setTimeout(()=>intro.remove(),950)}else intro.remove();onDone()};
  let seen=false;try{seen=sessionStorage.getItem('po_go_intro')==='1'}catch(_){}
  if(seen||reduce){intro.remove();reveal();onDone();return}
  try{sessionStorage.setItem('po_go_intro','1')}catch(_){}
  $('#skip').onclick=()=>finish(true);
  const safety=setTimeout(()=>finish(true),12000);
  const cv=$('#c');
  let gl=null;
  try{gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'high-performance'})}catch(_){}
  const fallback=()=>{intro.classList.add('nogl');requestAnimationFrame(()=>intro.classList.add('show'));$('#flash')?.classList.add('go');setTimeout(()=>{clearTimeout(safety);finish(true)},2300)};
  if(!gl){fallback();return}
  let film,pts,buf,quad,tP,tA;
  const W=Math.max(1,innerWidth),H=Math.max(1,innerHeight),dpr=Math.min(devicePixelRatio||1,lowPower?1.25:1.75);
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  try{film=program(gl,QUAD_VS,FILM_FS);pts=program(gl,FILM_PT_VS,FILM_PT_FS)}catch(e){console.warn(e);fallback();return}
  quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const scale=lowPower?.5:1,mix=[[0,420],[1,1300],[2,900],[3,1700],[4,1100],[5,330]];
  const total=mix.reduce((s,[,n])=>s+Math.round(n*scale),0),data=new Float32Array(total*4);let o=0;
  mix.forEach(([k,n])=>{n=Math.round(n*scale);for(let i=0;i<n;i++){data[o++]=Math.random();data[o++]=Math.random();data[o++]=Math.random();data[o++]=k+.05}});
  buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  const tex=(unit,src)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(src)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
    else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([5,4,3,255]));return t};
  tP=tex(0,null);tA=tex(1,titleCanvas(Math.round(W*dpr),Math.round(H*dpr)));
  const im=new Image();im.onload=()=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tP);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im)};im.src='assets/bg-banya.jpg';
  gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,0);
  const t0=performance.now();let boomDone=false;
  const IEND=6.75,IST=5.72;
  function frame(now){
    if(finished)return;
    const t=(now-t0)/1000;
    if(document.hidden){clearTimeout(safety);finish(false);return}
    const amb=1-ss(2.5,2.9,t);
    const boom=ss(2.45,2.76,t)*(1-ss(3.45,4.2,t))*(1+.12*Math.sin(t*11));
    const dis=ss(2.75,3.75,t),sl=ss(3.95,4.72,t),ti=ss(4.15,4.85,t);
    const gli=(1-ss(4.45,5.0,t))*ss(3.95,4.2,t)+ss(5.45,5.85,t)*.8;
    const flare=ss(1.5,2.35,t)*(1-ss(2.5,3,t));
    const stage=ss(4.3,4.95,t),a1=ss(.1,.8,t)*(1-ss(2.62,3,t)),a2=stage;
    const ra=Math.max(a1,a2);
    const iris=clamp((t-IST)/(IEND-IST));
    let rr,rth,cx,cy,rot,inner;
    if(stage<=0){rr=.098;rth=.0065;cx=0;cy=.26;rot=Math.sin(t*.8)*.28;inner=a1}
    else{
      const e=iris*iris;
      rr=(.1+.27*stage)*Math.exp(e*(lowPower?4.3:4.5));rth=rr*(.12+(.0));
      cx=.13*(1-ss(0,.35,iris));cy=.0;rot=(.95-.5*stage+Math.sin(t*1.5)*.32)*(1-ss(0,.3,iris));inner=0;
    }
    if(t>=2.46&&!boomDone){boomDone=true;buzz(30)}
    if(iris>0&&!revealed){intro.classList.add('iris');reveal()}
    gl.disable(gl.BLEND);gl.useProgram(film.p);
    gl.bindBuffer(gl.ARRAY_BUFFER,quad);const la=gl.getAttribLocation(film.p,'a');gl.enableVertexAttribArray(la);gl.vertexAttribPointer(la,2,gl.FLOAT,false,0,0);
    const U=film.u,f=(n,v)=>U[n]&&gl.uniform1f(U[n],v);
    gl.uniform2f(U.R,cv.width,cv.height);U.RC&&gl.uniform2f(U.RC,cx,cy);
    f('T',t);f('BOOM',boom);f('DIS',dis);f('SLIDE',sl);f('TI',ti);f('GLI',gli);f('RA',ra);f('RR',rr);f('RTH',rth);f('ROT',rot);f('IRIS',iris>0?1:0);f('FLARE',flare);f('INNER',inner);
    U.P&&gl.uniform1i(U.P,0);U.A&&gl.uniform1i(U.A,1);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(t<4.75){
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.useProgram(pts.p);
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);const lb=gl.getAttribLocation(pts.p,'a');gl.enableVertexAttribArray(lb);gl.vertexAttribPointer(lb,4,gl.FLOAT,false,0,0);
      const V=pts.u,g=(n,v)=>V[n]&&gl.uniform1f(V[n],v);
      gl.uniform2f(V.R,cv.width,cv.height);V.RC&&gl.uniform2f(V.RC,0,.26);
      g('T',t);g('B',t-2.5);g('AMB',amb);g('SLIDE',sl);g('DP',dpr);
      gl.drawArrays(gl.POINTS,0,total);
    }
    if(t>=IEND){clearTimeout(safety);finish(false);return}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ================= LIVING LAYER =================
   embers, water glints, a spiral of leaves behind the deck, and bursts on press */
const FX_VS=`precision highp float;attribute vec4 a;
uniform vec2 R;uniform vec4 C;uniform float T,S,G,DP;uniform vec4 BU[6];varying vec3 c;varying float k,al,rs;
const float PI2=6.28318;
void main(){
  float kd=floor(a.w);vec2 p=vec2(0.);float s=1.;al=0.;k=0.;c=vec3(1.,.72,.34);
  if(kd<.5){ // embers
    float sp=.018+a.y*.04,y=fract(a.z+T*sp);
    p=vec2(a.x*R.x+sin(T*.6+a.x*30.)*16.*DP,R.y*(1.-y));
    s=1.2+a.y*2.;al=(.25+.6*(.5+.5*sin(T*2.+a.z*50.)))*smoothstep(0.,.1,y)*smoothstep(1.,.75,y);
    c=mix(vec3(1.,.5,.14),vec3(1.,.82,.45),a.y);
  }else if(kd<1.5){ // glints on the water
    float tw=pow(.5+.5*sin(T*(1.+a.y*3.)+a.x*70.),6.);
    p=vec2(a.x*R.x,R.y*(.84+a.z*.16));s=1.2+a.y*2.4;al=tw*.75;c=vec3(1.,.74,.36);
  }else if(kd<2.5){ // spiral of leaves — wakes up when the deck moves
    float u=a.x,an=u*18.+S+(a.y>.5?3.14:0.);
    float cx=(C.x+C.z)*.5,hh=(C.w-C.y)*.5+34.*DP;
    float rad=(C.z-C.x)*(.20+.05*sin(u*20.));
    p=vec2(cx+cos(an)*rad,(C.y+C.w)*.5+(u-.5)*2.*hh);
    float dz=sin(an);
    s=(3.+a.z*4.)*(1.+dz*.3);k=1.;rs=an+a.z*6.;
    al=(C.z-C.x<1.)?0.:(.12+G*.9)*(.45+.55*a.z);
    c=mix(vec3(.9,.58,.12),vec3(1.,.84,.5),a.z);
    if(p.x>C.x&&p.x<C.z&&p.y>C.y&&p.y<C.w)al=0.;
  }else{ // press bursts
    int j=int(floor(a.w-3.+.001));vec4 b=BU[j];float t=T-b.z;
    if(b.w>0.&&t>=0.&&t<1.15){
      float an=a.x*PI2,sp=(60.+a.y*a.y*260.)*DP*b.w,f=1.-exp(-t*(3.+a.z*2.));
      p=b.xy+vec2(cos(an),sin(an))*sp*f;p.y+=(t*t*90.)*DP;
      s=1.2+a.z*2.8;al=smoothstep(1.1*(.45+.55*a.z),.1,t);
      k=a.z>.72?1.:0.;rs=an+t*5.;if(k>.5)s*=2.;
      c=mix(vec3(1.,.55,.16),vec3(1.,.9,.6),a.y);
    }
  }
  gl_Position=vec4(p.x/R.x*2.-1.,1.-p.y/R.y*2.,0.,1.);gl_PointSize=max(s*DP,.5)*1.6;
  if(al<=.002)gl_Position=vec4(2.,2.,0.,1.);
}`;

function createFx(){
  const cv=$('#bg');const noop={burst(){},spin(){},setDeckRect(){},start(){},stop(){}};
  if(reduce)return noop;
  let gl=null;try{gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false})}catch(_){}
  if(!gl)return noop;
  let pr;try{pr=program(gl,FX_VS,FILM_PT_FS)}catch(e){console.warn(e);return noop}
  const N=lowPower?[26,36,120]:[46,60,240],B=lowPower?28:44;
  const total=N[0]+N[1]+N[2]+B*6,data=new Float32Array(total*4);let o=0;
  const put=(n,k)=>{for(let i=0;i<n;i++){data[o++]=Math.random();data[o++]=Math.random();data[o++]=Math.random();data[o++]=k+.05}};
  put(N[0],0);put(N[1],1);put(N[2],2);for(let j=0;j<6;j++)put(B,3+j);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  gl.useProgram(pr.p);const la=gl.getAttribLocation(pr.p,'a');gl.enableVertexAttribArray(la);gl.vertexAttribPointer(la,4,gl.FLOAT,false,0,0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.clearColor(0,0,0,0);
  let W=0,H=0,dpr=1,raf=0,last=0,running=false,spin=0,glow=0,glowTarget=0,headT=0,slot=0;
  const start0=performance.now(),bursts=new Float32Array(24),rect=[0,0,0,0];
  const fit=()=>{dpr=Math.min(devicePixelRatio||1,lowPower?1:1.5);W=innerWidth;H=innerHeight;cv.width=Math.max(1,Math.round(W*dpr));cv.height=Math.max(1,Math.round(H*dpr));cv.style.width=W+'px';cv.style.height=H+'px';gl.viewport(0,0,cv.width,cv.height)};
  fit();let rz=0;addEventListener('resize',()=>{if(!rz)rz=requestAnimationFrame(()=>{rz=0;fit()})},{passive:true});
  const minDt=lowPower?1000/30:1000/60-2;
  function draw(now){
    raf=0;if(!running||document.hidden)return;
    raf=requestAnimationFrame(draw);
    if(last&&now-last<minDt)return;
    const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;
    glow+=(glowTarget-glow)*Math.min(1,dt*6);glowTarget*=Math.exp(-dt*2.2);spin+=dt*.25;
    headT=(now-start0)/1000;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(pr.u.R,cv.width,cv.height);gl.uniform1f(pr.u.T,headT);gl.uniform1f(pr.u.S,spin);gl.uniform1f(pr.u.G,clamp(glow));gl.uniform1f(pr.u.DP,dpr);
    gl.uniform4f(pr.u.C,rect[0]*dpr,rect[1]*dpr,rect[2]*dpr,rect[3]*dpr);
    gl.uniform4fv(pr.u.BU,bursts);
    gl.drawArrays(gl.POINTS,0,total);
  }
  return{
    burst(x,y,power=1){const i=slot++%6,now=(performance.now()-start0)/1000;bursts[i*4]=x*dpr;bursts[i*4+1]=y*dpr;bursts[i*4+2]=now;bursts[i*4+3]=power},
    spin(v){spin+=v;glowTarget=Math.max(glowTarget,Math.min(1,Math.abs(v)*22))},
    setDeckRect(l,t,r,b){rect[0]=l;rect[1]=t;rect[2]=r;rect[3]=b},
    start(){running=true;if(!raf&&!document.hidden){last=0;raf=requestAnimationFrame(draw)}},
    stop(){running=false;if(raf){cancelAnimationFrame(raf);raf=0}gl.clear(gl.COLOR_BUFFER_BIT)}
  };
}
const fx=createFx();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&fxWanted)fx.start()});
let fxWanted=false,pauseT=0;
window.__poAmbientPause=()=>{fxWanted=false;clearTimeout(pauseT);pauseT=setTimeout(()=>fx.stop(),700)};
window.__poAmbientResume=()=>{clearTimeout(pauseT);if(!document.getElementById('intro')||document.getElementById('intro').classList.contains('iris')){fxWanted=true;fx.start()}};

/* ================= 3D DECK =================
   Endless ring of glass cards driven by the finger with a spring. */
const deckApi=(function(){
  const deck=$('#deck'),stage=$('#deckStage');
  if(!deck||!stage)return{enter(){},refresh(){}};
  const slabs=[...deck.children],N=slabs.length,dots=$$('#pager i');
  slabs.forEach(s=>{const o=document.createElement('i');o.className='orn';o.setAttribute('aria-hidden','true');s.prepend(o);
    const m=document.createElement('i');m.className='smear';m.setAttribute('aria-hidden','true');s.append(m)});
  let pos=0,vel=0,target=0,w=270,step=290,raf=0,last=0,active=-1;
  let drag=null,moved=false,enterAt=null;
  const enter=slabs.map(()=>1);
  const press={x:0,y:0,on:0,cur:0};
  const wrap=d=>{d=((d+N/2)%N+N)%N-N/2;return d};
  function measure(){
    w=slabs[0].offsetWidth||270;step=w*1.0+22;
    const r=deck.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    const cx=sr.left+sr.width/2;
    if($('#home').hidden){fx.setDeckRect(0,0,0,0);return}
    fx.setDeckRect(cx-w/2,r.top+9,cx+w/2,r.top+9+slabs[0].offsetHeight);
  }
  function paint(){
    const sp=Math.min(1,Math.abs(vel)/4.5),split=lowPower?0:(vel>0?1:-1)*sp*sp*8;
    stage.style.setProperty('--split',split.toFixed(2));
    let best=0,bd=9;
    slabs.forEach((s,i)=>{
      const d=wrap(i-pos),a=Math.abs(d),cl=clamp(d,-1,1),e=enter[i];
      if(a<bd){bd=a;best=i}
      const ie=1-e;
      const tx=d*step*(1+.03*Math.min(a,1));
      const ty=ie*innerHeight*.62;
      const tz=-Math.min(a,1.5)*170-ie*620;
      const rY=-cl*26+(-vel*2.4)*(a<1?1:.4);
      const rX=ie*58+press.cur*press.y*-7*(a<.5?1:0);
      const rZ=ie*(i%2?-14:14);
      const rP=press.cur*press.x*8*(a<.5?1:0);
      const sc=(1-Math.min(a,1)*.05)*(1-press.cur*.025*(a<.5?1:0));
      const skew=clamp(vel*1.1,-7,7);
      s.style.transform=`translate3d(calc(-50% + ${tx.toFixed(1)}px),${ty.toFixed(1)}px,${tz.toFixed(1)}px) rotateX(${(rX).toFixed(2)}deg) rotateY(${(rY+rP).toFixed(2)}deg) rotateZ(${rZ.toFixed(2)}deg) skewY(${skew.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      s.style.opacity=(a<1?1-a*.16:Math.max(0,(1.5-a)*1.68))*Math.min(1,e*2.4);
      s.style.zIndex=String(Math.round(100-a*30));
      s.style.setProperty('--dim',Math.max(0,1-a*1.5).toFixed(3));
      s.style.setProperty('--spec',Math.max(sp*.9,press.cur).toFixed(3));
      s.style.setProperty('--smear',(sp*sp*(a<1.2?.85:0)).toFixed(3));
    });
    if(best!==active){
      active=best;
      slabs.forEach((s,i)=>{const on=i===best;s.classList.toggle('active',on);s.setAttribute('aria-hidden',String(!on));s.querySelectorAll('button').forEach(b=>b.tabIndex=on?0:-1)});
      dots.forEach((p,i)=>p.classList.toggle('on',i===best));
    }
    $('#scene').style.setProperty('--scene-x',(-wrap(pos-0)*5).toFixed(1)+'px');
  }
  function tick(now){
    raf=0;
    const dt=last?Math.min(.034,(now-last)/1000):.016;last=now;
    let busy=false;
    if(enterAt!==null){
      const t=(now-enterAt)/1000;
      slabs.forEach((s,i)=>{const q=clamp((t-[.0,.12,.22][wrap(i-pos)>0?1:wrap(i-pos)<0?2:0])/1.05);enter[i]=1-Math.pow(1-q,4)});
      if(t<1.5)busy=true;else{enter.fill(1);enterAt=null}
    }
    if(!drag){
      vel+=((target-pos)*118-vel*17)*dt;
      const prev=pos;pos+=vel*dt;fx.spin(pos-prev);
      if(Math.abs(target-pos)<.0006&&Math.abs(vel)<.006){pos=target;vel=0}else busy=true;
    }else busy=true;
    press.cur+=(press.on-press.cur)*Math.min(1,dt*14);
    if(Math.abs(press.cur-press.on)>.004)busy=true;else press.cur=press.on;
    paint();
    if(busy)raf=requestAnimationFrame(tick);else last=0;
  }
  const wake=()=>{if(!raf){last=0;raf=requestAnimationFrame(tick)}};
  function go(delta){target=Math.round(target)+delta;buzz(8);wake()}
  deck.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const r=slabs[active].getBoundingClientRect();
    press.x=clamp((e.clientX-r.left)/r.width*2-1,-1,1);press.y=clamp((e.clientY-r.top)/r.height*2-1,-1,1);
    press.on=1;slabs[active].style.setProperty('--mx',((press.x+1)*50)+'%');slabs[active].style.setProperty('--my',((press.y+1)*50)+'%');
    drag={x0:e.clientX,y0:e.clientY,p0:pos,lx:e.clientX,lt:e.timeStamp,v:0,id:e.pointerId,on:false,lost:false};moved=false;wake();
  });
  addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;
    if(!drag.on){
      if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){release(e,true);return}
      if(Math.abs(dx)<8)return;
      drag.on=true;moved=true;press.on=0;deck.classList.add('is-dragging');try{deck.setPointerCapture(e.pointerId)}catch(_){}
    }
    const prev=pos;pos=drag.p0-dx/step;
    const dtm=Math.max(1,e.timeStamp-drag.lt)/1000;
    const iv=-(e.clientX-drag.lx)/step/dtm;drag.v=drag.v*.6+iv*.4;drag.lx=e.clientX;drag.lt=e.timeStamp;vel=drag.v;
    fx.spin(pos-prev);wake();
  },{passive:true});
  function release(e,cancel){
    if(!drag)return;const d=drag;drag=null;press.on=0;deck.classList.remove('is-dragging');
    if(d.on&&!cancel){
      let base=Math.round(d.p0);
      const off=pos-d.p0;
      let n=Math.abs(off)>.2||Math.abs(d.v)>.8?(off>0||(!off&&d.v>0)?1:-1):0;
      if(Math.abs(d.v)>.8&&Math.sign(d.v)!==Math.sign(off))n=0;
      target=base+n;if(n)buzz(8);
    }else if(!cancel){
      const el=document.elementFromPoint(e.clientX,e.clientY),sl=el&&el.closest('.slab');
      const i=sl?slabs.indexOf(sl):-1;
      if(i>=0&&i!==active){target=Math.round(target)+Math.round(wrap(i-pos));buzz(8)}
    }
    wake();
  }
  addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id)release(e,false)});
  addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id)release(e,true)});
  deck.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true);
  deck.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){go(1);e.preventDefault()}if(e.key==='ArrowLeft'){go(-1);e.preventDefault()}});
  dots.forEach((d,i)=>d.addEventListener('click',()=>{target=Math.round(target)+Math.round(wrap(i-pos));buzz(8);wake()}));
  addEventListener('resize',()=>{measure();paint()},{passive:true});
  addEventListener('scroll',()=>measure(),{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(()=>{measure();paint()}).observe(deck);
  measure();paint();
  return{
    refresh(){measure();if(enterAt===null&&enter[0]===0&&!$('#home').hidden){enter.fill(0);enterAt=performance.now()+120;wake()}paint()},
    enter(){if(reduce)return;enter.fill(0);enterAt=performance.now()+120;paint();wake()},
    hide(){if(!reduce){enter.fill(0);paint()}}
  };
})();
window.__poDeckRefresh=deckApi.refresh;

/* ================= PRESS & PAGE MOTION ================= */
function ringAt(x,y,size=170,dur=620){
  if(reduce)return;
  const r=document.createElement('span');r.className='fx-ring';r.style.left=x+'px';r.style.top=y+'px';document.body.append(r);
  const a=r.animate([{transform:'scale(.2)',opacity:1},{transform:`scale(${size/12})`,opacity:0}],{duration:dur,easing:'cubic-bezier(.12,.72,.25,1)'});
  a.onfinish=()=>r.remove();
}
function sweep(dir=1){
  if(reduce)return;
  const s=document.createElement('div');s.className='fx-sweep';document.body.append(s);
  const H=innerHeight,y=dir>0?[H+80,-240]:[-240,H+80];
  const a=s.animate([{transform:`translate3d(0,${y[0]}px,0)`,opacity:.1},{opacity:1,offset:.35},{transform:`translate3d(0,${y[1]}px,0)`,opacity:0}],{duration:520,easing:'cubic-bezier(.5,0,.2,1)'});
  a.onfinish=()=>s.remove();
}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest&&e.target.closest('button');
  if(!b)return;
  const big=b.id==='qrbtn'||b.classList.contains('cta')||b.classList.contains('primary');
  fx.burst(e.clientX,e.clientY,big?1.2:.55);
  ringAt(e.clientX,e.clientY,big?260:120);
  buzz(big?14:6);
},{passive:true});

// Glass surfaces lean toward the finger
function bindPress(el){
  if(reduce||el.dataset.cPress)return;el.dataset.cPress='1';el.classList.add('c-press');
  const set=(e)=>{const r=el.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width),y=clamp((e.clientY-r.top)/r.height);
    el.style.setProperty('--mx',x*100+'%');el.style.setProperty('--my',y*100+'%');
    el.style.transform=`perspective(800px) rotateX(${((.5-y)*7).toFixed(2)}deg) rotateY(${((x-.5)*8).toFixed(2)}deg) scale(.985)`};
  const off=()=>{el.classList.remove('is-down');el.style.transform=''};
  el.addEventListener('pointerdown',e=>{if(e.target.closest('input,textarea,select,button'))return;el.classList.add('is-down');set(e)},{passive:true});
  el.addEventListener('pointermove',e=>{if(el.classList.contains('is-down'))set(e)},{passive:true});
  ['pointerup','pointercancel','pointerleave'].forEach(n=>el.addEventListener(n,off,{passive:true}));
}
$$('#poSmartInvite,#installPanel,.card.glass,.formcard').forEach(bindPress);

function flyIn(els,opt={}){
  if(reduce)return;
  const dirX=opt.dirX||0;
  els.filter(Boolean).forEach((el,i)=>{
    el.animate([
      {opacity:0,transform:`perspective(900px) translate3d(${dirX*70}px,46px,-260px) rotateX(24deg) rotateY(${dirX*-20}deg)`},
      {opacity:1,transform:'perspective(900px) translate3d(0,0,0) rotateX(0) rotateY(0)'}
    ],{duration:820,delay:(opt.delay||0)+i*70,easing:'cubic-bezier(.14,1,.3,1)',fill:'backwards'});
  });
}
const homeItems=()=>[$('#home .top'),$('#home .sub'),$('#hello'),$('#poSmartInvite'),$('#installPanel'),$('#pager')];
const sectionItems=sec=>[...sec.children].flatMap(c=>c.matches('.card')?[c]:[c]);
let tabIndex=0;
$$('nav button').forEach((b,i)=>b.addEventListener('click',e=>{
  if(i===tabIndex)return;
  const dir=i>tabIndex?1:-1;tabIndex=i;
  sweep(dir);
  const sec=$('#'+b.dataset.t);
  if(!sec)return;
  if(b.dataset.t==='home'){flyIn(homeItems(),{dirX:dir});deckApi.refresh();deckApi.enter()}
  else flyIn(sectionItems(sec),{dirX:dir});
}));

// QR opens as a portal growing from the button
const modal=$('#modal'),qrb=$('#qrbtn');
if(modal&&qrb&&!reduce)qrb.addEventListener('click',()=>{
  const r=qrb.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  modal.animate([{clipPath:`circle(0px at ${x}px ${y}px)`},{clipPath:`circle(150vmax at ${x}px ${y}px)`}],{duration:640,easing:'cubic-bezier(.3,.8,.2,1)'});
});

/* ================= START ================= */
function appVisible(){document.body.classList.add('ready');deckApi.refresh();
  if(!$('#home').hidden){flyIn(homeItems(),{delay:60});deckApi.enter()}
  else{const reg=$('#reg');if(reg&&!reg.hidden)flyIn(sectionItems(reg),{delay:60})}
}
if(document.getElementById('intro')&&!reduce)deckApi.hide&&deckApi.hide();
playIntro(appVisible,()=>{fxWanted=true;fx.start()});
})();
