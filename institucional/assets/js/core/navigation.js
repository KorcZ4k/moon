export function initNavigation(){
  const button=document.querySelector('.mobile-menu-button');
  const nav=document.querySelector('.site-nav');
  if(!button||!nav)return;
  button.addEventListener('click',()=>{
    const open=document.body.classList.toggle('menu-open');
    button.setAttribute('aria-expanded',String(open));
  });
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>document.body.classList.remove('menu-open')));
}