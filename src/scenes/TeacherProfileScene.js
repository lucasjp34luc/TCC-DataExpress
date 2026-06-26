/**
 * @file TeacherProfileScene.js
 * @description Tela de perfil do professor. Lista turmas (máx 5),
 * permite criar e excluir turmas, e navegar para a tela da turma.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class TeacherProfileScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim         = 0;
    this._loading      = false;
    this._errorMsg     = '';
    this._classes      = []; // [{ classId, name, studentCount }]
    this._stars        = [];

    // Criação de turma
    this._creating     = false;
    this._newClassName = '';
    this._createError  = '';
    this._activeField  = false;
    this._cursorBlink  = 0;

    this._btnLogout    = null;
    this._btnSettings  = null;
    this._btnTutorial  = null;
    this._btnCreate    = null;
    this._btnConfirm   = null;
    this._btnCancelNew = null;
    this._fieldName    = null;
    this._classCards   = []; // [{ rect, delBtn, classId, name }]

    this._keyHandler = (e) => this._onKey(e);
  }

  enter() {
    this._anim         = 0;
    this._loading      = true;
    this._errorMsg     = '';
    this._classes      = [];
    this._creating     = false;
    this._newClassName = '';
    this._createError  = '';
    this._activeField  = false;
    this._cursorBlink  = 0;
    this._stars        = Array.from({ length: 60 }, () => ({
      x:     Math.random() * VIRTUAL_W,
      y:     Math.random() * VIRTUAL_H,
      size:  0.5 + Math.random() * 1.5,
      alpha: Math.random()
    }));

    document.addEventListener('keydown', this._keyHandler);
    this._loadClasses();
  }

  exit() {
    document.removeEventListener('keydown', this._keyHandler);
    this.input.clearButtons();
  }

  async _loadClasses() {
    const user = this.manager.state.currentUser;
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/classes/owned/${user.userId}`);
      const data = await res.json();
      this._classes = data.success ? data.classes : [];
    } catch {
      this._classes = [];
    }
    this._loading = false;
    this._setupButtons();
  }

  _setupButtons() {
    this.input.clearButtons();
    this._classCards = [];

    // Logout
    this._btnLogout = { x: VIRTUAL_W - 160, y: 30, w: 110, h: 44 };
    this.input.addButton(this._btnLogout, () => {
      localStorage.removeItem('dataexpress_session');
      this.manager.state.currentUser = null;
      this.manager.goto('login');
    });

    // Configurações
    const gearSize = 44;
    this._btnSettings = { x: VIRTUAL_W - 160 - gearSize - 10, y: 30, w: gearSize, h: gearSize };
    this.input.addButton(this._btnSettings, () => {
      this.manager.goto('settings', { from: 'teacherProfile' });
    });

    // Tutorial
    const tutW = 100;
    this._btnTutorial = { x: 50, y: 30, w: tutW, h: gearSize };
    this.input.addButton(this._btnTutorial, () => {
      this.manager.goto('teacherTutorial');
    });

    if (this._creating) {
      // Campo de nome
      const fW = 420, fH = 58;
      const fX = VIRTUAL_W / 2 - fW / 2;
      const fY = VIRTUAL_H / 2 - 40;
      this._fieldName = { x: fX, y: fY, w: fW, h: fH };
      this.input.addButton(this._fieldName, () => { this._activeField = true; });

      this._btnConfirm   = { x: VIRTUAL_W / 2 - 215, y: VIRTUAL_H / 2 + 40, w: 200, h: 54 };
      this._btnCancelNew = { x: VIRTUAL_W / 2 + 15,  y: VIRTUAL_H / 2 + 40, w: 200, h: 54 };
      this.input.addButton(this._btnConfirm,   () => this._doCreate());
      this.input.addButton(this._btnCancelNew, () => {
        this._creating     = false;
        this._newClassName = '';
        this._createError  = '';
        this._setupButtons();
      });
      return;
    }

    // Botão criar turma (só se < 5)
    if (this._classes.length < 5) {
      this._btnCreate = { x: VIRTUAL_W / 2 - 110, y: VIRTUAL_H - 90, w: 220, h: 54 };
      this.input.addButton(this._btnCreate, () => {
        this._creating    = true;
        this._newClassName = '';
        this._createError  = '';
        this._activeField  = true;
        this._setupButtons();
      });
    } else {
      this._btnCreate = null;
    }

    // Cards de turma
    const cardW = 800, cardH = 80;
    const cardX = (VIRTUAL_W - cardW) / 2;
    let   cardY = 160;

    for (const cls of this._classes) {
      const rect   = { x: cardX, y: cardY, w: cardW, h: cardH };
      const delBtn = { x: cardX + cardW - 100, y: cardY + (cardH - 36) / 2, w: 90, h: 36 };
      const clickArea = { x: cardX, y: cardY, w: cardW - 110, h: cardH };

      this._classCards.push({ rect, delBtn, classId: cls.classId, name: cls.name });

      const classId = cls.classId;
      const name    = cls.name;
      this.input.addButton(clickArea, () => {
        this.manager.goto('classRoom', { classId, className: name });
      });
      this.input.addButton(delBtn, () => this._doDelete(classId));

      cardY += cardH + 12;
    }
  }

  _onKey(e) {
    if (!this._creating || !this._activeField) return;

    if (e.key === 'Backspace') {
      this._newClassName = this._newClassName.slice(0, -1);
      this._createError  = '';
      return;
    }
    if (e.key === 'Enter') {
      this._doCreate();
      return;
    }
    if (e.key.length === 1 && this._newClassName.length < 40) {
      this._newClassName += e.key;
      this._createError   = '';
    }
  }

  async _doCreate() {
    const name = this._newClassName.trim();
    if (!name) { this._createError = 'Digite um nome para a turma.'; return; }

    const user = this.manager.state.currentUser;
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/class/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ownerId: user.userId, name })
      });
      const data = await res.json();
      if (data.success) {
        this._creating     = false;
        this._newClassName = '';
        this._loading      = true;
        this._loadClasses();
      } else {
        this._createError = data.message || 'Erro ao criar turma.';
      }
    } catch {
      this._createError = 'Servidor indisponível.';
    }
  }

  async _doDelete(classId) {
    try {
      await fetch(`https://${window.location.hostname}:3000/class/${classId}`, { method: 'DELETE' });
    } catch { /* ignora */ }
    this._loading = true;
    this._loadClasses();
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

    const user = this.manager.state.currentUser;
    r.drawTextShadow(`PROFESSOR — ${(user?.username || '').toUpperCase()}`,
      VIRTUAL_W / 2, 48, '#c44aff', 30, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#532583', 1);

    // Botão Tutorial
    if (this._btnTutorial) {
      const { x, y, w, h } = this._btnTutorial;
      const hover = this.input.isHover(this._btnTutorial);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(60,20,80,0.95)' : 'rgba(20,5,35,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#c44aff' : '#5a2a8a', hover ? 2 : 1);
      r.drawText('Tutorial', x + w / 2, y + h / 2 + 7, hover ? '#c44aff' : '#8a5aaa', 14, 'center', 'Rajdhani');
    }

    // Botão Configurações
    if (this._btnSettings) {
      const { x, y, w, h } = this._btnSettings;
      const hover = this.input.isHover(this._btnSettings);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(30,70,140,0.95)' : 'rgba(10,25,60,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#5ab4ff' : '#1a4a8c', hover ? 2 : 1);
      r.drawText('⚙', x + w / 2, y + h / 2 + 8, hover ? '#5ab4ff' : '#3a6a9c', 24, 'center', 'sans-serif');
    }

    // Botão Sair
    if (this._btnLogout) {
      const { x, y, w, h } = this._btnLogout;
      const hover = this.input.isHover(this._btnLogout);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(80,15,15,0.95)' : 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#ff6666' : '#8c1a1a', hover ? 2 : 1);
      r.drawText('Sair', x + w / 2, y + h / 2 + 7, hover ? '#ffb3b3' : '#e68080', 15, 'center', 'Rajdhani');
    }

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2, '#c44aff', 22, 'center', 'Rajdhani');
      return;
    }

    // ── Modo criação de turma ──────────────────────────────────────────────
    if (this._creating) {
      r.fillRoundRect(VIRTUAL_W / 2 - 280, VIRTUAL_H / 2 - 110, 560, 230, 14, 'rgba(15,5,30,0.97)');
      r.strokeRoundRect(VIRTUAL_W / 2 - 280, VIRTUAL_H / 2 - 110, 560, 230, 14, '#c44aff', 2);
      r.drawText('Nova Turma', VIRTUAL_W / 2, VIRTUAL_H / 2 - 82, '#c44aff', 22, 'center', 'Rajdhani');
      r.drawText('Nome da turma', VIRTUAL_W / 2 - 200, VIRTUAL_H / 2 - 56, '#7aaccc', 14, 'left', 'Rajdhani');

      const fn = this._fieldName;
      if (fn) {
        const cur = this._activeField && Math.floor(this._cursorBlink * 2) % 2 === 0 ? '|' : '';
        r.fillRoundRect(fn.x, fn.y, fn.w, fn.h, 8, 'rgba(5,12,30,0.95)');
        r.strokeRoundRect(fn.x, fn.y, fn.w, fn.h, 8, '#c44aff', 2);
        r.drawText(this._newClassName + cur, fn.x + 14, fn.y + fn.h / 2 + 9, '#d0e8ff', 20, 'left', 'Rajdhani');
      }

      if (this._createError) {
        r.drawText(this._createError, VIRTUAL_W / 2, VIRTUAL_H / 2 + 20, '#ff8888', 13, 'center', 'Rajdhani');
      }

      if (this._btnConfirm) {
        r.drawButton(this._btnConfirm.x, this._btnConfirm.y, this._btnConfirm.w, this._btnConfirm.h,
          'Criar', this.input.isHover(this._btnConfirm), false, '#402871');
      }
      if (this._btnCancelNew) {
        r.drawButton(this._btnCancelNew.x, this._btnCancelNew.y, this._btnCancelNew.w, this._btnCancelNew.h,
          'Cancelar', this.input.isHover(this._btnCancelNew), false, '#1a2a3a');
      }
      return;
    }

    // ── Lista de turmas ────────────────────────────────────────────────────
    r.drawText('MINHAS TURMAS', VIRTUAL_W / 2, 118, '#c44aff', 17, 'center', 'Rajdhani');

    if (this._classes.length === 0) {
      r.drawText('Nenhuma turma criada ainda.', VIRTUAL_W / 2, VIRTUAL_H / 2 - 20, '#7c9eb5', 20, 'center', 'Rajdhani');
    }

    for (const card of this._classCards) {
      const { rect, delBtn, name, classId } = card;
      const hover    = this.input.isHover({ x: rect.x, y: rect.y, w: rect.w - 110, h: rect.h });
      const delHover = this.input.isHover(delBtn);

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 10,
        hover ? 'rgba(40,10,60,0.95)' : 'rgba(15,5,30,0.90)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 10,
        hover ? '#c44aff' : '#532583', hover ? 2.5 : 1.5);

      r.drawText(name, rect.x + 22, rect.y + rect.h / 2 - 5, hover ? '#d488ff' : '#d0e8ff', 20, 'left', 'Rajdhani');

      const cls = this._classes.find(c => c.classId === classId);
      const cnt = cls ? cls.studentCount : 0;
      r.drawText(`${cnt} aluno${cnt !== 1 ? 's' : ''}`, rect.x + 22, rect.y + rect.h / 2 + 15, '#7a8aaa', 13, 'left', 'Rajdhani');

      r.drawText('▶', rect.x + rect.w - 120, rect.y + rect.h / 2 + 8, hover ? '#c44aff' : '#5a4a7a', 18, 'center', 'Rajdhani');

      // Botão excluir
      r.fillRoundRect(delBtn.x, delBtn.y, delBtn.w, delBtn.h, 8,
        delHover ? 'rgba(80,15,15,0.95)' : 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(delBtn.x, delBtn.y, delBtn.w, delBtn.h, 8,
        delHover ? '#ff6666' : '#8c1a1a', delHover ? 2 : 1);
      r.drawText('Excluir', delBtn.x + delBtn.w / 2, delBtn.y + delBtn.h / 2 + 6,
        delHover ? '#ffb3b3' : '#e68080', 13, 'center', 'Rajdhani');
    }

    // Botão criar turma
    if (this._btnCreate) {
      r.drawButton(this._btnCreate.x, this._btnCreate.y, this._btnCreate.w, this._btnCreate.h,
        '+ Criar Turma', this.input.isHover(this._btnCreate), false, '#402871');
    } else if (this._classes.length >= 5) {
      r.drawText('Limite de 5 turmas atingido.', VIRTUAL_W / 2, VIRTUAL_H - 70, '#7a4aaa', 14, 'center', 'Rajdhani');
    }

    if (this._errorMsg) {
      r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(80,0,0,0.85)');
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#ff8888', 14, 'center', 'Rajdhani');
    }
  }
}

export default TeacherProfileScene;
