document.addEventListener("DOMContentLoaded", function () {

    /* ==============================
       LUCIDE ICONS
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


    mobileMenuButton.addEventListener("click", function () {

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

    });


    /*
       Quando clicchi un link nel menu mobile,
       il menu si richiude.
    */

    const mobileLinks =
        mobileNav.querySelectorAll("a");


    mobileLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            mobileNav.classList.remove("open");

            mobileMenuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            mobileMenuButton.innerHTML =
                '<i data-lucide="menu"></i>';

            if (window.lucide) {
                lucide.createIcons();
            }

        });

    });


    /* ==============================
       CHIAMACI DROPDOWN
    ============================== */

    const callButton =
        document.getElementById("callButton");

    const callWrapper =
        callButton.closest(".call-wrapper");


    callButton.addEventListener("click", function (event) {

        event.stopPropagation();

        const isOpen =
            callWrapper.classList.toggle("open");


        callButton.setAttribute(
            "aria-expanded",
            isOpen
        );

    });


   /*
   Cliccando fuori dal menu,
   il dropdown dei numeri si chiude.
*/

document.addEventListener("click", function (event) {

    if (!callWrapper.contains(event.target)) {

        callWrapper.classList.remove("open");

        callButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

});


/* ==============================
   SPECIALIZZAZIONI:
   FILTRO + MOSTRA TUTTE
============================== */

const specialtySearch =
    document.getElementById("specialtySearch");

const specialtyCards =
    Array.from(
        document.querySelectorAll(".specialty-card")
    );

const specialtiesEmpty =
    document.getElementById("specialtiesEmpty");

const specialtiesToggle =
    document.getElementById("specialtiesToggle");

const specialtiesToggleText =
    document.getElementById("specialtiesToggleText");


const specialtiesCount =
    document.getElementById("specialtiesCount");


let specialtiesExpanded = false;



/* ------------------------------
   QUANTE CARD MOSTRARE
------------------------------ */

function getSpecialtiesLimit() {

    const width = window.innerWidth;

    /* MOBILE */
    if (width <= 650) {
        return 4;
    }

    /* TABLET */
    if (width <= 900) {
        return 6;
    }

    /* DESKTOP */
    return Infinity;
}


/* ------------------------------
   AGGIORNA LA GRIGLIA
------------------------------ */

function updateSpecialties() {

    const searchValue =
        specialtySearch
            ? specialtySearch.value
                .toLowerCase()
                .trim()
            : "";

    const limit =
        getSpecialtiesLimit();

    const compactMode =
        Number.isFinite(limit);


    /*
       Se torni su desktop,
       resetta l'espansione.
       Così quando torni su mobile
       riparte chiusa.
    */

    if (!compactMode) {
        specialtiesExpanded = false;
    }


    /* Trova tutte le card che corrispondono alla ricerca */

    const matchingCards =
        specialtyCards.filter(function (card) {

            const content =
                card.dataset.specialty
                    .toLowerCase();

            return content.includes(searchValue);

        });

        /* ------------------------------
   CONTATORE SPECIALIZZAZIONI
------------------------------ */

if (specialtiesCount) {

    const searching =
        searchValue.length > 0;

    if (
        compactMode &&
        !searching &&
        !specialtiesExpanded
    ) {

        const visibleCount =
            Math.min(
                limit,
                matchingCards.length
            );

        specialtiesCount.textContent =
            "Stai visualizzando " +
            visibleCount +
            " di " +
            matchingCards.length +
            " specializzazioni";

        specialtiesCount.style.display =
            "block";

    } else {

        specialtiesCount.style.display =
            "none";

    }

}


    /* Prima nasconde tutte le card */

    specialtyCards.forEach(function (card) {

        card.classList.add("is-hidden");

    });


    /* Poi mostra quelle necessarie */

    matchingCards.forEach(
        function (card, index) {

            const searching =
                searchValue.length > 0;

            const shouldShow =
                searching ||
                specialtiesExpanded ||
                !compactMode ||
                index < limit;


            if (shouldShow) {

                card.classList.remove(
                    "is-hidden"
                );

            }

        }
    );


    /* ------------------------------
       NESSUN RISULTATO
    ------------------------------ */

    if (matchingCards.length === 0) {

        specialtiesEmpty.classList.add(
            "visible"
        );

    } else {

        specialtiesEmpty.classList.remove(
            "visible"
        );

    }


    /* ------------------------------
       BOTTONE MOSTRA TUTTE
    ------------------------------ */

    if (specialtiesToggle) {

        const searching =
            searchValue.length > 0;

        const showToggle =
            compactMode &&
            !searching &&
            matchingCards.length > limit;


        specialtiesToggle.hidden =
            !showToggle;


        if (showToggle) {

            if (specialtiesExpanded) {

                specialtiesToggleText.textContent =
                    "Mostra meno";

                specialtiesToggle.classList.add(
                    "expanded"
                );

                specialtiesToggle.setAttribute(
                    "aria-expanded",
                    "true"
                );

            } else {

                specialtiesToggleText.textContent =
                    "Vedi tutte le specializzazioni";

                specialtiesToggle.classList.remove(
                    "expanded"
                );

                specialtiesToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }

    }

}


/* ------------------------------
   CLICK MOSTRA TUTTE
------------------------------ */

if (specialtiesToggle) {

    specialtiesToggle.addEventListener(
        "click",
        function () {

            specialtiesExpanded =
                !specialtiesExpanded;

            updateSpecialties();

        }
    );

}


/* ------------------------------
   FILTRO SPECIALIZZAZIONI
------------------------------ */

if (specialtySearch) {

    specialtySearch.addEventListener(
        "input",
        function () {

            updateSpecialties();

        }
    );

}


/* ------------------------------
   CAMBIO DIMENSIONE SCHERMO
------------------------------ */

window.addEventListener(
    "resize",
    function () {

        updateSpecialties();

    }
);


/* PRIMO CARICAMENTO */

updateSpecialties();


    /* ==============================
       FORM CERCA ESAME
    ============================== */

    const bookingForm =
        document.getElementById("bookingForm");


    bookingForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const exam =
            document
                .getElementById("exam")
                .value
                .trim();


        /*
            PER ORA non c'è ancora un sistema
            di prenotazione collegato.

            Quando avrete l'URL/API reale,
            sostituiremo questa parte.
        */

        if (!exam) {

            alert(
                "Scrivi l'esame o la visita che vuoi prenotare."
            );

            return;
        }


        alert(
            "Hai cercato: " +
            exam +
            ". Il sistema di prenotazione verrà collegato successivamente."
        );
    

    });

});