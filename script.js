/* =========================================
   PORTFOLIO 2026
   ANIMAZIONI ALLO SCROLL
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    // Selezioniamo gli elementi da animare.

    const revealElements = document.querySelectorAll(
        ".scroll-reveal"
    );

    // Controlliamo le preferenze di accessibilità.

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Mostriamo subito gli elementi se le animazioni
    // sono disabilitate o il browser non le supporta.

    if (
        reducedMotion ||
        !("IntersectionObserver" in window)
    ) {

        revealElements.forEach(function (element) {
            element.classList.add("is-visible");
        });

        return;
    }

    // Osserviamo gli elementi durante lo scorrimento.

    const observer = new IntersectionObserver(

        function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    // Avviamo l'animazione.

                    entry.target.classList.add("is-visible");

                    // L'animazione si esegue una sola volta.

                    observer.unobserve(entry.target);

                }

            });

        },

        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }

    );

    // Attiviamo l'osservazione.

    revealElements.forEach(function (element) {
        observer.observe(element);
    });

});