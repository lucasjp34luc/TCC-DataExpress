/**
 * @file RankingScene.js
 * @description Tabela de classificação por fase do modo história.
 * Exibe os jogadores ranqueados por vitórias e melhor precisão.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { PHASES } from '../data/questions.js';

const LIST_TOP    = 162;
const LIST_BOTTOM = VIRTUAL_H - 20;
const VISIBLE_H   = LIST_BOTTOM - LIST_TOP;
const ROW_H       = 72;
const ROW_GAP     = 10;

const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

export class RankingScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim           = 0;
    this._loading        = false;
    this._errorMsg       = '';
    this._ranking        = [];
    this._currentPhaseId = null;
    this._scrollY        = 0;
    this._maxScroll      = 0;
    this._fetchToken     = 0;
    this._wheelBound     = null;

    this._btnBack   = null;
    this._tabRects  = [];
  }

  enter(params = {}) {
    this._anim    = 0;
    this._scrollY = 0;

    const phaseId = params.phaseId || this.manager.state.rankingPhaseId || PHASES[0].id;
    const from    = params.from || 'modeSelect';

    this.input.clearButtons();

    this._btnBack = { x: 50, y: 35, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => this.manager.goto(from));

    // Tabs alinhadas com a linha separadora do cabeçalho (x: 50 … VIRTUAL_W-50)
    const tabGap    = 8;
    const tabH      = 34;
    const tabStartX = 50;
    const tabTotalW = VIRTUAL_W - 100; // 50px de cada lado
    const tabW      = Math.floor((tabTotalW - (PHASES.length - 1) * tabGap) / PHASES.length);
    this._tabRects = [];
    PHASES.forEach((phase, i) => {
      const rect = { x: tabStartX + i * (tabW + tabGap), y: 104, w: tabW, h: tabH };
      this._tabRects.push({ rect, phase });
      this.input.addButton(rect, () => this._loadRanking(phase.id));
    });

    // Scroll
    this._wheelBound = (e) => {
      e.preventDefault();
      this._scrollY = Math.max(0, Math.min(this._maxScroll, this._scrollY + e.deltaY * 0.5));
    };
    this.input.canvas.addEventListener('wheel', this._wheelBound, { passive: false });

    // Clique em linha do ranking (área rolável)
    this.input.setOnClick((_x, y) => {
      if (y < LIST_TOP || y > LIST_BOTTOM) return;
      if (this._loading || this._errorMsg || this._ranking.length === 0) return;
      const relY = y - LIST_TOP + this._scrollY;
      const idx  = Math.floor(relY / (ROW_H + ROW_GAP));
      if (idx < 0 || idx >= this._ranking.length) return;
      // verifica que o clique está dentro da área do card (não no gap)
      const offsetInSlot = relY - idx * (ROW_H + ROW_GAP);
      if (offsetInSlot > ROW_H) return;
      const entry = this._ranking[idx];
      this.manager.goto('profile', {
        viewUserId:   entry.userId,
        viewUsername: entry.username,
        from:         'ranking',
        phaseId:      this._currentPhaseId,
      });
    });

    this._loadRanking(phaseId);
  }

  _loadRanking(phaseId) {
    this._currentPhaseId = phaseId;
    this._loading  = true;
    this._errorMsg = '';
    this._ranking  = [];
    this._scrollY  = 0;

    const token = ++this._fetchToken;

    fetch(`https://${window.location.hostname}:3000/ranking/${phaseId}`)
      .then(r => r.json())
      .then(data => {
        if (token !== this._fetchToken) return;
        this._ranking = data.success ? (data.ranking || []) : [];
        this._loading = false;
        this._calcMaxScroll();
      })
      .catch(() => {
        if (token !== this._fetchToken) return;
        this._errorMsg = 'Não foi possível carregar o ranking.';
        this._loading  = false;
      });
  }

  _calcMaxScroll() {
    const total = this._ranking.length * (ROW_H + ROW_GAP);
    this._maxScroll = Math.max(0, total - VISIBLE_H);
  }

  exit() {
    this.input.clearButtons();
    if (this._wheelBound) {
      this.input.canvas.removeEventListener('wheel', this._wheelBound);
      this._wheelBound = null;
    }
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    // ── Header ───────────────────────────────────────────────────────────────
    const currentPhase = PHASES.find(p => p.id === this._currentPhaseId) || PHASES[0];
    r.drawTextShadow(`RANKING — ${currentPhase.name.toUpperCase()}`,
      VIRTUAL_W / 2, 44, currentPhase.color, 26, 'center', 'Rajdhani');

    const isCyclic = currentPhase.listType === 'circular' || currentPhase.listType === 'doubly_circular';
    const hintText = isCyclic
      ? 'Maior o ciclo + mais vitórias + alta precisão = melhor posição | ★ Perfect = 100% de acerto em uma run vencida'
      : 'Mais vitórias + alta precisão nas runs vencidas = melhor posição | ★ Perfect = 100% de acerto em uma run vencida';
    r.drawText(hintText, VIRTUAL_W / 2, 71, '#a8cfe0', 15, 'center', 'Rajdhani');

    r.drawLine(50, 94, VIRTUAL_W - 50, 94, '#1a3a5c', 1);

    // Botão voltar
    r.drawButton(
      this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
      '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a'
    );

    // ── Tabs de fase ─────────────────────────────────────────────────────────
    for (const { rect, phase } of this._tabRects) {
      const isActive = phase.id === this._currentPhaseId;
      const hover    = this.input.isHover(rect);
      const bgAlpha  = isActive ? 0.50 : (hover ? 0.40 : 0.28);

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 7,
        `rgba(${_hexToRgb(phase.color)},${bgAlpha})`);
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 7,
        isActive ? phase.color : (hover ? phase.color + 'cc' : '#3a5888'),
        isActive ? 2.5 : 1.5);

      r.drawText(phase.name, rect.x + rect.w / 2, rect.y + rect.h / 2 + 5,
        isActive ? '#ffffff' : (hover ? '#ffffff' : '#dce8f0'),
        11, 'center', 'Rajdhani');
    }

    // ── Estados especiais ─────────────────────────────────────────────────────
    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2,
        '#8acfff', 22, 'center', 'Rajdhani');
      return;
    }

    if (this._errorMsg) {
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H / 2,
        '#ffbbbb', 20, 'center', 'Rajdhani');
      return;
    }

    if (this._ranking.length === 0) {
      r.drawText('Nenhum jogador completou esta fase ainda.',
        VIRTUAL_W / 2, VIRTUAL_H / 2, '#b4d4e8', 18, 'center', 'Rajdhani');
      return;
    }

    // ── Lista rolável ─────────────────────────────────────────────────────────
    const ctx        = r.ctx;
    const cardW      = 1140;
    const cardX      = (VIRTUAL_W - cardW) / 2;
    const currentUserId = this.manager.state.currentUser?.userId;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, r.vy(LIST_TOP), r.canvas.width, r.vy(VISIBLE_H));
    ctx.clip();

    this._ranking.forEach((entry, i) => {
      const rowY = LIST_TOP - this._scrollY + i * (ROW_H + ROW_GAP);

      if (rowY + ROW_H < LIST_TOP || rowY > LIST_BOTTOM) return;

      const isCurrentUser = entry.userId === currentUserId;
      const borderColor   = isCurrentUser ? '#ffcc44' : '#1a3060';
      const bgColor       = isCurrentUser ? 'rgba(40,30,0,0.92)' : 'rgba(8,16,40,0.90)';

      r.fillRoundRect(cardX, rowY, cardW, ROW_H, 10, bgColor);
      r.strokeRoundRect(cardX, rowY, cardW, ROW_H, 10, borderColor, isCurrentUser ? 2 : 1.5);

      const midY = rowY + ROW_H / 2 + 7;

      // Medalha / rank
      const medalX = cardX + 52;
      if (entry.rank <= 3) {
        const mc = MEDAL_COLORS[entry.rank - 1];
        r.fillCircle(medalX, rowY + ROW_H / 2, 20, mc, 0.25);
        r.drawText(`#${entry.rank}`, medalX, midY, mc, 16, 'center', 'Rajdhani');
      } else {
        r.drawText(`#${entry.rank}`, medalX, midY, '#8abccc', 14, 'center', 'Rajdhani');
      }

      // Username
      r.drawText(entry.username, cardX + 100, midY,
        isCurrentUser ? '#ffcc44' : '#f4faff', 16, 'left', 'Rajdhani');

      // Vitórias / Ciclos
      const vicX = cardX + 480;
      if (isCyclic) {
        const cycles = entry.bestCycles || 0;
        r.drawText(`${cycles} ciclo${cycles !== 1 ? 's' : ''}`,
          vicX, midY, '#44ccff', 14, 'left', 'Rajdhani');
      } else {
        r.drawText(`${entry.victories} vitória${entry.victories !== 1 ? 's' : ''}`,
          vicX, midY, '#44dd88', 14, 'left', 'Rajdhani');
      }

      // Barra de accuracy
      const barX  = cardX + 650;
      const barW  = 300;
      const barH  = 18;
      const barY  = rowY + ROW_H / 2 - barH / 2;
      const pct   = Math.round(entry.bestAccuracy * 100);
      const barColor = pct >= 70 ? '#44dd88' : pct >= 40 ? '#ffcc44' : '#ff6666';
      r.drawProgressBar(barX, barY, barW, barH, pct, 100, barColor, 'rgba(10,20,50,0.6)', '');

      // % texto
      r.drawText(`${pct}%`, barX + barW + 12, midY, '#aad4e8', 13, 'left', 'Rajdhani');

      // Badge perfect
      if (entry.hasPerfect) {
        r.drawText('★', cardX + cardW - 30, midY, '#ffd700', 18, 'center', 'Rajdhani');
      }
    });

    ctx.restore();

    // ── Scrollbar ─────────────────────────────────────────────────────────────
    if (this._maxScroll > 0) {
      const sbX   = cardX + cardW + 10;
      const sbY   = LIST_TOP;
      const sbH   = VISIBLE_H;
      const thumbH = Math.max(40, sbH * (VISIBLE_H / (VISIBLE_H + this._maxScroll)));
      const thumbY = sbY + (this._scrollY / this._maxScroll) * (sbH - thumbH);

      r.fillRoundRect(sbX, sbY, 6, sbH, 3, 'rgba(20,40,80,0.5)');
      r.fillRoundRect(sbX, thumbY, 6, thumbH, 3, '#3a6a9c', 0.8);
    }

  }
}

// Converte cor hex (#rrggbb) em "r,g,b" para uso em rgba()
function _hexToRgb(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export default RankingScene;
