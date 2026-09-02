const menu=document.querySelector('.menu');
const sidebar=document.querySelector('.sidebar');

menu?.addEventListener('click',()=>{
  sidebar?.classList.toggle('open');
  menu.textContent=sidebar?.classList.contains('open')?'×':'☰';
});

document.querySelectorAll('.side-nav a').forEach(link=>{
  link.addEventListener('click',()=>{
    if(!link.href.includes('#')) return;
    sidebar?.classList.remove('open');
    if(menu) menu.textContent='☰';
  });
});

const year=new Date().getFullYear();
const mainYear=document.getElementById('year');
if(mainYear) mainYear.textContent=year;
document.querySelectorAll('.footer-year').forEach(el=>el.textContent=year);