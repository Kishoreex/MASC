/* Public news / events archive, only published items returned by the API. */
(() => {
  const type = new URLSearchParams(location.search).get('type') === 'event' ? 'event' : 'news';
  const isNews = type === 'news';
  const title = isNews ? 'College News' : 'College Events';
  document.title = title + ' | Madha Arts & Science College';
  document.getElementById('updates-list-title').textContent = title;
  document.getElementById('updates-list-kicker').textContent = isNews ? 'LATEST UPDATES' : 'CAMPUS HAPPENINGS';
  document.getElementById('updates-list-description').textContent = isNews ? 'Latest announcements and news from our college.' : 'Explore activities and events from across our campus.';
  const status = document.getElementById('updates-list-status');
  const grid = document.getElementById('updates-list-grid');
  const node=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;};
  fetch('/api/updates',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('Updates are temporarily unavailable.');return r.json();})
    .then(posts=>{
      const selected = posts.filter(p=>p.Type===type);
      if(!selected.length){status.textContent='No '+(isNews?'news':'events')+' published yet. Check back soon.';return;}
      status.hidden=true;
      for(const post of selected){
        const card=node('article','updates-list-card');
        if(post.ImagePath && /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(post.ImagePath)){
          const img=node('img');img.src=post.ImagePath;img.alt='';img.loading='lazy';card.append(img);
        }
        const body=node('div','updates-list-card__body');
        const raw=post.EventDate||post.CreatedAt;
        if(raw){const date=new Date(raw);if(!isNaN(date.valueOf()))body.append(node('time','',date.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})));}



/* DATE AND DEPARTMENT — SAME LINE */

const departmentBadge = node(
    'span',
    'updates-department',
    post.Department || 'General'
);

const dateElement = body.querySelector('time');

if (dateElement) {
    const metaRow = document.createElement('div');
    metaRow.className = 'updates-card-meta';

    dateElement.parentNode.insertBefore(
        metaRow,
        dateElement
    );

    metaRow.appendChild(dateElement);
    metaRow.appendChild(departmentBadge);
} else {
    const metaRow = document.createElement('div');
    metaRow.className = 'updates-card-meta';

    metaRow.appendChild(departmentBadge);
    body.prepend(metaRow);
}


        body.append(node('h2','',post.Title),node('p','',post.Summary));
        const a=node('a','updates-list-link','View Details →');a.href='news-details.html?id='+encodeURIComponent(post.Id);
        a.setAttribute('aria-label','View details for '+post.Title);
        body.append(a);card.append(body);grid.append(card);
      }
    })
    .catch(e=>{status.textContent=e.message;});
})();



/* ==========================================
   NEWS & EVENTS — SCROLL CARD ANIMATIONS
   ========================================== */

(() => {
    const grid = document.querySelector(
        ".updates-list__grid"
    );

    if (!grid) return;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const revealCards = () => {
        const cards = grid.querySelectorAll(
            ".updates-list__card:not(.is-visible)"
        );

        if (!cards.length) return;

        if (reducedMotion.matches ||
            !("IntersectionObserver" in window)) {
            cards.forEach(card =>
                card.classList.add("is-visible")
            );
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "is-visible"
                        );
                        obs.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -30px 0px"
            }
        );

        cards.forEach((card, index) => {
            card.style.animationDelay =
                `${Math.min(index % 3, 2) * 120}ms`;
            observer.observe(card);
        });
    };

    // Handle dynamically loaded cards from SQL Server
    const mutationObserver = new MutationObserver(
        revealCards
    );

    mutationObserver.observe(grid, {
        childList: true
    });

    revealCards();
})();
