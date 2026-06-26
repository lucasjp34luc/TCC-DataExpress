/**
 * @file RunHistoryScene.js
 * @description Exibe as últimas 5 runs de uma fase/linha selecionada.
 * Cada run é clicável e leva à tela de revisão da run.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class RunHistoryScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim       = 0;
    this._loading    = false;
    this._errorMsg   = '';
    this._runs       = [];
    this._runCards   = []; // [{rect, run, index}]
    this._phaseName  = '';
    this._btnBack    = null;
  }

  enter() {
    this._anim      = 0;
    this._errorMsg  = '';
    this._loading   = true;
    this._runs      = [];
    this._runCards  = [];

    const st = this.manager.state;
    this._phaseName = st.selectedPhaseName || st.selectedPhaseId || '?';

    const viewUserId        = st.viewUserId        || null;
    const viewUsername      = st.viewUsername      || null;
    const viewFrom          = st.viewFrom          || 'ranking';
    const viewFromClassId   = st.viewFromClassId   || null;
    const viewFromClassName = st.viewFromClassName || null;

    this.input.clearButtons();
    this._btnBack = { x: 50, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => {
      if (viewUserId) {
        this.manager.goto('profile', {
          viewUserId,
          viewUsername,
          from:      viewFrom,
          classId:   viewFromClassId,
          className: viewFromClassName
        });
      } else {
        this.manager.goto('profile');
      }
    });

    const user    = st.currentUser;
    const phaseId = st.selectedPhaseId;
    const targetId = viewUserId || (user && user.userId);

    if (!targetId || !phaseId) {
      this._errorMsg = 'Dados inválidos.';
      this._loading  = false;
      return;
    }

    fetch(`https://${window.location.hostname}:3000/player/runs/${targetId}/${phaseId}`)
      .then(r => r.json())
      .then(data => {
        this._runs    = data.success ? (data.runs || []) : [];
        this._loading = false;
        this._setupRunButtons();
      })
      .catch(() => {
        this._errorMsg = 'Não foi possível carregar o histórico.';
        this._loading  = false;
      });
  }

  _setupRunButtons() {
    // Mantém o botão Voltar e adiciona os botões de run
    const cardW = 900;
    const cardH = 80;
    const cardX = (VIRTUAL_W - cardW) / 2;
    let   cardY = 182;

    this._runCards = [];
    this._runs.forEach((run, idx) => {
      const rect = { x: cardX, y: cardY, w: cardW, h: cardH };
      this._runCards.push({ rect, run, index: idx });
      this.input.addButton(rect, () => {
        this.manager.state.selectedRun = run;
        this.manager.goto('runReview');
      });
      cardY += cardH + 12;
    });
  }

  exit() {
    this.input.clearButtons();
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    // Cabeçalho
    r.drawTextShadow(`HISTÓRICO — ${this._phaseName.toUpperCase()}`, VIRTUAL_W / 2, 48, '#5ab4ff', 28, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#1a3a5c', 1);

    // Botão voltar
    if (this._btnBack) {
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a');
    }

    // Subtítulo
    r.drawText('Últimas 5 runs', VIRTUAL_W / 2, 118, '#8aaec8', 15, 'center', 'Rajdhani');

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2, '#5ab4ff', 22, 'center', 'Rajdhani');
      return;
    }

    if (this._errorMsg) {
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H / 2, '#ff9999', 20, 'center', 'Rajdhani');
      return;
    }

    if (this._runs.length === 0) {
      r.drawText('Nenhuma run registrada para esta fase.', VIRTUAL_W / 2, VIRTUAL_H / 2, '#8ab4cc', 18, 'center', 'Rajdhani');
      return;
    }

    this._runCards.forEach(({ rect, run, index }) => {
      const hover = this.input.isHover(rect);
      const won   = run.won;

      const bg     = hover ? 'rgba(20,40,80,0.95)' : 'rgba(8,16,40,0.90)';
      const border = hover ? '#5ab4ff' : (won ? '#2a5a3a' : '#5a2a2a');

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 10, bg);
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 10, border, 1.5);

      // Número da run (mais recente = #1)
      r.drawText(`Run #${index + 1}`, rect.x + 30, rect.y + rect.h / 2 + 8,
        '#7ac8ff', 16, 'left', 'Rajdhani');

      // Resultado
      const resultLabel = won ? '✔ Vitória' : '✘ Derrota';
      const resultColor = won ? '#44dd88'   : '#ff6666';
      r.drawText(resultLabel, rect.x + 160, rect.y + rect.h / 2 + 8, resultColor, 16, 'left', 'Rajdhani');

      // Acerto de questões
      const pct = run.totalAnswers > 0
        ? Math.round(run.questionsCorrect / run.totalAnswers * 100)
        : 0;
      r.drawText(`${run.questionsCorrect}/${run.totalAnswers} questões (${pct}%)`,
        rect.x + 330, rect.y + rect.h / 2 + 8, '#aad4e8', 14, 'left', 'Rajdhani');

      // Data
      if (run.timestamp) {
        const d   = new Date(run.timestamp);
        const fmt = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}  ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        r.drawText(fmt, rect.x + rect.w - 200, rect.y + rect.h / 2 + 8, '#7aaac8', 13, 'left', 'Rajdhani');
      }

      // Indicador de clique
      r.drawText('▶', rect.x + rect.w - 30, rect.y + rect.h / 2 + 8,
        hover ? '#7ac8ff' : '#5a8aaa', 16, 'center', 'Rajdhani');
    });
  }
}

export default RunHistoryScene;
