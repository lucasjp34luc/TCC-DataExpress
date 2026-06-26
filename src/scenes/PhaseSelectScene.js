/**
 * @file PhaseSelectScene.js
 * @description Tela de seleção da linha do metrô (fase).
 * Cada linha representa uma estrutura de dados de lista, com
 * comportamento de navegação dos vagões correspondente.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { PHASES } from '../data/questions.js';

// Ícone e direção visual de cada listType
const LIST_META = {
  linked:          { arrow: '▶',    label: 'só avançar',      icon: '▶' },
  circular:        { arrow: '↻',    label: 'ciclo infinito',   icon: '↻' },
  doubly_linked:   { arrow: '◀ ▶',   label: 'avançar e voltar', icon: '◀▶' },
  doubly_circular: { arrow: '◀ ▶ + ↻',   label: 'bidirecional + ciclo', icon: '◀▶ + ↻' }
};

export class PhaseSelectScene {
  constructor({ assets, input }) {
    this.assets     = assets;
    this.input      = input;
    this.manager    = null;
    this._buttons   = [];
    this._hovered   = null;
    this._selecting = false;
  }

  enter() {
    this._selecting = false;
    this._setupButtons();
  }

  exit() {
    this.input.clearButtons();
    this._buttons = [];
  }

  _setupButtons() {
    this.input.clearButtons();
    this._buttons = [];

    // Botão voltar
    this._btnBack = { x: 50, y: 35, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => this.manager.goto('modeSelect'));

    // Botão configurações (canto superior direito)
    const gearSize = 44;
    this._btnSettings = { x: VIRTUAL_W - gearSize - 50, y: 35, w: gearSize, h: gearSize };
    this.input.addButton(this._btnSettings, () => this.manager.goto('settings', { from: 'phaseSelect' }));

    const n      = PHASES.length;
    const cols   = n > 4 ? 3 : 2;
    const cardW  = cols > 2 ? Math.floor(VIRTUAL_W * 0.30) : Math.floor(VIRTUAL_W * 0.41);
    const cardH  = Math.floor(VIRTUAL_H * 0.32);
    const gapX   = cols > 2 ? Math.floor(VIRTUAL_W * 0.03) : Math.floor(VIRTUAL_W * 0.04);
    const gapY   = Math.floor(VIRTUAL_H * 0.06);
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (VIRTUAL_W - totalW) / 2;
    const startY = cols > 2 ? Math.floor(VIRTUAL_H * 0.18) : Math.floor(VIRTUAL_H * 0.22);
    const rows   = Math.ceil(n / cols);

    PHASES.forEach((phase, i) => {
      const col          = i % cols;
      const row          = Math.floor(i / cols);
      const lastRowCount = n % cols || cols;
      const rowOffset    = row === rows - 1 && lastRowCount < cols
        ? (cols - lastRowCount) * (cardW + gapX) / 2
        : 0;
      const bx   = startX + col * (cardW + gapX) + rowOffset;
      const by   = startY + row * (cardH + gapY);
      const rect = { x: bx, y: by, w: cardW, h: cardH };

      this._buttons.push({ rect, phase });
      this.input.addButton(rect, () => this._selectPhase(phase));
    });
  }

  async _selectPhase(phase) {
    if (this._selecting) return;
    this._selecting = true;

    const user = this.manager.state.currentUser;
    if (user && user.classId) {
      try {
        const res  = await fetch(`https://${window.location.hostname}:3000/class/${user.classId}`);
        const data = await res.json();
        if (data.success) {
          const classQs = (data.class.questions || {})[phase.id];
          if (Array.isArray(classQs) && classQs.length > 0) {
            this.manager.state.phase = { ...phase, questions: classQs };
            this.manager.goto('charSelect');
            return;
          }
        }
      } catch { /* fallback para questões padrão */ }
    }

    this.manager.state.phase = phase;
    this.manager.goto('charSelect');
  }

  update(_dt) {}

  render(r) {
    r.drawGradientBg('#060a18', '#0c1428');

    // Título
    r.drawTextShadow('DATA EXPRESS', VIRTUAL_W / 2, 45, '#5ab4ff', 32, 'center', 'Rajdhani');
    r.drawText('Selecione a Linha do Metrô', VIRTUAL_W / 2, 85, '#8ab4d4', 18, 'center', 'Rajdhani');
    r.drawLine(50, 108, VIRTUAL_W - 50, 108, '#1a3a5c', 1);

    // Cards
    for (const btn of this._buttons) {
      const { rect, phase } = btn;
      const hover = this.input.isHover(rect);
      const meta  = LIST_META[phase.listType] || LIST_META.linked;

      // Fundo
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        hover ? 'rgba(30,60,120,0.95)' : 'rgba(12,22,50,0.92)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        hover ? phase.color : '#1a3060', hover ? 3 : 2);

      // Barra de cor lateral
      r.fillRoundRect(rect.x, rect.y + 12, 6, rect.h - 24, 3, phase.color);

      // Ícone de navegação (grande, fundo)
      r.ctx.globalAlpha = 0.07;
      r.drawText(meta.icon, rect.x + rect.w - 30, rect.y + rect.h / 2 + 18,
        phase.color, 64, 'right', 'Arial');
      r.ctx.globalAlpha = 1;

      // Nome da fase
      r.drawTextShadow(phase.name, rect.x + 22, rect.y + 44, phase.color, 20, 'left', 'Rajdhani');

      // Descrição
      r.drawWrappedText(phase.description, rect.x + 22, rect.y + 68,
        rect.w - 44, 20, '#8ab4c8', 13, 'Rajdhani');

      // Badge de comportamento
      const badgeX = rect.x + 22;
      const badgeY = rect.y + rect.h - 38;
      r.fillRoundRect(badgeX, badgeY, rect.w - 44, 26, 5, 'rgba(0,0,0,0.45)');
      r.strokeRoundRect(badgeX, badgeY, rect.w - 44, 26, 5, phase.color + '55', 1);

      r.drawText(
        `${meta.arrow}  Vagões: ${meta.label}`,
        badgeX + (rect.w - 44) / 2, badgeY + 17,
        hover ? phase.color : '#5a8aaa', 12, 'center', 'Rajdhani'
      );

      // Selo de conclusão (canto superior direito)
      const _userId = this.manager.state.currentUser?.userId;
      const _compData = _userId ? JSON.parse(localStorage.getItem(`phase_completion_${_userId}_${phase.id}`) || 'null') : null;
      if (_compData?.completed) {
        const _isPerfect = _compData.perfect;
        const _bw = 36, _bh = 36;
        const _bx = rect.x + rect.w - _bw - 8;
        const _by = rect.y + 8;
        r.fillRoundRect(_bx, _by, _bw, _bh, 6,
          _isPerfect ? 'rgba(255,200,0,0.18)' : 'rgba(160,160,200,0.18)');
        r.strokeRoundRect(_bx, _by, _bw, _bh, 6,
          _isPerfect ? '#ffcc00' : '#9999bb', 1.5);
        r.drawText(_isPerfect ? '🏆' : '🥈', _bx + _bw / 2, _by + _bh / 2 + 7,
          '#ffffff', 18, 'center', 'sans-serif');
      }
    }

    // Botão voltar
    const backHover = this.input.isHover(this._btnBack);
    r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h, '◀ Voltar', backHover, false, '#1a2a3a');

    // Botão configurações
    if (this._btnSettings) {
      const { x, y, w, h } = this._btnSettings;
      const hover = this.input.isHover(this._btnSettings);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(30,70,140,0.95)' : 'rgba(10,25,60,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#5ab4ff' : '#1a4a8c', hover ? 2 : 1);
      r.drawText('⚙', x + w / 2, y + h / 2 + 8, hover ? '#5ab4ff' : '#3a6a9c', 24, 'center', 'sans-serif');
    }

    // Dica inferior
    r.drawText('Cada linha tem comportamento diferente de exploração dos vagões',
      VIRTUAL_W / 2, VIRTUAL_H - 36, '#ffffff', 13, 'center', 'Rajdhani');

    // Legenda de ícones
    r.drawText('◀ ▶ bidirecional   ↻ circular   ▶ apenas avançar', VIRTUAL_W / 2, VIRTUAL_H - 16,
      '#ffffff', 12, 'center', 'Rajdhani');
  }
}

export default PhaseSelectScene;