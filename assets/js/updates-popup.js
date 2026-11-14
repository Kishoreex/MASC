
/* ==========================================
   NEWS & EVENTS — CLICK CARD TO VIEW FULL TEXT
   ========================================== */

(() => {
    function initPopup() {
        const grid = document.querySelector(
            ".updates-list-grid"
        );

        if (!grid) return;

        // Create reusable popup
        const popup = document.createElement("dialog");
        popup.className = "updates-detail-popup";
        popup.setAttribute(
            "aria-labelledby",
            "updatesPopupTitle"
        );

        popup.innerHTML = `
          <button
            type="button"
            class="updates-detail-popup__close"
            aria-label="Close details"
          >&times;</button>

          <img
            class="updates-detail-popup__image"
            alt=""
          >

          <div class="updates-detail-popup__content">
            <span class="updates-detail-popup__label"></span>
            <time class="updates-detail-popup__date"></time>
            <h2
              class="updates-detail-popup__title"
              id="updatesPopupTitle"
            ></h2>
            <div class="updates-detail-popup__rule"></div>
            <p class="updates-detail-popup__description"></p>
          </div>
        `;

        document.body.appendChild(popup);

        const image = popup.querySelector(
            ".updates-detail-popup__image"
        );
        const title = popup.querySelector(
            ".updates-detail-popup__title"
        );
        const date = popup.querySelector(
            ".updates-detail-popup__date"
        );
        const description = popup.querySelector(
            ".updates-detail-popup__description"
        );
        const label = popup.querySelector(
            ".updates-detail-popup__label"
        );

        // Make dynamically loaded cards keyboard accessible
        function prepareCards() {
            grid.querySelectorAll(
                ".updates-list-card"
            ).forEach(card => {
                if (card.matches("a")) return;

                card.setAttribute("tabindex", "0");
                card.setAttribute("role", "button");

                const heading = card.querySelector(
                    "h2, h3"
                );

                card.setAttribute(
                    "aria-label",
                    "Read full story: " +
                    (heading?.textContent.trim() || "Update")
                );
            });
        }

        const observer = new MutationObserver(
            prepareCards
        );

        observer.observe(grid, {
            childList: true,
            subtree: true
        });

        prepareCards();

        function openCard(card) {
            const heading = card.querySelector("h2, h3");
            const paragraph = card.querySelector(
                ".updates-list-card__body p"
            ) || card.querySelector("p");
            const cardDate = card.querySelector("time");
            const cardImage = card.querySelector("img");

            // Existing listing cards contain the saved Summary
            title.textContent =
                heading?.textContent.trim() || "College Update";

            description.textContent =
                paragraph?.textContent.trim() ||
                "No description available.";

            date.textContent =
                cardDate?.textContent.trim() || "";

      
const departmentName =
    card.querySelector(".updates-department")
        ?.textContent.trim() || "General";

const postType =
    new URLSearchParams(location.search)
        .get("type") === "event"
        ? "COLLEGE EVENT"
        : "COLLEGE NEWS";

label.textContent =
    postType + "  ·  " + departmentName;

            if (cardImage) {
                image.src =
                    cardImage.currentSrc || cardImage.src;
                image.alt = cardImage.alt || title.textContent;
                image.style.display = "block";
            } else {
                image.removeAttribute("src");
                image.style.display = "none";
            }

            if (!popup.open) {
                popup.showModal();
            }
        }

        // Click anywhere on a card
        grid.addEventListener("click", event => {
            const card = event.target.closest(
                ".updates-list-card"
            );

            if (!card) return;

            event.preventDefault();
            openCard(card);
        });

        // Support Enter and Space keys
        grid.addEventListener("keydown", event => {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) return;

            const card = event.target.closest(
                ".updates-list-card"
            );

            if (!card) return;

            event.preventDefault();
            openCard(card);
        });

        // Close button
        popup.querySelector(
            ".updates-detail-popup__close"
        ).addEventListener("click", () => {
            popup.close();
        });

        // Close by clicking outside the popup
        popup.addEventListener("click", event => {
            if (event.target === popup) {
                popup.close();
            }
        });

        // Escape closes the native dialog automatically
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initPopup
        );
    } else {
        initPopup();
    }
})();
