/**
 * @file ClassRoomScene.js
 * @description Tela da turma: lista de alunos com opção de expulsar e ver perfil,
 * botões para navegar às questões e ao dashboard.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

const LIST_TOP    = 160;  // topo da área scrollável (virtual px)
const LIST_BOTTOM = 705;  // base da área scrollável
const LIST_H      = LIST_BOTTOM - LIST_TOP;
const CARD_START  = 180;  // y do primeiro card
const CARD_H      = 70;
const CARD_STRIDE = CARD_H + 8; // 78

export class ClassRoomScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim         = 0;
    this._loading      = false;
    this._errorMsg     = '';
    this._classId      = null;
    this._className    = '';
    this._students     = [];
    this._studentCards = [];
    this._scrollY      = 0;
    this._maxScroll    = 0;
    this._wheelHandler = null;
  }

  enter(params = {}) {
    this._anim      = 0;
    this._loading   = true;
    this._errorMsg  = '';
    this._classId   = params.classId   || null;
    this._className = params.className || 'Turma';
    this._students  = [];
    this._studentCards = [];
    this._scrollY   = 0;
    this._maxScroll = 0;

    this._wheelHandler = (e) => {
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * CARD_STRIDE : e.deltaY * 0.5;
      this._scrollY = Math.max(0, Math.min(this._maxScroll, this._scrollY + delta));
      this._setupButtons();
    };
    this.input.canvas.addEventListener('wheel', this._wheelHandler, { passive: false });

    this._loadClass();
  }

  exit() {
    this.input.clearButtons();
    if (this._wheelHandler) {
      this.input.canvas.removeEventListener('wheel', this._wheelHandler);
      this._wheelHandler = null;
    }
  }

  async _loadClass() {
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/class/${this._classId}`);
      const data = await res.json();
      if (data.success) {
        this._students  = data.class.students || [];
        this._className = data.class.name || this._className;
      } else {
        this._errorMsg = 'Turma não encontrada.';
      }
    } catch {
      this._errorMsg = 'Servidor indisponível.';
    }
    this._loading = false;
    this._setupButtons();
  }

  _setupButtons() {
    this.input.clearButtons();
    this._studentCards = [];

    // Voltar
    this._btnBack = { x: 50, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => this.manager.goto('teacherProfile'));

    // Botões de ação
    this._btnQuestions = { x: VIRTUAL_W - 360, y: 30, w: 150, h: 46 };
    this._btnDashboard = { x: VIRTUAL_W - 200, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnQuestions, () => {
      this.manager.goto('classQuestions', { classId: this._classId, className: this._className });
    });
    this.input.addButton(this._btnDashboard, () => {
      this.manager.goto('classDashboard', { classId: this._classId, className: this._className });
    });

    // Calcular scroll máximo
    const totalH = this._students.length * CARD_STRIDE - 8;
    this._maxScroll = Math.max(0, totalH - (LIST_BOTTOM - CARD_START));
    this._scrollY   = Math.min(this._scrollY, this._maxScroll);

    // Cards de alunos — só registra botões para cards visíveis
    const cardW = 760;
    const cardX = (VIRTUAL_W - cardW) / 2;

    for (let i = 0; i < this._students.length; i++) {
      const stu   = this._students[i];
      const cardY = CARD_START + i * CARD_STRIDE - this._scrollY;

      // Ignora cards totalmente fora da área visível
      if (cardY + CARD_H <= LIST_TOP || cardY >= LIST_BOTTOM) continue;

      const btnY       = cardY + (CARD_H - 36) / 2;
      const rect       = { x: cardX,               y: cardY, w: cardW,       h: CARD_H };
      const profileBtn = { x: cardX,               y: cardY, w: cardW - 120, h: CARD_H };
      const kickBtn    = { x: cardX + cardW - 110, y: btnY,  w: 100,         h: 36 };

      this._studentCards.push({ rect, profileBtn, kickBtn, userId: stu.userId, username: stu.username });

      this.input.addButton(profileBtn, () => {
        this.manager.goto('profile', { viewUserId: stu.userId, viewUsername: stu.username, from: 'classRoom', classId: this._classId, className: this._className });
      });
      this.input.addButton(kickBtn, () => this._doKick(stu.userId));
    }
  }

  async _doKick(studentId) {
    try {
      await fetch(`https://${window.location.hostname}:3000/class/${this._classId}/kick`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId })
      });
    } catch { /* ignora */ }
    this._loading = true;
    this._loadClass();
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    r.drawTextShadow(this._className.toUpperCase(), VIRTUAL_W / 2, 48, '#c44aff', 30, 'center', 'Rajdhani');
    r.drawText(`Código de entrada: ${this._classId}`, VIRTUAL_W / 2, 75, '#7a5aaa', 14, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#532583', 1);

    // Botões
    if (this._btnBack) {
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a');
    }
    if (this._btnQuestions) {
      r.drawButton(this._btnQuestions.x, this._btnQuestions.y, this._btnQuestions.w, this._btnQuestions.h,
        'Questões', this.input.isHover(this._btnQuestions), false, '#1a3a2a');
    }
    if (this._btnDashboard) {
      r.drawButton(this._btnDashboard.x, this._btnDashboard.y, this._btnDashboard.w, this._btnDashboard.h,
        'Dashboard', this.input.isHover(this._btnDashboard), false, '#1a2a4a');
    }

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2, '#c44aff', 22, 'center', 'Rajdhani');
      return;
    }

    if (this._errorMsg) {
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H / 2, '#ff8888', 20, 'center', 'Rajdhani');
      return;
    }

    r.drawText('ALUNOS', VIRTUAL_W / 2, 142, '#ffcc44', 16, 'center', 'Rajdhani');

    if (this._students.length === 0) {
      r.drawText('Nenhum aluno na turma ainda.', VIRTUAL_W / 2, VIRTUAL_H / 2, '#7c9eb5', 18, 'center', 'Rajdhani');
      r.drawText(`Compartilhe o código: ${this._classId}`, VIRTUAL_W / 2, VIRTUAL_H / 2 + 30, '#5a6a8a', 14, 'center', 'Rajdhani');
      return;
    }

    // Clip para evitar que cards saiam da área da lista
    r.ctx.save();
    r.ctx.beginPath();
    r.ctx.rect(r.vx(0), r.vy(LIST_TOP), r.vw(VIRTUAL_W), r.vh(LIST_H));
    r.ctx.clip();

    for (const card of this._studentCards) {
      const { rect, profileBtn, kickBtn, username } = card;
      const hover   = this.input.isHover(profileBtn);
      const kickHov = this.input.isHover(kickBtn);

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 10,
        hover ? 'rgba(20,10,40,0.95)' : 'rgba(8,5,20,0.90)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 10,
        hover ? '#c44aff' : '#402871', hover ? 2 : 1.5);

      r.drawText(username, rect.x + 20, rect.y + rect.h / 2 + 8,
        hover ? '#d488ff' : '#d0e8ff', 18, 'left', 'Rajdhani');

      // Botão Expulsar
      r.fillRoundRect(kickBtn.x, kickBtn.y, kickBtn.w, kickBtn.h, 8,
        kickHov ? 'rgba(80,15,15,0.95)' : 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(kickBtn.x, kickBtn.y, kickBtn.w, kickBtn.h, 8,
        kickHov ? '#ff6666' : '#8c1a1a', kickHov ? 2 : 1);
      r.drawText('Expulsar', kickBtn.x + kickBtn.w / 2, kickBtn.y + kickBtn.h / 2 + 6,
        kickHov ? '#ffb3b3' : '#e68080', 13, 'center', 'Rajdhani');
    }

    r.ctx.restore();

    // Scrollbar — só aparece quando há conteúdo além da tela
    if (this._maxScroll > 0) {
      const cardW   = 760;
      const cardX   = (VIRTUAL_W - cardW) / 2;
      const sbX     = cardX + cardW + 12;
      const sbY     = CARD_START;
      const sbH     = LIST_BOTTOM - CARD_START;
      const sbW     = 7;
      const visRatio = (LIST_BOTTOM - CARD_START) / (this._students.length * CARD_STRIDE - 8);
      const thumbH  = Math.max(36, sbH * visRatio);
      const thumbY  = sbY + (sbH - thumbH) * (this._scrollY / this._maxScroll);

      r.fillRoundRect(sbX, sbY, sbW, sbH, 4, 'rgba(255,255,255,0.08)');
      r.fillRoundRect(sbX, thumbY, sbW, thumbH, 4, 'rgba(196,74,255,0.55)');
    }
  }
}

export default ClassRoomScene;
