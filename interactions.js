/* ==========================================================
   INTERAZIONI DEL SITO
   ----------------------------------------------------------
   1. Cursore personalizzato (solo con il mouse)
   2. Pulsanti "magnetici" che seguono il cursore
   3. Titoli che salgono parola per parola
   4. Etichette in stile codice che si "decodificano"
   5. Luce che segue il mouse sulle competenze
   6. Foto profilo che si inclina in 3D
   7. Parallasse delle immagini allo scroll
   8. Linea del percorso che si riempie scorrendo
   9. Nastro rosa che accelera e si inclina con lo scroll
   10. Scia di immagini dei progetti nella sezione Contatti
========================================================== */

(function () {

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    ).matches;

    const lerp = function (a, b, t) {
        return a + (b - a) * t;
    };

    const clamp = function (v, min, max) {
        return Math.max(min, Math.min(max, v));
    };


    /* ==========================================
       1. CURSORE PERSONALIZZATO
    ========================================== */

    const cursor = document.querySelector(".cursor");

    const pointer = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };

    if (cursor && finePointer && !reducedMotion) {

        document.documentElement.classList.add("has-cursor");

        const dot = cursor.querySelector(".cursor-dot");
        const ringEl = cursor.querySelector(".cursor-ring");
        const label = cursor.querySelector(".cursor-label");

        function updateCursorState(el) {

            if (!el) return;

            const card = el.closest && el.closest(".gh-card");
            const stage = el.closest && el.closest(".gh-stage");
            const shot = el.closest && el.closest(".pd-shot");
            const link = el.closest && el.closest("a, button");

            cursor.classList.remove("is-link", "is-label");

            if (card && card.classList.contains("is-center")) {
                cursor.classList.add("is-label");
                label.textContent = "Apri";
            } else if (stage) {
                cursor.classList.add("is-label");
                label.textContent = "Trascina";
            } else if (shot) {
                cursor.classList.add("is-label");
                const visit = shot.closest(".pd-item").querySelector(".project-links a");
                label.textContent = visit ? "Guarda" : "Preview";
            } else if (link) {
                cursor.classList.add("is-link");
            }
        }

        window.addEventListener("pointermove", function (event) {

            pointer.x = event.clientX;
            pointer.y = event.clientY;

            dot.style.transform =
                `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;

            updateCursorState(event.target);
        });

        // Mentre si scorre, sotto il cursore cambiano gli elementi
        window.addEventListener("scroll", function () {
            updateCursorState(document.elementFromPoint(pointer.x, pointer.y));
        }, { passive: true });

        document.addEventListener("pointerleave", function () {
            cursor.classList.add("is-hidden");
        });

        document.addEventListener("pointerenter", function () {
            cursor.classList.remove("is-hidden");
        });

        // Lo screenshot nel dettaglio apre il sito, se c'è un link
        document.addEventListener("click", function (event) {

            const shot = event.target.closest && event.target.closest(".pd-shot");

            if (!shot) return;

            const visit = shot.closest(".pd-item").querySelector(".project-links a");

            if (visit) window.open(visit.href, "_blank", "noopener");
        });

        (function loop() {

            ring.x = lerp(ring.x, pointer.x, 0.18);
            ring.y = lerp(ring.y, pointer.y, 0.18);

            ringEl.style.transform =
                `translate3d(${ring.x.toFixed(1)}px, ${ring.y.toFixed(1)}px, 0)`;

            requestAnimationFrame(loop);
        })();
    }


    /* ==========================================
       2. PULSANTI MAGNETICI
    ========================================== */

    if (finePointer && !reducedMotion) {

        const magnets = document.querySelectorAll(
            ".gh-enter, .gh-arrow, .gh-back, .pd-close, .nav-contact, .contact-mail, .github-card, .menu-toggle"
        );

        magnets.forEach(function (el) {

            el.classList.add("is-magnetic");

            const strength = el.classList.contains("github-card") ? 0.12 : 0.3;

            el.addEventListener("pointermove", function (event) {

                const r = el.getBoundingClientRect();

                const x = (event.clientX - (r.left + r.width / 2)) * strength;
                const y = (event.clientY - (r.top + r.height / 2)) * strength;

                el.style.setProperty("--mgx", x.toFixed(1) + "px");
                el.style.setProperty("--mgy", y.toFixed(1) + "px");
            });

            el.addEventListener("pointerleave", function () {
                el.style.setProperty("--mgx", "0px");
                el.style.setProperty("--mgy", "0px");
            });
        });
    }


    /* ==========================================
       3. TITOLI PAROLA PER PAROLA
    ========================================== */

    function splitWords(heading) {

        let i = 0;

        function wrap(node) {

            const word = document.createElement("span");
            word.className = "split-word";

            const inner = document.createElement("span");
            inner.style.setProperty("--i", i++);

            inner.appendChild(node);
            word.appendChild(inner);

            return word;
        }

        Array.from(heading.childNodes).forEach(function (node) {

            if (node.nodeType === Node.TEXT_NODE) {

                const parts = node.textContent.split(/(\s+)/);
                const fragment = document.createDocumentFragment();

                parts.forEach(function (part) {
                    if (!part) return;
                    if (/^\s+$/.test(part)) {
                        fragment.appendChild(document.createTextNode(" "));
                    } else {
                        fragment.appendChild(wrap(document.createTextNode(part)));
                    }
                });

                node.replaceWith(fragment);

            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {

                const placeholder = document.createComment("");
                node.replaceWith(placeholder);
                placeholder.replaceWith(wrap(node));
            }
        });

        heading.classList.add("is-split");
    }

    const headings = document.querySelectorAll(
        ".about-heading h2, .skills-aside h2, .experience-heading h2, .contact-inner h2, .languages h2"
    );

    if (!reducedMotion && "IntersectionObserver" in window) {

        headings.forEach(splitWords);

        const headingObserver = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-split-in");
                    headingObserver.unobserve(entry.target);
                }
            });

        }, { threshold: 0.3 });

        headings.forEach(function (h) {
            headingObserver.observe(h);
        });
    }

    // Anche il titolo del dettaglio progetto
    document.addEventListener("portfolio:detail", function () {

        if (reducedMotion) return;

        const item = document.querySelector(".pd-item:not([hidden]) .pd-title");

        if (!item) return;

        if (!item.classList.contains("is-split")) splitWords(item);

        item.classList.remove("is-split-in");
        void item.offsetWidth;

        requestAnimationFrame(function () {
            item.classList.add("is-split-in");
        });
    });


    /* ==========================================
       4. ETICHETTE CHE SI DECODIFICANO
    ========================================== */

    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·*";

    function scramble(el) {

        const original = el.dataset.text || el.textContent;

        el.dataset.text = original;

        let frame = 0;
        const total = 22;

        (function step() {

            const progress = frame / total;

            el.textContent = original.split("").map(function (ch, index) {

                if (ch === " " || index / original.length < progress) return ch;

                return glyphs[Math.floor(Math.random() * glyphs.length)];

            }).join("");

            frame++;

            if (frame <= total) {
                requestAnimationFrame(step);
            } else {
                el.textContent = original;
            }
        })();
    }

    if (!reducedMotion && "IntersectionObserver" in window) {

        const labels = document.querySelectorAll(".kicker, .timeline > h3");

        const labelObserver = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    scramble(entry.target);
                    labelObserver.unobserve(entry.target);
                }
            });

        }, { threshold: 1 });

        labels.forEach(function (el) {

            // Solo etichette di solo testo (niente icone dentro)
            if (el.children.length === 0) labelObserver.observe(el);

            if (finePointer) {
                el.addEventListener("pointerenter", function () {
                    if (el.children.length === 0) scramble(el);
                });
            }
        });
    }


    /* ==========================================
       5. COMPETENZE: luce che segue il mouse
    ========================================== */

    if (finePointer) {

        document.querySelectorAll(".skill-tile").forEach(function (tile) {

            tile.addEventListener("pointermove", function (event) {

                const r = tile.getBoundingClientRect();

                const x = event.clientX - r.left;
                const y = event.clientY - r.top;

                tile.style.setProperty("--mx", x + "px");
                tile.style.setProperty("--my", y + "px");

                if (!reducedMotion) {
                    tile.style.setProperty("--tx", ((x / r.width - 0.5) * 14).toFixed(1) + "px");
                    tile.style.setProperty("--ty", ((y / r.height - 0.5) * 10).toFixed(1) + "px");
                }
            });

            tile.addEventListener("pointerleave", function () {
                tile.style.setProperty("--tx", "0px");
                tile.style.setProperty("--ty", "0px");
            });
        });
    }


    /* ==========================================
       6. FOTO PROFILO IN 3D
    ========================================== */

    const photo = document.querySelector(".about-photo");

    if (photo && finePointer && !reducedMotion) {

        photo.addEventListener("pointermove", function (event) {

            const r = photo.getBoundingClientRect();

            const x = (event.clientX - r.left) / r.width - 0.5;
            const y = (event.clientY - r.top) / r.height - 0.5;

            // asse di rotazione perpendicolare al movimento del mouse
            photo.style.setProperty("--rx", (-y).toFixed(3));
            photo.style.setProperty("--ry", x.toFixed(3));
            photo.style.setProperty("--ra", (Math.hypot(x, y) * 16).toFixed(2) + "deg");
        });

        photo.addEventListener("pointerleave", function () {
            photo.style.setProperty("--ra", "0deg");
        });
    }


    /* ==========================================
       7–10. EFFETTI LEGATI ALLO SCROLL
    ========================================== */

    const timelines = document.querySelectorAll(".timeline");
    const ticker = document.querySelector(".ticker-track");
    const contactTitle = document.querySelector(".contact-inner h2");

    let lastScroll = window.scrollY;
    let velocity = 0;
    let skew = 0;

    function onFrame() {

        requestAnimationFrame(onFrame);

        const vh = window.innerHeight;

        // Velocità dello scroll (pixel per fotogramma, smorzata)
        const y = window.scrollY;
        velocity = lerp(velocity, y - lastScroll, 0.15);
        lastScroll = y;

        if (reducedMotion) return;

        // 7. Parallasse dello screenshot nel dettaglio
        const shotImg = document.querySelector(".pd-item:not([hidden]) .pd-shot-img img");

        if (shotImg) {
            const r = shotImg.parentElement.getBoundingClientRect();
            if (r.bottom > 0 && r.top < vh) {
                const p = (r.top + r.height / 2 - vh / 2) / vh;
                shotImg.style.transform = `translate3d(0, ${(p * -8 - 4).toFixed(2)}%, 0)`;
            }
        }

        // 8. Linee del percorso
        timelines.forEach(function (line) {
            const r = line.getBoundingClientRect();
            const progress = clamp((vh * 0.75 - r.top) / r.height, 0, 1);
            line.style.setProperty("--progress", progress.toFixed(3));
        });

        // 9. Nastro rosa
        if (ticker) {

            skew = lerp(skew, clamp(velocity * -0.25, -8, 8), 0.12);
            ticker.style.setProperty("--skew", skew.toFixed(2) + "deg");

            const anim = ticker.getAnimations && ticker.getAnimations()[0];
            if (anim) anim.playbackRate = 1 + Math.min(Math.abs(velocity) / 6, 5);
        }

        // Titolo dei contatti: le lettere si avvicinano entrando nello schermo
        if (contactTitle) {
            const r = contactTitle.getBoundingClientRect();
            if (r.top < vh && r.bottom > 0) {
                const p = clamp(1 - (r.top - vh * 0.2) / (vh * 0.8), 0, 1);
                contactTitle.style.letterSpacing = (-0.03 - 0.072 * p).toFixed(4) + "em";
            }
        }
    }

    requestAnimationFrame(onFrame);


    /* ==========================================
       10. SCIA DI IMMAGINI NEI CONTATTI
    ========================================== */

    const contact = document.querySelector(".contact");

    if (contact && finePointer && !reducedMotion) {

        // Usiamo gli screenshot mobile della galleria
        const sources = Array.from(
            document.querySelectorAll(".gh-card-media img")
        ).map(function (img) {
            return img.getAttribute("src");
        });

        const pool = sources.slice(0, 8).map(function (src) {
            const img = document.createElement("img");
            img.className = "trail-img";
            img.src = src;
            img.alt = "";
            img.loading = "lazy";
            contact.appendChild(img);
            return img;
        });

        let index = 0;
        let lastX = 0;
        let lastY = 0;

        contact.addEventListener("pointermove", function (event) {

            const r = contact.getBoundingClientRect();
            const x = event.clientX - r.left;
            const y = event.clientY - r.top;

            if (Math.hypot(x - lastX, y - lastY) < 110) return;

            lastX = x;
            lastY = y;

            const img = pool[index % pool.length];
            index++;

            img.getAnimations().forEach(function (a) { a.cancel(); });

            img.style.left = (x - 75) + "px";
            img.style.top = (y - 100) + "px";

            const rotate = (Math.random() * 16 - 8).toFixed(1);

            img.animate([
                { opacity: 0, transform: `scale(0.6) rotate(${rotate}deg)` },
                { opacity: 1, transform: `scale(1) rotate(${rotate}deg)`, offset: 0.15 },
                { opacity: 1, transform: `scale(1) rotate(${rotate}deg)`, offset: 0.6 },
                { opacity: 0, transform: `scale(0.85) translateY(30px) rotate(${rotate}deg)` }
            ], {
                duration: 1300,
                easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
                fill: "forwards"
            });
        });
    }

})();
