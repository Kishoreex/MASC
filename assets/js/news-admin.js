(() => {
  const $=id=>document.getElementById(id);
  const status=message=>{$('adminStatus').textContent=message;};
  const dashboard=on=>{$('adminLogin').classList.toggle('admin-hidden',on);$('dashboard').classList.toggle('admin-hidden',!on);};
  async function api(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',...options});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||'Request failed');return data;
  }
  function button(label,cl,handler){const el=document.createElement('button');el.type='button';el.className='admin-btn '+cl;el.textContent=label;el.addEventListener('click',handler);return el;}
  async function load(){
    const posts=await api('/api/admin/updates');const list=$('postList');list.replaceChildren();
    if(!posts.length){list.textContent='No updates yet. Add the first one above.';return;}
    for(const p of posts){
      const article=document.createElement('article');article.className='admin-post';
      const content=document.createElement('div');const category=document.createElement('small');category.textContent=`${p.Type.toUpperCase()} · ${p.Published?'PUBLISHED':'DRAFT'}`;
      const title=document.createElement('h3');title.textContent=p.Title;const desc=document.createElement('p');desc.textContent=p.Summary;
      content.append(category,title,desc);
      const actions=document.createElement('div');actions.className='admin-actions';
      actions.append(button(p.Published?'Unpublish':'Publish','alt',async()=>{
        try{await api('/api/admin/updates/'+p.Id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({published:!p.Published})});status('Status updated');await load();}catch(e){status(e.message);}
      }));
      actions.append(button('Delete','danger',async()=>{
        if(!confirm('Permanently delete this update?'))return;
        try{await api('/api/admin/updates/'+p.Id,{method:'DELETE'});status('Deleted');await load();}catch(e){status(e.message);}
      }));article.append(content,actions);list.append(article);
    }
  }
  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();status('Signing in...');
    try{await api('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('username').value,password:$('password').value})});$('password').value='';dashboard(true);status('Signed in');await load();}catch(err){status(err.message);}
  });
  $('postForm').addEventListener('submit',async e=>{
    e.preventDefault();const data=new FormData(e.currentTarget);status('Saving...');
    try{await api('/api/admin/updates',{method:'POST',body:data});$('postForm').reset();status('Saved successfully');await load();}catch(err){status(err.message);}
  });
  $('logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST'});}catch(e){}dashboard(false);status('Signed out');});
  api('/api/admin/me').then(()=>{dashboard(true);load().catch(e=>status(e.message));}).catch(()=>dashboard(false));
})();



/* LOGIN PASSWORD VISIBILITY */

(() => {
    const button = document.querySelector(
        ".login-password-toggle"
    );

    const password = document.getElementById("password");

    if (!button || !password) return;

    button.addEventListener("click", () => {
        const isVisible = password.type === "text";

        password.type = isVisible
            ? "password"
            : "text";

        button.textContent = isVisible
            ? "Show"
            : "Hide";

        button.setAttribute(
            "aria-pressed",
            String(!isVisible)
        );

        button.setAttribute(
            "aria-label",
            isVisible ? "Show password" : "Hide password"
        );
    });
})();
