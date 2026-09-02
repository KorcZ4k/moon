<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Korczak Technologies · Matrix</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <!-- CABEÇALHO -->
  <header>
    <div class="container navbar">
      <div class="logo-area">
        <div class="logo-icon">K</div>
        <div class="logo-text">Korczak <span>Tech</span></div>
      </div>
      <div class="nav-links">
        <a href="#servicos">Serviços</a>
        <a href="#orcamento">Orçamento</a>
        <a href="#contato">Contato</a>
        <button class="btn-outline" onclick="document.getElementById('orcamento').scrollIntoView({behavior:'smooth'})">
          <i class="fas fa-paper-plane" style="margin-right:6px;"></i> Solicitar
        </button>
      </div>
    </div>
  </header>

  <main>
    <!-- HERO -->
    <section class="container hero" id="inicio">
      <div class="hero-content">
        <h1>Tecnologia com <i>propósito</i> social</h1>
        <p>
          A Korczak Technologies une desenvolvimento de software e impacto social.
          Soluções inovadoras para organizações, instituições e negócios que querem transformar.
        </p>
        <a href="#orcamento" class="btn-primario">
          <i class="fas fa-file-signature" style="margin-right:10px;"></i> Solicitar orçamento
        </a>
      </div>
      <div class="hero-image">
        <i class="fas fa-hand-holding-heart"></i>
        <p><i class="fas fa-check-circle" style="color:#00ff41;"></i> Pré-operacional · em construção</p>
        <p style="font-size:0.9rem; opacity:0.7; margin-top:0.2rem;">CNPJ em processo — já atendemos</p>
      </div>
    </section>

    <!-- SERVIÇOS -->
    <section class="container servicos" id="servicos">
      <h2>Nossos serviços</h2>
      <p class="servicos-desc">
        Da arquitetura de software à consultoria social, criamos pontes entre tecnologia e pessoas.
      </p>
      <div class="cards">
        <div class="card">
          <i class="fas fa-code"></i>
          <h3>Desenvolvimento web</h3>
          <p>Sites, aplicativos e sistemas personalizados com foco em performance e acessibilidade.</p>
        </div>
        <div class="card">
          <i class="fas fa-database"></i>
          <h3>Banco de dados & API</h3>
          <p>Modelagem, integração e segurança com MongoDB, SQL e RESTful APIs.</p>
        </div>
        <div class="card">
          <i class="fas fa-users"></i>
          <h3>Serviços sociais</h3>
          <p>Consultoria para ONGs, projetos comunitários e iniciativas de inclusão digital.</p>
        </div>
        <div class="card">
          <i class="fas fa-chart-line"></i>
          <h3>Landing pages</h3>
          <p>Páginas de conversão otimizadas para captar leads e apresentar sua ideia.</p>
        </div>
      </div>
    </section>

    <!-- ORÇAMENTO -->
    <section class="orcamento" id="orcamento">
      <div class="container orcamento-grid">
        <div class="orcamento-info">
          <h2><i class="fas fa-calculator"></i> Solicite um orçamento</h2>
          <p>
            Preencha o formulário e receba uma proposta personalizada para o seu projeto.
            Atendemos desde startups a organizações sociais.
          </p>
          <p><i class="fas fa-check-circle"></i> Resposta em até 24h</p>
          <p><i class="fas fa-check-circle"></i> Sem compromisso</p>
          <p style="margin-top:1.2rem;"><i class="fas fa-envelope"></i> contato@korczaktech.com</p>
        </div>

        <form class="form-orcamento" id="formOrcamento">
          <div class="form-group">
            <label for="nome">Nome completo</label>
            <input type="text" id="nome" placeholder="Seu nome" required />
          </div>
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required />
          </div>
          <div class="form-group">
            <label for="telefone">Telefone / WhatsApp</label>
            <input type="tel" id="telefone" placeholder="(11) 99999-9999" />
          </div>
          <div class="form-group">
            <label for="servico">Serviço de interesse</label>
            <select id="servico">
              <option value="desenvolvimento-web">Desenvolvimento web</option>
              <option value="banco-dados-api">Banco de dados / API</option>
              <option value="servicos-sociais">Serviços sociais</option>
              <option value="landing-page">Landing page</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label for="mensagem">Mensagem ou escopo inicial</label>
            <textarea id="mensagem" placeholder="Conte-nos sobre sua ideia, prazo ou necessidades..."></textarea>
          </div>
          <button type="submit" class="btn-enviar" id="btnEnviar">
            <i class="fas fa-paper-plane" style="margin-right:8px;"></i> Enviar orçamento
          </button>
          <p style="font-size:0.8rem; color:#666; margin-top:1rem; text-align:center;">
            <i class="fas fa-lock"></i> Seus dados estão seguros.
          </p>
        </form>
      </div>
    </section>
  </main>

  <!-- RODAPÉ -->
  <footer id="contato">
    <div class="container">
      <div class="footer-content">
        <div class="footer-col">
          <h4>Korczak Technologies</h4>
          <p>Inovação e responsabilidade social. Pré-operacional — construindo o futuro.</p>
        </div>
        <div class="footer-col">
          <h4>Contato</h4>
          <p><i class="fas fa-envelope" style="margin-right:8px;"></i> contato@korczaktech.com</p>
          <p><i class="fas fa-phone-alt"></i> +55 (11) 99999-9999</p>
        </div>
        <div class="footer-col footer-social">
          <h4>Redes</h4>
          <i class="fab fa-linkedin"></i>
          <i class="fab fa-instagram"></i>
          <i class="fab fa-github"></i>
          <i class="fab fa-youtube"></i>
        </div>
      </div>
      <div class="footer-copy">
        &copy; 2026 Korczak Technologies · todos os direitos reservados ·
        <span style="opacity:0.5;">CNPJ em processo</span>
      </div>
    </div>
  </footer>

  <!-- <script src="app.js"></script> -->
</body>
</html>
