/* ===========================================
   DETTAGLIO PROGETTO INTERATTIVO
   ProjectView.open(indice, { rect, onClose })
   - rect: da dove parte l'immagine (DOMRect o {left,top,width,height})
   Interazioni dentro:
   1. l'immagine si espande dalla card a tutto schermo
   2. titolo a lettere che reagiscono al mouse
   3. immagine che si inclina e ha una luce che segue il cursore
   4. scrollando l'immagine si "ritira" come una card
   5. il testo si accende parola per parola mentre scorri
   6. tag trascinabili che tornano al loro posto con un elastico
   7. interruttore Desktop / Mobile: lo schermo si trasforma
   8. "tieni premuto" per aprire il progetto successivo
=========================================== */

(function () {
    const P = window.PROJECTS;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = "cubic-bezier(.7,0,.2,1)";
    const easeOut = "cubic-bezier(.16,1,.3,1)";
    const pad = function (n) { return String(n).padStart(2, "0"); };

    let root, current = 0, onClose = null, isOpen = false;
    let mouseX = -9999, mouseY = -9999, titleHover = false;

    function build() {
        root = document.createElement("div");
        root.className = "pv";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.innerHTML =
            '<span class="pv-counter"></span>' +
            '<button class="pv-close" type="button" aria-label="Chiudi">✕</button>' +
            '<section class="pv-hero">' +
                '<div class="pv-hero-media"><img alt=""><span class="pv-spot"></span>' +
                    '<div class="pv-title-wrap"><span class="pv-type"></span><h2 class="pv-title"></h2></div>' +
                    '<span class="pv-scrollcue">Scorri ↓</span>' +
                '</div>' +
            '</section>' +
            '<div class="pv-body">' +
                '<p class="pv-intro"></p>' +
                '<div class="pv-grid">' +
                    '<div><h4>Ruolo</h4><p class="pv-role">Design · Sviluppo front-end</p></div>' +
                    '<div><h4>Stack <em style="text-transform:none;opacity:.6">(trascinali)</em></h4><div class="pv-tags"></div></div>' +
                    '<div><h4>Link</h4><div class="pv-links"></div></div>' +
                '</div>' +
                '<section class="pv-devices">' +
                    '<div class="pv-devices-head"><h3>Su ogni<br>schermo.</h3>' +
                        '<div class="pv-switch"><span class="pill"></span><button type="button" class="on" data-d="desktop">Desktop</button><button type="button" data-d="mobile">Mobile</button></div>' +
                    '</div>' +
                    '<div class="pv-stage"><div class="pv-device"><div class="pv-screen"><img class="d" alt=""><img class="m hide" alt=""></div></div></div>' +
                    '<p class="pv-stage-hint">Muovi il mouse sul dispositivo</p>' +
                '</section>' +
                '<section class="pv-next">' +
                    '<img class="pv-next-bg" alt="">' +
                    '<div class="pv-next-inner"><small>Prossimo progetto</small><h3></h3>' +
                        '<div class="pv-hold"><svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="57"/><circle class="fill" cx="60" cy="60" r="57"/></svg><span>Tieni<br>premuto</span></div>' +
                    '</div>' +
                '</section>' +
            '</div>';
        document.body.appendChild(root);

        const wipe = document.createElement("div");
        wipe.className = "pv-wipe";
        document.body.appendChild(wipe);

        root.querySelector(".pv-close").addEventListener("click", close);
        addEventListener("keydown", function (e) {
            if (!isOpen) return;
            if (e.key === "Escape") close();
            if (e.key === "ArrowRight") goTo(current + 1);
            if (e.key === "ArrowLeft") goTo(current - 1);
        });

        bindScroll();
        bindHero();
        bindTitle();
        bindSwitch();
        bindStage();
        bindHold();
    }

    /* ---------- CONTENUTO ---------- */
    function render(i) {
        current = (i + P.length) % P.length;
        const p = P[current];
        const next = P[(current + 1) % P.length];

        root.querySelector(".pv-counter").textContent = pad(current + 1) + " / " + pad(P.length);
        root.querySelector(".pv-hero-media img").src = p.img;
        root.querySelector(".pv-type").textContent = p.type;

        /* Titolo spezzato in lettere (parole tenute insieme) */
        root.querySelector(".pv-title").innerHTML = p.name.split(" ").map(function (w) {
            return '<span class="w">' + w.split("").map(function (c) {
                return '<span class="m"><span class="c">' + c + "</span></span>";
            }).join("") + "</span>";
        }).join("");

        /* Testo: ogni parola diventa uno span che si accende */
        const pinkWords = /^(scroll|three\.js|gsap|3d|redesign|ai|immersiva|interattive|figma|usabilità)/i;
        root.querySelector(".pv-intro").innerHTML = p.text[0].split(" ").map(function (w) {
            return '<span class="word' + (pinkWords.test(w) ? " pink" : "") + '">' + w + "</span>";
        }).join(" ");

        root.querySelector(".pv-tags").innerHTML = p.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("");
        bindTags();

        root.querySelector(".pv-links").innerHTML = p.links.length
            ? p.links.map(function (l) { return '<a href="' + l.href + '" target="_blank" rel="noopener">' + l.label + "</a>"; }).join("")
            : "<em>Online a breve</em>";

        root.querySelector(".pv-screen .d").src = p.img;
        root.querySelector(".pv-screen .m").src = p.mobile;
        setDevice("desktop");

        root.querySelector(".pv-next-bg").src = next.img;
        root.querySelector(".pv-next h3").textContent = next.name;

        root.scrollTop = 0;
        onScroll();
    }

    function revealTitle(delay) {
        root.querySelectorAll(".pv-title .c").forEach(function (c, i) {
            c.animate([{ transform: "translateY(105%)" }, { transform: "translateY(0)" }],
                { duration: reduced ? 1 : 900, delay: delay + i * 28, easing: easeOut, fill: "forwards" });
        });
    }

    /* ---------- APERTURA / CHIUSURA ---------- */
    function open(i, opts) {
        opts = opts || {};
        if (!root) build();
        onClose = opts.onClose || null;
        render(i);
        isOpen = true;
        document.documentElement.style.overflow = "hidden";

        const r = opts.rect;
        if (!r || reduced) {
            root.classList.add("open");
            root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
            revealTitle(150);
            return;
        }

        /* Clone dell'immagine che vola dalla card a tutto schermo */
        const ghost = document.createElement("img");
        ghost.src = P[current].img;
        Object.assign(ghost.style, {
            position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px",
            objectFit: "cover", objectPosition: "top", zIndex: 510, borderRadius: "14px", pointerEvents: "none"
        });
        document.body.appendChild(ghost);
        const sx = innerWidth / r.width, sy = innerHeight / r.height;
        ghost.style.transformOrigin = "0 0";
        ghost.animate([
            { transform: "none", borderRadius: "14px" },
            { transform: "translate(" + (-r.left) + "px," + (-r.top) + "px) scale(" + sx + "," + sy + ")", borderRadius: "0px" }
        ], { duration: 950, easing: ease, fill: "forwards" }).onfinish = function () {
            root.classList.add("open");
            ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }).onfinish = function () { ghost.remove(); };
            revealTitle(0);
        };
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        root.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }],
            { duration: reduced ? 1 : 800, easing: ease }).onfinish = function () {
            root.classList.remove("open");
            document.documentElement.style.overflow = "";
            if (onClose) onClose(current);
        };
    }

    function goTo(i) {
        const wipe = document.querySelector(".pv-wipe");
        wipe.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 600, easing: ease, fill: "forwards" })
            .onfinish = function () {
                render(i);
                wipe.animate([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], { duration: 700, easing: ease, fill: "forwards" });
                revealTitle(250);
            };
    }

    /* ---------- SCROLL ---------- */
    function onScroll() {
        if (!root) return;
        const st = root.scrollTop;
        const p = Math.min(1, st / innerHeight);
        const media = root.querySelector(".pv-hero-media");
        media.style.setProperty("--p", p);
        media.style.transform = "scale(" + (1 - p * .12) + ")";
        media.style.borderRadius = (p * 36) + "px";
        media.querySelector("img").style.translate = "0 " + (p * 60) + "px";
        root.querySelector(".pv-scrollcue").style.opacity = 1 - p * 4;

        const limit = innerHeight * .78;
        root.querySelectorAll(".pv-intro .word").forEach(function (w) {
            w.classList.toggle("lit", w.getBoundingClientRect().top < limit);
        });
    }

    function bindScroll() {
        root.addEventListener("scroll", function () { requestAnimationFrame(onScroll); }, { passive: true });
    }

    /* ---------- HERO: inclinazione + luce ---------- */
    function bindHero() {
        const hero = root.querySelector(".pv-hero");
        const media = root.querySelector(".pv-hero-media");
        const img = media.querySelector("img");
        hero.addEventListener("pointermove", function (e) {
            const x = e.clientX / innerWidth, y = e.clientY / innerHeight;
            media.style.setProperty("--mx", (x * 100) + "%");
            media.style.setProperty("--my", (y * 100) + "%");
            if (reduced) return;
            img.style.transform = "translate(" + ((.5 - x) * 30) + "px," + ((.5 - y) * 20) + "px) scale(1.02)";
        });
        img.style.transition = "transform .8s cubic-bezier(.2,.8,.2,1)";
    }

    /* ---------- TITOLO: lettere che reagiscono ---------- */
    function bindTitle() {
        const title = root.querySelector(".pv-title");
        title.addEventListener("pointerenter", function () { titleHover = true; loop(); });
        title.addEventListener("pointerleave", function () {
            titleHover = false;
            title.querySelectorAll(".c").forEach(function (c) { c.style.fontVariationSettings = ""; c.style.color = ""; });
        });
        addEventListener("pointermove", function (e) { mouseX = e.clientX; mouseY = e.clientY; });

        function loop() {
            if (!titleHover) return;
            const chars = title.querySelectorAll(".c");
            const rects = Array.from(chars).map(function (c) { return c.getBoundingClientRect(); });
            chars.forEach(function (c, i) {
                const r = rects[i];
                const d = Math.hypot(mouseX - (r.left + r.width / 2), mouseY - (r.top + r.height / 2));
                const k = Math.max(0, 1 - d / 220);
                c.style.fontVariationSettings = '"wght" ' + Math.round(750 - k * 520) + ', "wdth" ' + (100 - k * 25).toFixed(1);
                c.style.color = k > .55 ? "#ff3d7f" : "";
            });
            requestAnimationFrame(loop);
        }
    }

    /* ---------- TAG TRASCINABILI ---------- */
    function bindTags() {
        root.querySelectorAll(".pv-tags span").forEach(function (tag) {
            let sx, sy, dx = 0, dy = 0, dragging = false;
            tag.addEventListener("pointerdown", function (e) {
                dragging = true; sx = e.clientX; sy = e.clientY;
                tag.setPointerCapture(e.pointerId);
                tag.classList.add("dragging");
                tag.getAnimations().forEach(function (a) { a.cancel(); });
            });
            tag.addEventListener("pointermove", function (e) {
                if (!dragging) return;
                dx = e.clientX - sx; dy = e.clientY - sy;
                tag.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + (dx * .08) + "deg)";
            });
            const release = function () {
                if (!dragging) return;
                dragging = false;
                tag.classList.remove("dragging");
                /* ritorno elastico */
                const from = "translate(" + dx + "px," + dy + "px) rotate(" + (dx * .08) + "deg)";
                tag.style.transform = "";
                tag.animate([
                    { transform: from },
                    { transform: "translate(" + (-dx * .18) + "px," + (-dy * .18) + "px) rotate(" + (-dx * .02) + "deg)", offset: .55 },
                    { transform: "translate(" + (dx * .06) + "px," + (dy * .06) + "px)", offset: .8 },
                    { transform: "none" }
                ], { duration: 900, easing: "cubic-bezier(.2,.7,.3,1)" });
            };
            tag.addEventListener("pointerup", release);
            tag.addEventListener("pointercancel", release);
        });
    }

    /* ---------- DESKTOP / MOBILE ---------- */
    function setDevice(d) {
        const device = root.querySelector(".pv-device");
        const sw = root.querySelector(".pv-switch");
        const pill = sw.querySelector(".pill");
        sw.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.d === d); });
        const on = sw.querySelector("button.on");
        pill.style.left = on.offsetLeft + "px";
        pill.style.width = on.offsetWidth + "px";
        device.classList.toggle("mobile", d === "mobile");
        root.querySelector(".pv-screen .d").classList.toggle("hide", d === "mobile");
        root.querySelector(".pv-screen .m").classList.toggle("hide", d !== "mobile");
    }

    function bindSwitch() {
        root.querySelectorAll(".pv-switch button").forEach(function (b) {
            b.addEventListener("click", function () { setDevice(b.dataset.d); });
        });
    }

    function bindStage() {
        const stage = root.querySelector(".pv-stage");
        const device = root.querySelector(".pv-device");
        const screen = root.querySelector(".pv-screen");
        stage.addEventListener("pointermove", function (e) {
            const r = stage.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            if (!reduced) device.style.transform = "rotateY(" + (x * 18) + "deg) rotateX(" + (-y * 14) + "deg)";
            /* lo screenshot scorre col mouse, come se navigassi la pagina */
            const img = screen.querySelector("img:not(.hide)");
            const extra = img.offsetHeight - screen.offsetHeight;
            if (extra > 0) img.style.transform = "translateY(" + (-(y + .5) * extra) + "px)";
        });
        stage.addEventListener("pointerleave", function () {
            device.style.transform = "";
            screen.querySelectorAll("img").forEach(function (i) { i.style.transform = ""; });
        });
        screen.querySelectorAll("img").forEach(function (i) { i.style.transition = "opacity .5s, transform 1.2s cubic-bezier(.2,.8,.2,1)"; });
    }

    /* ---------- TIENI PREMUTO PER IL PROSSIMO ---------- */
    function bindHold() {
        const zone = root.querySelector(".pv-next");
        const fill = root.querySelector(".pv-hold .fill");
        const C = 358, DURATION = 1100;
        let progress = 0, holding = false, last = 0, raf = 0;

        function tick(now) {
            const dt = now - last; last = now;
            progress += (holding ? dt / DURATION : -dt / 400);
            progress = Math.max(0, Math.min(1, progress));
            fill.style.strokeDashoffset = C * (1 - progress);
            zone.querySelector(".pv-next-bg").style.transform = "scale(" + (1.15 - progress * .15) + ")";
            if (progress >= 1) {
                holding = false; progress = 0;
                zone.classList.remove("holding");
                fill.style.strokeDashoffset = C;
                goTo(current + 1);
                return;
            }
            if (holding || progress > 0) raf = requestAnimationFrame(tick);
        }

        zone.addEventListener("pointerdown", function (e) {
            e.preventDefault();
            holding = true;
            zone.classList.add("holding");
            cancelAnimationFrame(raf);
            last = performance.now();
            raf = requestAnimationFrame(tick);
        });
        const stop = function () {
            if (!holding) return;
            holding = false;
            zone.classList.remove("holding");
        };
        zone.addEventListener("pointerup", stop);
        zone.addEventListener("pointerleave", stop);
        zone.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    }

    window.ProjectView = { open: open, close: close };
})();
