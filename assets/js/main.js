(() => {
  document.documentElement.classList.add("js");

  // Mobile navigation drawer
  const nav = document.querySelector("[data-nav]");
  const openBtn = document.querySelector("[data-nav-toggle]");
  const closeBtn = document.querySelector("[data-nav-close]");
  const backdrop = document.querySelector(".nav-backdrop");
  let inerted = [];

  // While the drawer is open, everything outside it is inert, so Tab and screen readers stay inside.
  // The backdrop is left alone so a click outside still closes the drawer.
  const setOutsideInert = (on) => {
    if (!on) {
      inerted.forEach((el) => (el.inert = false));
      inerted = [];
      return;
    }
    for (let el = nav; el.parentElement && el !== document.body; el = el.parentElement) {
      for (const sibling of el.parentElement.children) {
        if (sibling === el || sibling === backdrop || sibling.inert || sibling.tagName === "SCRIPT") continue;
        sibling.inert = true;
        inerted.push(sibling);
      }
    }
  };
  const isOpen = () => nav?.classList.contains("is-open");

  const setNav = (open) => {
    if (!nav) return;
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    openBtn?.setAttribute("aria-expanded", String(open));
    setOutsideInert(open); // release before focusing the toggle, which sits outside the drawer
    if (open) closeBtn?.focus();
    else openBtn?.focus({ preventScroll: true });
  };
  openBtn?.addEventListener("click", () => setNav(true));
  closeBtn?.addEventListener("click", () => setNav(false));
  backdrop?.addEventListener("click", () => setNav(false));
  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") return setNav(false);
    if (e.key !== "Tab") return;
    // Wrap Tab / Shift+Tab around the drawer's own links and buttons.
    const items = [...nav.querySelectorAll("a[href], button:not([disabled])")].filter((el) => el.getClientRects().length);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // Widening past the drawer breakpoint (e.g. rotating a tablet) must not leave the page inert.
  window.matchMedia("(max-width: 1200px)").addEventListener("change", (e) => {
    if (!e.matches && isOpen()) setNav(false);
  });
  nav?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => nav.classList.contains("is-open") && setNav(false))
  );

  // Header shadow once the page scrolls
  const header = document.querySelector("[data-header]");
  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Reveal on scroll
  const reveal = document.querySelectorAll("[data-reveal]");
  // If this script arrived after the CSS failsafe (2s) already showed everything, don't hide it again.
  const arrivedLate = performance.now() > 1900;
  if (!arrivedLate && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add("is-in"));
  }
  document.documentElement.classList.add("reveal-ready");

  // Programme filters
  const filters = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll("[data-school]");
  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      const value = btn.dataset.filter;
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      cards.forEach((card) => {
        card.hidden = value !== "all" && !card.dataset.school.split(" ").includes(value);
      });
    })
  );

  // Gallery lightbox
  const lightbox = document.querySelector("[data-lightbox]");
  if (lightbox && typeof lightbox.showModal === "function") {
    const img = lightbox.querySelector("img");
    const caption = lightbox.querySelector("p");
    document.querySelectorAll("[data-zoom]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const source = btn.querySelector("img");
        img.src = source.currentSrc || source.src;
        img.alt = source.alt;
        caption.textContent = btn.dataset.zoom;
        lightbox.showModal();
      })
    );
    lightbox.querySelector("[data-lightbox-close]").addEventListener("click", () => lightbox.close());
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });
  }

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();

/* ===== NAVBAR AUTO TEXT COLOR ===== */

const navbar = document.querySelector(".site-header");

function updateNavbarColor() {
    if (!navbar) return;

    const rect = navbar.getBoundingClientRect();

    // Check the actual content behind the navbar
    const x = window.innerWidth / 2;
    const y = Math.max(
        0,
        Math.min(
            window.innerHeight - 1,
            rect.top + rect.height / 2
        )
    );

    const elements = document.elementsFromPoint(x, y);

    let darkBackground = false;

    for (const element of elements) {

        // Ignore navbar itself and its children
        if (navbar.contains(element) || element === navbar) {
            continue;
        }

        const bg = getComputedStyle(element).backgroundColor;
        const match = bg.match(
            /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/
        );

        if (!match) continue;

        const alpha = bg.match(/[\d.]+\s*\)$/);
        if (
            bg.startsWith("rgba") &&
            alpha &&
            parseFloat(alpha[0]) === 0
        ) {
            continue;
        }

        const r = Number(match[1]);
        const g = Number(match[2]);
        const b = Number(match[3]);

        const brightness =
            (r * 299 + g * 587 + b * 114) / 1000;

        darkBackground = brightness < 140;
        break;
    }

    navbar.classList.toggle("on-dark", darkBackground);
}

window.addEventListener("scroll", updateNavbarColor, {
    passive: true
});

window.addEventListener("resize", updateNavbarColor);

updateNavbarColor();




/* ==========================================
   COLLEGE PAGE — ADVANCED SCROLL EFFECTS
   ========================================== */

(() => {
    const page = document.querySelector(
        ".college-refresh"
    );

    // Run only on college.html
    if (!page) return;

    const hero = page.querySelector(
        ".page-hero--college"
    );

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    // 1. Create reading progress bar
    const progress = document.createElement("div");
    progress.className = "college-progress";
    progress.setAttribute("aria-hidden", "true");

    const fill = document.createElement("div");
    fill.className = "college-progress__fill";

    progress.appendChild(fill);
    document.body.appendChild(progress);

    // 2. Reveal decorative heading lines
    const headings = page.querySelectorAll(
        ".section .eyebrow"
    );

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "line-visible"
                        );
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.25 }
        );

        headings.forEach(el => observer.observe(el));
    } else {
        headings.forEach(el =>
            el.classList.add("line-visible")
        );
    }

    // 3. Update progress and hero parallax
    let ticking = false;

    function updateEffects() {
        const scrollTop =
            window.scrollY ||
            document.documentElement.scrollTop;

        const maxScroll = Math.max(
            0,
            document.documentElement.scrollHeight -
            window.innerHeight
        );

        const progressValue = maxScroll > 0
            ? Math.min(scrollTop / maxScroll, 1)
            : 0;

        fill.style.transform =
            `scaleX(${progressValue})`;

        if (hero) {
            const isDesktop = window.innerWidth > 720;

            if (!reducedMotion.matches && isDesktop) {
                const rect = hero.getBoundingClientRect();

                if (
                    rect.bottom > 0 &&
                    rect.top < window.innerHeight
                ) {
                    const offset = Math.max(
                        -65,
                        Math.min(65, -rect.top * 0.12)
                    );

                    hero.style.setProperty(
                        "--college-parallax",
                        `${offset}px`
                    );
                }
            } else {
                hero.style.setProperty(
                    "--college-parallax",
                    "0px"
                );
            }
        }

        ticking = false;
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateEffects);
    }

    window.addEventListener(
        "scroll",
        requestUpdate,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        requestUpdate
    );

    reducedMotion.addEventListener?.(
        "change",
        requestUpdate
    );

    updateEffects();
})();



/* =====================================
   ADMISSION ENQUIRY EMAIL HANDLER
   ===================================== */

(() => {
    const form = document.getElementById("admissionForm");

    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!form.reportValidity()) return;

        const data = new FormData(form);

        const name = data.get("studentName").trim();
        const email = data.get("studentEmail").trim();
        const phone = data.get("studentPhone").trim();
        const type = data.get("admissionType");
        const course = data.get("course");
        const message = data.get("enquiryMessage").trim();

        const subject =
            "Admission Enquiry - " + name;

        const body = [
            "ADMISSION ENQUIRY",
            "",
            "Student Name: " + name,
            "Email: " + email,
            "Mobile: " + phone,
            "Admission Type: " + type,
            "Interested Programme: " + course,
            "",
            "Message:",
            message || "No additional message.",
            "",
            "Submitted via Madha College website"
        ].join("\n");

        const mailto =
            "mailto:madhaasc@gmail.com" +
            "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);

        window.location.href = mailto;
    });
})();



/* ==========================================
   ADMISSION ENQUIRY — FIRST VISIT POPUP
   ========================================== */

(() => {
   

    // Admission popup only on the homepage.
    const page = window.location.pathname.toLowerCase();

    const isHomePage =
        page === "/" ||
        page.endsWith("/index.html");

    if (!isHomePage) return;


    // Create popup automatically on every page
    const popup = document.createElement("dialog");
    popup.className = "admission-popup";
    popup.setAttribute(
        "aria-labelledby",
        "admissionPopupTitle"
    );

    popup.innerHTML = `
      <div class="admission-popup__inner">

        <button class="admission-popup__close"
                type="button"
                aria-label="Close enquiry popup">
          &times;
        </button>

        <p class="admission-popup__label">
          ADMISSIONS · MADHA COLLEGE
        </p>

        <h2 id="admissionPopupTitle">
          Start your journey with us.
        </h2>

        <p class="admission-popup__desc">
          Interested in joining Madha Arts & Science
          College? Share your details to enquire.
        </p>

        <form class="admission-popup__form">

          <div class="admission-popup__field">
            <label for="popupName">Full Name *</label>
            <input id="popupName" name="name"
                   type="text"
                   placeholder="Enter your name"
                   autocomplete="name" required>
          </div>

          <div class="admission-popup__field">
            <label for="popupEmail">Email Address *</label>
            <input id="popupEmail" name="email"
                   type="email"
                   placeholder="you@example.com"
                   autocomplete="email" required>
          </div>

          <div class="admission-popup__field">
            <label for="popupPhone">Mobile Number *</label>
            <input id="popupPhone" name="phone"
                   type="tel"
                   placeholder="10-digit mobile number"
                   pattern="[0-9]{10}"
                   title="Enter a 10-digit mobile number"
                   autocomplete="tel" required>
          </div>

          <div class="admission-popup__field">
            <label for="popupCourse">
              Interested Programme *
            </label>
            <select id="popupCourse" name="course" required>
              <option value="">Select programme</option>
              <option>B.Com</option>
              <option>B.B.A</option>
              <option>B.C.A</option>
              <option>B.Sc Computer Science</option>
              <option>B.Sc Biotechnology</option>
              <option>B.Sc Mathematics</option>
              <option>B.A English</option>
              <option>Hotel & Catering Management</option>
              <option>Other / Please advise</option>
            </select>
          </div>

          <button class="admission-popup__submit"
                  type="submit">
            Prepare Enquiry Email ↗
          </button>

        </form>

        <p class="admission-popup__note">
          Your email application will open.
          Please review and send your enquiry.
        </p>

        <button class="admission-popup__later"
                type="button">
          Maybe later
        </button>

      </div>
    `;

    document.body.appendChild(popup);

    function closePopup() {
        popup.close();
    }

    popup.querySelector(
        ".admission-popup__close"
    ).addEventListener("click", closePopup);

    popup.querySelector(
        ".admission-popup__later"
    ).addEventListener("click", closePopup);

    popup.addEventListener("click", (event) => {
        if (event.target === popup) closePopup();
    });

    // Email preparation
    popup.querySelector("form").addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const form = event.currentTarget;
            if (!form.reportValidity()) return;

            const data = new FormData(form);

            const name = String(data.get("name")).trim();
            const email = String(data.get("email")).trim();
            const phone = String(data.get("phone")).trim();
            const course = String(data.get("course")).trim();

            const subject = "Admission Enquiry - " + name;

            const body = [
                "ADMISSION ENQUIRY",
                "",
                "Student Name: " + name,
                "Email: " + email,
                "Mobile: " + phone,
                "Interested Programme: " + course,
                "",
                "Sent from Madha College website"
            ].join("\n");

            const mailto =
                "mailto:madhaasc@gmail.com" +
                "?subject=" + encodeURIComponent(subject) +
                "&body=" + encodeURIComponent(body);

            window.location.href = mailto;
            closePopup();
        }
    );

 

    if (typeof popup.showModal === "function") {
        popup.showModal();
    } else {
        popup.remove();
    }
})();
