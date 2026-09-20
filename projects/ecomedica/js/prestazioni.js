document.addEventListener("DOMContentLoaded", function () {


    /* ==============================
       ICONE
    ============================== */

    if (window.lucide) {
        lucide.createIcons();
    }



    /* ==============================
       MENU MOBILE
    ============================== */

    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const mobileNav =
        document.getElementById("mobileNav");


    if (mobileMenuButton && mobileNav) {

        mobileMenuButton.addEventListener(
            "click",
            function () {

                const isOpen =
                    mobileNav.classList.toggle("open");


                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    isOpen
                );


                mobileMenuButton.innerHTML =
                    isOpen
                        ? '<i data-lucide="x"></i>'
                        : '<i data-lucide="menu"></i>';


                if (window.lucide) {
                    lucide.createIcons();
                }

            }
        );

    }



    /* ==============================
       FILTRI PRESTAZIONI
    ============================== */

    const filterButtons =
        document.querySelectorAll(".service-filter");

    const serviceCards =
        document.querySelectorAll(".service-detail-card");

    const servicesSearch =
        document.getElementById("servicesSearch");


    let activeFilter = "all";



    function updateServices() {

        const searchValue =
            servicesSearch
                ? servicesSearch
                    .value
                    .toLowerCase()
                    .trim()
                : "";


        serviceCards.forEach(function (card) {

            const category =
                card.dataset.category;

            const content =
                card.dataset.search.toLowerCase();


            const matchesFilter =
                activeFilter === "all" ||
                category === activeFilter;


            const matchesSearch =
                content.includes(searchValue);


            if (
                matchesFilter &&
                matchesSearch
            ) {

                card.style.display = "grid";

            } else {

                card.style.display = "none";

            }

        });

    }



    /* CLICK FILTRI */

    filterButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                activeFilter =
                    button.dataset.filter;


                updateServices();

            }
        );

    });



    /* RICERCA */

    if (servicesSearch) {

        servicesSearch.addEventListener(
            "input",
            updateServices
        );

    }

    /* ==============================
   APERTURA PAGINA SINGOLA
============================== */

const clickableServiceCards =
document.querySelectorAll(".service-card-clickable");

clickableServiceCards.forEach(function (card) {

card.addEventListener("click", function (event) {

    /*
       Se clicchi un bottone o un link presente
       dentro la card, lascia funzionare quel link.
    */
    if (event.target.closest("a, button")) {
        return;
    }

    const destination =
        card.dataset.href;

    if (destination) {
        window.location.href = destination;
    }

});

});

});