/**
 * @file TeacherTutorialScene.js
 * @description Tutorial interativo do professor: 7 slides cobrindo todas as
 * funcionalidades do painel docente. Mockup visual à esquerda, texto à direita.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

// ─── Dados dos slides ────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: 'Bem-vindo, Professor!',
    desc:
      'Este painel foi criado para você acompanhar suas turmas.\n\n' +
      'Com ele você pode:\n\n' +
      '🏫  Criar e gerenciar até 5 turmas\n' +
      '👥  Ver e remover alunos de cada turma\n' +
      '📝  Importar e editar questões por fase\n' +
      '📊  Acompanhar o desempenho individual e coletivo\n\n' +
      'Use este tutorial para conhecer cada funcionalidade antes de começar.'
  },
  {
    title: 'Suas Turmas',
    desc:
      'Na tela de perfil você gerencia todas as suas turmas.\n\n' +
      '➕  "+ Criar Turma" — cria uma nova turma com um código único gerado automaticamente.\n\n' +
      '🗑  "Excluir" — remove permanentemente a turma e todos os seus dados.\n\n' +
      'Clique no card de uma turma para acessá-la e gerenciar os alunos.\n\n' +
      'Limite máximo: 5 turmas simultâneas.'
  },
  {
    title: 'Gerenciando a Turma',
    desc:
      'Dentro da turma você encontra:\n\n' +
      'Código de entrada — compartilhe com seus alunos para eles entrarem na turma.\n\n' +
      'Card do aluno — clique para ver o perfil e o histórico de partidas.\n\n' +
      '"Expulsar" — remove o aluno da turma imediatamente.\n\n' +
      'Use os botões no topo para navegar para Questões ou Dashboard.'
  },
  {
    title: 'Questões por Fase',
    desc:
      'Em Questões você gerencia o banco de perguntas da turma.\n\n' +
      'As 5 abas correspondem aos 4 tipos de lista + "Todas as Listas".\n\n' +
      'Importar JSON — abre seletor de arquivo JSON com as questões.\n\n' +
      'Editar — modifica uma questão existente em popup.\n\n' +
      'Remover — exclui uma questão individualmente.\n\n' +
      '"Remover Todas" — limpa todas as questões da aba ativa.'
  },
  {
    title: 'Gerando Questões com IA',
    desc:
      'Sem questões? Use "Ver Formato" para abrir o assistente.\n\n' +
      'O modal mostra:\n\n' +
      '📋  O formato JSON exato para importação\n' +
      '🤖  Um prompt pronto para colar em uma IA (ChatGPT, Gemini, etc.)\n\n' +
      'Passo a passo:\n' +
      '1. Clique "Copiar Prompt"\n' +
      '2. Cole em uma IA generativa\n' +
      '3. Salve a resposta como arquivo .json\n' +
      '4. Clique "Importar" e selecione o arquivo'
  },
  {
    title: 'Dashboard de Desempenho',
    desc:
      'No Dashboard acompanhe o desempenho da turma por fase.\n\n' +
      'Filtre usando as abas no topo.\n\n' +
      'Painel esquerdo — Tabela de alunos:\n' +
      '🥇  Ranking dos melhores\n' +
      '✔  Vitórias e Derrotas por fase\n' +
      '📊  Porcentagem de acerto\n\n' +
      'Painel direito — Resumo da turma:\n' +
      'Média geral, total de partidas, melhor aluno e participantes.'
  },
  {
    title: 'Fluxo de Navegação',
    desc:
      'Resumo do fluxo do painel professor:\n\n' +
      '1. Perfil → suas turmas\n' +
      '2. Turma → alunos + código de entrada\n' +
      '3. Questões → importar e editar por fase\n' +
      '4. Dashboard → desempenho dos alunos\n\n' +
      'Dica: o código da turma aparece na tela da turma. Compartilhe-o com seus alunos para que entrem no jogo vinculados à sua turma!\n\n' +
      'Agora você está pronto para começar.'
  },
];

// ─── Cena ────────────────────────────────────────────────────────────────────

export class TeacherTutorialScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._slide       = 0;
    this._totalSlides = SLIDES.length;
    this._anim        = 0;

    this._btnPrev = null;
    this._btnNext = null;
    this._btnSkip = null;
  }

  enter(params) {
    this._slide = (params && params.slide != null) ? params.slide : 0;
    this._anim  = 0;
    this._setupButtons();
  }

  exit() {
    this.input.clearButtons();
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    this._drawBg(r);
    this._drawPanels(r);
    this._drawMockup(r, this._slide);
    this._drawPanel(r, this._slide);
    this._drawNav(r);
  }

  // ── Botões ─────────────────────────────────────────────────────────────────

  _setupButtons() {
    this.input.clearButtons();

    const isFirst = this._slide === 0;
    const isLast  = this._slide === this._totalSlides - 1;

    this._btnPrev = { x: 20, y: 640, w: 160, h: 44 };
    if (!isFirst) {
      this.input.addButton(this._btnPrev, () => {
        this._slide--;
        this._setupButtons();
      });
    }

    this._btnNext = { x: 1080, y: 640, w: 180, h: 44 };
    this.input.addButton(this._btnNext, () => {
      if (isLast) {
        this.manager.goto('teacherProfile');
      } else {
        this._slide++;
        this._setupButtons();
      }
    });

    this._btnSkip = { x: 1100, y: 14, w: 160, h: 38 };
    this.input.addButton(this._btnSkip, () => {
      this.manager.goto('teacherProfile');
    });
  }

  // ── Fundo ──────────────────────────────────────────────────────────────────

  _drawBg(r) {
    r.drawGradientBg('#04060f', '#080e1e');
    const seed = 99;
    for (let i = 0; i < 60; i++) {
      const sx    = ((seed * (i + 1) * 7919) % VIRTUAL_W);
      const sy    = ((seed * (i + 1) * 6271) % VIRTUAL_H);
      const sz    = 0.5 + (i % 3) * 0.7;
      const alpha = 0.15 + 0.25 * Math.abs(Math.sin(this._anim * 0.3 + i * 0.4));
      r.fillCircle(sx, sy, sz, '#aa88cc', alpha);
    }
  }

  // ── Painéis de fundo ───────────────────────────────────────────────────────

  _drawPanels(r) {
    r.fillRoundRect(20, 70, 670, 545, 12, 'rgba(5,10,25,0.85)');
    r.strokeRoundRect(20, 70, 670, 545, 12, '#2a1a4c', 1);

    r.fillRoundRect(730, 70, 530, 545, 12, 'rgba(5,10,25,0.85)');
    r.strokeRoundRect(730, 70, 530, 545, 12, '#2a1a4c', 1);
  }

  // ── Painel de texto ────────────────────────────────────────────────────────

  _drawPanel(r, slide) {
    const s  = SLIDES[slide];
    const px = 750;

    r.drawText(`${slide + 1} / ${this._totalSlides}`, px, 100, '#7a4abc', 13, 'left', 'Rajdhani');
    r.drawLine(px, 130, 1240, 130, '#2a1a5c', 1);
    r.drawTextShadow(s.title, px, 125, '#c44aff', 22, 'left', 'Rajdhani');

    const lines = s.desc.split('\n');
    let y = 160;
    for (const line of lines) {
      if (line === '') { y += 10; continue; }
      const maxW = 460;
      const words = line.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? current + ' ' + word : word;
        if (test.length * 8.5 > maxW && current) {
          r.drawText(current, px, y, '#b0cce0', 15, 'left', 'Rajdhani');
          y += 22;
          current = word;
        } else {
          current = test;
        }
      }
      if (current) {
        r.drawText(current, px, y, '#b0cce0', 15, 'left', 'Rajdhani');
        y += 22;
      }
    }
  }

  // ── Navegação ──────────────────────────────────────────────────────────────

  _drawNav(r) {
    const isFirst = this._slide === 0;
    const isLast  = this._slide === this._totalSlides - 1;

    // Pular Tutorial
    const sh = this.input.isHover(this._btnSkip);
    r.fillRoundRect(1100, 14, 160, 38, 8, sh ? 'rgba(60,20,80,0.95)' : 'rgba(20,5,35,0.80)');
    r.strokeRoundRect(1100, 14, 160, 38, 8, sh ? '#c44aff' : '#5a2a8a', sh ? 2 : 1);
    r.drawText('Pular Tutorial', 1180, 37, sh ? '#c44aff' : '#8a5aaa', 14, 'center', 'Rajdhani');

    // Anterior
    if (!isFirst) {
      const ph = this.input.isHover(this._btnPrev);
      r.fillRoundRect(20, 640, 160, 44, 8, ph ? 'rgba(30,10,55,0.95)' : 'rgba(10,3,22,0.80)');
      r.strokeRoundRect(20, 640, 160, 44, 8, ph ? '#c44aff' : '#3a1a6c', ph ? 2 : 1);
      r.drawText('◀ Anterior', 100, 666, ph ? '#c44aff' : '#8a5acc', 16, 'center', 'Rajdhani');
    }

    // Próximo / Concluir
    const nh    = this.input.isHover(this._btnNext);
    const label = isLast ? 'Concluir ▶' : 'Próximo ▶';
    r.fillRoundRect(1080, 640, 180, 44, 8, nh ? 'rgba(80,20,120,0.95)' : 'rgba(30,8,55,0.80)');
    r.strokeRoundRect(1080, 640, 180, 44, 8, nh ? '#c44aff' : '#6a2aaa', nh ? 2 : 1);
    r.drawText(label, 1170, 666, nh ? '#e088ff' : '#c44aff', 16, 'center', 'Rajdhani');

    // Dots indicadores
    const dotR      = 5, dotGap = 14;
    const dotsStart = VIRTUAL_W / 2 - ((this._totalSlides - 1) * dotGap) / 2;
    for (let i = 0; i < this._totalSlides; i++) {
      const active = i === this._slide;
      r.fillCircle(dotsStart + i * dotGap, 662, active ? dotR : dotR - 2,
        active ? '#c44aff' : '#3a1a5c', 1);
    }
  }

  // ── Mockup dispatcher ──────────────────────────────────────────────────────

  _drawMockup(r, slide) {
    const methods = [
      '_mockupWelcome',
      '_mockupClasses',
      '_mockupClassRoom',
      '_mockupQuestions',
      '_mockupAiPrompt',
      '_mockupDashboard',
      '_mockupFlow',
    ];
    if (this[methods[slide]]) this[methods[slide]](r);
  }

  // ── Mockup 0: Bem-vindo ────────────────────────────────────────────────────

  _mockupWelcome(r) {
    r.drawTextShadow('DATA EXPRESS', 355, 175, '#c44aff', 38, 'center', 'Rajdhani');
    r.drawText('Painel do Professor', 355, 213, '#9966cc', 20, 'center', 'Rajdhani');
    r.drawLine(90, 232, 620, 232, '#2a1a4c', 1);

    const cards = [
      { icon: '🏫', label: 'Turmas',     sub: 'Crie e gerencie', color: '#c44aff', x: 160, y: 330 },
      { icon: '👥', label: 'Alunos',     sub: 'Veja e remova',   color: '#44ccff', x: 550, y: 330 },
      { icon: '📝', label: 'Questões',   sub: 'Importe e edite', color: '#44ffaa', x: 160, y: 490 },
      { icon: '📊', label: 'Dashboard',  sub: 'Acompanhe tudo',  color: '#ffcc44', x: 550, y: 490 },
    ];
    for (const c of cards) {
      const cW = 230, cH = 120;
      const cx = c.x - cW / 2, cy = c.y - cH / 2;
      r.fillRoundRect(cx, cy, cW, cH, 12, 'rgba(10,5,25,0.92)');
      r.strokeRoundRect(cx, cy, cW, cH, 12, c.color, 2);
      r.drawText(c.icon, c.x, c.y - 18, c.color, 28, 'center', 'sans-serif');
      r.drawText(c.label, c.x, c.y + 14, c.color, 18, 'center', 'Rajdhani');
      r.drawText(c.sub, c.x, c.y + 35, '#7a8aaa', 12, 'center', 'Rajdhani');
    }

    // Connector lines
    r.drawLine(275, 330, 435, 330, '#3a1a5c', 1.5);
    r.drawLine(275, 490, 435, 490, '#3a1a5c', 1.5);
    r.drawLine(160, 390, 160, 430, '#3a1a5c', 1.5);
    r.drawLine(550, 390, 550, 430, '#3a1a5c', 1.5);
  }

  // ── Mockup 1: Suas Turmas ──────────────────────────────────────────────────

  _mockupClasses(r) {
    r.drawTextShadow('PROFESSOR — DOCENTE', 355, 115, '#c44aff', 20, 'center', 'Rajdhani');
    r.drawLine(50, 148, 660, 140, '#532583', 1);

    // Settings + Logout
    r.fillRoundRect(556, 93, 42, 42, 8, 'rgba(10,25,60,0.80)');
    r.strokeRoundRect(556, 93, 42, 42, 8, '#1a4a8c', 1);
    r.drawText('⚙', 577, 120, '#3a6a9c', 20, 'center', 'sans-serif');
    r.fillRoundRect(604, 93, 58, 42, 8, 'rgba(40,8,8,0.80)');
    r.strokeRoundRect(604, 93, 58, 42, 8, '#8c1a1a', 1);
    r.drawText('Sair', 633, 118, '#e68080', 13, 'center', 'Rajdhani');

    r.drawText('MINHAS TURMAS', 355, 165, '#c44aff', 15, 'center', 'Rajdhani');

    const classes = [
      { name: 'Turma A — Manhã',    count: 12 },
      { name: 'Turma B — Tarde',    count: 8  },
      { name: 'Turma C — Noturno',  count: 5  },
    ];
    let cy = 185;
    for (const cls of classes) {
      const cH = 68;
      r.fillRoundRect(50, cy, 600, cH, 8, 'rgba(15,5,30,0.90)');
      r.strokeRoundRect(50, cy, 600, cH, 8, '#532583', 1.5);
      r.drawText(cls.name, 72, cy + 32, '#d0e8ff', 17, 'left', 'Rajdhani');
      r.drawText(`${cls.count} alunos`, 72, cy + 50, '#7a8aaa', 12, 'left', 'Rajdhani');
      r.drawText('▶', 566, cy + 40, '#5a4a7a', 16, 'center', 'Rajdhani');
      r.fillRoundRect(576, cy + 18, 66, 32, 6, 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(576, cy + 18, 66, 32, 6, '#8c1a1a', 1);
      r.drawText('Excluir', 609, cy + 40, '#e68080', 11, 'center', 'Rajdhani');
      cy += cH + 10;
    }

    r.fillRoundRect(245, 425, 220, 48, 8, 'rgba(40,15,70,0.90)');
    r.strokeRoundRect(245, 425, 220, 48, 8, '#c44aff', 2);
    r.drawText('+ Criar Turma', 355, 453, '#c44aff', 16, 'center', 'Rajdhani');
    r.drawText('3 de 5 turmas utilizadas', 355, 495, '#7a4aaa', 13, 'center', 'Rajdhani');
  }

  // ── Mockup 2: Gerenciando a Turma ──────────────────────────────────────────

  _mockupClassRoom(r) {
    r.drawTextShadow('TURMA A — MANHÃ', 355, 108, '#c44aff', 22, 'center', 'Rajdhani');
    r.drawText('Código de entrada: TUR-4821', 355, 132, '#7a5aaa', 13, 'center', 'Rajdhani');
    r.drawLine(50, 148, 660, 148, '#532583', 1);

    // Nav buttons
    r.fillRoundRect(50, 93, 120, 40, 8, 'rgba(10,20,35,0.85)');
    r.strokeRoundRect(50, 93, 120, 40, 8, '#1a3a5c', 1.5);
    r.drawText('◀ Voltar', 110, 117, '#7aaccc', 13, 'center', 'Rajdhani');

    r.fillRoundRect(460, 93, 100, 40, 8, 'rgba(10,30,20,0.85)');
    r.strokeRoundRect(460, 93, 100, 40, 8, '#1a4a2a', 1.5);
    r.drawText('Questões', 510, 117, '#44cc88', 13, 'center', 'Rajdhani');

    r.fillRoundRect(568, 93, 100, 40, 8, 'rgba(10,20,45,0.85)');
    r.strokeRoundRect(568, 93, 100, 40, 8, '#1a2a5c', 1.5);
    r.drawText('Dashboard', 618, 117, '#4488cc', 13, 'center', 'Rajdhani');

    r.drawText('ALUNOS', 355, 172, '#ffcc44', 14, 'center', 'Rajdhani');

    const students = ['Ana Lima', 'Bruno Santos', 'Carla Mendes', 'Daniel Rocha', 'Eva Costa'];
    let sy = 190;
    for (const name of students) {
      const sH = 56;
      r.fillRoundRect(100, sy, 510, sH, 8, 'rgba(8,5,20,0.90)');
      r.strokeRoundRect(100, sy, 510, sH, 8, '#402871', 1.5);
      r.drawText(name, 122, sy + sH / 2 + 7, '#d0e8ff', 16, 'left', 'Rajdhani');
      r.fillRoundRect(513, sy + 10, 88, 32, 6, 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(513, sy + 10, 88, 32, 6, '#8c1a1a', 1);
      r.drawText('Expulsar', 557, sy + 30, '#e68080', 11, 'center', 'Rajdhani');
      sy += sH + 6;
    }
  }

  // ── Mockup 3: Questões ─────────────────────────────────────────────────────

  _mockupQuestions(r) {
    r.drawTextShadow('TURMA A — QUESTÕES', 355, 105, '#c44aff', 20, 'center', 'Rajdhani');
    r.drawLine(50, 122, 660, 122, '#532583', 1);

    r.fillRoundRect(50, 88, 96, 28, 8, 'rgba(10,20,35,0.85)');
    r.strokeRoundRect(50, 88, 96, 28, 8, '#1a3a5c', 1.5);
    r.drawText('◀ Voltar', 98, 106, '#7aaccc', 10, 'center', 'Rajdhani');

    r.fillRoundRect(460, 88, 96, 28, 8, 'rgba(10,25,18,0.85)');
    r.strokeRoundRect(460, 88, 96, 28, 8, '#1a4a2a', 1.5);
    r.drawText('Importar JSON', 508, 106, '#44cc88', 10, 'center', 'Rajdhani');

    r.fillRoundRect(564, 88, 96, 28, 8, 'rgba(25,20,8,0.85)');
    r.strokeRoundRect(564, 88, 96, 28, 8, '#4a3a0a', 1.5);
    r.drawText('Ver Formato', 612, 106, '#ccaa44', 10, 'center', 'Rajdhani');

    // Phase tabs
    const tabs      = ['Encadeada', 'Circular', 'Duplamente', 'Dupla Circ.', 'Todas'];
    const tabColors = ['#4a9eff', '#ff6b4a', '#4aff8c', '#c44aff', '#ffcc44'];
    const tW = 118, tGap = 6, tStartX = 50, tY = 132;
    for (let i = 0; i < tabs.length; i++) {
      const tx     = tStartX + i * (tW + tGap);
      const active = i === 0;
      r.fillRoundRect(tx, tY, tW, 30, 6, active ? `${tabColors[i]}33` : 'rgba(5,12,30,0.85)');
      r.strokeRoundRect(tx, tY, tW, 30, 6, active ? tabColors[i] : '#2a4a6a', active ? 2 : 1);
      r.drawText(tabs[i], tx + tW / 2, tY + 20, active ? tabColors[i] : '#7aaccc', 11, 'center', 'Rajdhani');
    }

    r.fillRoundRect(295, 170, 120, 24, 6, 'rgba(50,10,10,0.85)');
    r.strokeRoundRect(295, 170, 120, 24, 6, '#8c1a1a', 1);
    r.drawText('Remover Todas', 355, 186, '#e68080', 10, 'center', 'Rajdhani');

    const questions = [
      'O que é o ponteiro "head" em uma lista?',
      'Qual a complexidade de busca em lista encadeada?',
      'Como inserir um nó no início da lista?',
      'O que acontece ao remover o último nó?',
    ];
    let qy = 203;
    for (let i = 0; i < questions.length; i++) {
      const qH = 50;
      r.fillRoundRect(50, qy, 610, qH, 6, 'rgba(5,12,35,0.90)');
      r.strokeRoundRect(50, qy, 610, qH, 6, '#1a3a6c', 1);
      r.drawText(`${i + 1}.`, 65, qy + qH / 2 + 6, '#4a6a9a', 13, 'left', 'Rajdhani');
      const q = questions[i].length > 52 ? questions[i].slice(0, 52) + '…' : questions[i];
      r.drawText(q, 85, qy + qH / 2 + 6, '#b0cce0', 12, 'left', 'Rajdhani');
      r.fillRoundRect(488, qy + 9, 72, 28, 6, 'rgba(10,25,60,0.90)');
      r.strokeRoundRect(488, qy + 9, 72, 28, 6, '#1a4a8c', 1);
      r.drawText('Editar', 524, qy + 27, '#4a9eff', 10, 'center', 'Rajdhani');
      r.fillRoundRect(566, qy + 9, 80, 28, 6, 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(566, qy + 9, 80, 28, 6, '#8c1a1a', 1);
      r.drawText('Remover', 606, qy + 27, '#e68080', 10, 'center', 'Rajdhani');
      qy += qH + 6;
    }

    r.drawText('4 questões nesta fase', 355, 440, '#7a4aaa', 12, 'center', 'Rajdhani');
  }

  // ── Mockup 4: IA / Formato ─────────────────────────────────────────────────

  _mockupAiPrompt(r) {
    r.fillRoundRect(20, 70, 670, 545, 12, 'rgba(3,7,18,0.96)');

    const mW = 570, mH = 490;
    const mX = 355 - mW / 2, mY = 342 - mH / 2;
    r.fillRoundRect(mX, mY, mW, mH, 14, 'rgba(8,4,20,0.98)');
    r.strokeRoundRect(mX, mY, mW, mH, 14, '#c44aff', 2);

    r.fillRoundRect(mX + mW - 40, mY + 8, 32, 32, 8, 'rgba(50,10,10,0.9)');
    r.strokeRoundRect(mX + mW - 40, mY + 8, 32, 32, 8, '#8c1a1a', 1.5);
    r.drawText('✕', mX + mW - 24, mY + 29, '#ff8888', 14, 'center', 'Rajdhani');

    r.drawTextShadow('Formato JSON', 355, mY + 34, '#c44aff', 18, 'center', 'Rajdhani');
    r.drawLine(mX + 16, mY + 50, mX + mW - 16, mY + 50, '#3a1a5c', 1);

    const jsonLines = [
      '[',
      '  {',
      '    "text": "Pergunta aqui?",',
      '    "options": [',
      '      "Opção A",',
      '      "Opção B",',
      '      "Opção C",',
      '      "Opção D"',
      '    ],',
      '    "correct": 0',
      '  }',
      ']',
    ];
    r.fillRoundRect(mX + 16, mY + 58, mW - 32, 262, 8, 'rgba(2,5,15,0.97)');
    r.strokeRoundRect(mX + 16, mY + 58, mW - 32, 262, 8, '#1a3a6c', 1);
    let jy = mY + 76;
    for (const line of jsonLines) {
      r.drawText(line, mX + 28, jy, '#7acc88', 11, 'left', 'Rajdhani');
      jy += 18;
    }

    r.drawText('Prompt para IA (ChatGPT / Gemini):', 355, mY + 338, '#7aaccc', 12, 'center', 'Rajdhani');
    r.fillRoundRect(mX + 16, mY + 350, mW - 32, 60, 8, 'rgba(2,5,15,0.95)');
    r.strokeRoundRect(mX + 16, mY + 350, mW - 32, 60, 8, '#2a4a6a', 1);
    r.drawText('Gere 5 questões sobre Lista Encadeada...', 355, mY + 372, '#8ab4cc', 11, 'center', 'Rajdhani');
    r.drawText('...Retorne APENAS o array JSON.', 355, mY + 392, '#8ab4cc', 11, 'center', 'Rajdhani');

    r.fillRoundRect(255, mY + 425, 200, 36, 8, 'rgba(30,15,55,0.95)');
    r.strokeRoundRect(255, mY + 425, 200, 36, 8, '#c44aff', 2);
    r.drawText('📋 Copiar Prompt', 355, mY + 447, '#c44aff', 13, 'center', 'Rajdhani');
  }

  // ── Mockup 5: Dashboard ────────────────────────────────────────────────────

  _mockupDashboard(r) {
    r.drawTextShadow('DASHBOARD — TURMA A', 355, 105, '#4a9eff', 20, 'center', 'Rajdhani');
    r.drawLine(50, 130, 660, 130, '#1a3a5c', 1);

    r.fillRoundRect(50, 86, 120, 36, 8, 'rgba(10,20,35,0.85)');
    r.strokeRoundRect(50, 86, 120, 36, 8, '#1a3a5c', 1.5);
    r.drawText('◀ Voltar', 110, 108, '#7aaccc', 12, 'center', 'Rajdhani');

    const tabs      = ['Encadeada', 'Circular', 'Duplamente', 'Dupla Circ.', 'Todas'];
    const tabColors = ['#4a9eff', '#ff6b4a', '#4aff8c', '#c44aff', '#ffcc44'];
    const tW = 108, tGap = 8, tStartX = 69, tY = 140;
    for (let i = 0; i < tabs.length; i++) {
      const tx     = tStartX + i * (tW + tGap);
      const active = i === 0;
      r.fillRoundRect(tx, tY, tW, 28, 6, active ? `${tabColors[i]}33` : 'rgba(5,12,30,0.85)');
      r.strokeRoundRect(tx, tY, tW, 28, 6, active ? tabColors[i] : '#2a4a6a', active ? 2 : 1);
      r.drawText(tabs[i], tx + tW / 2, tY + 18, active ? tabColors[i] : '#7aaccc', 10, 'center', 'Rajdhani');
    }

    // Left panel: student table
    const lX = 50, lW = 390, topY = 178, panH = 375;
    r.fillRoundRect(lX, topY, lW, panH, 10, 'rgba(5,12,30,0.80)');
    r.strokeRoundRect(lX, topY, lW, panH, 10, '#1a3a5c', 1);
    r.drawText('ALUNOS', lX + lW / 2, topY + 18, '#4a9eff', 13, 'center', 'Rajdhani');
    r.drawLine(lX + 8, topY + 30, lX + lW - 8, topY + 30, '#1a3a5c', 1);

    const hY = topY + 46;
    r.drawText('Nome',     lX + 12,  hY, '#7aaccc', 11, 'left',   'Rajdhani');
    r.drawText('Vitórias', lX + 175, hY, '#7aaccc', 11, 'center', 'Rajdhani');
    r.drawText('Derrotas', lX + 250, hY, '#7aaccc', 11, 'center', 'Rajdhani');
    r.drawText('Acerto',   lX + 340, hY, '#7aaccc', 11, 'center', 'Rajdhani');
    r.drawLine(lX + 8, hY + 10, lX + lW - 8, hY + 10, '#1a3060', 1);

    const students = [
      { name: 'Ana Lima',     vit: 8, def: 1, acc: 88 },
      { name: 'Bruno Santos', vit: 6, def: 3, acc: 72 },
      { name: 'Carla Mendes', vit: 4, def: 4, acc: 50 },
      { name: 'Daniel Rocha', vit: 2, def: 5, acc: 38 },
      { name: 'Eva Costa',    vit: 1, def: 7, acc: 22 },
    ];
    const medals = ['🥇', '🥈', '🥉'];
    let ry = hY + 22;
    for (let i = 0; i < students.length; i++) {
      const stu = students[i];
      const mid = ry + 20;
      r.drawText(i < 3 ? medals[i] : `${i + 1}.`, lX + 10, mid, i === 0 ? '#ffcc44' : '#5a8aaa', 12, 'left', 'Rajdhani');
      r.drawText(stu.name, lX + 35, mid, i === 0 ? '#ffcc44' : '#d0e8ff', 13, 'left', 'Rajdhani');
      r.drawText(String(stu.vit), lX + 175, mid, '#44dd88', 13, 'center', 'Rajdhani');
      r.drawText(String(stu.def), lX + 250, mid, '#ff6666', 13, 'center', 'Rajdhani');
      const barC = stu.acc >= 70 ? '#44dd88' : stu.acc >= 40 ? '#ffcc44' : '#ff5555';
      r.drawProgressBar(lX + 295, ry + 10, 65, 12, stu.acc, 100, barC);
      r.drawText(`${stu.acc}%`, lX + 366, mid, '#d0e8ff', 11, 'left', 'Rajdhani');
      ry += 42;
    }

    // Right panel: aggregate
    const rX = 455, rW = 200;
    r.fillRoundRect(rX, topY, rW, panH, 10, 'rgba(5,12,30,0.80)');
    r.strokeRoundRect(rX, topY, rW, panH, 10, '#1a3a5c', 1);
    r.drawText('RESUMO', rX + rW / 2, topY + 18, '#4a9eff', 13, 'center', 'Rajdhani');
    r.drawLine(rX + 8, topY + 30, rX + rW - 8, topY + 30, '#1a3a5c', 1);

    let sY = topY + 54;
    r.drawText('Média de acerto', rX + rW / 2, sY, '#7aaccc', 11, 'center', 'Rajdhani');
    r.drawProgressBar(rX + 34, sY + 10, rW - 67, 16, 54, 100, '#44dd88');
    r.drawText('54%', rX + rW / 2, sY + 44, '#d0e8ff', 18, 'center', 'Rajdhani');
    sY += 68;
    r.drawLine(rX + 12, sY, rX + rW - 12, sY, '#1a3060', 1); sY += 16;
    r.drawText('Total de partidas', rX + rW / 2, sY, '#7aaccc', 11, 'center', 'Rajdhani');
    r.drawText('29', rX + rW / 2, sY + 22, '#d0e8ff', 24, 'center', 'Rajdhani');
    sY += 54;
    r.drawLine(rX + 12, sY, rX + rW - 12, sY, '#1a3060', 1); sY += 16;
    r.drawText('Melhor aluno', rX + rW / 2, sY, '#7aaccc', 11, 'center', 'Rajdhani');
    r.drawText('Ana Lima', rX + rW / 2, sY + 22, '#ffcc44', 16, 'center', 'Rajdhani');
    sY += 54;
    r.drawLine(rX + 12, sY, rX + rW - 12, sY, '#1a3060', 1); sY += 16;
    r.drawText('Participantes', rX + rW / 2, sY, '#7aaccc', 11, 'center', 'Rajdhani');
    r.drawText('5', rX + rW / 2, sY + 22, '#d0e8ff', 22, 'center', 'Rajdhani');
  }

  // ── Mockup 6: Fluxo ────────────────────────────────────────────────────────

  _mockupFlow(r) {
    r.drawTextShadow('Fluxo de Navegação', 355, 130, '#c44aff', 22, 'center', 'Rajdhani');
    r.drawLine(90, 150, 620, 150, '#2a1a4c', 1);

    const nodes = [
      { label: 'Perfil',     sub: 'Suas turmas',       color: '#c44aff', x: 355, y: 220 },
      { label: 'Turma',      sub: 'Alunos + Código',   color: '#44ccff', x: 355, y: 340 },
      { label: 'Questões',   sub: 'Importar / Editar', color: '#44ffaa', x: 195, y: 470 },
      { label: 'Dashboard',  sub: 'Desempenho',        color: '#ffcc44', x: 515, y: 470 },
    ];
    for (const n of nodes) {
      const nW = 180, nH = 60;
      r.fillRoundRect(n.x - nW / 2, n.y - nH / 2, nW, nH, 10, 'rgba(10,5,25,0.92)');
      r.strokeRoundRect(n.x - nW / 2, n.y - nH / 2, nW, nH, 10, n.color, 2);
      r.drawText(n.label, n.x, n.y - 6, n.color, 16, 'center', 'Rajdhani');
      r.drawText(n.sub, n.x, n.y + 14, '#7a8aaa', 11, 'center', 'Rajdhani');
    }

    // Arrow: Perfil → Turma
    const _arrowDown = (x, y1, y2, col) => {
      r.drawLine(x, y1, x, y2, col, 2);
      r.drawLine(x, y2, x - 6, y2 - 10, col, 2);
      r.drawLine(x, y2, x + 6, y2 - 10, col, 2);
    };
    const _arrowDiag = (x1, y1, x2, y2, col) => {
      r.drawLine(x1, y1, x2, y2, col, 2);
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len, uy = dy / len;
      r.drawLine(x2, y2, x2 - ux * 12 + uy * 6,  y2 - uy * 12 - ux * 6,  col, 2);
      r.drawLine(x2, y2, x2 - ux * 12 - uy * 6,  y2 - uy * 12 + ux * 6,  col, 2);
    };

    _arrowDown(355, 250, 310, '#c44aff');
    _arrowDiag(310, 365, 240, 438, '#44ccff');
    _arrowDiag(400, 365, 460, 438, '#44ccff');

    r.fillRoundRect(100, 510, 510, 38, 8, 'rgba(20,10,40,0.90)');
    r.strokeRoundRect(100, 510, 510, 38, 8, '#532583', 1.5);
    r.drawText('🔑 Código da turma → alunos entram vinculados ao professor', 355, 533, '#9966cc', 12, 'center', 'Rajdhani');
  }
}

export default TeacherTutorialScene;
