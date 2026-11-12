/* Elementi comuni delle demo: lista dei progetti + effetto scia */

window.PROJECTS = [
    { src: "../images/josmash.jpg", name: "JoSmash", tag: "Redesign · GSAP" },
    { src: "../images/new-connection.jpg", name: "New Connection", tag: "Three.js" },
    { src: "../images/volta-gym.jpg", name: "VOLTA", tag: "Immersive · Motion" },
    { src: "../images/creationweb.png", name: "CreationWeb", tag: "Sito web" },
    { src: "../projects/ecomedica/assets/ecomedica.png", name: "Ecomedica", tag: "Redesign" },
    { src: "../images/poste-italiane.png", name: "Poste Italiane", tag: "Redesign" },
    { src: "../images/across-the-map.png", name: "Across the Map", tag: "Web app" },
    { src: "../images/aurea-desktop.jpg", name: "Aurea", tag: "AI & Luxury" }
];

window.REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Precarica le immagini, così la scia non "lampeggia" */
window.PROJECTS.forEach(function (p) { new Image().src = p.src; });


/* ==========================================
   SCIA DI PROGETTI
   area: elemento su cui si muove il mouse
   ogni ~90px di movimento compare uno screenshot
========================================== */
window.initTrail = function (area, options) {
    options = options || {};
    const gap = options.gap || 90;
    const max = options.max || 9;
    const layer = document.createElement("div");
    layer.className = "trail-layer";
    layer.setAttribute("aria-hidden", "true");
    area.appendChild(layer);

    let lastX = null, lastY = null, index = 0, zTop = 1;
    const alive = [];

    function spawn(x, y, dx, dy) {
        const p = PROJECTS[index++ % PROJECTS.length];
        const el = document.createElement("figure");
        el.className = "trail-item";
        el.innerHTML = '<img src="' + p.src + '" alt=""><figcaption>' + p.name + "</figcaption>";
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.zIndex = zTop++;
        layer.appendChild(el);
        alive.push(el);

        const rot = (Math.random() * 14 - 7);
        const drift = Math.max(-40, Math.min(40, dx * .6));
        const driftY = Math.max(-40, Math.min(40, dy * .6));

        el.animate([
            { transform: "translate(-50%,-50%) translate(" + (-drift) + "px," + (-driftY) + "px) scale(.4) rotate(" + (rot * 2) + "deg)", opacity: 0 },
            { transform: "translate(-50%,-50%) scale(1) rotate(" + rot + "deg)", opacity: 1 }
        ], { duration: 520, easing: "cubic-bezier(.2,.9,.25,1.15)", fill: "forwards" });

        const out = el.animate([
            { transform: "translate(-50%,-50%) scale(1) rotate(" + rot + "deg)", opacity: 1 },
            { transform: "translate(-50%,-50%) translateY(60px) scale(.7) rotate(" + (rot * 1.6) + "deg)", opacity: 0 }
        ], { duration: 650, delay: 900, easing: "cubic-bezier(.6,0,.8,.4)", fill: "forwards" });

        out.onfinish = remove;

        function remove() {
            const i = alive.indexOf(el);
            if (i > -1) alive.splice(i, 1);
            el.remove();
        }

        if (alive.length > max) {
            const old = alive.shift();
            old.getAnimations().forEach(function (a) { a.cancel(); });
            old.remove();
        }
    }

    area.addEventListener("pointermove", function (e) {
        const r = area.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (lastX === null) { lastX = x; lastY = y; return; }
        const dx = x - lastX, dy = y - lastY;
        if (Math.hypot(dx, dy) > gap) {
            spawn(x, y, dx, dy);
            lastX = x; lastY = y;
        }
    });

    area.addEventListener("pointerleave", function () { lastX = null; });

    /* Su mobile / senza mouse: un tocco = uno screenshot */
    area.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse") return;
        const r = area.getBoundingClientRect();
        spawn(e.clientX - r.left, e.clientY - r.top, 0, 0);
    });

    /* Autoplay leggero finché l'utente non muove il mouse:
       così l'effetto si vede anche senza interazione */
    if (options.autoplay && !REDUCED_MOTION) {
        let t = 0, stopped = false;
        const stop = function () { stopped = true; };
        area.addEventListener("pointermove", stop, { once: true });
        area.addEventListener("pointerdown", stop, { once: true });
        (function tick() {
            if (stopped) return;
            t += 1;
            const r = area.getBoundingClientRect();
            const a = t * .5;
            const x = r.width / 2 + Math.cos(a) * r.width * .3;
            const y = r.height / 2 + Math.sin(a * 1.3) * r.height * .22;
            spawn(x, y, Math.cos(a) * 30, Math.sin(a) * 30);
            setTimeout(tick, 260);
        })();
    }
};
