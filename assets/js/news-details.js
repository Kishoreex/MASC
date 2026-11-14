/* Public news/event detail page. Never inject untrusted post text as HTML. */
(() => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const message = document.getElementById('details-message');
  const title = document.getElementById('details-title');
  const article = document.getElementById('details-article');
  if (!id || !/^[1-9]\d*$/.test(id)) {
    title.textContent = 'Post not found';
    message.textContent = 'This News or Events link is invalid.';
    return;
  }
  fetch('/api/updates/' + encodeURIComponent(id), {cache:'no-store'})
    .then(async response => {
      if (response.status === 404) throw new Error('This post is unavailable or no longer published.');
      if (!response.ok) throw new Error('Unable to load this post at the moment.');
      return response.json();
    })
    .then(post => {
      const type = post.Type === 'event' ? 'COLLEGE EVENT' : 'COLLEGE NEWS';
      document.getElementById('details-type').textContent = type;
      title.textContent = post.Title;
      document.title = post.Title + ' | Madha Arts & Science College';
      const rawDate = post.EventDate || post.CreatedAt;
      if (rawDate) {
        const date = new Date(rawDate);
        if (!Number.isNaN(date.valueOf())) {
          document.getElementById('details-date').textContent = date.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
        }
      }
      document.getElementById('details-summary').textContent = post.Summary;
      const img = document.getElementById('details-image');
      if (post.ImagePath && /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(post.ImagePath)) {
        img.src = post.ImagePath;
        img.alt = post.Title;
        img.hidden = false;
      }
      article.hidden = false;
      message.hidden = true;
    })
    .catch(err => {
      title.textContent = 'Post unavailable';
      message.textContent = err.message;
    });
})();
