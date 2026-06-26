/**
 * @file JoinClassScene.js
 * @description Tela para o aluno entrar em uma turma digitando o código (classId).
 * Se já estiver em uma turma, exibe opção de sair.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class JoinClassScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._codeText    = '';
    this._activeField = false;
    this._anim        = 0;
    this._cursorBlink = 0;
    this._errorMsg    = '';
    this._successMsg  = '';
    this._loading     = false;
    this._stars       = [];

    this._fieldCode   = null;
    this._btnBack     = null;
    this._btnJoin     = null;
    this._btnLeave    = null;

    this._keyHandler = (e) => this._onKey(e);
  }

  enter() {
    this._codeText    = '';
    this._activeField = true;
    this._anim        = 0;
    this._cursorBlink = 0;
    this._errorMsg    = '';
    this._successMsg  = '';
    this._loading     = false;
    this._stars       = Array.from({ length: 60 }, () => ({
      x:     Math.random() * VIRTUAL_W,
      y:     Math.random() * VIRTUAL_H,
      size:  0.5 + Math.random() * 1.5,
      alpha: Math.random()
    }));

    document.addEventListener('keydown', this._keyHandler);
    this._setupButtons();
  }

  exit() {
    document.removeEventListener('keydown', this._keyHandler);
    this.input.clearButtons();
  }

  _setupButtons() {
    this.input.clearButtons();

    const user    = this.manager.state.currentUser;
    const inClass = user && user.classId;

    this._btnBack = { x: 50, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => this.manager.goto('profile'));

    if (!inClass) {
      const fW = 420, fH = 58;
      const fX = VIRTUAL_W / 2 - fW / 2;
      const fY = VIRTUAL_H / 2 - 50;
      this._fieldCode = { x: fX, y: fY, w: fW, h: fH };
      this.input.addButton(this._fieldCode, () => { this._activeField = true; });

      this._btnJoin  = { x: VIRTUAL_W / 2 - 100, y: VIRTUAL_H / 2 + 40, w: 200, h: 54 };
      this._btnLeave = null;
      this.input.addButton(this._btnJoin, () => this._doJoin());
    } else {
      this._fieldCode = null;
      this._btnJoin   = null;
      this._btnLeave  = { x: VIRTUAL_W / 2 - 120, y: VIRTUAL_H / 2 + 30, w: 240, h: 54 };
      this.input.addButton(this._btnLeave, () => this._doLeave());
    }
  }

  _onKey(e) {
    if (this._loading) return;
    const user = this.manager.state.currentUser;
    if (user && user.classId) return;
    if (!this._activeField) return;

    if (e.key === 'Backspace') {
      this._codeText = this._codeText.slice(0, -1);
      this._errorMsg = '';
      return;
    }
    if (e.key === 'Enter') {
      this._doJoin();
      return;
    }
    if (e.key.length === 1 && this._codeText.length < 40) {
      this._codeText += e.key;
      this._errorMsg  = '';
    }
  }

  async _doJoin() {
    const code = this._codeText.trim();
    if (!code) { this._errorMsg = 'Digite o código da turma.'; return; }

    this._loading  = true;
    this._errorMsg = '';
    try {
      const user = this.manager.state.currentUser;
      const res  = await fetch(`https://${window.location.hostname}:3000/class/${code}/join`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId: user.userId })
      });
      const data = await res.json();
      if (data.success) {
        user.classId = code;
        this.manager.state.currentUser.classId = code;
        const raw = localStorage.getItem('dataexpress_session');
        if (raw) {
          try {
            const s = JSON.parse(raw);
            s.classId = code;
            localStorage.setItem('dataexpress_session', JSON.stringify(s));
          } catch { /* ignora */ }
        }
        this._successMsg = `Você entrou na turma "${data.className}"!`;
        this._loading    = false;
        this._setupButtons();
      } else {
        this._errorMsg = data.message || 'Código inválido.';
        this._loading  = false;
      }
    } catch {
      this._errorMsg = 'Servidor indisponível.';
      this._loading  = false;
    }
  }

  async _doLeave() {
    this._loading  = true;
    this._errorMsg = '';
    try {
      const user = this.manager.state.currentUser;
      await fetch(`https://${window.location.hostname}:3000/class/${user.classId}/kick`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId: user.userId })
      });
      user.classId = null;
      this.manager.state.currentUser.classId = null;
      const raw = localStorage.getItem('dataexpress_session');
      if (raw) {
        try {
          const s = JSON.parse(raw);
          s.classId = null;
          localStorage.setItem('dataexpress_session', JSON.stringify(s));
        } catch { /* ignora */ }
      }
      this._loading = false;
      this._setupButtons();
    } catch {
      this._errorMsg = 'Servidor indisponível.';
      this._loading  = false;
    }
  }

  update(dt) {
    this._anim        += dt;
    this._cursorBlink += dt;
    for (const s of this._stars) {
      s.alpha = 0.15 + 0.85 * Math.abs(Math.sin(this._anim * 0.4 + s.x * 0.01));
    }
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    for (const s of this._stars) {
      r.fillCircle(s.x, s.y, s.size, '#8ab4cc', s.alpha * 0.4);
    }

    r.drawTextShadow('TURMA', VIRTUAL_W / 2, 160, '#5ab4ff', 54, 'center', 'Rajdhani');

    // Botão voltar
    if (this._btnBack) {
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a');
    }

    const user    = this.manager.state.currentUser;
    const inClass = user && user.classId;

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Aguarde${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2 + 20, '#5ab4ff', 20, 'center', 'Rajdhani');
      return;
    }

    if (inClass) {
      // Mostra info da turma atual
      r.drawText('Você está em uma turma', VIRTUAL_W / 2, VIRTUAL_H / 2 - 50, '#7aaccc', 18, 'center', 'Rajdhani');
      r.drawText(`Código: ${user.classId}`, VIRTUAL_W / 2, VIRTUAL_H / 2 - 15, '#d0e8ff', 22, 'center', 'Rajdhani');

      if (this._successMsg) {
        r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(0,60,20,0.85)');
        r.drawText(this._successMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#44dd88', 14, 'center', 'Rajdhani');
      }

      if (this._btnLeave) {
        const hover = this.input.isHover(this._btnLeave);
        const { x, y, w, h } = this._btnLeave;
        r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(80,15,15,0.95)' : 'rgba(40,8,8,0.80)');
        r.strokeRoundRect(x, y, w, h, 10, hover ? '#ff6666' : '#8c1a1a', hover ? 2 : 1);
        r.drawText('Sair da Turma', x + w / 2, y + h / 2 + 7, hover ? '#ffb3b3' : '#e68080', 17, 'center', 'Rajdhani');
      }
    } else {
      // Campo de código
      r.drawText('Código da Turma', VIRTUAL_W / 2 - 210, VIRTUAL_H / 2 - 64, '#7aaccc', 14, 'left', 'Rajdhani');
      const fc = this._fieldCode;
      if (fc) {
        const cur = this._activeField && Math.floor(this._cursorBlink * 2) % 2 === 0 ? '|' : '';
        r.fillRoundRect(fc.x, fc.y, fc.w, fc.h, 8, 'rgba(5,12,30,0.95)');
        r.strokeRoundRect(fc.x, fc.y, fc.w, fc.h, 8,
          this._activeField ? '#5ab4ff' : '#2a6aaa',
          this._activeField ? 2.5 : 1.5);
        r.drawText(this._codeText + cur, fc.x + 14, fc.y + fc.h / 2 + 9, '#d0e8ff', 20, 'left', 'Rajdhani');
      }

      if (this._successMsg) {
        r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(0,60,20,0.85)');
        r.drawText(this._successMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#44dd88', 14, 'center', 'Rajdhani');
      }

      if (this._errorMsg) {
        r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(80,0,0,0.85)');
        r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#ff8888', 14, 'center', 'Rajdhani');
      }

      if (this._btnJoin) {
        r.drawButton(this._btnJoin.x, this._btnJoin.y, this._btnJoin.w, this._btnJoin.h,
          'Entrar', this.input.isHover(this._btnJoin), false, '#1a4a2a');
      }
    }
  }
}

export default JoinClassScene;
