/* Reads published SQL Server posts through the protected backend API. */
(() => {
  const host=document.getElementById('madha-updates');
  if(!host)return;
  const dateLabel=(v)=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.valueOf())?'':d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});};
  const make=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!=null)el.textContent=content;return el;};
  function group(type,items){
    const section=make('section','madha-updates__group');
    const head=make('div','madha-updates__header container');
    const wrap=make('div');wrap.append(make('p','madha-updates__eyebrow',type==='news'?'LATEST UPDATES':'CAMPUS HAPPENINGS'));
    wrap.append(make('h2','',type==='news'?'College News':'College Events'));head.append(wrap);
    const seeAll=make('a','madha-updates__all',type==='news'?'View All News →':'View All Events →');
    seeAll.href='updates.html?type='+encodeURIComponent(type);
    head.append(seeAll);section.append(head);
    if(!items.length){const empty=make('div','madha-updates__empty container',`No ${type} published yet. Check back soon.`);section.append(empty);return section;}
    const viewport=make('div','madha-updates__viewport');const track=make('div','madha-updates__track'+(type==='event'?' madha-updates__track--reverse':''));
    const copies=items.length>=2?[...items,...items]:items;
    if(items.length<2) track.style.animation='none';
    for(const [i,p] of copies.entries()){
      const card=make('article','madha-updates__card');if(i>=items.length)card.setAttribute('aria-hidden','true');
      if(p.ImagePath && /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p.ImagePath)){
        const img=make('img');img.src=p.ImagePath;img.alt='';img.loading='lazy';card.append(img);
      }
      const body=make('div','madha-updates__card-body');const time=make('time','',dateLabel(p.EventDate||p.CreatedAt));
  
const departmentBadge = make(
  'span',
  'madha-department',
  p.Department || 'General'
);

body.append(
  time,
  departmentBadge,
  make('h3', '', p.Title),
  make('p', '', p.Summary)
);

      card.append(body);
      if(i>=items.length) card.inert=true;
      track.append(card);
    }
    viewport.append(track);section.append(viewport);return section;
  }
  async function refresh(){
    try {
      const response=await fetch('/api/updates',{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const posts=await response.json();host.replaceChildren(group('news',posts.filter(x=>x.Type==='news')),group('event',posts.filter(x=>x.Type==='event')));
    }catch(e){host.replaceChildren(make('p','madha-updates__empty container','Latest news and events are temporarily unavailable.'));console.warn('News/events:',e.message);}
  }
  refresh();setInterval(()=>{if(!document.hidden)refresh();},60000);
})();
