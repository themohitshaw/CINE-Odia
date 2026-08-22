document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       CINE-ODIA INDEX PAGE
       ========================================= */

    /*
       This JavaScript file handles all interactive
       functionality of the CINE-Odia home page.

       Main Features:
       1. Movie preference form
       2. Add favorite movies
       3. Remove favorite movies
       4. Movie field numbering
       5. Enter-key navigation
       6. Form validation and submission
       7. Movie search form
       8. Search validation
       9. Escape-key search reset
    */


    /* =========================================
       1. MOVIE PREFERENCE FORM
       ========================================= */

    /*
       Get all elements required for the
       favorite movie recommendation form.
    */

    const movieForm =
        document.getElementById("moviePreferenceForm");

    const movieInputs =
        document.getElementById("movieInputs");

    const addMovieBtn =
        document.getElementById("addMovieBtn");

    const suggestionBtn =
        document.getElementById("suggestionBtn");

    const movieLimit =
        document.getElementById("movieLimit");

    const movieCounter =
        document.getElementById("movieCounter");

    /* -----------------------------------------
       Maximum Number of Favorite Movies
       ----------------------------------------- */

    const MAX_MOVIES = 10;


    /*
       Continue only if all required movie
       preference elements exist on the page.
    */

    if (
        movieForm &&
        movieInputs &&
        addMovieBtn &&
        suggestionBtn &&
        movieLimit &&
        movieCounter
    ) {


        /* =========================================
           1.1 MOVIE STATUS
           ========================================= */

        /*
           Updates:
           - Movie counter
           - Movie limit message
           - Add More button state
        */

        function updateMovieStatus() {

            const fields =
                movieInputs.querySelectorAll(".movie-field");

            const count = fields.length;


            /* -----------------------------------------
               Update Movie Counter
               ----------------------------------------- */

            movieCounter.innerHTML = `
                <i class="fa-solid fa-clapperboard"></i>
                <span>${count} / ${MAX_MOVIES}</span>
            `;


            /* -----------------------------------------
               Check Maximum Movie Limit
               ----------------------------------------- */

            if (count >= MAX_MOVIES) {

                movieLimit.innerHTML = `
                    <i class="fa-solid fa-circle-check"></i>
                    <span>
                        You have reached the maximum of 10 movies.
                    </span>
                `;

                addMovieBtn.disabled = true;

            } else {

                movieLimit.innerHTML = `
                    <i class="fa-solid fa-circle-info"></i>
                    <span>
                        ${count}/10 favorite movies added.
                        Add more for better recommendations.
                    </span>
                `;

                addMovieBtn.disabled = false;
            }
        }


        /* =========================================
           1.2 RENUMBER MOVIE FIELDS
           ========================================= */

        /*
           Keeps movie numbers, placeholders and
           accessibility labels synchronized after
           adding or removing movie fields.
        */

        function renumberMovieFields() {

            movieInputs
                .querySelectorAll(".movie-field")
                .forEach(function (field, index) {

                    const number = index + 1;

                    const numberElement =
                        field.querySelector(".movie-number");

                    const input =
                        field.querySelector(".movie-input");

                    const remove =
                        field.querySelector(".remove-movie");


                    /* -----------------------------------------
                       Update Movie Number
                       ----------------------------------------- */

                    if (numberElement) {

                        numberElement.textContent =
                            String(number).padStart(2, "0");
                    }


                    /* -----------------------------------------
                       Update Input Placeholder and Label
                       ----------------------------------------- */

                    if (input) {

                        input.placeholder =
                            `Favorite movie ${number}`;

                        input.setAttribute(
                            "aria-label",
                            `Favorite movie ${number}`
                        );
                    }


                    /* -----------------------------------------
                       Update Remove Button Label
                       ----------------------------------------- */

                    if (remove) {

                        remove.setAttribute(
                            "aria-label",
                            `Remove movie ${number}`
                        );
                    }
                });
        }


        /* =========================================
           1.3 ADD MOVIE
           ========================================= */

        /*
           Creates a new favorite movie input field
           when the user clicks the "Add More" button.
        */

        addMovieBtn.addEventListener(
            "click",
            function () {

                const count =
                    movieInputs
                        .querySelectorAll(".movie-field")
                        .length;


                /* -----------------------------------------
                   Prevent Adding More Than 10 Movies
                   ----------------------------------------- */

                if (count >= MAX_MOVIES) {
                    return;
                }


                /* -----------------------------------------
                   Calculate Next Movie Number
                   ----------------------------------------- */

                const next = count + 1;


                /* -----------------------------------------
                   Create New Movie Field
                   ----------------------------------------- */

                const field =
                    document.createElement("div");

                field.className = "movie-field";


                /* -----------------------------------------
                   Add Movie Field HTML
                   ----------------------------------------- */

                field.innerHTML = `
                    <span class="movie-number">
                        ${String(next).padStart(2, "0")}
                    </span>

                    <input
                        type="text"
                        name="movies"
                        class="movie-input"
                        placeholder="Favorite movie ${next}"
                        autocomplete="off"
                        aria-label="Favorite movie ${next}"
                    >

                    <button
                        type="button"
                        class="remove-movie"
                        aria-label="Remove movie ${next}"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                `;


                /* -----------------------------------------
                   Insert New Field Into Container
                   ----------------------------------------- */

                movieInputs.appendChild(field);


                /* -----------------------------------------
                   Update Movie Status
                   ----------------------------------------- */

                updateMovieStatus();


                /* -----------------------------------------
                   Automatically Focus New Input
                   ----------------------------------------- */

                setTimeout(function () {

                    const input =
                        field.querySelector(".movie-input");

                    if (input) {
                        input.focus();
                    }

                }, 100);
            }
        );


        /* =========================================
           1.4 REMOVE MOVIE
           ========================================= */

        /*
           Removes a favorite movie field when
           the user clicks its remove button.
        */

        movieInputs.addEventListener(
            "click",
            function (event) {

                const remove =
                    event.target.closest(".remove-movie");


                /* -----------------------------------------
                   Check Whether Remove Button Was Clicked
                   ----------------------------------------- */

                if (!remove) {
                    return;
                }


                const field =
                    remove.closest(".movie-field");


                if (!field) {
                    return;
                }


                const fields =
                    movieInputs.querySelectorAll(".movie-field");


                /* -----------------------------------------
                   Keep At Least One Movie Field
                   ----------------------------------------- */

                if (fields.length <= 1) {

                    movieLimit.innerHTML = `
                        <i class="fa-solid fa-circle-info"></i>
                        <span>
                            Keep at least one movie field.
                        </span>
                    `;

                    return;
                }


                /* -----------------------------------------
                   Remove Animation
                   ----------------------------------------- */

                field.style.opacity = "0";

                field.style.transform =
                    "scale(.92) translateY(10px)";


                /* -----------------------------------------
                   Remove Field After Animation
                   ----------------------------------------- */

                setTimeout(function () {

                    field.remove();

                    renumberMovieFields();

                    updateMovieStatus();

                }, 220);
            }
        );


        /* =========================================
           1.5 ENTER KEY NAVIGATION
           ========================================= */

        /*
           Pressing Enter inside a movie input:
           - Moves to the next input if available.
           - Submits the form if it is the last input.
        */

        movieInputs.addEventListener(
            "keydown",
            function (event) {

                if (event.key !== "Enter") {
                    return;
                }


                const input =
                    event.target.closest(".movie-input");


                if (!input) {
                    return;
                }


                /* -----------------------------------------
                   Prevent Default Form Submission
                   ----------------------------------------- */

                event.preventDefault();


                /* -----------------------------------------
                   Get All Movie Inputs
                   ----------------------------------------- */

                const inputs =
                    Array.from(
                        movieInputs.querySelectorAll(
                            ".movie-input"
                        )
                    );


                const currentIndex =
                    inputs.indexOf(input);


                const nextInput =
                    inputs[currentIndex + 1];


                /* -----------------------------------------
                   Focus Next Input or Submit Form
                   ----------------------------------------- */

                if (nextInput) {

                    nextInput.focus();

                } else {

                    movieForm.requestSubmit();
                }
            }
        );


        /* =========================================
           1.6 MOVIE FORM SUBMISSION
           ========================================= */

        /*
           Validates the favorite movie inputs before
           allowing the recommendation form to submit.
        */

        movieForm.addEventListener(
            "submit",
            function (event) {

                /* -----------------------------------------
                   Collect Movie Input Values
                   ----------------------------------------- */

                const movies =
                    Array.from(
                        movieInputs.querySelectorAll(
                            ".movie-input"
                        )
                    )
                    .map(function (input) {

                        return input.value.trim();

                    })
                    .filter(Boolean);


                /* -----------------------------------------
                   Validate At Least One Movie
                   ----------------------------------------- */

                if (!movies.length) {

                    event.preventDefault();


                    movieLimit.innerHTML = `
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>
                            Please enter at least one favorite movie.
                        </span>
                    `;


                    /* -----------------------------------------
                       Focus First Movie Input
                       ----------------------------------------- */

                    const firstInput =
                        movieInputs.querySelector(
                            ".movie-input"
                        );


                    if (firstInput) {
                        firstInput.focus();
                    }


                    return;
                }


                /* -----------------------------------------
                   Show Loading State
                   ----------------------------------------- */

                suggestionBtn.disabled = true;

                suggestionBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Finding Movies...</span>
                `;
            }
        );


        /* =========================================
           1.7 INITIALIZE MOVIE FORM
           ========================================= */

        /*
           Set the correct movie numbers and status
           when the page initially loads.
        */

        renumberMovieFields();

        updateMovieStatus();
    }


    /* =========================================
       2. MOVIE SEARCH
       ========================================= */

    /*
       Get all elements required for the
       movie search functionality.
    */

    const searchForm =
        document.getElementById("movieSearchForm");

    const searchInput =
        document.getElementById("movieSearchInput");

    const searchButton =
        document.getElementById("movieSearchButton");

    const searchError =
        document.getElementById("movieSearchError");


    /*
       Continue only if all required search
       elements exist on the page.
    */

    if (
        searchForm &&
        searchInput &&
        searchButton &&
        searchError
    ) {


        /* =========================================
           2.1 SHOW SEARCH ERROR
           ========================================= */

        /*
           Displays a validation error message
           below the movie search form.
        */

        function showSearchError(message) {

            searchError.innerHTML = `
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>${message}</span>
            `;

            searchError.classList.add("show");

            searchInput.focus();
        }


        /* =========================================
           2.2 CLEAR SEARCH ERROR
           ========================================= */

        /*
           Hides the current search validation
           error message.
        */

        function clearSearchError() {

            searchError.classList.remove("show");
        }


        /* =========================================
           2.3 SEARCH INPUT
           ========================================= */

        /*
           Automatically removes the error message
           when the user starts entering a search term.
        */

        searchInput.addEventListener(
            "input",
            function () {

                if (searchInput.value.trim()) {

                    clearSearchError();
                }
            }
        );


        /* =========================================
           2.4 SEARCH FORM SUBMISSION
           ========================================= */

        /*
           Validates the movie search query before
           sending it to the Flask backend.
        */

        searchForm.addEventListener(
            "submit",
            function (event) {

                const value =
                    searchInput.value.trim();


                /* -----------------------------------------
                   Validate Empty Search
                   ----------------------------------------- */

                if (!value) {

                    event.preventDefault();

                    showSearchError(
                        "Please enter a movie name to search."
                    );

                    return;
                }


                /* -----------------------------------------
                   Validate Minimum Length
                   ----------------------------------------- */

                if (value.length < 2) {

                    event.preventDefault();

                    showSearchError(
                        "Please enter at least 2 characters."
                    );

                    return;
                }


                /* -----------------------------------------
                   Validate Maximum Length
                   ----------------------------------------- */

                if (value.length > 100) {

                    event.preventDefault();

                    showSearchError(
                        "Movie name cannot exceed 100 characters."
                    );

                    return;
                }


                /* -----------------------------------------
                   Clear Validation Error
                   ----------------------------------------- */

                clearSearchError();


                /* -----------------------------------------
                   Show Search Loading State
                   ----------------------------------------- */

                searchButton.classList.add("loading");

                searchButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Searching...</span>
                `;
            }
        );


        /* =========================================
           2.5 ESCAPE KEY
           ========================================= */

        /*
           Pressing Escape clears the search input,
           removes the error message and focuses
           the search input again.
        */

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    /* -----------------------------------------
                       Clear Search Input
                       ----------------------------------------- */

                    searchInput.value = "";


                    /* -----------------------------------------
                       Clear Search Error
                       ----------------------------------------- */

                    clearSearchError();


                    /* -----------------------------------------
                       Return Focus to Search Input
                       ----------------------------------------- */

                    searchInput.focus();
                }
            }
        );
    }


    /* =========================================
       END OF CINE-ODIA INDEX PAGE JAVASCRIPT
       ========================================= */

});

