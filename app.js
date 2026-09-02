// app.js - Frontend (navegador)
// Korczak Technologies - Versão com logs detalhados

(function() {
    "use strict";

    console.log('🚀 Korczak Technologies - app.js carregado!');

    // ===================== CONFIGURAÇÃO =====================
    // DETECÇÃO AUTOMÁTICA DE AMBIENTE
    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'  // Desenvolvimento local
        : 'https://korczak-backend.onrender.com/api';  // Produção (Render)

    console.log(`📡 API URL: ${API_URL}`);

    // ===================== ELEMENTOS DO DOM =====================
    const form = document.getElementById('formOrcamento');
    const btnEnviar = document.getElementById('btnEnviar');

    const campoNome = document.getElementById('nome');
    const campoEmail = document.getElementById('email');
    const campoTelefone = document.getElementById('telefone');
    const campoServico = document.getElementById('servico');
    const campoMensagem = document.getElementById('mensagem');

    console.log('📋 Elementos do formulário:', {
        form: !!form,
        nome: !!campoNome,
        email: !!campoEmail,
        telefone: !!campoTelefone,
        servico: !!campoServico,
        mensagem: !!campoMensagem,
        btnEnviar: !!btnEnviar
    });

    // ===================== FUNÇÕES AUXILIARES =====================

    /**
     * Mostra feedback visual para o usuário
     */
    function mostrarFeedback(tipo, mensagem) {
        console.log(`💬 Feedback: [${tipo}] ${mensagem}`);
        
        // Remove feedback anterior
        const antigo = document.querySelector('.feedback-orcamento');
        if (antigo) antigo.remove();

        // Cria novo feedback
        const div = document.createElement('div');
        div.className = 'feedback-orcamento';
        div.style.marginTop = '1.2rem';
        div.style.padding = '0.8rem 1.2rem';
        div.style.borderRadius = '30px';
        div.style.fontWeight = '500';
        div.style.textAlign = 'center';
        div.style.animation = 'fadeIn 0.3s ease';

        if (tipo === 'sucesso') {
            div.style.background = '#e0f2e6';
            div.style.color = '#0b4d2a';
            div.style.border = '1px solid #a8d5ba';
            div.innerHTML = `<i class="fas fa-check-circle" style="margin-right:8px;"></i> ${mensagem}`;
        } else if (tipo === 'erro') {
            div.style.background = '#fee9e7';
            div.style.color = '#8f2a1f';
            div.style.border = '1px solid #f5c6c2';
            div.innerHTML = `<i class="fas fa-exclamation-circle" style="margin-right:8px;"></i> ${mensagem}`;
        } else if (tipo === 'carregando') {
            div.style.background = '#e8f0fe';
            div.style.color = '#1a3f62';
            div.style.border = '1px solid #b8d0e8';
            div.innerHTML = `<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> ${mensagem}`;
        }

        form.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Valida os campos do formulário
     */
    function validarFormulario() {
        console.log('🔍 Validando formulário...');
        
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

        console.log('✅ Formulário válido!');
        return true;
    }

    /**
     * Limpa o formulário após envio
     */
    function limparFormulario() {
        form.reset();
        const feedback = document.querySelector('.feedback-orcamento');
        if (feedback) feedback.remove();
    }

    // ===================== FUNÇÃO DE ENVIO =====================

    /**
     * Envia os dados para o backend
     */
    async function enviarOrcamento(dados) {
        console.log('🚀 1. FUNÇÃO enviarOrcamento INICIADA');
        console.log('📤 2. URL:', `${API_URL}/orcamentos`);
        console.log('📦 3. Dados:', dados);

        try {
            const response = await fetch(`${API_URL}/orcamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            console.log('📥 4. STATUS DA RESPOSTA:', response.status);
            console.log('📥 5. RESPONSE OK?', response.ok);
            console.log('📥 6. HEADERS:', response.headers);

            // Tenta parsear a resposta como JSON
            let respostaJson;
            try {
                respostaJson = await response.json();
            } catch (e) {
                console.error('❌ Erro ao parsear JSON:', e);
                throw new Error('Resposta inválida do servidor');
            }

            console.log('📥 7. RESPOSTA JSON:', respostaJson);

            // Verifica se a requisição foi bem sucedida
            if (!response.ok) {
                const mensagemErro = respostaJson.erro || respostaJson.mensagem || 'Erro ao enviar orçamento';
                throw new Error(mensagemErro);
            }

            return respostaJson;

        } catch (error) {
            console.error('❌ 8. ERRO NA REQUISIÇÃO:', error);
            throw error;
        }
    }

    // ===================== HANDLER DO FORMULÁRIO =====================

    // Verifica se o formulário existe antes de adicionar o evento
    if (!form) {
        console.error('❌ Formulário com ID "formOrcamento" não encontrado!');
        return;
    }

    form.addEventListener('submit', async function(event) {
        console.log('📝 FORMULÁRIO SUBMETIDO!');
        event.preventDefault();

        // Valida o formulário
        console.log('🔍 Validando...');
        if (!validarFormulario()) {
            console.log('❌ Validação falhou');
            return;
        }
        console.log('✅ Validação passou!');

        // Desabilita o botão e mostra estado de carregamento
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Enviando...';
        mostrarFeedback('carregando', 'Enviando seu orçamento...');

        // Coleta os dados do formulário
        const dados = {
            nome: campoNome.value.trim(),
            email: campoEmail.value.trim(),
            telefone: campoTelefone.value.trim(),
            servico: campoServico.value,
            mensagem: campoMensagem.value.trim()
        };

        console.log('📦 Dados coletados:', dados);

        try {
            // Envia para o backend
            const resposta = await enviarOrcamento(dados);
            console.log('✅ Sucesso!', resposta);
            
            // Sucesso!
            const mensagemSucesso = resposta.mensagem || 'Orçamento enviado com sucesso!';
            const id = resposta.dados?.id || 'N/A';
            mostrarFeedback('sucesso', `✅ ${mensagemSucesso} (ID: ${id})`);
            
            // Se tiver link do WhatsApp, abre automaticamente
            if (resposta.linkWhatsApp) {
                console.log('💬 Abrindo WhatsApp...');
                setTimeout(() => {
                    window.open(resposta.linkWhatsApp, '_blank');
                }, 1500);
            }

            // Limpa o formulário
            limparFormulario();

        } catch (error) {
            // Erro ao enviar
            console.error('❌ Erro final:', error);
            mostrarFeedback('erro', `❌ ${error.message || 'Erro ao enviar orçamento. Tente novamente.'}`);
        } finally {
            // Reabilita o botão
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i> Enviar orçamento';
        }
    });

    // ===================== MÁSCARA PARA TELEFONE =====================

    if (campoTelefone) {
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
    }

    // ===================== ANIMAÇÃO SUAVE PARA LINKS =====================

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

    // ===================== VERIFICA CONECTIVIDADE COM BACKEND =====================

    async function verificarBackend() {
        console.log('🔍 Verificando conectividade com o backend...');
        try {
            const response = await fetch(`${API_URL}/saude`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const dados = await response.json();
            console.log('✅ Backend conectado:', dados);
            
            // Verifica se o MongoDB está conectado
            if (dados.mongo && dados.mongo.conectado) {
                console.log('✅ MongoDB: CONECTADO');
            } else {
                console.warn('⚠️ MongoDB: DESCONECTADO');
            }
            
        } catch (error) {
            console.error('❌ Backend OFFLINE:', error.message);
            mostrarFeedback('erro', '⚠️ Servidor offline. Tente novamente mais tarde.');
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
        API_URL,
        verificarBackend
    };

    console.log('✅ app.js totalmente carregado!');
    console.log('🛠️ Para debug, use: window.Korczak');
    console.log('📝 Exemplo: Korczak.verificarBackend()');

})();
