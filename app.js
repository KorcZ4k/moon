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

  menuButton?.addEventListener('click', () => setMenu(!sidebar?.classList.contains('open')));
  overlay?.addEventListener('click', () => setMenu(false));
  document.querySelectorAll('.side-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

  const year = new Date().getFullYear();
  document.querySelectorAll('#year, .footer-year').forEach((element) => { element.textContent = year; });

  budgetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = budgetForm.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(budgetForm).entries());

    if (!data.nome?.trim() || !data.email?.trim()) {
      showFormMessage('Preencha seu nome e e-mail antes de continuar.', 'error');
      return;
    }

    submitButton?.setAttribute('disabled', 'disabled');
    if (submitButton) submitButton.textContent = 'Enviando...';

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar o orçamento.');
      budgetForm.reset();
      showFormMessage('Solicitação recebida com sucesso. A Korczak Technologies analisará as informações enviadas.', 'success');
    } catch (error) {
      showFormMessage(error.message || 'Erro ao enviar a solicitação. Tente novamente.', 'error');
    } finally {
      submitButton?.removeAttribute('disabled');
      if (submitButton) submitButton.textContent = 'Solicitar orçamento';
    }
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
