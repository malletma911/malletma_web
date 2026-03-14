/* empty css             */(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))r(t);new MutationObserver(t=>{for(const i of t)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function o(t){const i={};return t.integrity&&(i.integrity=t.integrity),t.referrerPolicy&&(i.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?i.credentials="include":t.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(t){if(t.ep)return;t.ep=!0;const i=o(t);fetch(t.href,i)}})();function L(){const n=document.getElementById("nav"),e=document.getElementById("navToggle"),o=document.getElementById("navMobile"),r=document.querySelectorAll(".nav__links a"),t=document.querySelectorAll("section[id]"),i=new IntersectionObserver(([a])=>{n.classList.toggle("scrolled",!a.isIntersecting)},{threshold:.1}),c=document.getElementById("hero");c&&i.observe(c),e==null||e.addEventListener("click",()=>{const a=e.classList.toggle("open");o.classList.toggle("open",a),e.setAttribute("aria-label",a?"Menü schließen":"Menü öffnen"),document.body.style.overflow=a?"hidden":""}),document.querySelectorAll(".nav__mobile-link, .nav__mobile .nav__cta").forEach(a=>{a.addEventListener("click",()=>{e.classList.remove("open"),o.classList.remove("open"),document.body.style.overflow=""})});const s=new IntersectionObserver(a=>{a.forEach(m=>{m.isIntersecting&&r.forEach(d=>{d.classList.toggle("active",d.getAttribute("href")===`#${m.target.id}`)})})},{rootMargin:"-40% 0px -55% 0px"});t.forEach(a=>s.observe(a)),document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener("click",m=>{const d=document.querySelector(a.getAttribute("href"));if(!d)return;m.preventDefault();const p=n.offsetHeight+16,u=d.getBoundingClientRect().top+window.scrollY-p;window.scrollTo({top:u,behavior:"smooth"})})})}function A(){const n=document.querySelectorAll(".reveal, .reveal-fade, .quote-reveal");if(!n.length)return;const e=new IntersectionObserver(o=>{o.forEach(r=>{r.isIntersecting&&(r.target.classList.add("visible"),e.unobserve(r.target))})},{threshold:.12,rootMargin:"0px 0px -40px 0px"});n.forEach(o=>e.observe(o))}function M(){const n=document.getElementById("hero-canvas");if(!n)return;const e=n.getContext("2d");if(!e)return;let o,r,t,i;const c=72,s=140,a="rgba(232,168,56,",m="rgba(58,124,165,";function d(){o=n.width=n.offsetWidth,r=n.height=n.offsetHeight}class p{constructor(){this.reset(!0)}reset(h=!1){this.x=Math.random()*o,this.y=h?Math.random()*r:Math.random()>.5?-10:r+10,this.vx=(Math.random()-.5)*.4,this.vy=(Math.random()-.5)*.4,this.r=Math.random()*1.8+.8,this.amber=Math.random()>.6,this.alpha=Math.random()*.5+.3}update(){this.x+=this.vx,this.y+=this.vy,(this.x<-20||this.x>o+20||this.y<-20||this.y>r+20)&&this.reset()}draw(){e.beginPath(),e.arc(this.x,this.y,this.r,0,Math.PI*2),e.fillStyle=this.amber?a+this.alpha+")":m+this.alpha+")",e.fill()}}function u(){d(),t=Array.from({length:c},()=>new p)}function b(){for(let l=0;l<t.length;l++)for(let h=l+1;h<t.length;h++){const f=t[l],g=t[h],y=f.x-g.x,x=f.y-g.y,w=Math.sqrt(y*y+x*x);if(w<s){const I=(1-w/s)*.12;e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),e.strokeStyle=a+I+")",e.lineWidth=.6,e.stroke()}}}function v(){e.clearRect(0,0,o,r),b(),t.forEach(l=>{l.update(),l.draw()}),i=requestAnimationFrame(v)}u(),v(),new ResizeObserver(()=>{cancelAnimationFrame(i),d(),t.forEach(l=>l.reset(!0)),v()}).observe(n),window.matchMedia("(prefers-reduced-motion: reduce)").matches&&(cancelAnimationFrame(i),e.clearRect(0,0,o,r),t.forEach(l=>l.draw()))}function k(){const n=document.querySelectorAll(".counter__value[data-target]");if(!n.length)return;function e(t){return 1-Math.pow(1-t,3)}function o(t){const i=parseInt(t.dataset.target,10),c=t.dataset.suffix||"",s=1400,a=performance.now();function m(d){const p=d-a,u=Math.min(p/s,1),b=Math.round(e(u)*i);t.textContent=b+c,u<1&&requestAnimationFrame(m)}requestAnimationFrame(m)}const r=new IntersectionObserver(t=>{t.forEach(i=>{i.isIntersecting&&(o(i.target),r.unobserve(i.target))})},{threshold:.5});n.forEach(t=>r.observe(t))}function S(){document.querySelectorAll(".service-card__toggle").forEach(n=>{n.addEventListener("click",()=>{const e=n.getAttribute("aria-expanded")==="true",o=n.getAttribute("aria-controls"),r=document.getElementById(o);r&&(n.setAttribute("aria-expanded",String(!e)),r.classList.toggle("open",!e),n.childNodes[0].textContent=e?"Mehr erfahren":"Weniger anzeigen")})})}function O(){const n=document.getElementById("contactForm");if(!n)return;const e=document.getElementById("submitBtn"),o=document.getElementById("formSuccess");n.addEventListener("submit",async r=>{if(r.preventDefault(),!n.checkValidity()){n.reportValidity();return}e.classList.add("loading"),e.textContent="Wird gesendet...";try{const t=new FormData(n);if((await fetch(n.action,{method:"POST",body:t,headers:{Accept:"application/json"}})).ok)n.style.display="none",o.classList.add("visible"),o.textContent="✓ Vielen Dank! Ihre Nachricht wurde gesendet. Ich melde mich schnellstmöglich bei Ihnen.";else throw new Error("Serverfehler")}catch{e.classList.remove("loading"),e.innerHTML='Nachricht senden <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',alert("Es ist ein Fehler aufgetreten. Bitte senden Sie mir eine E-Mail direkt an henning.biebinger@t-online.de")}})}function C(){if(document.getElementById("region-map")){if(typeof window.L>"u"){const e=setInterval(()=>{typeof window.L<"u"&&(clearInterval(e),E())},100);setTimeout(()=>clearInterval(e),1e4);return}E()}}function E(){const n=document.getElementById("region-map"),e=window.L,o=e.map("region-map",{center:[54.516,9.55],zoom:9,scrollWheelZoom:!1,dragging:!1,zoomControl:!1,doubleClickZoom:!1,touchZoom:!1,keyboard:!1,attributionControl:!0});e.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',maxZoom:14}).addTo(o);const r=e.divIcon({className:"map-marker-amber",html:`
      <div class="map-pulse-wrap">
        <span class="map-pulse-ring"></span>
        <span class="map-pulse-dot"></span>
      </div>
    `,iconSize:[24,24],iconAnchor:[12,12]}),t=e.divIcon({className:"map-marker-city",html:'<span class="map-city-dot"></span>',iconSize:[8,8],iconAnchor:[4,4]});e.marker([54.516,9.55],{icon:r}).bindTooltip("<strong>Schleswig</strong><br>Ihr Energieberater vor Ort",{permanent:!1,direction:"top",offset:[0,-14],className:"map-tooltip"}).addTo(o),[{name:"Flensburg",lat:54.793,lng:9.437},{name:"Kiel",lat:54.323,lng:10.122},{name:"Husum",lat:54.483,lng:9.05},{name:"Rendsburg",lat:54.303,lng:9.663},{name:"Neumünster",lat:54.073,lng:9.981},{name:"Lübeck",lat:53.866,lng:10.686},{name:"Heide",lat:54.196,lng:9.095}].forEach(s=>{e.marker([s.lat,s.lng],{icon:t}).bindTooltip(s.name,{permanent:!1,direction:"top",offset:[0,-6],className:"map-tooltip"}).addTo(o)});const c=n.closest(".reveal");if(c){const s=new MutationObserver(()=>{c.classList.contains("visible")&&(setTimeout(()=>o.invalidateSize(),100),s.disconnect())});s.observe(c,{attributes:!0,attributeFilter:["class"]}),c.classList.contains("visible")&&setTimeout(()=>o.invalidateSize(),100)}if(!document.getElementById("map-styles")){const s=document.createElement("style");s.id="map-styles",s.textContent=`
      .map-pulse-wrap {
        position: relative;
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
      }
      .map-pulse-ring {
        position: absolute;
        width: 24px; height: 24px;
        border-radius: 50%;
        background: rgba(232,168,56,0.15);
        border: 1.5px solid #E8A838;
        animation: mapPulse 2.2s ease-out infinite;
      }
      .map-pulse-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #E8A838;
        box-shadow: 0 0 10px rgba(232,168,56,0.8);
        position: relative; z-index: 1;
      }
      .map-city-dot {
        display: block;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #3A7CA5;
        border: 1px solid rgba(255,255,255,0.25);
        box-shadow: 0 0 5px rgba(58,124,165,0.6);
      }
      @keyframes mapPulse {
        0%   { transform: scale(1);   opacity: 0.9; }
        70%  { transform: scale(2.8); opacity: 0; }
        100% { transform: scale(2.8); opacity: 0; }
      }
      .map-tooltip {
        background: rgba(12,20,30,0.95) !important;
        border: 1px solid rgba(232,168,56,0.3) !important;
        color: #F2F0EB !important;
        font-family: Inter, sans-serif !important;
        font-size: 12px !important;
        border-radius: 8px !important;
        padding: 5px 12px !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        white-space: nowrap !important;
        line-height: 1.5 !important;
      }
      .map-tooltip::before { display: none !important; }
      .leaflet-attribution-flag { display: none !important; }
      .leaflet-control-attribution {
        background: rgba(10,18,26,0.8) !important;
        color: #3a4a5a !important;
        font-size: 9px !important;
        border-radius: 4px 0 0 0 !important;
      }
      .leaflet-control-attribution a { color: #3A7CA5 !important; }
    `,document.head.appendChild(s)}}document.addEventListener("DOMContentLoaded",()=>{L(),A(),M(),k(),S(),O()});window.addEventListener("load",C);
