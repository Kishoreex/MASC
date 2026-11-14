/* Visual enhancements only. Authentication and publish API stay in news-admin.js. */
(() => {
  const dashboard = document.getElementById('dashboard');
  const list = document.getElementById('postList');
  const form = document.getElementById('postForm');
  if (!dashboard || !list || !form) return;

  // Place the overview inside the dashboard, without replacing original elements.
  const overview = document.createElement('div');
  overview.className = 'md-overview';
  overview.setAttribute('aria-label','Published content overview');
  const metrics = [
    ['All updates','all'],['News','news'],['Events','event'],['Published','published']
  ];
  const metricValues = {};
  metrics.forEach(([label,key]) => {
    const stat = document.createElement('div');
    stat.className = 'md-stat';
    const caption = document.createElement('span');
    caption.className='md-stat__label'; caption.textContent=label;
    const number = document.createElement('strong');
    number.className='md-stat__value'; number.textContent='0';
    stat.append(caption,number);overview.append(stat);metricValues[key]=number;
  });
  dashboard.prepend(overview);

  // Filter existing DOM cards; the original code keeps control of the post list.
  const listPanel=list.closest('.admin-box');
  const bar=document.createElement('div');bar.className='md-listbar';
  const filterWrap=document.createElement('div');filterWrap.className='md-filters';
  const filters=[['All','all'],['News','news'],['Events','event'],['Drafts','draft']];
  let active='all';
  const buttons=[];
  filters.forEach(([label,key])=>{
    const btn=document.createElement('button');btn.type='button';btn.className='md-filter';
    btn.textContent=label;btn.setAttribute('aria-pressed',String(key==='all'));
    btn.addEventListener('click',()=>{active=key;buttons.forEach(([b,k])=>b.setAttribute('aria-pressed',String(k===active)));refresh();});
    filterWrap.append(btn);buttons.push([btn,key]);
  });
  bar.append(filterWrap);listPanel.insertBefore(bar,list);

  const empty=document.createElement('p');empty.className='md-empty';
  empty.textContent='No updates match this filter.';empty.hidden=true;
  listPanel.insertBefore(empty,list.nextSibling);

  function refresh(){
    const posts=[...list.querySelectorAll('.admin-post')];
    let news=0,events=0,published=0,shown=0;
    posts.forEach(post=>{
      const tag=post.querySelector('small');
      const raw=(tag?.textContent||'').toUpperCase();
      const kind=raw.startsWith('NEWS')?'news':raw.startsWith('EVENT')?'event':'other';
      const isDraft=raw.includes('DRAFT');
      if(kind==='news')news++;
      if(kind==='event')events++;
      if(!isDraft)published++;
      if(tag)tag.classList.toggle('md-draft',isDraft);
      const show=active==='all'||active===kind||(active==='draft'&&isDraft);
      post.hidden=!show;
      if(show)shown++;
    });
    metricValues.all.textContent=String(posts.length);
    metricValues.news.textContent=String(news);
    metricValues.event.textContent=String(events);
    metricValues.published.textContent=String(published);
    empty.hidden=posts.length===0||shown>0;
  }
  const observer=new MutationObserver(refresh);
  observer.observe(list,{childList:true});
  refresh();

  // Local file preview; not uploaded until staff clicks Save update.
  const photo=form.querySelector('#postImage');
  if(photo){
    const preview=document.createElement('div');preview.className='md-photo-preview';
    const img=document.createElement('img');img.alt='Selected upload preview';
    const name=document.createElement('span');preview.append(img,name);
    const submit=form.querySelector('button[type=submit]');
    const submitField=submit?.closest('.admin-field');
    form.insertBefore(preview,submitField||null);
    let objectUrl=null;
    const clear=()=>{if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}img.removeAttribute('src');name.textContent='';preview.classList.remove('is-visible');};
    photo.addEventListener('change',()=>{
      clear();const file=photo.files?.[0];if(!file)return;
      if(!['image/jpeg','image/png','image/webp'].includes(file.type))return;
      objectUrl=URL.createObjectURL(file);img.src=objectUrl;
      name.textContent=file.name;preview.classList.add('is-visible');
    });
    form.addEventListener('reset',()=>{clear();});
    window.addEventListener('pagehide',clear,{once:true});
  }
})();
