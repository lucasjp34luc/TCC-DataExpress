/**
 * @file LoginScene.js
 * @description Tela de login — primeira cena exibida ao iniciar o jogo.
 * Permite fazer login ou ir para a tela de criar conta.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class LoginScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._nameText    = '';
    this._passText    = '';
    this._activeField = 'name'; // 'name' | 'pass'
    this._anim        = 0;
    this._cursorBlink = 0;
    this._errorMsg    = '';
    this._loading     = false;
    this._showPass    = false;
    this._stars       = [];

    this._fieldName    = null;
    this._fieldPass    = null;
    this._btnLogin     = null;
    this._btnCreate    = null;
    this._btnTogglePass = null;

    this._keyHandler = (e) => this._onKey(e);
  }

  enter() {
    this._nameText    = '';
    this._passText    = '';
    this._activeField = 'name';
    this._anim        = 0;
    this._cursorBlink = 0;
    this._errorMsg    = '';
    this._loading     = false;
    this._showPass    = false;
    this._stars       = Array.from({ length: 70 }, () => ({
      x:     Math.random() * VIRTUAL_W,
      y:     Math.random() * VIRTUAL_H,
      size:  0.5 + Math.random() * 1.8,
      alpha: Math.random()
    }));

    document.addEventListener('keydown', this._keyHandler);
    this._setupButtons();
  }

  exit() {
    document.removeEventListener('keydown', this._keyHandler);
    this.input.clearButtons();
  }

  // ─── Setup de botões ──────────────────────────────────────────────────────

  _setupButtons() {
    this.input.clearButtons();

    const fW = 420, fH = 58;
    const fX = VIRTUAL_W / 2 - fW / 2;
    const nameY = VIRTUAL_H / 2 - 110;
    const passY = VIRTUAL_H / 2 - 20;

    this._fieldName = { x: fX, y: nameY, w: fW, h: fH };
    this._fieldPass = { x: fX, y: passY, w: fW, h: fH };

    this._btnTogglePass = { x: this._fieldPass.x + fW - 44, y: passY + (fH - 36) / 2, w: 36, h: 36 };
    this.input.addButton(this._btnTogglePass, () => { this._showPass = !this._showPass; });

    this.input.addButton(this._fieldName, () => { this._activeField = 'name'; });
    this.input.addButton(this._fieldPass, () => { this._activeField = 'pass'; });

    this._btnLogin  = { x: VIRTUAL_W / 2 - 215, y: VIRTUAL_H / 2 + 80, w: 200, h: 54 };
    this._btnCreate = { x: VIRTUAL_W / 2 + 15,  y: VIRTUAL_H / 2 + 80, w: 200, h: 54 };

    this.input.addButton(this._btnLogin,  () => this._doLogin());
    this.input.addButton(this._btnCreate, () => this.manager.goto('createAccount'));
  }

  // ─── Teclado ──────────────────────────────────────────────────────────────

  _onKey(e) {
    if (this._loading) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      this._activeField = this._activeField === 'name' ? 'pass' : 'name';
      return;
    }

    if (e.key === 'Backspace') {
      if (this._activeField === 'name') this._nameText = this._nameText.slice(0, -1);
      else                              this._passText = this._passText.slice(0, -1);
      this._errorMsg = '';
      return;
    }

    if (e.key === 'Enter') {
      if (this._activeField === 'name') this._activeField = 'pass';
      else                              this._doLogin();
      return;
    }

    if (e.key.length === 1) {
      if (this._activeField === 'name' && this._nameText.length < 24) {
        this._nameText += e.key;
        this._errorMsg  = '';
      } else if (this._activeField === 'pass' && this._passText.length < 32) {
        this._passText += e.key;
        this._errorMsg  = '';
      }
    }
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async _doLogin() {
    const name = this._nameText.trim();
    const pass = this._passText;
    if (!name) { this._errorMsg = 'Digite seu nome.';  return; }
    if (!pass) { this._errorMsg = 'Digite sua senha.'; return; }

    this._loading  = true;
    this._errorMsg = '';
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: name, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        this.manager.state.currentUser = {
          userId:   data.userId,
          username: data.username,
          role:     data.role    || 'aluno',
          classId:  data.classId || null,
          profile:  data.profile
        };
        localStorage.setItem('dataexpress_session', JSON.stringify({
          userId:    data.userId,
          username:  data.username,
          role:      data.role    || 'aluno',
          classId:   data.classId || null,
          profile:   data.profile,
          loginTime: Date.now()
        }));
        if ((data.role || 'aluno') === 'professor') {
          this.manager.goto('teacherProfile');
        } else {
          this.manager.goto('modeSelect');
        }
      } else {
        this._errorMsg = data.message || 'Erro ao fazer login.';
        this._loading  = false;
      }
    } catch {
      this._errorMsg = 'Servidor indisponível. Verifique se o servidor está rodando.';
      this._loading  = false;
    }
  }

  // ─── Ícone olho ───────────────────────────────────────────────────────────

  _drawEyeIcon(r, cx, cy, open) {
    const ctx = r.ctx;
    const s   = r.scale;
    const x   = cx * s;
    const y   = cy * s;
    const hover = this._btnTogglePass && this.input.isHover(this._btnTogglePass);
    const color = hover ? '#5ab4ff' : '#4a7a9a';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5 * s;
    ctx.lineCap     = 'round';

    if (open) {
      ctx.beginPath();
      ctx.moveTo(x - 11 * s, y);
      ctx.bezierCurveTo(x - 11 * s, y - 7 * s, x + 11 * s, y - 7 * s, x + 11 * s, y);
      ctx.bezierCurveTo(x + 11 * s, y + 7 * s, x - 11 * s, y + 7 * s, x - 11 * s, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - 11 * s, y);
      ctx.bezierCurveTo(x - 5 * s, y - 6 * s, x + 5 * s, y - 6 * s, x + 11 * s, y);
      ctx.stroke();
      for (const dx of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * s, y + 1 * s);
        ctx.lineTo(x + dx * s, y + 5 * s);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ─── Update / Render ──────────────────────────────────────────────────────

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
      r.fillCircle(s.x, s.y, s.size, '#8ab4cc', s.alpha * 0.45);
    }

    // Título
    const pulse = 0.95 + 0.05 * Math.sin(this._anim * 1.2);
    r.ctx.save();
    r.ctx.globalAlpha = pulse;
    r.drawTextShadow('DATA EXPRESS', VIRTUAL_W / 2, 175, '#5ab4ff', 68, 'center', 'Rajdhani');
    r.ctx.restore();

    const fX = VIRTUAL_W / 2 - 210;

    // Campo Nome
    r.drawText('Nome', fX, VIRTUAL_H / 2 - 124, '#7aaccc', 14, 'left', 'Rajdhani');
    const fn = this._fieldName;
    if (fn) {
      const active = this._activeField === 'name';
      r.fillRoundRect(fn.x, fn.y, fn.w, fn.h, 8, 'rgba(5,12,30,0.95)');
      r.strokeRoundRect(fn.x, fn.y, fn.w, fn.h, 8, active ? '#5ab4ff' : '#2a6aaa', active ? 2.5 : 1.5);
      const cur = active && Math.floor(this._cursorBlink * 2) % 2 === 0 ? '|' : '';
      r.drawText(this._nameText + cur, fn.x + 14, fn.y + fn.h / 2 + 9, '#d0e8ff', 20, 'left', 'Rajdhani');
    }

    // Campo Senha
    r.drawText('Senha', fX, VIRTUAL_H / 2 - 34, '#7aaccc', 14, 'left', 'Rajdhani');
    const fp = this._fieldPass;
    if (fp) {
      const active = this._activeField === 'pass';
      r.fillRoundRect(fp.x, fp.y, fp.w, fp.h, 8, 'rgba(5,12,30,0.95)');
      r.strokeRoundRect(fp.x, fp.y, fp.w, fp.h, 8, active ? '#5ab4ff' : '#2a6aaa', active ? 2.5 : 1.5);
      const cur = active && Math.floor(this._cursorBlink * 2) % 2 === 0 ? '|' : '';
      const passDisplay = this._showPass ? this._passText : '●'.repeat(this._passText.length);
      r.drawText(passDisplay + cur, fp.x + 14, fp.y + fp.h / 2 + 9, '#d0e8ff', 20, 'left', 'Rajdhani');
      this._drawEyeIcon(r, fp.x + fp.w - 26, fp.y + fp.h / 2, this._showPass);
    }



    // Erro
    if (this._errorMsg) {
      r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(80,0,0,0.85)');
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#ff8888', 14, 'center', 'Rajdhani');
    }

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Entrando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2 + 112, '#5ab4ff', 18, 'center', 'Rajdhani');
      return;
    }

    // Botões
    if (this._btnLogin) {
      r.drawButton(this._btnLogin.x, this._btnLogin.y, this._btnLogin.w, this._btnLogin.h,
        'Logar', this.input.isHover(this._btnLogin), false, '#1a4a2a');
    }
    if (this._btnCreate) {
      r.drawButton(this._btnCreate.x, this._btnCreate.y, this._btnCreate.w, this._btnCreate.h,
        'Criar Conta', this.input.isHover(this._btnCreate), false, '#1a3a6a');
    }
  }
}

export default LoginScene;
