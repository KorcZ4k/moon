(() => {
  'use strict';

  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.querySelector('.menu');
  const budgetForm = document.querySelector('.budget-form');

  // Sidebar mobile
  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    if (menuButton) {
      menuButton.textContent = '☰';
      menuButton.setAttribute('aria-label', 'Abrir menu');
    }
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = sidebar?.classList.toggle('open');
    menuButton.textContent = isOpen ? '×' : '☰';
    menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  document.querySelectorAll('.side-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1000) closeSidebar();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSidebar();
  });

  // Ano automático
  const year = new Date().getFullYear();
  document.querySelectorAll('#year, .footer-year').forEach((element) => {
    element.textContent = year;
  });

  // Formulário de orçamento
  budgetForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(budgetForm);
    const name = data.get('nome')?.trim();
    const email = data.get('email')?.trim();
    const service = data.get('servico');
    const project = data.get('projeto')?.trim();

    if (!name || !email) {
      showFormMessage('Preencha seu nome e e-mail antes de continuar.', 'error');
      return;
    }

    // O formulário está preparado para receber uma integração futura
    // com e-mail, API, banco de dados ou serviço de orçamento.
    console.log('Solicitação de orçamento:', {
      name,
      email,
      service,
      project,
    });

    showFormMessage(
      'Solicitação registrada localmente. A integração de envio ainda precisa ser configurada.',
      'success'
    );
  });

  function showFormMessage(message, type) {
    if (!budgetForm) return;

    let messageElement = budgetForm.querySelector('.form-message');

    if (!messageElement) {
      messageElement = document.createElement('p');
      messageElement.className = 'form-message';
      budgetForm.appendChild(messageElement);
    }

    messageElement.textContent = message;
    messageElement.dataset.type = type;
  }
})();