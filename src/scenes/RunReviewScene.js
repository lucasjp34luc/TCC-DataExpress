/**
 * @file RunReviewScene.js
 * @description Revisão detalhada de uma run: exibe todas as perguntas,
 * as 4 alternativas, a resposta escolhida e a resposta correta.
 * Suporta scroll com a roda do mouse.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

const QUESTION_CARD_GAP = 14;
const CONTENT_TOP       = 110; // Y onde começa a lista
const CONTENT_BOTTOM    = VIRTUAL_H - 20;
const VISIBLE_H         = CONTENT_BOTTOM - CONTENT_TOP;

export class RunReviewScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._run         = null;
    this._scrollY     = 0;
    this._maxScroll   = 0;
    this._btnBack     = null;
    this._wheelBound  = null;
  }

  enter() {
    this._scrollY   = 0;
    this._run       = this.manager.state.selectedRun || null;

    // Calcula scroll máximo com a altura real de cada card
    const questions = this._run && this._run.questions ? this._run.questions : [];
    let totalH = 0;
    questions.forEach(q => {
      const opts    = q ? (q.options || []) : [];
      const optRows = Math.ceil(opts.length / 2);
      totalH += (50 + optRows * 55 + 20) + QUESTION_CARD_GAP;
    });
    this._maxScroll = Math.max(0, totalH - VISIBLE_H);

    this.input.clearButtons();
    this._btnBack = { x: 50, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => this.manager.goto('runHistory'));

    // Registra evento de scroll na roda do mouse
    this._wheelBound = (e) => {
      e.preventDefault();
      this._scrollY = Math.max(0, Math.min(this._maxScroll, this._scrollY + e.deltaY * 0.5));
    };
    this.input.canvas.addEventListener('wheel', this._wheelBound, { passive: false });
  }

  exit() {
    this.input.clearButtons();
    if (this._wheelBound) {
      this.input.canvas.removeEventListener('wheel', this._wheelBound);
      this._wheelBound = null;
    }
  }

  update() {}

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    // Cabeçalho fixo
    const run = this._run;
    const resultLabel = run && run.won ? '✔ Vitória' : '✘ Derrota';
    const resultColor = run && run.won ? '#55ee99' : '#ff8888';

    r.drawTextShadow('REVISÃO DA RUN', VIRTUAL_W / 2, 40, '#5ab4ff', 26, 'center', 'Rajdhani');
    r.drawText(resultLabel, VIRTUAL_W / 2, 68, resultColor, 16, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#1a3a5c', 1);

    // Botão Voltar
    if (this._btnBack) {
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a');
    }

    if (!run || !run.questions || run.questions.length === 0) {
      r.drawText('Nenhuma questão registrada para esta run.', VIRTUAL_W / 2, VIRTUAL_H / 2, '#8ab4cc', 18, 'center', 'Rajdhani');
      return;
    }

    // Área de clipping virtual para o conteúdo rolável
    const ctx = r.ctx;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, r.vy(CONTENT_TOP), r.canvas.width, r.vy(VISIBLE_H));
    ctx.clip();

    const cardW = 1080;
    const cardX = (VIRTUAL_W - cardW) / 2;
    let   cardY = CONTENT_TOP - this._scrollY;

    run.questions.forEach((q, qi) => {
      if (!q) return;

      const opts    = q.options || [];
      const correct = q.correct;
      const chosen  = q.chosen;

      // Estima altura real do card
      const optRows = Math.ceil(opts.length / 2);
      const qH = 50 + optRows * 55 + 20;

      // Não renderiza o que está fora da área visível
      if (cardY + qH < CONTENT_TOP || cardY > CONTENT_BOTTOM) {
        cardY += qH + QUESTION_CARD_GAP;
        return;
      }

      // Card de fundo
      r.fillRoundRect(cardX, cardY, cardW, qH, 10, 'rgba(8,16,40,0.92)');
      r.strokeRoundRect(cardX, cardY, cardW, qH, 10, '#1a3060', 1.5);

      // Número da questão
      r.drawText(`Q${qi + 1}`, cardX + 20, cardY + 26, '#7aaad4', 14, 'left', 'Rajdhani');

      // Enunciado
      r.drawWrappedText(q.text || '', cardX + 60, cardY + 24, cardW - 80, 22,
        '#e8f4ff', 15, 'Rajdhani');

      // Alternativas (grade 2×2)
      const optStartY = cardY + 50;
      const btnW      = (cardW - 60) / 2 - 8;
      const btnH      = 44;

      opts.forEach((opt, i) => {
        const col  = i % 2;
        const row  = Math.floor(i / 2);
        const bx   = cardX + 20 + col * (btnW + 16);
        const by   = optStartY + row * (btnH + 8);

        const isCorrect = i === correct;
        const isChosen  = i === chosen;

        let bg     = 'rgba(14,24,50,0.8)';
        let border = '#1a3060';
        let tColor = '#aad4e8';

        if (isCorrect) {
          bg     = 'rgba(10,50,20,0.9)';
          border = '#44dd88';
          tColor = '#55ee99';
        }
        if (isChosen && !isCorrect) {
          bg     = 'rgba(60,10,10,0.9)';
          border = '#ff5555';
          tColor = '#ffaaaa';
        }
        if (isChosen && isCorrect) {
          bg     = 'rgba(10,60,20,0.95)';
          border = '#66ff99';
          tColor = '#66ff99';
        }

        r.fillRoundRect(bx, by, btnW, btnH, 7, bg);
        r.strokeRoundRect(bx, by, btnW, btnH, 7, border, isCorrect || isChosen ? 2 : 1);

        // Prefixo A/B/C/D
        const prefix = ['A', 'B', 'C', 'D'][i] || String(i + 1);

        // Ícone se foi a escolha ou correta
        let icon = '';
        if (isChosen && isCorrect) icon = ' ✔';
        else if (isChosen)         icon = ' ✘';
        else if (isCorrect)        icon = ' ✔';

        r.drawText(`${prefix}) ${opt}${icon}`, bx + 12, by + btnH / 2 + 7,
          tColor, 13, 'left', 'Rajdhani');
      });

      cardY += qH + QUESTION_CARD_GAP;
    });

    ctx.restore();

    // Scrollbar indicativa (se necessário)
    if (this._maxScroll > 0) {
      const sbX   = VIRTUAL_W - 18;
      const sbH   = VISIBLE_H;
      const sbY   = CONTENT_TOP;
      const thumbH = Math.max(40, sbH * (VISIBLE_H / (VISIBLE_H + this._maxScroll)));
      const thumbY = sbY + (this._scrollY / this._maxScroll) * (sbH - thumbH);

      r.fillRoundRect(sbX - 6, sbY, 8, sbH, 4, 'rgba(20,40,80,0.5)');
      r.fillRoundRect(sbX - 6, thumbY, 8, thumbH, 4, '#2a5a8c');
    }
  }
}

export default RunReviewScene;
