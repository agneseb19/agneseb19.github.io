/* ==========================================================
   HERO — GALLERIA DEI PROGETTI
   ----------------------------------------------------------
   1. Le anteprime fluttuanti seguono il mouse (parallasse)
   2. "Scopri i progetti" fa svanire l'intro e apre la galleria
   3. La galleria mette le card su una parete curva in 3D:
      si scorre con frecce, trascinamento, tastiera o trackpad
========================================================== */

(function () {

    const hero = document.querySelector(".gh");

    if (!hero) return;

    const floats = hero.querySelectorAll("[data-depth]");
    const enterButton = hero.querySelector(".gh-enter");
    const backButton = hero.querySelector(".gh-back");
    const gallery = hero.querySelector(".gh-gallery");
    const stage = hero.querySelector(".gh-stage");
    const cards = Array.from(hero.querySelectorAll(".gh-card"));
    const prevButton = hero.querySelector(".gh-prev");
    const nextButton = hero.querySelector(".gh-next");
    const counter = hero.querySelector(".gh-current");
    const total = hero.querySelector(".gh-total");

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const pad = function (n) {
        return String(n).padStart(2, "0");
    };

    total.textContent = pad(cards.length);


    /* ==========================================
       STATO
    ========================================== */

    let galleryOpen = false;

    // Mouse (da -1 a 1), con una versione "morbida" che lo insegue
    const mouse = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };

    // Quanto le anteprime sono "esplose" verso l'esterno (0 → 1)
    let explode = 0;

    // Galleria: card al centro (può essere decimale durante il movimento)
    let current = 0;
    let target = 0;
    let lastActive = -1;

    // Ingresso delle card (0 = nascoste, 1 = al loro posto)
    let entrance = 0;

    // Misure, ricalcolate quando cambia lo schermo
    let cardWidth = 300;
    let stepAngle = 0.28;   // radianti tra una card e l'altra
    let radius = 1200;

    function measure() {

        const isPhone = window.innerWidth <= 760;

        cardWidth = cards[0] ? cards[0].offsetWidth : 300;

        const gap = isPhone ? 30 : 64;   // un po' di spazio in più: la card al centro è più grande

        stepAngle = isPhone ? 0.42 : 0.27;

        // Raggio scelto in modo che le card vicine non si sovrappongano
        radius = (cardWidth + gap) / stepAngle;
    }

    measure();

    window.addEventListener("resize", measure);


    /* ==========================================
       1. PARALLASSE COL MOUSE
    ========================================== */

    hero.addEventListener("pointermove", function (event) {

        if (event.pointerType !== "mouse") return;

        const rect = hero.getBoundingClientRect();

        mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
        mouse.y = (event.clientY - rect.top) / rect.height * 2 - 1;
    });

    hero.addEventListener("pointerleave", function () {
        mouse.x = 0;
        mouse.y = 0;
    });

    // Per ogni anteprima salviamo la direzione dal centro,
    // così quando si apre la galleria "volano via" verso l'esterno.

    const floatData = Array.from(floats).map(function (el) {
        return {
            el: el,
            depth: parseFloat(el.dataset.depth) || 10,
            dirX: 0,
            dirY: 0
        };
    });

    function measureFloats() {

        const rect = hero.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        floatData.forEach(function (f) {

            // Togliamo un attimo la trasformazione per misurare la posizione vera
            const old = f.el.style.transform;
            f.el.style.transform = "none";

            const r = f.el.getBoundingClientRect();

            f.el.style.transform = old;

            const x = r.left - rect.left + r.width / 2 - cx;
            const y = r.top - rect.top + r.height / 2 - cy;
            const len = Math.hypot(x, y) || 1;

            f.dirX = x / len;
            f.dirY = y / len;
        });
    }

    measureFloats();

    window.addEventListener("resize", measureFloats);


    /* ==========================================
       2. APRIRE E CHIUDERE LA GALLERIA
    ========================================== */

    function openGallery() {

        if (galleryOpen) return;

        galleryOpen = true;

        gallery.hidden = false;

        measure();

        entrance = reducedMotion ? 1 : 0;

        // Aspettiamo un fotogramma, così la transizione CSS parte davvero
        requestAnimationFrame(function () {
            hero.dataset.state = "gallery";
        });

        setTimeout(function () {
            if (cards[Math.round(target)]) {
                cards[Math.round(target)].focus({ preventScroll: true });
            }
        }, 700);
    }

    function closeGallery() {

        if (!galleryOpen) return;

        galleryOpen = false;

        hero.dataset.state = "intro";

        setTimeout(function () {
            if (!galleryOpen) gallery.hidden = true;
        }, 700);

        enterButton.focus({ preventScroll: true });
    }

    enterButton.addEventListener("click", openGallery);
    backButton.addEventListener("click", closeGallery);


    /* ==========================================
       3. NAVIGAZIONE NELLA GALLERIA
    ========================================== */

    function goTo(index) {

        target = Math.max(0, Math.min(cards.length - 1, index));
    }

    prevButton.addEventListener("click", function () {
        goTo(Math.round(target) - 1);
    });

    nextButton.addEventListener("click", function () {
        goTo(Math.round(target) + 1);
    });

    // Tastiera: frecce sinistra/destra, Esc per tornare indietro

    document.addEventListener("keydown", function (event) {

        if (!galleryOpen || !heroVisible) return;

        if (event.target.closest && event.target.closest("input, textarea")) return;

        if (event.key === "ArrowRight") goTo(Math.round(target) + 1);
        if (event.key === "ArrowLeft") goTo(Math.round(target) - 1);
        if (event.key === "Escape") closeGallery();
    });

    // Trackpad / rotellina in orizzontale

    let wheelTimer;

    stage.addEventListener("wheel", function (event) {

        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

        event.preventDefault();

        target = Math.max(
            0,
            Math.min(cards.length - 1, target + event.deltaX / 400)
        );

        clearTimeout(wheelTimer);

        wheelTimer = setTimeout(function () {
            goTo(Math.round(target));
        }, 140);

    }, { passive: false });

    // Trascinamento con mouse o dito

    let dragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartTarget = 0;

    stage.addEventListener("pointerdown", function (event) {

        if (event.button !== 0) return;

        dragging = true;
        dragMoved = false;

        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragStartTarget = target;
    });

    window.addEventListener("pointermove", function (event) {

        if (!dragging) return;

        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;

        // Sul telefono: se il dito va in verticale, lasciamo scorrere la pagina
        if (!dragMoved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
            dragging = false;
            return;
        }

        if (Math.abs(dx) > 6) {
            dragMoved = true;
            stage.classList.add("is-dragging");
        }

        if (dragMoved) {
            const distance = cardWidth * 1.1;
            target = Math.max(
                -0.4,
                Math.min(cards.length - 0.6, dragStartTarget - dx / distance)
            );
        }
    });

    window.addEventListener("pointerup", function () {

        if (!dragging) return;

        dragging = false;

        stage.classList.remove("is-dragging");

        goTo(Math.round(target));
    });

    // Clic su una card:
    // - se è dopo un trascinamento, non facciamo nulla
    // - se non è quella al centro, la portiamo al centro
    // - se è quella al centro, apriamo i dettagli sotto

    cards.forEach(function (card, index) {

        card.addEventListener("click", function (event) {

            if (dragMoved) {
                event.preventDefault();
                dragMoved = false;
                return;
            }

            if (index !== Math.round(current)) {
                goTo(index);
                return;
            }

            openDetail(index, true);
        });

        card.addEventListener("dragstart", function (event) {
            event.preventDefault();
        });

        // Con il tasto Tab, la card che riceve il focus va al centro
        card.addEventListener("focus", function () {
            goTo(index);
        });
    });


    /* ==========================================
       3b. DETTAGLIO DEL PROGETTO (sotto la galleria)
    ========================================== */

    const detail = document.querySelector(".pd");
    const detailItems = detail
        ? Array.from(detail.querySelectorAll(".pd-item"))
        : [];
    const detailNum = detail ? detail.querySelector(".pd-num") : null;
    const detailPrev = detail ? detail.querySelector(".pd-prev") : null;
    const detailNext = detail ? detail.querySelector(".pd-next") : null;
    const detailClose = detail ? detail.querySelector(".pd-close") : null;

    let detailIndex = -1;

    function cardTitle(index) {
        const t = cards[index] && cards[index].querySelector(".gh-card-info strong");
        return t ? t.textContent : "";
    }

    function showItem(index) {

        const id = cards[index].dataset.project;

        detailItems.forEach(function (item) {

            const match = item.dataset.project === id;

            item.hidden = !match;
            item.classList.remove("is-in");

            if (match) {
                // forziamo il browser a ripartire con l'animazione
                void item.offsetWidth;
                item.classList.add("is-in");
            }
        });

        detailIndex = index;

        detailNum.textContent = pad(index + 1);

        const prevIndex = (index - 1 + cards.length) % cards.length;
        const nextIndex = (index + 1) % cards.length;

        detail.querySelector(".pd-prev-name").textContent = cardTitle(prevIndex);
        detail.querySelector(".pd-next-name").textContent = cardTitle(nextIndex);
    }

    function openDetail(index, scroll) {

        if (!detail) return;

        const wasHidden = detail.hidden;

        detail.hidden = false;

        showItem(index);

        if (wasHidden) {
            void detail.offsetWidth;
            detail.classList.add("is-open");
        }

        goTo(index);

        if (scroll) {
            setTimeout(function () {
                detail.scrollIntoView({
                    behavior: reducedMotion ? "auto" : "smooth",
                    block: "start"
                });
            }, 60);
        }

        document.dispatchEvent(new CustomEvent("portfolio:detail", { detail: { index: index } }));
    }

    function closeDetail() {

        if (!detail || detail.hidden) return;

        hero.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start"
        });

        setTimeout(function () {
            detail.classList.remove("is-open");
            detail.hidden = true;
            detailIndex = -1;
        }, reducedMotion ? 0 : 650);
    }

    if (detail) {

        detailPrev.addEventListener("click", function () {
            openDetail((detailIndex - 1 + cards.length) % cards.length, false);
            detail.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        });

        detailNext.addEventListener("click", function () {
            openDetail((detailIndex + 1) % cards.length, false);
            detail.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        });

        detailClose.addEventListener("click", closeDetail);
    }


    /* ==========================================
       4. ANIMAZIONE (un fotogramma alla volta)
    ========================================== */

    let heroVisible = true;

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            heroVisible = entries[0].isIntersecting;
        }).observe(hero);
    }

    function clampNum(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function render() {

        requestAnimationFrame(render);

        if (!heroVisible) return;

        /* --- Anteprime fluttuanti --- */

        const followSpeed = reducedMotion ? 1 : 0.06;

        smooth.x = lerp(smooth.x, reducedMotion ? 0 : mouse.x, followSpeed);
        smooth.y = lerp(smooth.y, reducedMotion ? 0 : mouse.y, followSpeed);

        explode = lerp(explode, galleryOpen ? 1 : 0, reducedMotion ? 1 : 0.05);

        if (explode < 0.999 || !galleryOpen) {

            floatData.forEach(function (f) {

                const px = -smooth.x * f.depth;
                const py = -smooth.y * f.depth;

                const push = explode * (260 + f.depth * 8);

                const x = px + f.dirX * push;
                const y = py + f.dirY * push;
                const scale = 1 + explode * 0.25;

                f.el.style.transform =
                    `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
            });
        }

        /* --- Galleria curva --- */

        if (gallery.hidden) return;

        current = lerp(current, target, reducedMotion ? 1 : 0.1);

        if (galleryOpen) {
            entrance = Math.min(1, entrance + (reducedMotion ? 1 : 0.018));
        }

        cards.forEach(function (card, index) {

            const offset = index - current;
            const distance = Math.abs(offset);

            // Ogni card entra con un piccolo ritardo, partendo dal centro
            const delay = Math.min(distance * 0.12, 0.5);
            const local = easeOut(
                Math.max(0, Math.min(1, (entrance - delay) / (1 - delay)))
            );

            // Durante l'ingresso la curva si "apre" dal centro
            const angle = offset * stepAngle * (0.35 + 0.65 * local);

            const x = Math.sin(angle) * radius;
            const z = (1 - Math.cos(angle)) * radius * 0.55;
            const rotate = -angle * (180 / Math.PI);

            const y = (1 - local) * 90;

            // Le card troppo lontane svaniscono
            const fade = Math.max(0, Math.min(1, 4.2 - distance));
            const opacity = fade * local;

            // La card al centro si ingrandisce, le altre tornano normali
            const isPhone = window.innerWidth <= 760;
            const grow = reducedMotion ? 0 : (isPhone ? 0.08 : 0.14);
            const closeness = Math.max(0, 1 - distance);           // 1 al centro, 0 a una card di distanza
            const eased = closeness * closeness * (3 - 2 * closeness); // passaggio morbido
            const scale = 1 + grow * eased * local;

            card.style.transform =
                `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

            card.style.opacity = opacity.toFixed(3);

            card.style.zIndex = String(100 - Math.round(distance * 10));

            card.style.visibility = opacity < 0.01 ? "hidden" : "visible";

            card.tabIndex = galleryOpen ? 0 : -1;

            card.classList.toggle("is-center", distance < 0.5 && local > 0.9);
        });

        const active = Math.round(current);

        if (active !== lastActive) {
            counter.textContent = pad(active + 1);
            lastActive = active;
        }

        prevButton.disabled = Math.round(target) <= 0;
        nextButton.disabled = Math.round(target) >= cards.length - 1;
    }

    requestAnimationFrame(render);

})();
