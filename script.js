/* ==========================================
   AGNESE BARNABA — PORTFOLIO 2026
   ANIMAZIONI E INTERAZIONI
========================================== */

document.documentElement.classList.add("has-js");

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       1. IMPOSTAZIONI GENERALI
    ====================================== */

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    /* =====================================
   CURSORE CON ALONE ROSA
===================================== */

const supportsFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
).matches;

if (supportsFinePointer && !reducedMotion) {

    // Creiamo l'alone.

    const cursorAura = document.createElement("div");

    cursorAura.className = "cursor-aura";

    cursorAura.setAttribute("aria-hidden", "true");

    document.body.appendChild(cursorAura);


    // Posizione attuale e posizione da raggiungere.

    let currentX = 0;
    let currentY = 0;

    let targetX = 0;
    let targetY = 0;

    let cursorFrame = null;
    let cursorInitialized = false;


    // Animazione morbida.

    function animateCursor() {

        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;

        cursorAura.style.transform = `
            translate3d(${currentX}px, ${currentY}px, 0)
            translate(-50%, -50%)
        `;

        const distanceX = Math.abs(targetX - currentX);
        const distanceY = Math.abs(targetY - currentY);

        if (distanceX > 0.3 || distanceY > 0.3) {

            cursorFrame = requestAnimationFrame(animateCursor);

        } else {

            cursorFrame = null;

        }

    }


    // Seguiamo il movimento del mouse.

    document.addEventListener("pointermove", function (event) {

        targetX = event.clientX;
        targetY = event.clientY;

        if (!cursorInitialized) {

            currentX = targetX;
            currentY = targetY;

            cursorInitialized = true;

        }

        cursorAura.classList.add("is-visible");

        if (cursorFrame === null) {

            cursorFrame = requestAnimationFrame(animateCursor);

        }

    }, { passive: true });


    // Nascondiamo l'alone quando la finestra perde il focus.

    window.addEventListener("blur", function () {

        cursorAura.classList.remove("is-visible");

    });

    document.addEventListener("pointerout", function (event) {

        if (!event.relatedTarget) {

            cursorAura.classList.remove("is-visible");

        }

    });

}

    /* =====================================
       2. ANIMAZIONI ALLO SCROLL
    ====================================== */

    const revealElements = document.querySelectorAll(".reveal");

    if (
        reducedMotion ||
        !("IntersectionObserver" in window)
    ) {

        revealElements.forEach(function (element) {
            element.classList.add("is-visible");
        });

    } else {

        const observer = new IntersectionObserver(

            function (entries) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        entry.target.classList.add("is-visible");

                        observer.unobserve(entry.target);

                    }

                });

            },

            {
                threshold: 0.07,
                rootMargin: "0px 0px -35px 0px"
            }

        );

        revealElements.forEach(function (element) {
            observer.observe(element);
        });

    }


    /* =====================================
       3. BARRA DI PROGRESSO SCROLL
    ====================================== */

    const progressBar = document.querySelector(".scroll-progress");

    let progressFrame = false;

    function updateProgress() {

        const documentHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        const progress = documentHeight > 0
            ? (window.scrollY / documentHeight) * 100
            : 0;

        if (progressBar) {

            progressBar.style.width = progress + "%";

        }

        progressFrame = false;

    }

    window.addEventListener("scroll", function () {

        if (!progressFrame) {

            progressFrame = true;

            requestAnimationFrame(updateProgress);

        }

    }, { passive: true });

    window.addEventListener("resize", updateProgress);

    updateProgress();


    /* =====================================
       4. MENU MOBILE
    ====================================== */

    const menuButton = document.querySelector(".menu-toggle");

    const mobileMenu = document.querySelector(".nav-links");

    if (menuButton && mobileMenu) {

        menuButton.addEventListener("click", function () {

            const isOpen = mobileMenu.classList.toggle("open");

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            menuButton.setAttribute(
                "aria-label",
                isOpen ? "Chiudi il menu" : "Apri il menu"
            );

        });

        mobileMenu.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                mobileMenu.classList.remove("open");

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

                menuButton.setAttribute(
                    "aria-label",
                    "Apri il menu"
                );

            });

        });

    }


   /* ==========================================
   5. HERO — INTERACTIVE FLOATING SYSTEM
========================================== */

const hero = document.querySelector(".hero");

const heroArt = document.querySelector(".hero-art");

const floatingCards = document.querySelectorAll(
    ".floating-preview"
);

const floatingWords = document.querySelectorAll(
    ".hero-art-word"
);

const floatingDots = document.querySelectorAll(
    ".hero-spark"
);

const cube = document.querySelector(".cube");


/* ==========================================
   MOVIMENTO DEL CURSORE
========================================== */

const mouse = {
    x: 0,
    y: 0
};

const smoothMouse = {
    x: 0,
    y: 0
};

const supportsMouse = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
).matches;


/* ==========================================
   PARAMETRI DI MOVIMENTO
========================================== */

const floatingObjects = [];


/* IMMAGINI */

floatingCards.forEach(function (element, index) {

    floatingObjects.push({

        element: element,

        type: "image",

        index: index,

        depth: [32, 36, 30][index] ?? 32,

        phase: index * 1.7,

        speed: 0.55 + index * 0.12,

        amplitude: 6 + index * 2,

        rotation: [5, -7, -4][index] ?? 0

    });

});


/* SCRITTE */

floatingWords.forEach(function (element, index) {

    floatingObjects.push({

        element: element,

        type: "word",

        index: index,

        depth: [30, 34, 32][index] ?? 32,

        phase: index * 2.1 + 0.8,

        speed: 0.48 + index * 0.1,

        amplitude: 5 + index * 2,

        rotation: 0

    });

});


/* PALLINI ROSA */

floatingDots.forEach(function (element, index) {

    floatingObjects.push({

        element: element,

        type: "dot",

        index: index,

        depth: [32, -26, 38][index] ?? 25,

        phase: index * 2.3,

        speed: 0.7 + index * 0.2,

        amplitude: 17 + index * 4,

        rotation: 0

    });

});


/* ==========================================
   RILEVAMENTO DEL MOUSE
========================================== */

if (hero && supportsMouse && !reducedMotion) {

    hero.addEventListener("pointermove", function (event) {

        const rect = hero.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        mouse.x = Math.max(
            -1,
            Math.min(1, (event.clientX - centerX) / (rect.width / 2))
        );

        mouse.y = Math.max(
            -1,
            Math.min(1, (event.clientY - centerY) / (rect.height / 2))
        );

    }, { passive: true });


    hero.addEventListener("pointerleave", function () {

        mouse.x = 0;
        mouse.y = 0;

    });

}


/* ==========================================
   MOTORE DI ANIMAZIONE
========================================== */

if (heroArt && !reducedMotion) {

    let previousTime = 0;

    let elapsed = 0;


    function animateHero(timestamp) {

        if (!previousTime) {
            previousTime = timestamp;
        }

        const delta = Math.min(
            (timestamp - previousTime) / 1000,
            0.05
        );

        previousTime = timestamp;

        elapsed += delta;


        /* MOVIMENTO MORBIDO DEL MOUSE */

        const easing = 1 - Math.exp(-delta * 7);

        smoothMouse.x += (
            mouse.x - smoothMouse.x
        ) * easing;

        smoothMouse.y += (
            mouse.y - smoothMouse.y
        ) * easing;


        /* =====================================
           IMMAGINI, TESTI E PALLINI
        ====================================== */

        floatingObjects.forEach(function (object) {

            const time =
                elapsed * object.speed + object.phase;


            /* Oscillazione continua */

            const floatingX =
                Math.sin(time) * object.amplitude;

            const floatingY =
                Math.cos(time * 0.85) * object.amplitude;


            /* MOVIMENTO SINCRONIZZATO CON IL CURSORE */

const mouseOffsetX =
    smoothMouse.x * object.depth * 1.5;

const mouseOffsetY =
    smoothMouse.y * object.depth * 1.5;


            /* Piccola rotazione */

            const rotation =
                Math.sin(time * 0.7) * 2.5;


            /* Movimento completo */

            const x =
                floatingX + mouseOffsetX;

            const y =
                floatingY + mouseOffsetY;


            object.element.style.transform = `
                translate3d(${x}px, ${y}px, 0)
                rotate(${object.rotation + rotation}deg)
            `;

        });


        /* =====================================
           CUBO — ROTAZIONE SU TRE ASSI
        ====================================== */

        if (cube) {

            /*
             * Rotazione continua:
             * X = inclinazione verticale
             * Y = rotazione orizzontale
             * Z = oscillazione laterale
             */

            const rotationX =
                -22 +
                Math.sin(elapsed * 0.62) * 23 +
                smoothMouse.y * 20;

            const rotationY =
                elapsed * 31 +
                smoothMouse.x * 33;

            const rotationZ =
                -10 +
                Math.sin(elapsed * 0.41) * 16 +
                smoothMouse.x * 11;


            /* Leggero movimento nello spazio */

            const cubeX =
                Math.sin(elapsed * 0.63) * 8 +
                smoothMouse.x * 15;

            const cubeY =
                Math.cos(elapsed * 0.52) * 12 +
                smoothMouse.y * 15;


            cube.style.transform = `
                translate3d(${cubeX}px, ${cubeY}px, 0)
                rotateX(${rotationX}deg)
                rotateY(${rotationY}deg)
                rotateZ(${rotationZ}deg)
            `;

        }


        requestAnimationFrame(animateHero);

    }


    requestAnimationFrame(animateHero);

}

    /* =====================================
       6. SCROLL FLUIDO NAVBAR
    ====================================== */

    const navigationLinks = document.querySelectorAll(
        'a[href^="#"]'
    );

    navigationLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const targetSection = document.querySelector(targetId);

            if (!targetSection) {
                return;
            }

            event.preventDefault();

            targetSection.scrollIntoView({

                behavior: reducedMotion ? "auto" : "smooth",

                block: "start"

            });

            history.replaceState(null, "", targetId);

        });

    });


    /* =====================================
       7. CONTROLLO FINALE
    ====================================== */

    console.log(
        "Portfolio Agnese Barnaba — animazioni inizializzate."
    );

    /* ==========================================
   PROGETTI UNIVERSITARI — ACCORDION
========================================== */

const universitySection = document.querySelector(
    ".university-section"
);

const universityToggle = document.querySelector(
    ".university-toggle"
);

const universityPanel = document.querySelector(
    ".university-panel"
);

if (universitySection && universityToggle && universityPanel) {

    const universityIcon = universityToggle.querySelector(
        ".university-toggle-icon"
    );

    let closeTimer = null;

    universityToggle.addEventListener("click", function () {

        const isOpen = universitySection.classList.contains(
            "is-open"
        );

        clearTimeout(closeTimer);

        if (isOpen) {

            /* CHIUSURA */

            universitySection.classList.remove("is-open");

            universityToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            universityToggle.setAttribute(
                "aria-label",
                "Mostra progetti universitari"
            );

            if (universityIcon) {
                universityIcon.textContent = "+";
            }

            closeTimer = setTimeout(function () {
                universityPanel.inert = true;
            }, reducedMotion ? 0 : 750);

        } else {

            /* APERTURA */

            universityPanel.inert = false;

            universitySection.classList.add("is-open");

            universityToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            universityToggle.setAttribute(
                "aria-label",
                "Nascondi progetti universitari"
            );

            if (universityIcon) {
                universityIcon.textContent = "−";
            }

        }

    });

}

});