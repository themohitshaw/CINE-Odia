/* ============================================================
   CINE-Odia — index.js
   Handles:
     1. Splash screen fade-out on load
     2. Live search suggestions (from the `movieTitles` array
        injected by index.html)
     3. Client-side filtering of the movie cards already
        rendered by app.py (by `data-title` attribute)
     4. Pagination of the (filtered) movie cards
     5. Pagination of the suggestion cards (Get Suggestions)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================
       SPLASH SCREEN
    ========================================================== */

    const splashScreen = document.getElementById("splashScreen");

    if (splashScreen) {
        const hideSplash = () => {
            splashScreen.classList.add("splash-hidden");

            setTimeout(() => {
                splashScreen.remove();
            }, 650);
        };

        const minDelay = new Promise((resolve) => setTimeout(resolve, 600));
        const pageLoaded = new Promise((resolve) => {
            if (document.readyState === "complete") {
                resolve();
            } else {
                window.addEventListener("load", resolve, { once: true });
            }
        });

        Promise.all([minDelay, pageLoaded]).then(hideSplash);

        // Safety net: never let the splash screen stay up forever
        setTimeout(hideSplash, 4000);
    }


    /* --------------------------------------------------------
       ELEMENT REFERENCES
    -------------------------------------------------------- */
    const searchForm        = document.getElementById("movieSearchForm");
    const searchInput       = document.getElementById("movieSearchInput");
    const suggestionsBox    = document.getElementById("movieSearchSuggestions");
    const resultsContainer  = document.getElementById("movieSearchResults");
    const paginationWrapper = document.getElementById("moviePagination");
    const paginationNumbers = document.getElementById("paginationNumbers");
    const prevBtn           = document.getElementById("prevPage");
    const nextBtn           = document.getElementById("nextPage");

    const movieInputsBox    = document.getElementById("movieInputs");
    const addMovieBtn       = document.getElementById("addMovieBtn");
    const movieCounter      = document.querySelector("#movieCounter span");
    const movieLimit        = document.getElementById("movieLimit");

    // `movieTitles` is defined inline in index.html:
    //   const movieTitles = {{ all_movies | map(attribute='title') | list | tojson }};
    const titles = typeof movieTitles !== "undefined" ? movieTitles : [];

    // All movie cards currently rendered by the server (app.py -> all_movies)
    const allCards = resultsContainer
        ? Array.from(resultsContainer.querySelectorAll(".movie-card"))
        : [];

    const CARDS_PER_PAGE = 10;
    const MAX_SUGGESTIONS = 6;
    const MAX_MOVIES = 10;

    let filteredCards = allCards;
    let currentPage = 1;
    let suggestionIndex = -1; // for keyboard navigation


    /* ==========================================================
       SEARCH SUGGESTIONS
    ========================================================== */

    function getMatchingTitles(query) {
        const normalized = query.trim().toLowerCase();

        if (!normalized) return [];

        return titles
            .filter((title) => title.toLowerCase().includes(normalized))
            .slice(0, MAX_SUGGESTIONS);
    }

    function renderSuggestions(matches) {
        if (!suggestionsBox) return;

        suggestionsBox.innerHTML = "";
        suggestionIndex = -1;

        if (matches.length === 0) {
            suggestionsBox.classList.remove("active");
            return;
        }

        matches.forEach((title) => {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.textContent = title;

            item.addEventListener("click", () => {
                searchInput.value = title;
                clearSuggestions();
                filterMovies(title);
                searchInput.focus();
            });

            suggestionsBox.appendChild(item);
        });

        suggestionsBox.classList.add("active");
    }

    function clearSuggestions() {
        if (!suggestionsBox) return;
        suggestionsBox.innerHTML = "";
        suggestionsBox.classList.remove("active");
        suggestionIndex = -1;
    }

    function moveSuggestionFocus(direction) {
        const items = suggestionsBox.querySelectorAll(".suggestion-item");
        if (items.length === 0) return;

        items[suggestionIndex]?.classList.remove("active-suggestion");

        suggestionIndex += direction;

        if (suggestionIndex < 0) suggestionIndex = items.length - 1;
        if (suggestionIndex >= items.length) suggestionIndex = 0;

        const activeItem = items[suggestionIndex];
        activeItem.classList.add("active-suggestion");
        searchInput.value = activeItem.textContent;
    }


    /* ==========================================================
       MOVIE FILTERING (client-side, based on data-title)
    ========================================================== */

    function filterMovies(query) {
        const normalized = query.trim().toLowerCase();

        filteredCards = normalized
            ? allCards.filter((card) =>
                  card.dataset.title.includes(normalized)
              )
            : allCards;

        currentPage = 1;
        renderPage(currentPage);
        showEmptyStateIfNeeded();
    }

    function showEmptyStateIfNeeded() {
        let emptyState = resultsContainer.querySelector(".movie-search-empty");

        if (filteredCards.length === 0) {
            if (!emptyState) {
                emptyState = document.createElement("div");
                emptyState.className = "movie-search-empty";
                emptyState.innerHTML = `
                    <i class="fa-solid fa-film"></i>
                    <span>No movies found.</span>
                `;
                resultsContainer.appendChild(emptyState);
            }
            emptyState.style.display = "flex";
        } else if (emptyState) {
            emptyState.style.display = "none";
        }
    }


    /* ==========================================================
       FAVORITE MOVIE INPUTS ("Add More" button)
    ========================================================== */

    function getMovieFieldCount() {
        return movieInputsBox
            ? movieInputsBox.querySelectorAll(".movie-field").length
            : 0;
    }

    function updateMovieCounter() {
        const count = getMovieFieldCount();

        if (movieCounter) {
            movieCounter.textContent = `${count} / ${MAX_MOVIES}`;
        }

        if (addMovieBtn) {
            const atLimit = count >= MAX_MOVIES;
            addMovieBtn.disabled = atLimit;
            addMovieBtn.classList.toggle("disabled", atLimit);
        }

        if (movieLimit) {
            const limitText = movieLimit.querySelector("span");
            if (limitText) {
                limitText.textContent =
                    count >= MAX_MOVIES
                        ? `You've reached the maximum of ${MAX_MOVIES} favorites.`
                        : `Add at least one movie. You can add up to ${MAX_MOVIES} favorites.`;
            }
        }
    }

    function addMovieField() {
        const count = getMovieFieldCount();

        if (!movieInputsBox || count >= MAX_MOVIES) return;

        const nextIndex = count + 1;
        const number = String(nextIndex).padStart(2, "0");

        const field = document.createElement("div");
        field.className = "movie-field";
        field.innerHTML = `
            <span class="movie-number">${number}</span>
            <input
                type="text"
                name="movies"
                class="movie-input"
                placeholder="Favorite movie ${nextIndex}"
                autocomplete="off"
                aria-label="Favorite movie ${nextIndex}">
        `;

        movieInputsBox.appendChild(field);
        updateMovieCounter();

        field.querySelector(".movie-input")?.focus();
    }

    if (addMovieBtn) {
        addMovieBtn.addEventListener("click", addMovieField);
    }


    /* ==========================================================
       PAGINATION HELPERS (shared by both pagination bars)
    ========================================================== */

    // Builds a compact page list like [1, "...", 4, 5, 6, "...", 93]
    // instead of listing every page number. `delta` controls how
    // many pages are shown on each side of the current page.
    function getPaginationRange(current, total, delta = 1) {
        const range = [1];

        for (let i = current - delta; i <= current + delta; i++) {
            if (i > 1 && i < total) {
                range.push(i);
            }
        }

        if (total > 1) {
            range.push(total);
        }

        const uniqueSorted = [...new Set(range)].sort((a, b) => a - b);

        const withDots = [];
        let previous = null;

        uniqueSorted.forEach((page) => {
            if (previous !== null) {
                if (page - previous === 2) {
                    withDots.push(previous + 1);
                } else if (page - previous > 2) {
                    withDots.push("...");
                }
            }
            withDots.push(page);
            previous = page;
        });

        return withDots;
    }


    /* ==========================================================
       PAGINATION (Explore section)
    ========================================================== */

    function getTotalPages() {
        return Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
    }

    function renderPage(page) {
        const totalPages = getTotalPages();
        currentPage = Math.min(Math.max(page, 1), totalPages);

        const start = (currentPage - 1) * CARDS_PER_PAGE;
        const end = start + CARDS_PER_PAGE;

        // Hide every card, then show only the ones for this page
        allCards.forEach((card) => (card.style.display = "none"));
        filteredCards.slice(start, end).forEach((card) => {
            card.style.display = "";
        });

        renderPaginationControls(totalPages);
    }

    function renderPaginationControls(totalPages) {
        if (!paginationNumbers) return;

        paginationNumbers.innerHTML = "";

        // Hide pagination entirely if everything fits on one page
        if (paginationWrapper) {
            paginationWrapper.style.display = totalPages <= 1 ? "none" : "flex";
        }

        getPaginationRange(currentPage, totalPages).forEach((page) => {
            if (page === "...") {
                const dots = document.createElement("span");
                dots.className = "pagination-ellipsis";
                dots.textContent = "...";
                paginationNumbers.appendChild(dots);
                return;
            }

            const pageBtn = document.createElement("button");
            pageBtn.type = "button";
            pageBtn.className = "pagination-number";
            pageBtn.textContent = page;

            if (page === currentPage) {
                pageBtn.classList.add("active");
            }

            pageBtn.addEventListener("click", () => renderPage(page));
            paginationNumbers.appendChild(pageBtn);
        });

        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    }


    /* ==========================================================
       EVENT LISTENERS (Explore section)
    ========================================================== */

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value;

            renderSuggestions(getMatchingTitles(query));
            filterMovies(query);
        });

        searchInput.addEventListener("keydown", (event) => {
            const items = suggestionsBox?.querySelectorAll(".suggestion-item");

            if (!items || items.length === 0) return;

            if (event.key === "ArrowDown") {
                event.preventDefault();
                moveSuggestionFocus(1);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                moveSuggestionFocus(-1);
            } else if (event.key === "Escape") {
                clearSuggestions();
            }
        });

        // Close suggestions when clicking outside the search box
        document.addEventListener("click", (event) => {
            if (
                !searchInput.contains(event.target) &&
                !suggestionsBox?.contains(event.target)
            ) {
                clearSuggestions();
            }
        });
    }

    if (searchForm) {
        // Client-side filtering already happens live; prevent the full
        // page reload so results update instantly without a POST round-trip.
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            clearSuggestions();
            filterMovies(searchInput.value);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => renderPage(currentPage - 1));
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => renderPage(currentPage + 1));
    }


    /* ==========================================================
       INITIAL RENDER (Explore section)
    ========================================================== */

    // Normalize each card's data-title once up front so filtering
    // and matching stay consistent (index.html already lowercases it).
    allCards.forEach((card) => {
        card.dataset.title = (card.dataset.title || "").toLowerCase();
    });

    updateMovieCounter();
    renderPage(1);


    /* ==========================================================
       SUGGESTIONS PAGINATION
       (independent of the Explore-section pagination above)
    ========================================================== */

    const suggestionResultsBox   = document.getElementById("suggestionResults");
    const suggestionPagination   = document.getElementById("suggestionPagination");
    const suggestionPageNumbers  = document.getElementById("suggestionPaginationNumbers");
    const suggestionPrevBtn      = document.getElementById("suggestionPrevPage");
    const suggestionNextBtn      = document.getElementById("suggestionNextPage");

    if (suggestionResultsBox) {

        const SUGGESTION_CARDS_PER_PAGE = 5;

        const suggestionCards = Array.from(
            suggestionResultsBox.querySelectorAll(".suggestion-card")
        );

        let suggestionCurrentPage = 1;

        function getSuggestionTotalPages() {
            return Math.max(
                1,
                Math.ceil(suggestionCards.length / SUGGESTION_CARDS_PER_PAGE)
            );
        }

        function renderSuggestionPage(page) {
            const totalPages = getSuggestionTotalPages();
            suggestionCurrentPage = Math.min(Math.max(page, 1), totalPages);

            const start = (suggestionCurrentPage - 1) * SUGGESTION_CARDS_PER_PAGE;
            const end = start + SUGGESTION_CARDS_PER_PAGE;

            suggestionCards.forEach((card) => (card.style.display = "none"));
            suggestionCards.slice(start, end).forEach((card) => {
                card.style.display = "";
            });

            renderSuggestionPaginationControls(totalPages);
        }

        function renderSuggestionPaginationControls(totalPages) {
            if (!suggestionPageNumbers) return;

            suggestionPageNumbers.innerHTML = "";

            if (suggestionPagination) {
                suggestionPagination.style.display =
                    totalPages <= 1 ? "none" : "flex";
            }

            getPaginationRange(suggestionCurrentPage, totalPages).forEach((page) => {
                if (page === "...") {
                    const dots = document.createElement("span");
                    dots.className = "pagination-ellipsis";
                    dots.textContent = "...";
                    suggestionPageNumbers.appendChild(dots);
                    return;
                }

                const pageBtn = document.createElement("button");
                pageBtn.type = "button";
                pageBtn.className = "pagination-number";
                pageBtn.textContent = page;

                if (page === suggestionCurrentPage) {
                    pageBtn.classList.add("active");
                }

                pageBtn.addEventListener("click", () => renderSuggestionPage(page));
                suggestionPageNumbers.appendChild(pageBtn);
            });

            if (suggestionPrevBtn) {
                suggestionPrevBtn.disabled = suggestionCurrentPage === 1;
            }
            if (suggestionNextBtn) {
                suggestionNextBtn.disabled = suggestionCurrentPage === totalPages;
            }
        }

        if (suggestionPrevBtn) {
            suggestionPrevBtn.addEventListener("click", () =>
                renderSuggestionPage(suggestionCurrentPage - 1)
            );
        }

        if (suggestionNextBtn) {
            suggestionNextBtn.addEventListener("click", () =>
                renderSuggestionPage(suggestionCurrentPage + 1)
            );
        }

        renderSuggestionPage(1);
    }

});
