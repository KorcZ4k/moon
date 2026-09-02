// app.js - Frontend (navegador)
// Responsável pela interação com o usuário e comunicação com a API

(function() {
    "use strict";

    // ===================== CONFIGURAÇÕES =====================
    // URL da API backend (ajuste conforme seu ambiente)
    // Para desenvolvimento local: 'http://localhost:3000/api'
    // Para produção: 'https://seu-backend.herokuapp.com/api'
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://korczak-backend.herokuapp.com/api';

    // ===================== ELEMENTOS DO DOM =====================
    const form = document.getElementById('formOrcamento');
    const btnEnviar = document.getElementById('btnEnviar');
    
    // Campos do formulário
    const campoNome = document.getElementById('nome');
    const campoEmail = document.getElementById('email');
    const campoTelefone = document.getElementById('telefone');
    const campoServico = document.getElementById('servico');
    const campoMensagem = document.getElementById('mensagem');

    // Elementos para feedback
    let feedbackElement = null;

    // ===================== FUNÇÕES AUXILIARES =====================

    // Função para mostrar mensagens de feedback
    function mostrarFeedback(tipo, mensagem) {
        // Remove feedback anterior se existir
        if (feedbackElement) {
            feedbackElement.remove();
            feedbackElement = null;
        }

        // Cria novo elemento de feedback
        feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback-orcamento';
        feedbackElement.style.marginTop = '1.2rem';
        feedbackElement.style.padding = '0.8rem 1.2rem';
        feedbackElement.style.borderRadius = '30px';
        feedbackElement.style.fontWeight = '500';
        feedbackElement.style.textAlign = 'center';
        feedbackElement.style.animation = 'fadeIn 0.3s ease';

        if (tipo === 'sucesso') {
            feedbackElement.style.background = '#e0f2e6';
            feedbackElement.style.color = '#0b4d2a';
            feedbackElement.style.border = '1px solid #a8d5ba';
            feedbackElement.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
        } else if (tipo === 'erro') {
            feedbackElement.style.background = '#fee9e7';
            feedbackElement.style.color = '#8f2a1f';
            feedbackElement.style.border = '1px solid #f5c6c2';
            feedbackElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensagem}`;
        } else if (tipo === 'carregando') {
            feedbackElement.style.background = '#e8f0fe';
            feedbackElement.style.color = '#1a3f62';
            feedbackElement.style.border = '1px solid #b8d0e8';
            feedbackElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${mensagem}`;
        }

        // Adiciona ao formulário
        form.appendChild(feedbackElement);
        
        // Rola para o feedback
        feedbackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Função para validar campos
    function validarFormulario() {
        const nome = campoNome.value.trim();
        const email = campoEmail.value.trim();
        const telefone = campoTelefone.value.trim();

        // Valida nome
        if (!nome || nome.length < 2) {
            mostrarFeedback('erro', 'Por favor, informe seu nome completo (mínimo 2 caracteres).');
            campoNome.focus();
            return false;
        }

        // Valida email
        if (!email || !email.includes('@') || !email.includes('.')) {
            mostrarFeedback('erro', 'Por favor, informe um e-mail válido (ex: nome@dominio.com).');
            campoEmail.focus();
            return false;
        }

        // Valida telefone (opcional, mas se preenchido deve ter pelo menos 10 dígitos)
        if (telefone && telefone.replace(/\D/g, '').length < 10) {
            mostrarFeedback('erro', 'Por favor, informe um telefone válido com DDD (ex: (11) 99999-9999).');
            campoTelefone.focus();
            return false;
        }

        return true;
    }

    // Função para limpar o formulário
    function limparFormulario() {
        form.reset();
        // Remove feedback
        if (feedbackElement) {
            feedbackElement.remove();
            feedbackElement = null;
        }
    }

    // ===================== FUNÇÃO DE ENVIO PARA O BACKEND =====================

    async function enviarOrcamento(dados) {
        try {
            // Faz a requisição para o backend
            const response = await fetch(`${API_URL}/orcamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            // Tenta parsear a resposta como JSON
            let respostaJson;
            try {
                respostaJson = await response.json();
            } catch (e) {
                throw new Error('Resposta inválida do servidor');
            }

            // Verifica se a requisição foi bem sucedida
            if (!response.ok) {
                // Extrai mensagem de erro da resposta
                const mensagemErro = respostaJson.erro || respostaJson.mensagem || 'Erro ao enviar orçamento';
                throw new Error(mensagemErro);
            }

            return respostaJson;

        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // ===================== HANDLER DO FORMULÁRIO =====================

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Valida o formulário antes de enviar
        if (!validarFormulario()) {
            return;
        }

        // Desabilita o botão e mostra estado de carregamento
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        mostrarFeedback('carregando', 'Enviando seu orçamento...');

        // Coleta os dados do formulário
        const dados = {
            nome: campoNome.value.trim(),
            email: campoEmail.value.trim(),
            telefone: campoTelefone.value.trim(),
            servico: campoServico.value,
            mensagem: campoMensagem.value.trim()
        };

        try {
            // Envia para o backend
            const resposta = await enviarOrcamento(dados);
            
            // Sucesso!
            mostrarFeedback('sucesso', 
                `✅ ${resposta.mensagem || 'Orçamento enviado com sucesso!'} `
                + `ID: ${resposta.dados?.id || 'N/A'}`
            );
            
            // Limpa o formulário após envio bem sucedido
            limparFormulario();

        } catch (error) {
            // Erro ao enviar
            mostrarFeedback('erro', 
                `❌ ${error.message || 'Erro ao enviar orçamento. Tente novamente.'}`
            );
        } finally {
            // Reabilita o botão
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i> Enviar orçamento';
        }
    });

    // ===================== MASCARAS PARA TELEFONE =====================

    // Máscara para telefone (formato (XX) XXXXX-XXXX)
    campoTelefone.addEventListener('input', function(e) {
        let valor = this.value.replace(/\D/g, '');
        if (valor.length > 11) valor = valor.slice(0, 11);
        
        if (valor.length > 0) {
            if (valor.length <= 2) {
                valor = `(${valor}`;
            } else if (valor.length <= 6) {
                valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
            } else if (valor.length <= 10) {
                valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
            } else {
                valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
            }
        }
        this.value = valor;
    });

    // ===================== ANIMAÇÃO AO ROLAR A PÁGINA =====================

    // Animação suave para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===================== INICIALIZAÇÃO =====================

    console.log('🚀 Korczak Technologies - Frontend carregado!');
    console.log(`📡 API URL: ${API_URL}`);
    console.log('📝 Formulário pronto para uso.');

    // Verifica conectividade com o backend
    async function verificarBackend() {
        try {
            const response = await fetch(`${API_URL}/saude`);
            if (response.ok) {
                const dados = await response.json();
                console.log('✅ Backend conectado:', dados);
            } else {
                console.warn('⚠️ Backend não respondeu corretamente');
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível conectar ao backend:', error.message);
            // Mostra aviso discreto para o usuário
            const aviso = document.createElement('div');
            aviso.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #fff3cd;
                color: #856404;
                padding: 12px 20px;
                border-radius: 12px;
                border: 1px solid #ffc107;
                font-size: 0.9rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                max-width: 300px;
            `;
            aviso.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                Modo offline: orçamentos serão salvos localmente.
                <button onclick="this.parentElement.remove()" style="margin-left:10px;background:none;border:none;font-weight:bold;cursor:pointer;">✕</button>
            `;
            document.body.appendChild(aviso);
            
            // Modo offline - salva no localStorage
            form.addEventListener('submit', function(e) {
                if (!navigator.onLine) {
                    e.preventDefault();
                    const dados = {
                        nome: campoNome.value.trim(),
                        email: campoEmail.value.trim(),
                        telefone: campoTelefone.value.trim(),
                        servico: campoServico.value,
                        mensagem: campoMensagem.value.trim(),
                        data: new Date().toISOString(),
                        offline: true
                    };
                    
                    // Salva no localStorage
                    const orcamentosOffline = JSON.parse(localStorage.getItem('orcamentosOffline') || '[]');
                    orcamentosOffline.push(dados);
                    localStorage.setItem('orcamentosOffline', JSON.stringify(orcamentosOffline));
                    
                    mostrarFeedback('sucesso', '✅ Orçamento salvo offline! Será enviado quando a conexão for restabelecida.');
                    limparFormulario();
                    btnEnviar.disabled = false;
                    btnEnviar.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i> Enviar orçamento';
                }
            });
        }
    }

    // Verifica backend após carregar
    verificarBackend();

    // ===================== CSS ADICIONAL (injetado dinamicamente) =====================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .feedback-orcamento {
            animation: fadeIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // ===================== EXPORTA FUNÇÕES GLOBAIS (para debug) =====================
    window.Korczak = {
        enviarOrcamento,
        validarFormulario,
        mostrarFeedback,
        limparFormulario,
        API_URL
    };

})();
