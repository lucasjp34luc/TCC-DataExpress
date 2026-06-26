/**
 * @file AchievementsScene.js
 * @description Tela de conquistas do jogador: lista todas as conquistas
 * com status de desbloqueio, progresso e porcentagem global.
 * Suporta scroll com a roda do mouse e filtros por status/raridade.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { computeAchievements, RARITY_COLORS, RARITY_LABELS } from '../data/achievements.js';

const CARD_W     = 550;
const CARD_H     = 82;
const GAP_X      = 20;
const GAP_Y      = 8;
const COLS       = 2;
const HEADER_H   = 26;
const CAT_GAP    = 14;
const CONTENT_TOP    = 185;
const CONTENT_BOTTOM = VIRTUAL_H - 18;
const VISIBLE_H      = CONTENT_BOTTOM - CONTENT_TOP;

const TOTAL_CARDS_W = CARD_W * COLS + GAP_X;
const START_X       = (VIRTUAL_W - TOTAL_CARDS_W) / 2;

// Agrupamento das conquistas por categoria
const CATEGORIES = [
  {
    label: 'Geral',
    ids: ['first_win','veteran','champion','legend','explorer','traveler',
          'line_master','good_student','specialist','perfect','all_perfect_master'],
  },
  {
    label: 'Linha Encadeada',
    ids: ['enc_first','enc_veteran','enc_master'],
  },
  {
    label: 'Linha Circular',
    ids: ['cir_first','cir_loops','cir_master','cir_perfect'],
  },
  {
    label: 'Duplamente Encadeada',
    ids: ['dup_first','dup_veteran','dup_master'],
  },
  {
    label: 'Duplamente Encadeada Circular',
    ids: ['dcir_first','dcir_loops','dcir_master','dcir_perfect'],
  },
  {
    label: 'Todas as Listas',
    ids: ['all_first','all_veteran','all_legend'],
  },
];

// Filtros de status
const STATUS_FILTERS = [
  { id: 'all',      label: 'Todos' },
  { id: 'unlocked', label: 'Desbloqueadas' },
  { id: 'locked',   label: 'Bloqueadas' },
];

// Filtros de raridade
const RARITY_FILTERS = [
  { id: 'all',       label: 'Todos' },
  { id: 'common',    label: 'Comum' },
  { id: 'rare',      label: 'Raro' },
  { id: 'epic',      label: 'Épico' },
  { id: 'legendary', label: 'Lendário' },
];

// Dimensões dos botões de filtro
const SPILL_W = 130, SPILL_H = 26, SPILL_GAP = 10;
const RPILL_W = 100, RPILL_H = 22, RPILL_GAP = 8;

const STATUS_ROW_Y  = 120;
const RARITY_ROW_Y  = 154;

export class AchievementsScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim        = 0;
    this._username    = '';
    this._computed    = [];
    this._globalStats = {};
    this._scrollY     = 0;
    this._maxScroll   = 0;
    this._wheelBound  = null;
    this._btnBack     = null;
    this._statusBtns  = [];
    this._rarityBtns  = [];

    this._filterStatus = 'all';
    this._filterRarity = 'all';
    this._displayItems = [];

    this._viewUserId      = null;
    this._viewUsername    = null;
    this._from            = null;
    this._phaseId         = null;
    this._loading         = false;
  }

  enter(params = {}) {
    this._anim        = 0;
    this._scrollY     = 0;
    this._globalStats = {};
    this._filterStatus = 'all';
    this._filterRarity = 'all';

    this._viewUserId      = params.viewUserId   || null;
    this._viewUsername    = params.viewUsername || null;
    this._from            = params.from         || 'modeSelect';
    this._phaseId         = params.phaseId      || null;
    this._fromClassId     = params.classId      || null;
    this._fromClassName   = params.className    || null;
    this._loading         = false;

    const user   = this.manager.state.currentUser;
    const userId = this._viewUserId || (user && user.userId) || null;
    this._username = this._viewUsername || (user && user.username) || '';

    if (this._viewUserId) {
      this._loading  = true;
      this._computed = [];
      fetch(`https://${window.location.hostname}:3000/player/profile/${this._viewUserId}`)
        .then(r => r.json())
        .then(data => {
          const profile = data.success ? data.profile : {};
          this._computed = computeAchievements(profile, userId);
          this._loading  = false;
          this._buildDisplayItems();
        })
        .catch(() => {
          this._computed = computeAchievements({}, userId);
          this._loading  = false;
          this._buildDisplayItems();
        });
    } else {
      const profile  = (user && user.profile) || null;
      this._computed = computeAchievements(profile, userId);
    }

    this.input.clearButtons();

    // ── Botão Voltar ───────────────────────────────────────────────────────
    this._btnBack = { x: 50, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => {
      const p = {};
      if (this._viewUserId)    p.viewUserId   = this._viewUserId;
      if (this._viewUsername)  p.viewUsername = this._viewUsername;
      if (this._from)          p.from         = this._from;
      if (this._phaseId)       p.phaseId      = this._phaseId;
      if (this._fromClassId)   p.classId      = this._fromClassId;
      if (this._fromClassName) p.className    = this._fromClassName;
      this.manager.goto('profile', p);
    });

    // ── Filtros de status ──────────────────────────────────────────────────
    const statusTotalW = STATUS_FILTERS.length * SPILL_W + (STATUS_FILTERS.length - 1) * SPILL_GAP;
    const statusStartX = (VIRTUAL_W - statusTotalW) / 2;
    this._statusBtns = STATUS_FILTERS.map((f, i) => {
      const btn = {
        x: statusStartX + i * (SPILL_W + SPILL_GAP),
        y: STATUS_ROW_Y,
        w: SPILL_W,
        h: SPILL_H,
        filterId: f.id,
        label: f.label,
      };
      this.input.addButton(btn, () => {
        this._filterStatus = f.id;
        this._scrollY = 0;
        this._buildDisplayItems();
      });
      return btn;
    });

    // ── Filtros de raridade ────────────────────────────────────────────────
    const rarityTotalW = RARITY_FILTERS.length * RPILL_W + (RARITY_FILTERS.length - 1) * RPILL_GAP;
    const rarityStartX = (VIRTUAL_W - rarityTotalW) / 2;
    this._rarityBtns = RARITY_FILTERS.map((f, i) => {
      const btn = {
        x: rarityStartX + i * (RPILL_W + RPILL_GAP),
        y: RARITY_ROW_Y,
        w: RPILL_W,
        h: RPILL_H,
        filterId: f.id,
        label: f.label,
      };
      this.input.addButton(btn, () => {
        this._filterRarity = f.id;
        this._scrollY = 0;
        this._buildDisplayItems();
      });
      return btn;
    });

    this._buildDisplayItems();

    // ── Scroll com roda do mouse ───────────────────────────────────────────
    this._wheelBound = (e) => {
      e.preventDefault();
      this._scrollY = Math.max(0, Math.min(this._maxScroll, this._scrollY + e.deltaY * 0.5));
    };
    this.input.canvas.addEventListener('wheel', this._wheelBound, { passive: false });

    // ── Busca porcentagens globais ─────────────────────────────────────────
    fetch(`https://${window.location.hostname}:3000/achievements/stats`)
      .then(res => res.json())
      .then(data => { if (data.success) this._globalStats = data.stats || {}; })
      .catch(() => {});
  }

  /**
   * Aplica filtros e monta a lista de itens de exibição (headers + rows).
   */
  _buildDisplayItems() {
    const filtered = this._computed.filter(a => {
      if (this._filterStatus === 'unlocked' && !a.unlocked) return false;
      if (this._filterStatus === 'locked'   &&  a.unlocked) return false;
      if (this._filterRarity !== 'all' && a.rarity !== this._filterRarity) return false;
      return true;
    });

    const items = [];
    let y = 0;

    for (const cat of CATEGORIES) {
      const achs = filtered.filter(a => cat.ids.includes(a.id));
      if (achs.length === 0) continue;

      items.push({ type: 'header', label: cat.label, y });
      y += HEADER_H + GAP_Y;

      for (let i = 0; i < achs.length; i += COLS) {
        items.push({ type: 'row', achs: achs.slice(i, i + COLS), y });
        y += CARD_H + GAP_Y;
      }
      y += CAT_GAP;
    }

    this._displayItems = items;
    this._maxScroll = Math.max(0, y - VISIBLE_H);
    this._scrollY   = Math.min(this._scrollY, this._maxScroll);
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

    // ── Cabeçalho fixo ─────────────────────────────────────────────────────
    const title = this._username
      ? `CONQUISTAS — ${this._username.toUpperCase()}`
      : 'CONQUISTAS';
    r.drawTextShadow(title, VIRTUAL_W / 2, 48, '#ffcc44', 30, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#1a3a5c', 1);

    if (this._btnBack) {
      r.drawButton(
        this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a'
      );
    }

    // Contador de desbloqueadas
    const unlocked = this._computed.filter(a => a.unlocked).length;
    const total    = this._computed.length;
    r.drawText(
      `${unlocked} / ${total} desbloqueadas`,
      VIRTUAL_W / 2, 108, '#8aaec8', 15, 'center', 'Rajdhani'
    );

    // ── Filtros de status ──────────────────────────────────────────────────
    const STATUS_COLOR = '#5ab4ff';
    for (const btn of this._statusBtns) {
      const isActive = this._filterStatus === btn.filterId;
      const hover    = this.input.isHover(btn);
      const bgAlpha  = isActive ? 0.50 : (hover ? 0.40 : 0.28);
      r.fillRoundRect(btn.x, btn.y, btn.w, btn.h, 7,
        `rgba(${_hexToRgb(STATUS_COLOR)},${bgAlpha})`);
      r.strokeRoundRect(btn.x, btn.y, btn.w, btn.h, 7,
        isActive ? STATUS_COLOR : (hover ? STATUS_COLOR + 'cc' : '#3a5888'),
        isActive ? 2.5 : 1.5);
      r.drawText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5,
        isActive ? '#ffffff' : (hover ? '#ffffff' : '#dce8f0'),
        11, 'center', 'Rajdhani');
    }

    // ── Filtros de raridade ────────────────────────────────────────────────
    for (const btn of this._rarityBtns) {
      const isActive  = this._filterRarity === btn.filterId;
      const hover     = this.input.isHover(btn);
      const color     = RARITY_COLORS[btn.filterId] || '#5ab4ff';
      const bgAlpha   = isActive ? 0.50 : (hover ? 0.40 : 0.28);
      r.fillRoundRect(btn.x, btn.y, btn.w, btn.h, 7,
        `rgba(${_hexToRgb(color)},${bgAlpha})`);
      r.strokeRoundRect(btn.x, btn.y, btn.w, btn.h, 7,
        isActive ? color : (hover ? color + 'cc' : '#3a5888'),
        isActive ? 2.5 : 1.5);
      r.drawText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5,
        isActive ? '#ffffff' : (hover ? '#ffffff' : '#dce8f0'),
        11, 'center', 'Rajdhani');
    }

    // Divisor antes da lista
    r.drawLine(50, CONTENT_TOP - 6, VIRTUAL_W - 50, CONTENT_TOP - 6, '#0d2040', 1);

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, CONTENT_TOP + 80, '#ffcc44', 22, 'center', 'Rajdhani');
      return;
    }

    // ── Área rolável com clipping ──────────────────────────────────────────
    const ctx = r.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, r.vy(CONTENT_TOP), r.canvas.width, r.vy(VISIBLE_H));
    ctx.clip();

    if (this._displayItems.length === 0) {
      r.drawText(
        'Nenhuma conquista encontrada.',
        VIRTUAL_W / 2, CONTENT_TOP + 60, '#3a6a8a', 16, 'center', 'Rajdhani'
      );
    }

    for (const item of this._displayItems) {
      const itemY = CONTENT_TOP + item.y - this._scrollY;

      if (item.type === 'header') {
        if (itemY + HEADER_H < CONTENT_TOP || itemY > CONTENT_BOTTOM) continue;
        this._renderCategoryHeader(r, item.label, itemY);
      } else if (item.type === 'row') {
        if (itemY + CARD_H < CONTENT_TOP || itemY > CONTENT_BOTTOM) continue;
        item.achs.forEach((ach, col) => {
          this._renderCard(r, ach, START_X + col * (CARD_W + GAP_X), itemY);
        });
      }
    }

    ctx.restore();

    // ── Scrollbar indicativa ───────────────────────────────────────────────
    if (this._maxScroll > 0) {
      const sbX    = VIRTUAL_W - 18;
      const sbY    = CONTENT_TOP;
      const sbH    = VISIBLE_H;
      const thumbH = Math.max(40, sbH * (VISIBLE_H / (VISIBLE_H + this._maxScroll)));
      const thumbY = sbY + (this._scrollY / this._maxScroll) * (sbH - thumbH);
      r.fillRoundRect(sbX - 6, sbY, 8, sbH,     4, 'rgba(20,40,80,0.5)');
      r.fillRoundRect(sbX - 6, thumbY, 8, thumbH, 4, '#2a5a8c');
    }

    // ── Barra de progresso geral (rodapé fixo) ─────────────────────────────
    const BAR_W  = 600;
    const BAR_H  = 10;
    const bx     = (VIRTUAL_W - BAR_W) / 2;
    const by     = VIRTUAL_H - 14;
    const pctAll = total > 0 ? unlocked / total : 0;
    r.fillRoundRect(bx, by, BAR_W, BAR_H, 5, 'rgba(10,20,50,0.80)');
    if (pctAll > 0) r.fillRoundRect(bx, by, Math.round(BAR_W * pctAll), BAR_H, 5, '#ffcc44');
  }

  // ── Helpers de renderização ─────────────────────────────────────────────

  _renderCategoryHeader(r, label, y) {
    const lineY = y + HEADER_H - 4;
    r.drawText(label.toUpperCase(), START_X + 4, y + 17, '#ffaa33', 13, 'left', 'Rajdhani');
    r.drawLine(START_X, lineY, START_X + TOTAL_CARDS_W, lineY, '#1a3a5c', 1);
  }

  _renderCard(r, ach, cx, cy) {
    const rarityColor = RARITY_COLORS[ach.rarity] || '#7a9aaa';
    const locked      = !ach.unlocked;

    // Fundo e borda
    r.fillRoundRect(cx, cy, CARD_W, CARD_H, 10,
      locked ? 'rgba(6,10,24,0.85)' : 'rgba(20,40,80,0.90)');
    r.strokeRoundRect(cx, cy, CARD_W, CARD_H, 10,
      locked ? '#1a3060' : rarityColor,
      locked ? 1 : (ach.rarity === 'legendary' ? 2.5 : 1.5));

    // Ícone
    r.drawText(locked ? '🔒' : ach.icon,
      cx + 36, cy + CARD_H / 2 + 9,
      locked ? '#3a5a6a' : '#ffffff', 22, 'center', 'Rajdhani');

    // Nome
    r.drawText(ach.name,
      cx + 68, cy + 26,
      locked ? '#3a5a6a' : (ach.rarity === 'legendary' ? '#ffcc44' : '#d0e8ff'),
      16, 'left', 'Rajdhani');

    // Descrição
    r.drawText(ach.description,
      cx + 68, cy + 50,
      locked ? '#2a4a5a' : '#7aaac8', 12, 'left', 'Rajdhani');

    // % dos jogadores
    const globalPct = this._globalStats[ach.id];
    if (globalPct !== undefined) {
      r.drawText(`${globalPct}% dos jogadores`,
        cx + 68, cy + 68,
        locked ? '#253545' : '#4a8aaa', 11, 'left', 'Rajdhani');
    }

    // Badge de raridade (canto superior direito)
    r.drawText(RARITY_LABELS[ach.rarity] || ach.rarity,
      cx + CARD_W - 14, cy + 20,
      locked ? '#2a4050' : rarityColor, 11, 'right', 'Rajdhani');

    // Progresso ou ✔ (canto inferior direito)
    if (ach.unlocked) {
      r.drawText('✔',
        cx + CARD_W - 14, cy + CARD_H - 10,
        rarityColor, 16, 'right', 'Rajdhani');
    } else if (ach.total > 1) {
      const BAR_W = 120;
      const BAR_H = 7;
      const bx    = cx + CARD_W - 14 - BAR_W;
      const by    = cy + CARD_H - 20;
      const pct   = ach.total > 0 ? ach.progress / ach.total : 0;

      r.fillRoundRect(bx, by, BAR_W, BAR_H, 4, 'rgba(10,20,50,0.80)');
      if (pct > 0) r.fillRoundRect(bx, by, Math.round(BAR_W * pct), BAR_H, 4, rarityColor);

      r.drawText(`${ach.progress}/${ach.total}`,
        cx + CARD_W - 14, cy + CARD_H - 22,
        '#4a7a9a', 10, 'right', 'Rajdhani');
    }
  }
}

export default AchievementsScene;

// Converte cor hex (#rrggbb) em "r,g,b" para uso em rgba()
function _hexToRgb(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
