/**
 * @file TutorialScene.js
 * @description Tutorial interativo cobrindo todas as mecânicas do jogo.
 * 12 slides com mockup visual à esquerda e texto explicativo à direita.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

// ─── Dados dos slides ────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: 'Bem-vindo ao Data Express!',
    desc:
      'Você é um aventureiro em missão para liberar as linhas do metrô de invasores.\n\n' +
      'O trem representa uma estrutura de lista. Cada linha tem um trem com comportamento diferente.\n\n' +
      'Use este tutorial para aprender as regras antes de entrar em combate.'
  },
  {
    title: 'Estrutura do Trem',
    desc:
      'O trem por padrão tem 5 vagões dispostos em sequência.\n\nCada vagão tem um tipo:\n\n' +
      '⚔  Inimigo — batalha de perguntas\n' +
      '📦  Mímico — baú com recompensa ou armadilha\n' +
      '🛒  Loja — gaste ouro em melhorias\n' +
      '🔧  Manutenção — manipule a ordem dos vagões\n' +
      '💀  BOSS — o chefe da linha\n\n' +
      'Os vagões 2 e 3 tem seu tipo sorteado aleatoriamente entre inimigo, mímico ou manutenção.\n\n' +
      'O vagão destacado é o atual. Navegue por eles conforme as regras da linha escolhida.'
  },
  {
    title: 'Lista Encadeada',
    desc: `📖 CONCEITO: A versão mais básica da estrutura. Cada vagão (nó) guarda os dados e aponta para o próximo. O último vagão aponta para o "Vazio" (Nulo), marcando o fim da linha.

🧭 NAVEGAÇÃO: Viagem de mão única a partir do primeiro vagão (o "Head"/"Primeiro"). Você só pode avançar — nunca voltar.

🎮 MECÂNICA: Os vagões devem ser enfrentados em ordem estrita. Um vagão só se abre após o anterior ser concluído.
🏆 VITÓRIA: Conclua todos os vagões e derrote o BOSS.`
  },
  {
    title: 'Lista Circular',
    desc: `📖 CONCEITO: Uma variação da lista encadeada, mas o fim se conecta ao começo. O último vagão aponta de volta para o primeiro, formando um loop.

🧭 NAVEGAÇÃO: O trem não tem fim! Após o último vagão, você pode percorrer a lista do inicio novamente para acessar a loja ou os vagões ainda não concluídos.

🎮 MECÂNICA: Após concluir todos os vagões, exibe o botão “Próximo ciclo". Onde ao selecioná-lo, você volta para o início do trem com todos os vagões disponíveis para acessar novamente. A cada ciclo completo que você dá no trem, os inimigos ficam 15% mais fortes. Até que ciclo você sobrevive ?

🏆 VITÓRIA: Limpe todos os vagões e derrote o BOSS dentro do mesmo ciclo. Só então o botão de encerrar aparece.`
  },
  {
    title: 'Lista Duplamente Encadeada',
    desc: `📖 CONCEITO: Resolve o problema da "viagem de mão única". Cada vagão possui conexões para a frente (próximo) e para trás (anterior). Os extremos do trem apontam para o "Vazio" (Nulo).

🧭 NAVEGAÇÃO: Liberdade total! Você pode avançar ou recuar livremente entre os vagões.

🎮 MECÂNICA: Não há obrigação de seguir a ordem. Escolha sua própria estratégia, volte para vagões anteriores se precisar e explore o trem no seu ritmo.

🏆 VITÓRIA: Derrote o BOSS e limpe todos os vagões, a ordem de limpeza é uma decisão sua!`
  },
  {
    title: 'Lista Duplamente Encadeada Circular',
    desc: `📖 CONCEITO: A estrutura definitiva. Combina a liberdade de ir e vir com o ciclo infinito. Não há conexões para o "Vazio" — os extremos estão conectados.

🧭 NAVEGAÇÃO: Bidirecional e sem becos sem saída. Do vagão 1, você pode "voltar" e cair direto no último vagão (e vice-versa).

🎮 MECÂNICA: Liberdade máxima para criar atalhos. Use a conexão dos extremos para bolar estratégias de combate e movimentação pelo trem.

🏆 VITÓRIA: Derrote o BOSS e limpe todos os vagões, a ordem de limpeza é uma decisão sua!`
  },
  {
    title: 'Batalha: Como Funciona',
    desc:
      'A batalha ocorre por turnos de perguntas.\n\n' +
      'Uma pergunta aparece com 4 alternativas (A/B/C/D).\n\n' +
      '✔  Resposta correta → você ataca o inimigo.\n' +
      '✖  Resposta errada → o inimigo te ataca.\n\n' +
      'O combate continua até um dos lados chegar a 0 de HP.\n\n' +
      'Inimigos derrotados rendem ouro para gastar na loja.'
  },
  {
    title: 'Personagens',
    desc:
      'Escolha seu herói antes de embarcar.\n\n' +
      'Cada personagem tem status e passivas únicas:\n\n' +
      'Estudioso (130 HP / 20 ATK)\nPassiva: Olho Crítico — elimina 2 alternativas erradas automaticamente e vê as recompensas do Mímico sem desfoque.\n\n' +
      'Assassino (160 HP / 30 ATK)\nPassiva: Golpe Crítico — 15% de chance de dano crítico (1.8×). Ganha +2,5% de ATK por acerto (máx +25%), mas perde o bônus ao errar.'
  },
  {
    title: 'Ouro e a Loja',
    desc:
      'Ouro é a moeda do trem.\n\nGanhe batalhando.\n' +
      'Na Loja, gaste ouro em melhorias permanentes para essa run:\n+5, +10 ou +15 ATK, Cura de HP, ou uma combinação.\n\n' +
      'Cada item só pode ser comprado uma vez por ciclo. Use o ouro com sabedoria!'
  },
  {
    title: 'Vagão do Mímico',
    desc:
      'O Mímico guarda 3 baús — escolha um.\n\n' +
      'Após escolher, você precisa responder uma pergunta para "hackear" o baú e reivindicar a recompensa.\n\n' +
      '✔  Acertou → item aplicado, vagão marcado como concluído.\n' +
      '✖  Errou → o Mímico desperta para lutar!\n\n' +
      'Estudioso vê a recompensa sem desfoque antes de hackear. Assassino Vê a recompensa criptografada'
  },
  {
    title: 'Vagão de Manutenção',
    desc:
      'Prove sua capacitação respondendo uma pergunta. Acertou → execute a operação. Errou → sem efeito, volte ao mapa.\n\n' +
      'Adicionar: insere um novo vagão na posição escolhida, e ajutas os ponteiros.\n\n' +
      'Remover: elimina um vagão. Restrições: não pode ser o atual, a loja ou o último boss, e ajutas os ponteiros.\n\n'
  },
  {
    title: 'Condições de Vitória',
    desc:
      'Cada tipo de lista tem sua condição:\n\n' +
      'Lista Encadeada: derrote o BOSS + limpe todos os vagões.\n\n' +
      'Lista Circular: derrote o BOSS + limpe todos os vagões no mesmo ciclo.\n\n' +
      'Lista Duplamente Encadeada: derrote o BOSS + limpe todos os vagões.\n\n' +
      'Lista Duplamente Encadeada Circular: derrote o BOSS + limpe todos os vagões no mesmo ciclo.\n\n' +
      'Quando as condições forem cumpridas, o botão "Encerrar" aparece no mapa!\n\n' +
      '🏆 Troféu: encerre sem nenhum erro.\n' +
      '🥈 Medalha: encerre mesmo tendo errado alguma questão.'
  },
];

// Tipos de vagão para mockups
const ROOM_ICONS   = { enemy: '⚔', mimic: '📦', shop: '🛒', maintenance: '🔧', boss: '💀' };
const ROOM_COLORS  = { enemy: '#ff4a4a', mimic: '#cc44ff', shop: '#44dd88', maintenance: '#44bbff', boss: '#ff8800' };
const ROOM_LABELS  = { enemy: 'Inimigo', mimic: 'Mímico', shop: 'Loja', maintenance: 'Manutenção', boss: 'BOSS' };

// ─── Cena ────────────────────────────────────────────────────────────────────

export class TutorialScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._slide        = 0;
    this._totalSlides  = SLIDES.length; // 13
    this._anim         = 0;

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

    // Anterior
    this._btnPrev = { x: 20, y: 640, w: 160, h: 44 };
    if (!isFirst) {
      this.input.addButton(this._btnPrev, () => {
        this._slide--;
        this._setupButtons();
      });
    }

    // Próximo / Jogar Agora
    this._btnNext = { x: 1080, y: 640, w: 180, h: 44 };
    this.input.addButton(this._btnNext, () => {
      if (isLast) {
        this.manager.goto('modeSelect');
      } else {
        this._slide++;
        this._setupButtons();
      }
    });

    // Pular Tutorial
    this._btnSkip = { x: 1100, y: 14, w: 160, h: 38 };
    this.input.addButton(this._btnSkip, () => {
      this.manager.goto('modeSelect');
    });
  }

  // ── Fundo ──────────────────────────────────────────────────────────────────

  _drawBg(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    // Estrelas animadas
    const seed = 42;
    for (let i = 0; i < 60; i++) {
      const sx = ((seed * (i + 1) * 7919) % VIRTUAL_W);
      const sy = ((seed * (i + 1) * 6271) % VIRTUAL_H);
      const sz = 0.5 + (i % 3) * 0.7;
      const alpha = 0.15 + 0.25 * Math.abs(Math.sin(this._anim * 0.3 + i * 0.4));
      r.fillCircle(sx, sy, sz, '#8ab4cc', alpha);
    }
  }

  // ── Painéis de fundo ───────────────────────────────────────────────────────

  _drawPanels(r) {
    // Painel mockup (esquerda)
    r.fillRoundRect(20, 70, 670, 545, 12, 'rgba(5,10,25,0.85)');
    r.strokeRoundRect(20, 70, 670, 545, 12, '#1a3a5c', 1);

    // Painel texto (direita)
    r.fillRoundRect(730, 70, 530, 545, 12, 'rgba(5,10,25,0.85)');
    r.strokeRoundRect(730, 70, 530, 545, 12, '#1a3a5c', 1);
  }

  // ── Painel de texto ────────────────────────────────────────────────────────

  _drawPanel(r, slide) {
    const s = SLIDES[slide];
    const px = 750;

    // Número do slide
    r.drawText(`${slide + 1} / ${this._totalSlides}`, px, 100, '#4a8abc', 13, 'left', 'Rajdhani');

    // Linha decorativa
    r.drawLine(px, 130, 1240, 130, '#1a4a8c', 1);

    // Título
    r.drawTextShadow(s.title, px, 125, '#5ab4ff', 22, 'left', 'Rajdhani');

    // Descrição com quebra de linha manual (\n)
    const lines = s.desc.split('\n');
    let y = 160;
    for (const line of lines) {
      if (line === '') {
        y += 10;
        continue;
      }
      // Quebrar linha longa automaticamente
      const maxW = 460;
      const words = line.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? current + ' ' + word : word;
        // Estima largura (15px por char é aproximação conservadora)
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

  // ── Mockup dispatcher ──────────────────────────────────────────────────────

  _drawMockup(r, slide) {
    const methods = [
      '_mockupWelcome', '_mockupMap', '_mockupLinked', '_mockupCircular',
      '_mockupDoublyLinked', '_mockupDoublyCircular', '_mockupBattle',
      '_mockupCharacters', '_mockupShop', '_mockupMimic',
      '_mockupMaintenance', '_mockupVictory'
    ];
    if (this[methods[slide]]) this[methods[slide]](r);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Desenha um vagão no mockup.
   * state: 'current' | 'cleared' | 'locked' | 'normal'
   */
  _drawWagon(r, cx, cy, type, state = 'normal') {
    const w = 88, h = 80;
    const x = cx - w / 2, y = cy - h / 2;
    const color = ROOM_COLORS[type] || '#888';

    // Fundo
    let bg = 'rgba(8,15,35,0.9)';
    if (state === 'cleared') bg = 'rgba(5,30,10,0.9)';
    if (state === 'locked')  bg = 'rgba(10,10,10,0.7)';
    r.fillRoundRect(x, y, w, h, 8, bg);

    // Borda
    const borderColor = state === 'current'
      ? color
      : state === 'cleared' ? '#44aa66'
      : state === 'locked'  ? '#333'
      : '#1a3a5c';
    const borderW = state === 'current' ? 2.5 : 1.5;

    // Pulso na borda do vagão atual
    if (state === 'current') {
      const pulse = 0.7 + 0.3 * Math.abs(Math.sin(this._anim * 2));
      r.ctx.save();
      r.ctx.globalAlpha = pulse;
      r.strokeRoundRect(x, y, w, h, 8, color, borderW);
      r.ctx.restore();
    } else {
      r.strokeRoundRect(x, y, w, h, 8, borderColor, borderW);
    }

    // Ícone
    const iconColor = state === 'locked' ? '#444' : color;
    r.drawText(ROOM_ICONS[type] || '?', cx, cy - 4, iconColor, 26, 'center', 'sans-serif');

    // Label
    const labelColor = state === 'locked' ? '#444' : '#7aaccc';
    r.drawText(ROOM_LABELS[type] || type, cx, cy + 26, labelColor, 10, 'center', 'Rajdhani');

    // Check se limpo
    if (state === 'cleared') {
      r.drawText('✔', cx + 34, cy - 34, '#44dd88', 14, 'center', 'sans-serif');
    }
    // Cadeado se bloqueado
    if (state === 'locked') {
      r.drawText('🔒', cx + 34, cy - 34, '#666', 12, 'center', 'sans-serif');
    }
  }

  /** Desenha trilho horizontal entre dois pontos */
  _drawRail(r, x1, y, x2) {
    r.drawLine(x1, y - 4, x2, y - 4, '#2a4a6c', 3);
    r.drawLine(x1, y + 4, x2, y + 4, '#2a4a6c', 3);
  }

  /** Seta horizontal simples */
  _drawArrow(r, x1, y, x2, color = '#5ab4ff') {
    r.drawLine(x1, y, x2, y, color, 2);
    // Ponta
    r.drawLine(x2, y, x2 - 8, y - 5, color, 2);
    r.drawLine(x2, y, x2 - 8, y + 5, color, 2);
  }

  /** Seta bidirecional */
  _drawArrowBoth(r, x1, y1, x2, y2, color = '#5ab4ff') {
    // Direita
    r.drawLine(x1, y1 - 5, x2, y2 - 5, color, 1.5);
    r.drawLine(x2, y2 - 5, x2 - 7, y2 - 10, color, 1.5);
    r.drawLine(x2, y2 - 5, x2 - 7, y2,      color, 1.5);
    // Esquerda
    r.drawLine(x2, y2 + 5, x1, y1 + 5, '#88aaff', 1.5);
    r.drawLine(x1, y1 + 5, x1 + 7, y1,      '#88aaff', 1.5);
    r.drawLine(x1, y1 + 5, x1 + 7, y1 + 10, '#88aaff', 1.5);
  }

  // ── Mockups individuais ────────────────────────────────────────────────────

  /** Slide 0 — Bem-vindo */
  _mockupWelcome(r) {
    const my = 355;

    // 5 vagões
    const types = ['enemy', 'mimic', 'shop', 'maintenance', 'boss'];
    const startX = 163;
    for (let i = 0; i < 5; i++) {
      const cx = startX + i * 96;
      r.fillRoundRect(cx - 40, my - 40, 80, 65, 8, 'rgba(8,15,35,0.9)');
      r.strokeRoundRect(cx - 40, my - 40, 80, 65, 8, ROOM_COLORS[types[i]], 1.5);
      r.drawText(ROOM_ICONS[types[i]], cx, my - 14, ROOM_COLORS[types[i]], 24, 'center', 'sans-serif');
      r.drawText(ROOM_LABELS[types[i]], cx, my + 16, '#7aaabb', 9, 'center', 'Rajdhani');
      // Conector
      if (i < 4) r.drawLine(cx + 40, my, cx + 56, my, '#3a6a9c', 2);
    }

    // Título decorativo
    r.drawTextShadow('DATA EXPRESS', 355, 195, '#5ab4ff', 42, 'center', 'Rajdhani');
    r.drawText('O Trem do Conhecimento', 355, 233, '#7abcdd', 18, 'center', 'Rajdhani');

    // Linha separadora
    r.drawLine(100, 250, 610, 250, '#1a3a5c', 1);



  }

  /** Slide 1 — Estrutura do Trem */
  _mockupMap(r) {
    const my = 385;
    const types = ['enemy', 'mimic', 'shop', 'maintenance', 'boss'];
    const xs = [139, 247, 355, 463, 571];

    for (let i = 0; i < 5; i++) {
      const state = i === 0 ? 'current' : 'normal';
      this._drawWagon(r, xs[i], my, types[i], state);
      if (i < 4) r.drawLine(xs[i] + 44, my, xs[i + 1] - 44, my, '#1a4a8c', 1);
    }

    // Legenda
    const legendY = 135;
    r.fillRoundRect(105, legendY, 500, 130, 8, 'rgba(5,10,25,0.8)');
    r.strokeRoundRect(105, legendY, 500, 130, 8, '#1a3a5c', 1);
    r.drawText('Tipos de Vagão', 355, legendY + 20, '#5ab4ff', 14, 'center', 'Rajdhani');

    const legendItems = [
      { type: 'enemy', x: 140 }, { type: 'mimic', x: 250 },
      { type: 'shop', x: 360 }, { type: 'maintenance', x: 470 }, { type: 'boss', x: 580 }
    ];
    for (const item of legendItems) {
      r.fillCircle(item.x, legendY + 55, 12, ROOM_COLORS[item.type], 0.9);
      r.drawText(ROOM_ICONS[item.type], item.x, legendY + 60, '#fff', 13, 'center', 'sans-serif');
      r.drawText(ROOM_LABELS[item.type], item.x, legendY + 80, '#7aaccc', 10, 'center', 'Rajdhani');
    }

    // Indicador de posição
    r.drawText('▼ Vagão atual', xs[0], my - 60, '#5ab4ff', 12, 'center', 'Rajdhani');
    r.drawLine(xs[0], my - 48, xs[0], my - 44, '#5ab4ff', 1.5);
  }

  /** Slide 2 — Lista Encadeada */
  _mockupLinked(r) {
    const my = 315;
    const types = ['enemy', 'mimic', 'shop', 'maintenance', 'boss'];
    const xs = [139, 247, 355, 463, 571];

    // Título
    r.drawTextShadow('Lista Encadeada', 355, 190, '#4a9eff', 26, 'center', 'Rajdhani');
    r.drawText('Navegação apenas para frente', 355, 220, '#7abcdd', 15, 'center', 'Rajdhani');

    for (let i = 0; i < 5; i++) {
      const state = i === 0 ? 'current' : i > 1 ? 'locked' : 'normal';
      this._drawWagon(r, xs[i], my, types[i], state);

      if (i < 4) {
        const ax = xs[i] + 46;
        const bx = xs[i + 1] - 46;
        this._drawArrow(r, ax, my, bx, '#4a9eff');
      }
    }

    // Condição de vitória
    r.fillRoundRect(115, 445, 480, 60, 8, 'rgba(5,20,5,0.85)');
    r.strokeRoundRect(115, 445, 480, 60, 8, '#44aa66', 1.5);
    r.drawText('Vitória: Derrotar o BOSS uma vez', 355, 480, '#44dd88', 16, 'center', 'Rajdhani');
  }

  /** Slide 3 — Lista Circular */
  _mockupCircular(r) {
    const my = 300;
    const types = ['enemy', 'mimic', 'shop', 'maintenance', 'boss'];
    const xs = [139, 247, 355, 463, 571];

    r.drawTextShadow('Lista Circular', 355, 180, '#ff6b4a', 26, 'center', 'Rajdhani');
    r.drawText('Avança infinitamente — conecta ao início', 355, 210, '#ee9070', 15, 'center', 'Rajdhani');

    for (let i = 0; i < 5; i++) {
      this._drawWagon(r, xs[i], my, types[i], i === 0 ? 'current' : 'normal');
      if (i < 4) this._drawArrow(r, xs[i] + 46, my, xs[i + 1] - 46, '#ff6b4a');
    }

    // Arco de wrap (do boss ao início)
    const arcY = my + 80;
    r.drawLine(xs[4], my + 40, xs[4], arcY, '#ff6b4a', 1.5);
    r.drawLine(xs[4], arcY, xs[0], arcY, '#ff6b4a', 1.5);
    r.drawLine(xs[0], arcY, xs[0], my + 40, '#ff6b4a', 1.5);
    r.drawLine(xs[0], my + 40, xs[0] - 6, my + 50, '#ff6b4a', 1.5);
    r.drawLine(xs[0], my + 40, xs[0] + 6, my + 50, '#ff6b4a', 1.5);

    // Badge de escalonamento
    r.fillRoundRect(225, 405, 260, 44, 8, 'rgba(50,20,5,0.9)');
    r.strokeRoundRect(225, 405, 260, 44, 8, '#ff8800', 1.5);
    r.drawText('Ciclo 2 → inimigos +15%', 355, 432, '#ffaa44', 15, 'center', 'Rajdhani');

    // Vitória
    r.fillRoundRect(115, 465, 480, 55, 8, 'rgba(5,20,5,0.85)');
    r.strokeRoundRect(115, 465, 480, 55, 8, '#44aa66', 1.5);
    r.drawText('Vitória: BOSS + todos os vagões no mesmo ciclo', 355, 497, '#44dd88', 14, 'center', 'Rajdhani');
  }

  /** Slide 4 — Lista Duplamente Encadeada */
  _mockupDoublyLinked(r) {
    const my = 315;
    const types = ['enemy', 'mimic', 'shop', 'maintenance', 'boss'];
    const xs = [139, 247, 355, 463, 571];

    r.drawTextShadow('Lista Duplamente Encadeada', 355, 185, '#4aff8c', 22, 'center', 'Rajdhani');
    r.drawText('Navegue livremente nos dois sentidos', 355, 215, '#66cc99', 15, 'center', 'Rajdhani');

    for (let i = 0; i < 5; i++) {
      this._drawWagon(r, xs[i], my, types[i], i === 0 ? 'current' : 'normal');
      if (i < 4) {
        this._drawArrowBoth(r, xs[i] + 46, my, xs[i + 1] - 46, my, '#4aff8c');
      }
    }

    r.fillRoundRect(115, 450, 480, 55, 8, 'rgba(5,20,5,0.85)');
    r.strokeRoundRect(115, 450, 480, 55, 8, '#44aa66', 1.5);
    r.drawText('Vitória: BOSS + todos os vagões limpos', 355, 482, '#44dd88', 14, 'center', 'Rajdhani');
  }

  /** Slide 5 — Lista Duplamente Encadeada Circular */
  _mockupDoublyCircular(r) {
    const my = 325;
    const types = ['enemy', 'mimic', 'shop', 'maintenance', 'boss'];
    const xs = [139, 247, 355, 463, 571];

    r.drawTextShadow('Lista Duplamente Encadeada Circular', 355, 125, '#c44aff', 22, 'center', 'Rajdhani');
    r.drawText('Bidirecional + conexão nos extremos', 355, 151, '#cc66ff', 15, 'center', 'Rajdhani');

    // Arco superior (início → boss) — desenhado antes dos vagões
    const arcTop = my - 100;
    r.drawLine(xs[0], my - 40, xs[0], arcTop,  '#aa88ff', 1.5);
    r.drawLine(xs[0], arcTop,  xs[4], arcTop,  '#aa88ff', 1.5);
    r.drawLine(xs[4], arcTop,  xs[4], my - 40, '#aa88ff', 1.5);
    // Ponta da seta: entra no vagão boss vindo de cima
    r.drawLine(xs[4], my - 40, xs[4] - 6, my - 52, '#aa88ff', 1.5);
    r.drawLine(xs[4], my - 40, xs[4] + 6, my - 52, '#aa88ff', 1.5);

    for (let i = 0; i < 5; i++) {
      this._drawWagon(r, xs[i], my, types[i], i === 0 ? 'current' : 'normal');
      if (i < 4) this._drawArrowBoth(r, xs[i] + 46, my, xs[i + 1] - 46, my, '#c44aff');
    }

    // Arco inferior (boss → início)
    const arcY = my + 80;
    r.drawLine(xs[4], my + 40, xs[4], arcY,  '#c44aff', 1.5);
    r.drawLine(xs[4], arcY,   xs[0], arcY,   '#c44aff', 1.5);
    r.drawLine(xs[0], arcY,   xs[0], my + 40,'#c44aff', 1.5);
    // Ponta da seta: entra no vagão 1 vindo de baixo
    r.drawLine(xs[0], my + 40, xs[0] - 6, my + 52, '#c44aff', 1.5);
    r.drawLine(xs[0], my + 40, xs[0] + 6, my + 52, '#c44aff', 1.5);

    // Badge de escalonamento
    r.fillRoundRect(225, arcY + 34, 260, 44, 8, 'rgba(50,20,5,0.9)');
    r.strokeRoundRect(225, arcY + 34, 260, 44, 8, '#ff8800', 1.5);
    r.drawText('Ciclo 2 → inimigos +15%', 355, arcY + 61, '#ffaa44', 15, 'center', 'Rajdhani');

    r.fillRoundRect(115, arcY + 90, 480, 50, 8, 'rgba(5,20,5,0.85)');
    r.strokeRoundRect(115, arcY + 90, 480, 50, 8, '#44aa66', 1.5);
    r.drawText('Vitória: BOSS + todos os vagões limpos', 355, arcY + 120, '#44dd88', 14, 'center', 'Rajdhani');
  }

  /** Slide 6 — Batalha */
  _mockupBattle(r) {
    // Cenário
    r.fillRoundRect(30, 80, 650, 525, 10, 'rgba(3,7,18,0.97)');

    // HUD player — centralizado em x=165 (355-190)
    r.fillRoundRect(55, 90, 220, 60, 8, 'rgba(10,20,60,0.9)');
    r.drawText('Estudioso', 70, 115, '#4a9eff', 14, 'left', 'Rajdhani');
    r.drawProgressBar(70, 123, 180, 14, 75, 100, '#44dd88', '#1a3a1a', 'HP');

    // HUD inimigo — centralizado em x=545 (355+190)
    r.fillRoundRect(435, 90, 220, 60, 8, 'rgba(40,5,5,0.9)');
    r.drawText('Invasor', 448, 115, '#ff4a4a', 14, 'left', 'Rajdhani');
    r.drawProgressBar(448, 123, 180, 14, 40, 60, '#ff4a4a', '#3a1a1a', 'HP');

    // Sprite player — centro em x=125 (355-230)
    r.fillRoundRect(85, 190, 80, 110, 10, 'rgba(20,50,120,0.8)');
    r.strokeRoundRect(85, 190, 80, 110, 10, '#4a9eff', 2);
    r.drawText('👤', 125, 253, '#4a9eff', 32, 'center', 'sans-serif');

    // Sprite inimigo — centro em x=585 (355+230)
    r.fillRoundRect(545, 190, 80, 110, 10, 'rgba(80,10,10,0.8)');
    r.strokeRoundRect(545, 190, 80, 110, 10, '#ff4a4a', 2);
    r.drawText('👾', 585, 253, '#ff4a4a', 32, 'center', 'sans-serif');

    // Card de pergunta — centralizado em x=355 (145 + 420/2)
    r.fillRoundRect(145, 330, 420, 220, 10, 'rgba(8,15,40,0.97)');
    r.strokeRoundRect(145, 330, 420, 220, 10, '#1a4a8c', 2);

    r.drawText('Qual a complexidade de busca em uma lista encadeada?', 355, 360, '#d0e8ff', 13, 'center', 'Rajdhani');

    const opts = [
      { label: 'A) O(1)', correct: false, y: 395 },
      { label: 'B) O(n)', correct: true,  y: 427 },
      { label: 'C) O(log n)', correct: false, y: 459 },
      { label: 'D) O(n²)', correct: false, y: 491 }
    ];
    for (const opt of opts) {
      r.fillRoundRect(160, opt.y - 14, 390, 26, 6, 'rgba(10,20,50,0.9)');
      r.strokeRoundRect(160, opt.y - 14, 390, 26, 6, '#1a3a6c', 1);
      r.drawText(opt.label, 172, opt.y + 5, '#8ab4cc', 13, 'left', 'Rajdhani');
    }
  }

  /** Slide 7 — Personagens */
  _mockupCharacters(r) {
    const drawCard = (x, y, w, h, name, hp, atk, passiveName, passiveDesc, color, spriteKey) => {
      r.fillRoundRect(x, y, w, h, 12, 'rgba(8,15,35,0.95)');
      r.strokeRoundRect(x, y, w, h, 12, color, 2.5);

      // Barra de cor no topo
      r.fillRoundRect(x, y, w, 5, 12, color);

      // Sprite do personagem
      r.fillRoundRect(x + w / 2 - 70, y + 15, 140, 140, 10, 'rgba(0,0,0,0.4)');
      r.strokeRoundRect(x + w / 2 - 70, y + 15, 140, 140, 10, color, 1.5);
      const spr = this.assets.get(spriteKey);
      if (spr) {
        r.drawImage(spr, x + w / 2 - 70, y + 15, 140, 140);
      } else {
        r.drawText('🧑', x + w / 2, y + 90, color, 56, 'center', 'sans-serif');
      }

      // Nome
      r.drawTextShadow(name, x + w / 2, y + 170, color, 20, 'center', 'Rajdhani');

      // Stats
      r.drawProgressBar(x + 20, y + 188, w - 40, 13, hp, hp, '#44dd88', '#1a3a1a');
      r.drawText(`${hp} HP`, x + 20, y + 214, '#44dd88', 13, 'left', 'Rajdhani');
      r.drawText(`${atk} ATK`, x + w - 20, y + 214, '#ffaa44', 13, 'right', 'Rajdhani');

      // Divider
      r.drawLine(x + 15, y + 228, x + w - 15, y + 228, '#1a3a5c', 1);

      // Passiva
      r.drawText('Passiva:', x + 20, y + 248, '#5ab4ff', 13, 'left', 'Rajdhani');
      r.drawText(passiveName, x + 20, y + 268, color, 14, 'left', 'Rajdhani');

      // Descrição da passiva (quebra de linha simples)
      const maxW = w - 40;
      const words = passiveDesc.split(' ');
      let line = '';
      let ty = y + 290;
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (test.length * 7.5 > maxW && line) {
          r.drawText(line, x + 20, ty, '#8ab4cc', 12, 'left', 'Rajdhani');
          ty += 19;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) r.drawText(line, x + 20, ty, '#8ab4cc', 12, 'left', 'Rajdhani');
    };

    // Card Estudioso
    drawCard(45, 105, 275, 450, 'Estudioso', 130, 20,
      'Olho Crítico',
      'Elimina 2 alternativas erradas automaticamente. Vê recompensas do Mímico sem desfoque.',
      '#4a9eff',
      'assets/image/Personagens/Estudioso/Sem Fundo/Em Batalha/Batalha/Estudioso_Batalha.png');

    // Card Assassino
    drawCard(365, 105, 275, 450, 'Assassino', 160, 30,
      'Golpe Crítico',
      '15% de chance de crítico (1.8×). Ganha +2,5% ATK por acerto (máx +25%). Perde o bônus ao errar.',
      '#ff4a4a',
      'assets/image/Personagens/Assasino/Sem Fundo/Em Batalha/Batalha/Assasino_Batalha.png');
  }

  /** Slide 8 — Ouro e a Loja */
  _mockupShop(r) {
    // Painel: x=20, y=55, w=670, h=560 → centro X = 355
    // Slots horizontais iguais: 670/3 ≈ 223px cada
    // Centros dos slots: 131, 355, 578

    // ── Linha superior: HP | Loja | Ouro ────────────────────────────────────────
    const topY = 110, topH = 50;

    // HP/ATK — slot esquerdo, centro em x=131
    r.fillRoundRect(54, topY, 155, topH, 7, 'rgba(5,10,30,0.9)');
    r.strokeRoundRect(54, topY, 155, topH, 7, '#1a3a5c', 1);
    r.drawText('HP:', 66, topY + 18, '#7aaccc', 11, 'left', 'Rajdhani');
    r.drawProgressBar(88, topY + 9, 108, 11, 75, 100, '#44dd88', '#1a3a1a');
    r.drawText('ATK: 20', 66, topY + 38, '#ffaa44', 11, 'left', 'Rajdhani');

    // Vagão Loja — slot central, centro em x=355
    r.fillRoundRect(310, topY, 90, topH, 8, 'rgba(5,25,12,0.95)');
    r.strokeRoundRect(310, topY, 90, topH, 8, '#44dd88', 1.5);
    r.drawText('🛒', 355, topY + 22, '#44dd88', 20, 'center', 'sans-serif');
    r.drawText('Loja', 355, topY + 41, '#44dd88', 10, 'center', 'Rajdhani');

    // Ouro — slot direito, centro em x=578
    r.fillRoundRect(503, topY, 150, topH, 7, 'rgba(28,22,4,0.95)');
    r.strokeRoundRect(503, topY, 150, topH, 7, '#aa8800', 1.5);
    r.drawText('💰 80 ouro', 578, topY + 29, '#ffcc44', 16, 'center', 'Rajdhani');

    // ── 3 cards de item — centralizados ─────────────────────────────────────────
    const items = [
      { name: '+5 ATK',   desc: 'Aumenta\ndano em 5',   cost: 25, color: '#5ab4ff',
        img: 'assets/image/Itens/Sem Fundo/Buff_Dano_5.png' },
      { name: 'Cura 15%', desc: 'Recupera\n15% do HP',  cost: 35, color: '#5ab4ff',
        img: 'assets/image/Itens/Sem Fundo/Buff_Vida_10.png' },
      { name: '+10 ATK',  desc: 'Aumenta\ndano em 10',  cost: 45, color: '#5ab4ff',
        img: 'assets/image/Itens/Sem Fundo/Buff_Dano_10 - Copia.png' }
    ];

    const cardW = 170, cardH = 235, cardGap = 25;
    const totalCardsW = cardW * 3 + cardGap * 2;               // 560
    const cardStartX  = 20 + Math.round((670 - totalCardsW) / 2); // 75
    const cardY       = 235;                                    // centralizado verticalmente no painel

    for (let i = 0; i < 3; i++) {
      const ix   = cardStartX + i * (cardW + cardGap);
      const item = items[i];

      r.fillRoundRect(ix, cardY, cardW, cardH, 10, 'rgba(5,15,35,0.95)');
      r.strokeRoundRect(ix, cardY, cardW, cardH, 10, item.color, 1.5);

      // Barra de cor no topo do card
      r.fillRoundRect(ix, cardY, cardW, 4, 10, item.color);

      // Imagem do item — centralizada
      const imgSize = 76;
      const imgX = ix + Math.round((cardW - imgSize) / 2);
      const imgY = cardY + 14;
      r.fillRoundRect(imgX, imgY, imgSize, imgSize, 8, 'rgba(0,0,0,0.35)');
      const spr = this.assets.get(item.img);
      if (spr) {
        r.drawImage(spr, imgX, imgY, imgSize, imgSize);
      } else {
        r.drawText(i === 1 ? '❤' : '⚔', ix + cardW / 2, imgY + imgSize / 2 + 10, item.color, 28, 'center', 'sans-serif');
      }

      // Nome
      r.drawText(item.name, ix + cardW / 2, cardY + 108, item.color, 14, 'center', 'Rajdhani');

      // Descrição
      const descLines = item.desc.split('\n');
      for (let d = 0; d < descLines.length; d++) {
        r.drawText(descLines[d], ix + cardW / 2, cardY + 126 + d * 17, '#8ab4cc', 11, 'center', 'Rajdhani');
      }

      // Badge de custo — centralizado na base do card
      const badgeW = 64, badgeH = 26;
      const badgeX = ix + Math.round((cardW - badgeW) / 2);
      r.fillRoundRect(badgeX, cardY + cardH - 36, badgeW, badgeH, 6, 'rgba(30,25,5,0.9)');
      r.strokeRoundRect(badgeX, cardY + cardH - 36, badgeW, badgeH, 6, '#aa8800', 1.5);
      r.drawText(`💰${item.cost}`, ix + cardW / 2, cardY + cardH - 19, '#ffcc44', 12, 'center', 'Rajdhani');
    }

    // ── Botão sair — meio inferior ───────────────────────────────────────────────
    const btnW = 230;
    const btnX = 20 + Math.round((670 - btnW) / 2);
    const btnY = 560; // meio inferior do painel (panel termina em y=615)
    r.fillRoundRect(btnX, btnY, btnW, 46, 8, 'rgba(5,20,10,0.9)');
    r.strokeRoundRect(btnX, btnY, btnW, 46, 8, '#44dd88', 1.5);
    r.drawText('Sair da Loja ▶', btnX + btnW / 2, btnY + 28, '#44dd88', 15, 'center', 'Rajdhani');
  }

  /** Slide 9 — Mímico */
  _mockupMimic(r) {
    // ── Título ───────────────────────────────────────────────────────
    r.drawTextShadow('📦 Vagão do Mímico', 355, 107, '#cc44ff', 22, 'center', 'Rajdhani');
    r.drawLine(55, 125, 655, 125, '#7a3aaa', 1);

    // ── Etapa 1: Escolha um baú ──────────────────────────────────────
    // label y=145 → rect y=165 (+20px gap)
    r.drawText('1 — Escolha um baú', 355, 145, '#cc88ff', 13, 'center', 'Rajdhani');

    const SP = 20, FONT_H = 14;  // espaçamento e altura visual de fonte (13pt)
    const chestW = 134, chestH = 96, chestGap = 22;
    const totalCW = 3 * chestW + 2 * chestGap;
    const cStartX = 355 - totalCW / 2;
    const chestY  = 165;
    const SEL_OFFSET = SP + FONT_H;  // 24px: 10px gap + 14px altura da fonte

    const chests = [
      { x: cStartX,                           selected: false },
      { x: cStartX + chestW + chestGap,       selected: true  },
      { x: cStartX + 2 * (chestW + chestGap), selected: false }
    ];

    const bauSpr = this.assets.get('assets/image/Inimigos/Mimico/Sem Fundo/Bau/Mimico_Bau.png');
    for (const ch of chests) {
      const cx   = ch.x + chestW / 2;
      const bg   = ch.selected ? 'rgba(40,5,65,0.97)' : 'rgba(8,5,22,0.9)';
      const bdr  = ch.selected ? '#cc44ff' : '#5a2a7a';
      const bdrW = ch.selected ? 2.5 : 1.5;

      r.fillRoundRect(ch.x, chestY, chestW, chestH, 10, bg);
      r.strokeRoundRect(ch.x, chestY, chestW, chestH, 10, bdr, bdrW);

      // Imagem do baú centralizada no retângulo
      const imgSize = 76;
      const imgX = cx - imgSize / 2;
      const imgY = chestY + (chestH - imgSize) / 2;
      if (bauSpr) {
        r.drawImage(bauSpr, imgX, imgY, imgSize, imgSize);
      } else {
        r.drawText('📦', cx, chestY + chestH / 2 + 10, bdr, 28, 'center', 'sans-serif');
      }

      if (ch.selected) {
        r.drawText('▼ Selecionado', cx, chestY + chestH + SEL_OFFSET, '#cc44ff', 11, 'center', 'Rajdhani');
      }
    }

    // ── Layout com cursor: 10px acima e 10px abaixo de cada elemento ─
    // cursor parte do fundo dos baús
    let cur = chestY + chestH;  // 246

    // "Selecionado" já desenhado; avança cursor pelo espaço do texto
    cur += SP + FONT_H;  // +24 → 270

    // ── Etapa 2: label ───────────────────────────────────────────────
    cur += SP + FONT_H;  // +24 → 294  (10px abaixo de "Selecionado" + 14px label)
    const label2Y = cur;

    // ── Painéis Estudioso / Assassino ────────────────────────────────
    cur += SP;           // +10 → 304
    const charY = cur;
    const charW = 245, charH = 56;
    cur += charH;

    // ── Etapa 3: label ───────────────────────────────────────────────
    cur += SP + FONT_H;  // +24 → 384
    const label3Y = cur;

    // ── Quiz ─────────────────────────────────────────────────────────
    cur += SP;           // +10 → 394
    const quizY = cur;
    const quizW = 510, quizH = 46;
    cur += quizH;        // +46 → 440

    // ── Resultados ───────────────────────────────────────────────────
    cur += SP;           // +10 → 450
    const resY = cur;
    const resW = 245, resH = 38;

    // ─────────────────────────────────────────────────────────────────

    r.drawText('2 — A visualização da recompensa depende do seu personagem', 355, label2Y, '#cc88ff', 13, 'center', 'Rajdhani');

    // alinhados ao quiz (quizW=510, x=100..610): cada painel w=245, gap=20
    const charL = 100, charR = 100 + charW + 20;

    r.fillRoundRect(charL, charY, charW, charH, 8, 'rgba(5,15,42,0.95)');
    r.strokeRoundRect(charL, charY, charW, charH, 8, '#4a9eff', 1.5);
    r.drawText('👤  Estudioso', charL + 12, charY + 15, '#4a9eff', 13, 'left', 'Rajdhani');
    r.drawText('Cura 15 %', charL + 12, charY + 30, '#88ccff', 12, 'left', 'Rajdhani');
    r.drawText('Vê a recompensa claramente', charL + 12, charY + 43, '#a0ccee', 10, 'left', 'Rajdhani');

    r.fillRoundRect(charR, charY, charW, charH, 8, 'rgba(5,15,42,0.95)');
    r.strokeRoundRect(charR, charY, charW, charH, 8, '#ff4a4a', 1.5);
    r.drawText('🗡  Assassino', charR + 12, charY + 15, '#ff4a4a', 13, 'left', 'Rajdhani');
    r.drawText('C#&4 !5 %', charR + 12, charY + 30, '#cc8888', 12, 'left', 'Rajdhani');
    r.drawText('Vê a recompensa criptografada', charR + 12, charY + 43, '#bb8888', 10, 'left', 'Rajdhani');

    r.drawText('3 — Prove sua capacidade para hackear o baú', 355, label3Y, '#cc88ff', 13, 'center', 'Rajdhani');

    r.fillRoundRect(355 - quizW / 2, quizY, quizW, quizH, 8, 'rgba(8,15,40,0.97)');
    r.strokeRoundRect(355 - quizW / 2, quizY, quizW, quizH, 8, '#1a4a8c', 1.5);
    r.drawText('[Pergunta sobre lista]', 355, quizY + 16, '#c4ddf0', 13, 'center', 'Rajdhani');
    r.drawText('4 alternativas — responda para liberar o baú', 355, quizY + 34, '#b0cce0', 11, 'center', 'Rajdhani');

    const resL = 100, resR = resL + resW + 20;

    r.fillRoundRect(resL, resY, resW, resH, 7, 'rgba(5,30,10,0.9)');
    r.strokeRoundRect(resL, resY, resW, resH, 7, '#44aa66', 1.5);
    r.drawText('✔  Acertou', resL + 14, resY + 14, '#44dd88', 13, 'left', 'Rajdhani');
    r.drawText('Ganha o item', resL + 14, resY + 29, '#66dd88', 10, 'left', 'Rajdhani');

    r.fillRoundRect(resR, resY, resW, resH, 7, 'rgba(40,5,5,0.9)');
    r.strokeRoundRect(resR, resY, resW, resH, 7, '#aa4444', 1.5);
    r.drawText('✖  Errou', resR + 14, resY + 14, '#ff6666', 13, 'left', 'Rajdhani');
    r.drawText('Mímico desperta', resR + 14, resY + 29, '#ee6666', 10, 'left', 'Rajdhani');
  }

  /** Slide 10 — Manutenção */
  _mockupMaintenance(r) {
    r.drawTextShadow('🔧 Vagão de Manutenção', 355, 145, '#44bbff', 20, 'center', 'Rajdhani');

    // 5 vagões em miniatura, centrados em x=355
    const miniTypes = ['enemy', 'mimic', 'shop', 'maintenance', 'boss'];
    const miniXs = [155, 255, 355, 455, 555];
    const miniY = 225;

    r.drawLine(120, miniY + 15, 590, miniY + 15, '#2a4a6c', 3);
    for (let i = 0; i < miniTypes.length; i++) {
      const t = miniTypes[i];
      r.fillRoundRect(miniXs[i] - 35, miniY - 30, 70, 55, 7, 'rgba(8,15,35,0.9)');
      r.strokeRoundRect(miniXs[i] - 35, miniY - 30, 70, 55, 7, ROOM_COLORS[t], 1.5);
      r.drawText(ROOM_ICONS[t], miniXs[i], miniY - 3, ROOM_COLORS[t], 20, 'center', 'sans-serif');
      r.drawText(ROOM_LABELS[t], miniXs[i], miniY + 18, '#7aaabb', 9, 'center', 'Rajdhani');
    }

    // 3 botões de operação, centrados em x=355
    const ops = [
      { label: '➕ Adicionar Vagão', color: '#44bbff' },
      { label: '➖ Remover Vagão',   color: '#ff8844' }
    ];
    const btnW = 250, btnX = 355 - btnW / 2;
    for (let i = 0; i < 2; i++) {
      const by = 315 + i * 80;
      r.fillRoundRect(btnX, by, btnW, 56, 8, 'rgba(5,15,35,0.9)');
      r.strokeRoundRect(btnX, by, btnW, 56, 8, ops[i].color, 1.5);
      r.drawText(ops[i].label, 355, by + 30, ops[i].color, 14, 'center', 'Rajdhani');
    }
  }

  /** Slide 11 — Condições de Vitória */
  _mockupVictory(r) {
    r.drawTextShadow('Condições de Vitória', 355, 120, '#ffcc44', 22, 'center', 'Rajdhani');

    const listTypes = [
      { name: 'Lista Encadeada',                    color: '#4a9eff', conditions: ['Derrotar o BOSS', 'Limpar todos os vagões'] },
      { name: 'Lista Circular',                     color: '#ff6b4a', conditions: ['Derrotar o BOSS', 'Limpar todos os vagões no ciclo'] },
      { name: 'Lista Duplamente Encadeada',          color: '#4aff8c', conditions: ['Derrotar o BOSS', 'Limpar todos os vagões'] },
      { name: 'Lista Duplamente Encadeada Circular', color: '#c44aff', conditions: ['Derrotar o BOSS', 'Limpar todos os vagões no ciclo'] }
    ];

    const rectW = 600, rectX = 355 - rectW / 2;  // x=55, centro=355
    for (let i = 0; i < listTypes.length; i++) {
      const lt = listTypes[i];
      const ry = 160 + i * 105;

      r.fillRoundRect(rectX, ry, rectW, 90, 8, 'rgba(5,10,28,0.9)');
      r.strokeRoundRect(rectX, ry, rectW, 90, 8, lt.color, 1.5);

      // Nome da lista
      r.drawText(lt.name, rectX + 20, ry + 28, lt.color, 15, 'left', 'Rajdhani');

      // Troféu ou Medalha (dentro do retângulo, lado direito)
      const reward = i === 3 ? { icon: '🥈', color: '#aaaaaa' } : { icon: '🏆', color: '#ffcc44' };
      r.drawText(reward.icon, rectX + rectW - 28, ry + 48, reward.color, 24, 'center', 'sans-serif');

      // Condições com ícones — espaçadas dentro da área útil (excluindo troféu)
      const condAreaW = rectW - 70;  // reserva espaço para o troféu
      const condSpacing = lt.conditions.length > 1 ? condAreaW / lt.conditions.length : 0;
      for (let ci = 0; ci < lt.conditions.length; ci++) {
        const cx = rectX + 20 + ci * condSpacing;
        const cy = ry + 62;
        r.fillCircle(cx + 8, cy, 8, '#44dd88', 0.9);
        r.drawText('✔', cx + 8, cy + 5, '#fff', 10, 'center', 'sans-serif');
        r.drawText(lt.conditions[ci], cx + 22, cy + 5, '#b0cce0', 11, 'left', 'Rajdhani');
      }
    }

  }

  // ── Navegação ──────────────────────────────────────────────────────────────

  _drawNav(r) {
    const isFirst = this._slide === 0;
    const isLast  = this._slide === this._totalSlides - 1;

    // Botão Anterior
    {
      const { x, y, w, h } = this._btnPrev;
      const hover = !isFirst && this.input.isHover(this._btnPrev);
      r.fillRoundRect(x, y, w, h, 8, isFirst ? 'rgba(5,10,25,0.4)' : hover ? 'rgba(20,55,120,0.95)' : 'rgba(10,25,60,0.85)');
      r.strokeRoundRect(x, y, w, h, 8, isFirst ? '#1a2a4c' : hover ? '#5ab4ff' : '#1a4a8c', isFirst ? 1 : hover ? 2 : 1.5);
      r.drawText('◀ Anterior', x + w / 2, y + h / 2 + 7, isFirst ? '#2a4a6c' : hover ? '#d0e8ff' : '#8ab4cc', 15, 'center', 'Rajdhani');
    }

    // Dots indicadores
    const dotR = 5, dotGap = 14;
    const totalDotW = this._totalSlides * (dotR * 2) + (this._totalSlides - 1) * (dotGap - dotR * 2);
    let dotX = VIRTUAL_W / 2 - totalDotW / 2 + dotR;
    for (let i = 0; i < this._totalSlides; i++) {
      if (i === this._slide) {
        r.fillCircle(dotX, 662, dotR, '#5ab4ff', 1);
      } else {
        r.strokeRoundRect(dotX - dotR, 662 - dotR, dotR * 2, dotR * 2, dotR, '#2a5a8c', 1.5);
      }
      dotX += dotGap;
    }

    // Botão Próximo / Jogar Agora
    {
      const { x, y, w, h } = this._btnNext;
      const hover = this.input.isHover(this._btnNext);
      const label = isLast ? 'Ir para o menu ▶' : 'Próximo ▶';
      const accent = isLast ? '#44dd88' : '#5ab4ff';
      const bgHover = isLast ? 'rgba(5,50,20,0.98)' : 'rgba(20,55,120,0.98)';
      const bgNormal = isLast ? 'rgba(5,30,12,0.92)' : 'rgba(10,25,60,0.88)';
      r.fillRoundRect(x, y, w, h, 8, hover ? bgHover : bgNormal);
      r.strokeRoundRect(x, y, w, h, 8, hover ? accent : (isLast ? '#22aa55' : '#1a4a8c'), hover ? 2.5 : 1.5);
      r.drawText(label, x + w / 2, y + h / 2 + 7, hover ? '#d0f8e0' : accent, 15, 'center', 'Rajdhani');
    }

    // Botão Pular Tutorial
    {
      const { x, y, w, h } = this._btnSkip;
      const hover = this.input.isHover(this._btnSkip);
      r.fillRoundRect(x, y, w, h, 6, hover ? 'rgba(20,40,80,0.9)' : 'rgba(10,20,50,0.8)');
      r.strokeRoundRect(x, y, w, h, 6, hover ? '#5a8abc' : '#2a4a7c', 1.5);
      r.drawText('Pular Tutorial', x + w / 2, y + h / 2 + 6, hover ? '#c0d8f0' : '#7aaad0', 13, 'center', 'Rajdhani');
    }
  }
}

export default TutorialScene;
