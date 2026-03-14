/* empty css             */(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))r(t);new MutationObserver(t=>{for(const a of t)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function o(t){const a={};return t.integrity&&(a.integrity=t.integrity),t.referrerPolicy&&(a.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?a.credentials="include":t.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(t){if(t.ep)return;t.ep=!0;const a=o(t);fetch(t.href,a)}})();function I(){const n=document.getElementById("nav"),e=document.getElementById("navToggle"),o=document.getElementById("navMobile"),r=document.querySelectorAll(".nav__links a"),t=document.querySelectorAll("section[id]"),a=new IntersectionObserver(([i])=>{n.classList.toggle("scrolled",!i.isIntersecting)},{threshold:.1}),s=document.getElementById("hero");s&&a.observe(s),e==null||e.addEventListener("click",()=>{const i=e.classList.toggle("open");o.classList.toggle("open",i),e.setAttribute("aria-label",i?"Menü schließen":"Menü öffnen"),document.body.style.overflow=i?"hidden":""}),document.querySelectorAll(".nav__mobile-link, .nav__mobile .nav__cta").forEach(i=>{i.addEventListener("click",()=>{e.classList.remove("open"),o.classList.remove("open"),document.body.style.overflow=""})});const m=new IntersectionObserver(i=>{i.forEach(d=>{d.isIntersecting&&r.forEach(l=>{l.classList.toggle("active",l.getAttribute("href")===`#${d.target.id}`)})})},{rootMargin:"-40% 0px -55% 0px"});t.forEach(i=>m.observe(i)),document.querySelectorAll('a[href^="#"]').forEach(i=>{i.addEventListener("click",d=>{const l=document.querySelector(i.getAttribute("href"));if(!l)return;d.preventDefault();const u=n.offsetHeight+16,p=l.getBoundingClientRect().top+window.scrollY-u;window.scrollTo({top:p,behavior:"smooth"})})})}function A(){const n=document.querySelectorAll(".reveal, .reveal-fade, .quote-reveal");if(!n.length)return;const e=new IntersectionObserver(o=>{o.forEach(r=>{r.isIntersecting&&(r.target.classList.add("visible"),e.unobserve(r.target))})},{threshold:.12,rootMargin:"0px 0px -40px 0px"});n.forEach(o=>e.observe(o))}function L(){const n=document.getElementById("hero-canvas");if(!n)return;const e=n.getContext("2d");if(!e)return;let o,r,t,a;const s=72,m=140,i="rgba(232,168,56,",d="rgba(58,124,165,";function l(){o=n.width=n.offsetWidth,r=n.height=n.offsetHeight}class u{constructor(){this.reset(!0)}reset(h=!1){this.x=Math.random()*o,this.y=h?Math.random()*r:Math.random()>.5?-10:r+10,this.vx=(Math.random()-.5)*.4,this.vy=(Math.random()-.5)*.4,this.r=Math.random()*1.8+.8,this.amber=Math.random()>.6,this.alpha=Math.random()*.5+.3}update(){this.x+=this.vx,this.y+=this.vy,(this.x<-20||this.x>o+20||this.y<-20||this.y>r+20)&&this.reset()}draw(){e.beginPath(),e.arc(this.x,this.y,this.r,0,Math.PI*2),e.fillStyle=this.amber?i+this.alpha+")":d+this.alpha+")",e.fill()}}function p(){l(),t=Array.from({length:s},()=>new u)}function b(){for(let c=0;c<t.length;c++)for(let h=c+1;h<t.length;h++){const f=t[c],g=t[h],v=f.x-g.x,x=f.y-g.y,w=Math.sqrt(v*v+x*x);if(w<m){const E=(1-w/m)*.12;e.beginPath(),e.moveTo(f.x,f.y),e.lineTo(g.x,g.y),e.strokeStyle=i+E+")",e.lineWidth=.6,e.stroke()}}}function y(){e.clearRect(0,0,o,r),b(),t.forEach(c=>{c.update(),c.draw()}),a=requestAnimationFrame(y)}p(),y(),new ResizeObserver(()=>{cancelAnimationFrame(a),l(),t.forEach(c=>c.reset(!0)),y()}).observe(n),window.matchMedia("(prefers-reduced-motion: reduce)").matches&&(cancelAnimationFrame(a),e.clearRect(0,0,o,r),t.forEach(c=>c.draw()))}function M(){const n=document.querySelectorAll(".counter__value[data-target]");if(!n.length)return;function e(t){return 1-Math.pow(1-t,3)}function o(t){const a=parseInt(t.dataset.target,10),s=t.dataset.suffix||"",m=1400,i=performance.now();function d(l){const u=l-i,p=Math.min(u/m,1),b=Math.round(e(p)*a);t.textContent=b+s,p<1&&requestAnimationFrame(d)}requestAnimationFrame(d)}const r=new IntersectionObserver(t=>{t.forEach(a=>{a.isIntersecting&&(o(a.target),r.unobserve(a.target))})},{threshold:.5});n.forEach(t=>r.observe(t))}function k(){document.querySelectorAll(".service-card__toggle").forEach(n=>{n.addEventListener("click",()=>{const e=n.getAttribute("aria-expanded")==="true",o=n.getAttribute("aria-controls"),r=document.getElementById(o);r&&(n.setAttribute("aria-expanded",String(!e)),r.classList.toggle("open",!e),n.childNodes[0].textContent=e?"Mehr erfahren":"Weniger anzeigen")})})}function C(){const n=document.getElementById("contactForm");if(!n)return;const e=document.getElementById("submitBtn"),o=document.getElementById("formSuccess");n.addEventListener("submit",async r=>{if(r.preventDefault(),!n.checkValidity()){n.reportValidity();return}e.classList.add("loading"),e.textContent="Wird gesendet...";try{const t=new FormData(n);if((await fetch(n.action,{method:"POST",body:t,headers:{Accept:"application/json"}})).ok)n.style.display="none",o.classList.add("visible"),o.textContent="✓ Vielen Dank! Ihre Nachricht wurde gesendet. Ich melde mich schnellstmöglich bei Ihnen.";else throw new Error("Serverfehler")}catch{e.classList.remove("loading"),e.innerHTML='Nachricht senden <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',alert("Es ist ein Fehler aufgetreten. Bitte senden Sie mir eine E-Mail direkt an henning.biebinger@t-online.de")}})}function O(){if(!document.getElementById("region-map")||typeof window.L>"u")return;const e=window.L,o=e.map("region-map",{center:[54.516,9.55],zoom:9,scrollWheelZoom:!1,dragging:!1,zoomControl:!1,doubleClickZoom:!1,touchZoom:!1,keyboard:!1,attributionControl:!0});e.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',maxZoom:14}).addTo(o);const r=e.divIcon({className:"map-marker-amber",html:`
      <div class="map-pulse-wrap">
        <span class="map-pulse-ring"></span>
        <span class="map-pulse-dot"></span>
      </div>
    `,iconSize:[24,24],iconAnchor:[12,12]}),t=e.divIcon({className:"map-marker-city",html:'<span class="map-city-dot"></span>',iconSize:[8,8],iconAnchor:[4,4]});if(e.marker([54.516,9.55],{icon:r}).bindTooltip("<strong>Schleswig</strong><br>Ihr Energieberater vor Ort",{permanent:!1,direction:"top",offset:[0,-14],className:"map-tooltip"}).addTo(o),[{name:"Flensburg",lat:54.793,lng:9.437},{name:"Kiel",lat:54.323,lng:10.122},{name:"Husum",lat:54.483,lng:9.05},{name:"Rendsburg",lat:54.303,lng:9.663},{name:"Neumünster",lat:54.073,lng:9.981},{name:"Lübeck",lat:53.866,lng:10.686},{name:"Heide",lat:54.196,lng:9.095}].forEach(s=>{e.marker([s.lat,s.lng],{icon:t}).bindTooltip(s.name,{permanent:!1,direction:"top",offset:[0,-6],className:"map-tooltip"}).addTo(o)}),!document.getElementById("map-styles")){const s=document.createElement("style");s.id="map-styles",s.textContent=`
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
    `,document.head.appendChild(s)}}document.addEventListener("DOMContentLoaded",()=>{I(),A(),L(),M(),k(),C()});window.addEventListener("load",O);
