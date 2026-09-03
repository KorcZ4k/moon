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

  function message(form, text, type = 'error') {
    const element = form?.querySelector('.form-message');
    if (!element) return;
    element.hidden = false;
    element.textContent = text;
    element.dataset.type = type;
  }

  async function api(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Ocorreu um erro na comunicação com o servidor.');
    return data;
  }

  budgetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = budgetForm.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(budgetForm).entries());
    submitButton?.setAttribute('disabled', 'disabled');
    if (submitButton) submitButton.textContent = 'Enviando...';
    try {
      const result = await api('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      budgetForm.reset();
      message(budgetForm, `Orçamento recebido. Seu ID de orçamento é: ${result.quoteId}. Guarde este número para vinculá-lo à sua conta.`, 'success');
    } catch (error) { message(budgetForm, error.message, 'error'); }
    finally { submitButton?.removeAttribute('disabled'); if (submitButton) submitButton.textContent = 'Solicitar orçamento'; }
  });

  const tabs = document.querySelectorAll('[data-auth-target]');
  const authForms = document.querySelectorAll('[data-auth-form]');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const target = tab.dataset.authTarget;
    tabs.forEach((item) => item.classList.toggle('active', item === tab));
    authForms.forEach((form) => form.classList.toggle('active', form.dataset.authForm === target));
  }));

  const signInForm = document.getElementById('signin-form');
  signInForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = signInForm.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Entrando...';
    try {
      const result = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(signInForm).entries())) });
      localStorage.setItem('kz_auth_token', result.token);
      localStorage.setItem('kz_user', JSON.stringify(result.user));
      message(signInForm, `Login realizado. Bem-vindo, ${result.user.nome}.`, 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 700);
    } catch (error) { message(signInForm, error.message, 'error'); }
    finally { button.disabled = false; button.textContent = 'Entrar'; }
  });

  const signUpForm = document.getElementById('signup-form');
  signUpForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = signUpForm.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(signUpForm).entries());
    if (data.senha !== data.confirmarSenha) return message(signUpForm, 'As senhas não coincidem.', 'error');
    delete data.confirmarSenha;
    data.userId = String(data.userId || '').replace(/\D/g, '');
    data.quoteId = String(data.quoteId || '').trim() || 'Pendente';
    if (data.quoteId !== 'Pendente') data.quoteId = data.quoteId.replace(/\D/g, '');
    button.disabled = true; button.textContent = 'Criando conta...';
    try {
      const result = await api('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      localStorage.setItem('kz_auth_token', result.token);
      localStorage.setItem('kz_user', JSON.stringify(result.user));
      message(signUpForm, `Conta criada com sucesso. Seu ID pessoal é ${result.user.userId}.`, 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (error) { message(signUpForm, error.message, 'error'); }
    finally { button.disabled = false; button.textContent = 'Criar conta'; }
  });
})();
