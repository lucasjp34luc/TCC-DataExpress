/**
 * @file CreateAccountScene.js
 * @description Tela de criação de conta. Acesada a partir da LoginScene.
 * Após criar a conta, o usuário é automaticamente logado e vai para modeSelect.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class CreateAccountScene {
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
    this._role        = 'aluno'; // 'aluno' | 'professor'

    this._fieldName     = null;
    this._fieldPass     = null;
    this._btnBack       = null;
    this._btnCreate     = null;
    this._btnTogglePass = null;
    this._btnRoleAluno  = null;
    this._btnRoleProf   = null;

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
    this._role        = 'aluno';
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
    const nameY = VIRTUAL_H / 2 - 120;
    const passY = VIRTUAL_H / 2 - 30;

    this._fieldName = { x: fX, y: nameY, w: fW, h: fH };
    this._fieldPass = { x: fX, y: passY, w: fW, h: fH };

    this._btnTogglePass = { x: this._fieldPass.x + fW - 44, y: passY + (fH - 36) / 2, w: 36, h: 36 };
    this.input.addButton(this._btnTogglePass, () => { this._showPass = !this._showPass; });

    this.input.addButton(this._fieldName, () => { this._activeField = 'name'; });
    this.input.addButton(this._fieldPass, () => { this._activeField = 'pass'; });

    // Botões de tipo de conta (abaixo do campo senha com folga)
    this._btnRoleAluno = { x: VIRTUAL_W / 2 - 215, y: VIRTUAL_H / 2 + 70, w: 196, h: 44 };
    this._btnRoleProf  = { x: VIRTUAL_W / 2 + 19,  y: VIRTUAL_H / 2 + 70, w: 196, h: 44 };
    this.input.addButton(this._btnRoleAluno, () => { this._role = 'aluno'; });
    this.input.addButton(this._btnRoleProf,  () => { this._role = 'professor'; });

    this._btnBack   = { x: VIRTUAL_W / 2 - 215, y: VIRTUAL_H / 2 + 134, w: 200, h: 54 };
    this._btnCreate = { x: VIRTUAL_W / 2 + 15,  y: VIRTUAL_H / 2 + 134, w: 200, h: 54 };

    this.input.addButton(this._btnBack,   () => this.manager.goto('login'));
    this.input.addButton(this._btnCreate, () => this._doCreate());
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
      else                              this._doCreate();
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

  // ─── Criar conta ──────────────────────────────────────────────────────────

  async _doCreate() {
    const name = this._nameText.trim();
    const pass = this._passText;
    if (!name)          { this._errorMsg = 'Digite seu nome.';                        return; }
    if (pass.length < 4){ this._errorMsg = 'Senha deve ter ao menos 4 caracteres.';  return; }

    this._loading  = true;
    this._errorMsg = '';
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: name, password: pass, role: this._role })
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
          this.manager.goto('teacherTutorial');
        } else {
          this.manager.goto('tutorial');
        }
      } else {
        this._errorMsg = data.message || 'Erro ao criar conta.';
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
      // Contorno do olho (arco superior + inferior)
      ctx.beginPath();
      ctx.moveTo(x - 11 * s, y);
      ctx.bezierCurveTo(x - 11 * s, y - 7 * s, x + 11 * s, y - 7 * s, x + 11 * s, y);
      ctx.bezierCurveTo(x + 11 * s, y + 7 * s, x - 11 * s, y + 7 * s, x - 11 * s, y);
      ctx.stroke();
      // Pupila
      ctx.beginPath();
      ctx.arc(x, y, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Olho fechado — linha horizontal ondulada
      ctx.beginPath();
      ctx.moveTo(x - 11 * s, y);
      ctx.bezierCurveTo(x - 5 * s, y - 6 * s, x + 5 * s, y - 6 * s, x + 11 * s, y);
      ctx.stroke();
      // Três cílios para baixo
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

    r.drawTextShadow('CRIAR CONTA', VIRTUAL_W / 2, 170, '#5ab4ff', 52, 'center', 'Rajdhani');
    r.drawText('Crie sua conta para salvar seu progresso', VIRTUAL_W / 2, 208, '#5a88aa', 18, 'center', 'Rajdhani');


    const fX = VIRTUAL_W / 2 - 210;

    // Campo Nome
    r.drawText('Nome', fX, VIRTUAL_H / 2 - 134, '#7aaccc', 14, 'left', 'Rajdhani');
    const fn = this._fieldName;
    if (fn) {
      const active = this._activeField === 'name';
      r.fillRoundRect(fn.x, fn.y, fn.w, fn.h, 8, 'rgba(5,12,30,0.95)');
      r.strokeRoundRect(fn.x, fn.y, fn.w, fn.h, 8, active ? '#5ab4ff' : '#2a6aaa', active ? 2.5 : 1.5);
      const cur = active && Math.floor(this._cursorBlink * 2) % 2 === 0 ? '|' : '';
      r.drawText(this._nameText + cur, fn.x + 14, fn.y + fn.h / 2 + 9, '#d0e8ff', 20, 'left', 'Rajdhani');
    }

    // Campo Senha
    r.drawText('Senha', fX, VIRTUAL_H / 2 - 44, '#7aaccc', 14, 'left', 'Rajdhani');
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
      r.drawText(`Criando conta${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2 + 200, '#5ab4ff', 18, 'center', 'Rajdhani');
      return;
    }

    // Tipo de conta
    r.drawText('Tipo de conta', VIRTUAL_W / 2 - 210, VIRTUAL_H / 2 + 56, '#7aaccc', 14, 'left', 'Rajdhani');
    if (this._btnRoleAluno) {
      const active = this._role === 'aluno';
      const hover  = this.input.isHover(this._btnRoleAluno);
      r.fillRoundRect(this._btnRoleAluno.x, this._btnRoleAluno.y, this._btnRoleAluno.w, this._btnRoleAluno.h, 8,
        active ? 'rgba(20,60,100,0.95)' : 'rgba(5,12,30,0.85)');
      r.strokeRoundRect(this._btnRoleAluno.x, this._btnRoleAluno.y, this._btnRoleAluno.w, this._btnRoleAluno.h, 8,
        active ? '#5ab4ff' : '#2a4a6a', active ? 2.5 : 1.5);
      r.drawText('Aluno', this._btnRoleAluno.x + this._btnRoleAluno.w / 2,
        this._btnRoleAluno.y + this._btnRoleAluno.h / 2 + 7,
        active ? '#5ab4ff' : '#7aaccc', 16, 'center', 'Rajdhani');
    }
    if (this._btnRoleProf) {
      const active = this._role === 'professor';
      const hover  = this.input.isHover(this._btnRoleProf);
      r.fillRoundRect(this._btnRoleProf.x, this._btnRoleProf.y, this._btnRoleProf.w, this._btnRoleProf.h, 8,
        active ? 'rgba(60,30,100,0.95)' : 'rgba(5,12,30,0.85)');
      r.strokeRoundRect(this._btnRoleProf.x, this._btnRoleProf.y, this._btnRoleProf.w, this._btnRoleProf.h, 8,
        active ? '#c44aff' : '#4a2a6a', active ? 2.5 : 1.5);
      r.drawText('Professor', this._btnRoleProf.x + this._btnRoleProf.w / 2,
        this._btnRoleProf.y + this._btnRoleProf.h / 2 + 7,
        active ? '#c44aff' : '#7aaccc', 16, 'center', 'Rajdhani');
    }

    // Botões
    if (this._btnBack) {
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a');
    }
    if (this._btnCreate) {
      r.drawButton(this._btnCreate.x, this._btnCreate.y, this._btnCreate.w, this._btnCreate.h,
        'Criar', this.input.isHover(this._btnCreate), false, '#1a4a2a');
    }
  }
}

export default CreateAccountScene;
