/**
 * @file ModeSelectScene.js
 * @description Tela inicial de selecao de modo: Historia ou PvP.
 * E a primeira cena exibida ao iniciar o jogo.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class ModeSelectScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._btnHistory  = null;
    this._btnPvp      = null;
    this._btnSettings = null;
    this._btnProfile  = null;
    this._btnTutorial = null;
    this._btnRanking  = null;
    this._anim        = 0;
    this._stars       = [];
  }

  enter() {
    this._anim  = 0;
    this._stars = Array.from({ length: 80 }, () => ({
      x:     Math.random() * VIRTUAL_W,
      y:     Math.random() * VIRTUAL_H,
      size:  0.5 + Math.random() * 2,
      alpha: Math.random()
    }));

    this.input.clearButtons();

    const btnW = 300, btnH = 64, btnGap = 16;
    const btnX = VIRTUAL_W / 2 - btnW / 2;
    const btnY = 270;

    this._btnHistory = { x: btnX, y: btnY, w: btnW, h: btnH };
    this.input.addButton(this._btnHistory, () => {
      this.manager.goto('story');
    });

    this._btnPvp = { x: btnX, y: btnY + (btnH + btnGap), w: btnW, h: btnH };
    this.input.addButton(this._btnPvp, () => {
      this.manager.goto('pvpSetup');
    });

    this._btnRanking = { x: btnX, y: btnY + (btnH + btnGap) * 2, w: btnW, h: btnH };
    this.input.addButton(this._btnRanking, () => {
      this.manager.goto('ranking');
    });

    this._btnTutorial = { x: btnX, y: btnY + (btnH + btnGap) * 3, w: btnW, h: btnH };
    this.input.addButton(this._btnTutorial, () => {
      this.manager.goto('tutorial');
    });

    // Botão Perfil (canto superior esquerdo)
    this._btnProfile = { x: 50, y: 18, w: 130, h: 44 };
    this.input.addButton(this._btnProfile, () => {
      this.manager.goto('profile');
    });

    // Botão Sair (ao lado do perfil)

    // Botão de configurações (canto superior direito)
    const gearSize = 44;
    this._btnSettings = { x: VIRTUAL_W - gearSize - 50, y: 18, w: gearSize, h: gearSize };
    this.input.addButton(this._btnSettings, () => {
      this.manager.goto('settings', { from: 'modeSelect' });
    });
  }

  exit() {
    this.input.clearButtons();
  }

  update(dt) {
    this._anim += dt;
    for (const s of this._stars) {
      s.alpha = 0.2 + 0.8 * Math.abs(Math.sin(this._anim * 0.4 + s.x * 0.01));
    }
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    // Estrelas de fundo
    for (const s of this._stars) {
      r.fillCircle(s.x, s.y, s.size, '#8ab4cc', s.alpha * 0.5);
    }

    // Titulo principal
    const titlePulse = 0.95 + 0.05 * Math.sin(this._anim * 1.2);
    r.ctx.save();
    r.ctx.globalAlpha = titlePulse;
    r.drawTextShadow('DATA EXPRESS', VIRTUAL_W / 2, 210, '#5ab4ff', 72, 'center', 'Rajdhani');
    r.ctx.restore();

    // ── Botao Modo Historia ───────────────────────────────────────────────
    if (this._btnHistory) {
      const { x, y, w, h } = this._btnHistory;
      const hover = this.input.isHover(this._btnHistory);
      r.fillRoundRect(x, y, w, h, 12, hover ? 'rgba(20,55,120,0.98)' : 'rgba(10,25,60,0.92)');
      r.strokeRoundRect(x, y, w, h, 12, hover ? '#5ab4ff' : '#1a4a8c', hover ? 2 : 1.5);
      r.drawTextShadow('Modo Historia', x + w / 2, y + h / 2 + 7, hover ? '#d0e8ff' : '#8ab4cc', 20, 'center', 'Rajdhani');
    }

    // ── Botao Modo PvP ───────────────────────────────────────────────────
    if (this._btnPvp) {
      const { x, y, w, h } = this._btnPvp;
      const hover = this.input.isHover(this._btnPvp);
      r.fillRoundRect(x, y, w, h, 12, hover ? 'rgba(100,20,20,0.98)' : 'rgba(50,10,10,0.92)');
      r.strokeRoundRect(x, y, w, h, 12, hover ? '#ff6666' : '#8c1a1a', hover ? 2 : 1.5);
      r.drawTextShadow('Modo PvP', x + w / 2, y + h / 2 + 7, hover ? '#ffcccc' : '#cc8888', 20, 'center', 'Rajdhani');
    }

    // ── Botão Perfil (canto superior esquerdo) ────────────────────────────
    if (this._btnProfile) {
      const { x, y, w, h } = this._btnProfile;
      const hover = this.input.isHover(this._btnProfile);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(20,50,110,0.95)' : 'rgba(10,25,60,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#5ab4ff' : '#1a4a8c', hover ? 2 : 1);
      r.drawText('👤 Perfil', x + w / 2, y + h / 2 + 7, hover ? '#5ab4ff' : '#7aaccc', 15, 'center', 'Rajdhani');
    }


    // ── Botão Ranking ────────────────────────────────────────────────────
    if (this._btnRanking) {
      const { x, y, w, h } = this._btnRanking;
      const hover = this.input.isHover(this._btnRanking);
      r.fillRoundRect(x, y, w, h, 12, hover ? 'rgba(60,44,0,0.92)' : 'rgba(24,18,0,0.75)');
      r.strokeRoundRect(x, y, w, h, 12, hover ? '#ffcc44' : '#7a6000', hover ? 2 : 1.5);
      r.drawText('🏆 Ranking', x + w / 2, y + h / 2 + 7, hover ? '#ffcc44' : '#aa8800', 20, 'center', 'Rajdhani');
    }

    // ── Botão Tutorial ───────────────────────────────────────────────────
    if (this._btnTutorial) {
      const { x, y, w, h } = this._btnTutorial;
      const hover = this.input.isHover(this._btnTutorial);
      r.fillRoundRect(x, y, w, h, 12, hover ? 'rgba(10,30,60,0.90)' : 'rgba(5,15,35,0.75)');
      r.strokeRoundRect(x, y, w, h, 12, hover ? '#5ab4ff' : '#2a4a6c', hover ? 2 : 1.5);
      r.drawText('Tutorial', x + w / 2, y + h / 2 + 7, hover ? '#c0e8ff' : '#7aaccc', 20, 'center', 'Rajdhani');
    }

    // ── Botão Configurações (canto superior direito) ──────────────────────
    if (this._btnSettings) {
      const { x, y, w, h } = this._btnSettings;
      const hover = this.input.isHover(this._btnSettings);

      r.fillRoundRect(x, y, w, h, 10,
        hover ? 'rgba(30,70,140,0.95)' : 'rgba(10,25,60,0.80)');
      r.strokeRoundRect(x, y, w, h, 10,
        hover ? '#5ab4ff' : '#1a4a8c', hover ? 2 : 1);

      // Ícone de engrenagem desenhado como texto Unicode
      r.drawText('⚙', x + w / 2, y + h / 2 + 8, hover ? '#5ab4ff' : '#3a6a9c', 24, 'center', 'sans-serif');
    }
    
  }
}

export default ModeSelectScene;
