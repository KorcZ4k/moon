import { initNavigation } from './navigation.js';

document.addEventListener('DOMContentLoaded',()=>{
  const root=document.body;
  const header=document.querySelector('[data-site-header]');
  const footer=document.querySelector('[data-site-footer]');
  const base='./';
  if(header){
    header.className='site-header';
    header.innerHTML=`<a class="brand" href="${base}index.html"><span class="brand-mark">KZ</span><span class="brand-name">KORCZAK TECHNOLOGIES</span></a><button class="mobile-menu-button" type="button" aria-label="Abrir menu" aria-expanded="false">MENU</button><nav class="site-nav" aria-label="Navegação principal"><a href="${base}index.html">A Korczak Tech</a><a href="${base}franquias.html">Franquias</a><a href="../servicos/">Serviços</a><a href="${base}portfolio.html">Portfólio</a><a href="${base}sobre.html">Sobre Nós</a><a href="${base}contato.html">Contato</a><a class="btn btn-profile" href="../area-cliente.html">Meu perfil</a></nav>`;
  }
  if(footer){
    footer.className='site-footer';
    footer.innerHTML=`<div><strong>KZ</strong> Korczak Technologies</div><div class="footer-contact"><a href="mailto:KZTechnologies@gmail.com">E-mail</a><a href="https://wa.me/5511954083183">WhatsApp</a><a href="https://www.instagram.com/korczak_.tech/" target="_blank" rel="noopener">Instagram</a><a href="https://www.facebook.com/korczak_.tech" target="_blank" rel="noopener">Facebook</a><span>LinkedIn: Korczak Technologies</span></div><div><a href="../termosserv/">Termos</a> · <a href="../politicapriv/">Privacidade</a> · © ${new Date().getFullYear()}</div>`;
  }
  initNavigation(root);
});