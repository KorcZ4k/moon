(() => {
  'use strict';

  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.querySelector('.menu');
  const overlay = document.querySelector('.menu-overlay');
  const budgetForm = document.querySelector('.budget-form');

  const setMenu = (open) => {
    sidebar?.classList.toggle('open', open);
    overlay?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  menuButton?.addEventListener('click', () => {
    setMenu(!sidebar?.classList.contains('open'));
  });

  overlay?.addEventListener('click', () => setMenu(false));

  document.querySelectorAll('.side-nav a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  const year = new Date().getFullYear();
  document.querySelectorAll('#year, .footer-year').forEach((element) => {
    element.textContent = year;
  });

  budgetForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(budgetForm);
    const name = data.get('nome')?.trim();
    const email = data.get('email')?.trim();

    if (!name || !email) {
      showFormMessage('Preencha seu nome e e-mail antes de continuar.', 'error');
      return;
    }

    showFormMessage('Solicitação recebida. A integração automática de envio ainda precisa ser configurada.', 'success');
  });

  function showFormMessage(message, type) {
    if (!budgetForm) return;
    let element = budgetForm.querySelector('.form-message');
    if (!element) {
      element = document.createElement('p');
      element.className = 'form-message';
      budgetForm.appendChild(element);
    }
    element.textContent = message;
    element.dataset.type = type;
  }
})();