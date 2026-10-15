import"./modulepreload-polyfill-B5Qt9EMX.js";import{i as B,e as p,g as P,s as q,a as z,o as T}from"./lab-IwAoJHq5.js";const v={calm:{bez:[.2,.8,.2,1],ms:320,label:"Calm"},snappy:{bez:[.7,0,.2,1],ms:220,label:"Snappy"},springy:{bez:[.34,1.56,.64,1],ms:420,label:"Springy"},linear:{bez:[0,0,1,1],ms:300,label:"Linear"}},t={bez:[...v.calm.bez],ms:v.calm.ms,lift:10,scale:1.02,shadow:.18,preset:"calm"};B&&document.querySelectorAll("[data-hide-embed]").forEach(e=>e.remove());const H=document.getElementById("preview"),$=280,u=280,i=40,l=e=>i+e*($-i*2),c=e=>u-i-e*(u-i*2),R=(e,n)=>[(e-i)/($-i*2),(u-i-n)/(u-i*2)],Y="http://www.w3.org/2000/svg",f=document.createElementNS(Y,"svg");f.setAttribute("viewBox",`0 0 ${$} ${u}`);f.setAttribute("class","curve");f.setAttribute("aria-label","Easing curve editor — drag the two handles");f.innerHTML=`
  <rect x="${i}" y="${i}" width="${$-i*2}" height="${u-i*2}" class="box"/>
  <line x1="${l(0)}" y1="${c(0)}" x2="${l(1)}" y2="${c(1)}" class="diag"/>
  <line class="arm a1"/><line class="arm a2"/>
  <path class="bez"/>
  <circle class="dot" r="5"/>
  <circle class="h h1" r="9" tabindex="0"/><circle class="h h2" r="9" tabindex="0"/>
  <text x="${i}" y="${u-14}" class="lbl">time →</text>
  <text x="12" y="${i+4}" class="lbl" transform="rotate(-90 12 ${i+4})">progress →</text>`;const m=e=>f.querySelector(e),k=p("div",{class:"stage"}),d=p("div",{class:"card",tabindex:"0"},p("div",{class:"card-media"}),p("div",{class:"card-meta"},p("b",{},"Hover me"),p("span",{},"or watch it replay")));k.append(d);H.append(p("div",{class:"pair"},f,k));function j(){const[e,n,r,a]=t.bez;m(".bez").setAttribute("d",`M${l(0)} ${c(0)} C${l(e)} ${c(n)} ${l(r)} ${c(a)} ${l(1)} ${c(1)}`);const s=m(".a1"),o=m(".a2");s.setAttribute("x1",String(l(0))),s.setAttribute("y1",String(c(0))),s.setAttribute("x2",String(l(e))),s.setAttribute("y2",String(c(n))),o.setAttribute("x1",String(l(1))),o.setAttribute("y1",String(c(1))),o.setAttribute("x2",String(l(r))),o.setAttribute("y2",String(c(a))),m(".h1").setAttribute("cx",String(l(e))),m(".h1").setAttribute("cy",String(c(n))),m(".h2").setAttribute("cx",String(l(r))),m(".h2").setAttribute("cy",String(c(a)))}for(const[e,n]of[[".h1",0],[".h2",2]]){const r=m(e);r.addEventListener("pointerdown",a=>{r.setPointerCapture(a.pointerId);const s=g=>{const x=f.getBoundingClientRect(),[F,D]=R((g.clientX-x.left)/x.width*$,(g.clientY-x.top)/x.height*u);t.bez[n]=A(S(F,0,1)),t.bez[n+1]=A(S(D,-.5,1.6)),t.preset="custom",I.set("custom"),b()},o=()=>{r.removeEventListener("pointermove",s),r.removeEventListener("pointerup",o)};r.addEventListener("pointermove",s),r.addEventListener("pointerup",o)}),r.addEventListener("keydown",a=>{const s=a.shiftKey?.1:.02,o={ArrowLeft:[-s,0],ArrowRight:[s,0],ArrowUp:[0,s],ArrowDown:[0,-s]}[a.key];o&&(a.preventDefault(),t.bez[n]=A(S(t.bez[n]+o[0],0,1)),t.bez[n+1]=A(S(t.bez[n+1]+o[1],-.5,1.6)),b())})}let C=!1;const y=e=>{C=e,d.classList.toggle("lifted",e),N()};d.addEventListener("pointerenter",()=>{L=!0,y(!0)});d.addEventListener("pointerleave",()=>{L=!1,y(!1)});d.addEventListener("focus",()=>y(!0));d.addEventListener("blur",()=>y(!1));let L=!1;window.setInterval(()=>{L||y(!C)},1400);let E=0;function N(){cancelAnimationFrame(E);const e=performance.now(),n=m(".dot"),r=a=>{const s=Math.min(1,(a-e)/t.ms),[o,g]=U(t.bez,s);n.setAttribute("cx",String(l(o))),n.setAttribute("cy",String(c(g))),s<1&&(E=requestAnimationFrame(r))};E=requestAnimationFrame(r)}function U([e,n,r,a],s){const o=1-s;return[3*o*o*s*e+3*o*s*s*r+s*s*s,3*o*o*s*n+3*o*s*s*a+s*s*s]}const h=document.getElementById("params");h.append(P("Feel"));const I=q({options:[...Object.entries(v).map(([e,n])=>({value:e,label:n.label})),{value:"custom",label:"Custom"}],value:t.preset,onChange:e=>{e!=="custom"&&(t.preset=e,t.bez=[...v[e].bez],t.ms=v[e].ms,M.set(t.ms),b())}});h.append(I.root);const M=z({label:"Duration",min:80,max:900,step:10,value:t.ms,format:e=>`${e} ms`,onInput:e=>{t.ms=e,b()}});h.append(M.root);h.append(P("Motion"));h.append(z({label:"Lift",min:0,max:28,step:1,value:t.lift,format:e=>`${e} px`,onInput:e=>{t.lift=e,b()}}).root);h.append(z({label:"Scale",min:1,max:1.08,step:.005,value:t.scale,format:e=>e.toFixed(3),onInput:e=>{t.scale=e,b()}}).root);h.append(z({label:"Shadow",min:0,max:.4,step:.01,value:t.shadow,format:e=>e.toFixed(2),onInput:e=>{t.shadow=e,b()}}).root);h.append(p("p",{class:"hint"},"Drag the two handles on the curve. Arrow keys nudge a focused handle; Shift for bigger steps."));const w=T(document.getElementById("output"),[{id:"css",label:"CSS",filename:"hover.css"},{id:"motion",label:"motion/react",filename:"hover-motion.ts"},{id:"tokens",label:"tokens.json",filename:"motion-tokens.json"},{id:"prompt",label:"Prompt",filename:"hover-prompt.md"}]);function b(){const[e,n,r,a]=t.bez,s=`cubic-bezier(${e}, ${n}, ${r}, ${a})`,o=`0 ${Math.round(t.lift*1.6)}px ${Math.round(t.lift*3)}px rgba(14, 14, 14, ${t.shadow.toFixed(2)})`;d.style.setProperty("--dur",`${t.ms}ms`),d.style.setProperty("--ease",s),d.style.setProperty("--lift",`${-t.lift}px`),d.style.setProperty("--scale",String(t.scale)),d.style.setProperty("--shadow",o),j(),w.set("css",`.card {
  transition:
    transform ${t.ms}ms ${s},
    box-shadow ${t.ms}ms ${s};
}
.card:hover,
.card:focus-visible {
  transform: translateY(${-t.lift}px) scale(${t.scale});
  box-shadow: ${o};
}
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
}`),w.set("motion",`// motion/react
export const hoverLift = {
  rest:  { y: 0, scale: 1, boxShadow: "0 0 0 rgba(14,14,14,0)" },
  hover: { y: ${-t.lift}, scale: ${t.scale}, boxShadow: "${o}" },
};
export const hoverTransition = {
  duration: ${(t.ms/1e3).toFixed(3)},
  ease: [${e}, ${n}, ${r}, ${a}],
};

// <motion.div variants={hoverLift} initial="rest" whileHover="hover" transition={hoverTransition} />`),w.set("tokens",JSON.stringify({motion:{hover:{duration:{$type:"duration",$value:`${t.ms}ms`},easing:{$type:"cubicBezier",$value:[e,n,r,a]},lift:{$type:"dimension",$value:`${t.lift}px`},scale:{$type:"number",$value:t.scale}}}},null,2)),w.set("prompt",`Update the hover interaction on cards. Use these exact values — they were tuned by eye in a lab, don't round them:

- duration: ${t.ms}ms
- easing: ${s}${n>1||a>1?"  (intentional overshoot — keep it)":""}
- on hover / focus-visible: translateY(${-t.lift}px) scale(${t.scale})
- shadow on hover: ${o}
- animate transform and box-shadow only (no layout properties)
- respect prefers-reduced-motion: no transition

Apply it to every card component that is clickable. Don't change anything else.`)}function S(e,n,r){return Math.max(n,Math.min(r,e))}function A(e){return Math.round(e*100)/100}b();
