/**
 * @file GameOverScene.js
 * @description Tela de game over.
 */
import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class GameOverScene {
  constructor({ assets, input }) {
    this.assets    = assets;
    this.input     = input;
    this.manager   = null;
    this._btn      = null;
    this._btnReplay = null;
    this._anim     = 0;
  }

  enter() {
    this._anim = 0;

    // Salva derrota no servidor apenas uma vez (evita duplo POST ao voltar do replay)
    const user = this.manager.state.currentUser;
    const st   = this.manager.state;
    if (user && st.phase && !st._resultPosted) {
      st._resultPosted = true;
      const total = (st.questionsCorrect || 0) + (st.questionsWrong || 0);
      fetch(`https://${window.location.hostname}:3000/player/result`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId:           user.userId,
          phaseId:          st.phase.id,
          phaseName:        st.phase.name,
          won:              false,
          questionsCorrect: st.questionsCorrect || 0,
          totalAnswers:     total,
          runQuestions:     st.runQuestions    || []
        })
      })
        .then(r => r.json())
        .then(data => { if (data.success) user.profile = data.profile; })
        .catch(() => {});
    }

    this.input.clearButtons();

    // Dois botões lado a lado
    this._btn = { x: VIRTUAL_W / 2 - 240, y: VIRTUAL_H - 100, w: 220, h: 50 };
    this.input.addButton(this._btn, () => {
      this.manager.resetState();
      this.manager.goto('phaseSelect');
    });

    this._btnReplay = { x: VIRTUAL_W / 2 + 20, y: VIRTUAL_H - 100, w: 220, h: 50 };
    this.input.addButton(this._btnReplay, () => {
      this.manager.state.replayReturnTo = 'gameover';
      this.manager.goto('runReplay');
    });
  }

  exit() { this.input.clearButtons(); }

  update(dt) { this._anim += dt; }

  render(r) {
    r.drawGradientBg('#100005', '#200010');
    const pulse = 0.8 + 0.2 * Math.sin(this._anim * 2);
    r.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H, `rgba(80,0,0,${0.1 * pulse})`);

    r.drawTextShadow('💀 GAME OVER', VIRTUAL_W / 2, VIRTUAL_H / 2 - 40, '#ff3333', 50, 'center', 'Rajdhani');
    r.drawText('Você foi derrotado...', VIRTUAL_W / 2, VIRTUAL_H / 2 + 20, '#aa3333', 20, 'center', 'Rajdhani');
    r.drawText('O metrô ainda precisa de um herói.', VIRTUAL_W / 2, VIRTUAL_H / 2 + 50, '#664444', 16, 'center', 'Rajdhani');

    if (this._btn) {
      const hover = this.input.isHover(this._btn);
      r.drawButton(this._btn.x, this._btn.y, this._btn.w, this._btn.h, '↺ Tentar Novamente', hover, false, '#4a0a0a');
    }
    if (this._btnReplay) {
      const hover = this.input.isHover(this._btnReplay);
      r.drawButton(this._btnReplay.x, this._btnReplay.y, this._btnReplay.w, this._btnReplay.h, '📋 Ver Run', hover, false, '#1a2a3a');
    }
  }
}

export default GameOverScene;
