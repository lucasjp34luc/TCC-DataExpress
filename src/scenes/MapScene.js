/**
 * @file MapScene.js
 * @description Mapa de progressão dos vagões. O comportamento de navegação
 * depende do listType da fase selecionada:
 *
 *  linked          → apenas avançar; boss no final
 *  circular        → avança em ciclo; boss sempre na última sala;
 *                    cada ciclo os inimigos ficam 15% mais fortes
 *  doubly_linked   → avança e volta livremente pelas salas desbloqueadas
 *  doubly_circular → bidirecional circular; popup ao voltar no vagão 0
 *                    sem ter derrotado o boss
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

const ROOM_ICONS = {
  enemy:       '⚔',
  mimic:       '📦',
  shop:        '🛒',
  boss:        '💀',
  maintenance: '🔧'
};

const ROOM_LABELS = {
  enemy:       'Inimigo',
  mimic:       'Mímico',
  shop:        'Loja',
  boss:        'BOSS',
  maintenance: 'Manutenção'
};

const ROOM_COLORS = {
  enemy:       '#ff4a4a',
  mimic:       '#cc44ff',
  shop:        '#44dd88',
  boss:        '#ff8800',
  maintenance: '#44bbff'
};

export class MapScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._btnEnter    = null;
    this._btnPrev     = null;
    this._btnNext     = null;
    this._btnFinish   = null;
    this._btnNextCycle = null;
    this._btnBack     = null;
    this._btnSettings = null;
    this._anim        = 0;
    this._canFinish   = false;

    this._showAbandonPopup = false;
    this._btnPopupConfirm  = null;
    this._btnPopupCancel   = null;
  }

  enter() {
    this._anim = 0;
    this._showAbandonPopup = false;
    this._setupButtons();
  }

  exit() {
    this.input.clearButtons();
    this._showAbandonPopup = false;
  }

  // ── Setup de botões ────────────────────────────────────────────────────────

  _setupButtons() {
    this.input.clearButtons();
    this._btnEnter            = null;
    this._btnSkipMaintenance  = null;
    this._btnPrev             = null;
    this._btnNext             = null;
    this._btnFinish           = null;
    this._btnNextCycle        = null;
    this._btnBack             = null;
    this._btnSettings         = null;
    this._btnPopupConfirm     = null;
    this._btnPopupCancel      = null;

    if (this._showAbandonPopup) {
      this._setupAbandonPopupButtons();
      return;
    }

    // ── Botão VOLTAR (abandonar) ──────────────────────────────────────────
    this._btnBack = { x: 50, y: 20, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => {
      this._showAbandonPopup = true;
      this._setupButtons();
    });

    // ── Botão configurações (canto superior direito) ──────────────────────
    const gearSize = 44;
    this._btnSettings = { x: VIRTUAL_W - gearSize - 50, y: 20, w: gearSize, h: gearSize };
    this.input.addButton(this._btnSettings, () => this.manager.goto('settings', { from: 'map' }));

    const st       = this.manager.state;
    const listType = st.phase ? st.phase.listType : 'linked';
    const cur      = st.currentRoom;
    const rooms    = st.rooms;
    // Verifica se todos os vagões foram concluídos (boss entra em clearedRooms quando derrotado)
    const clearedSet = st.clearedRooms || new Set();
    const allCleared = rooms.every((_, i) => clearedSet.has(i));
    this._canFinish  = st.bossDefeated && allCleared;

    // Oculta o botão de entrar se o vagão atual já foi concluído (exceto loja)
    const curType             = rooms[cur];
    const isCurCleared        = clearedSet.has(cur);
    const showEnter           = !isCurCleared || curType === 'shop';
    // Vagão de manutenção já concluído (movido para cá por operação anterior):
    // mostra botão para avançar em vez do botão de entrar
    const showSkipMaintenance = isCurCleared && curType === 'maintenance' && listType === 'linked';

    const hasPrev =
      listType === 'doubly_linked'   ? cur > 0 :
      listType === 'doubly_circular' ? true     : false;

    const hasNext = listType === 'doubly_linked'   ? cur < rooms.length - 1
                  : listType === 'doubly_circular' ? true
                  : listType === 'circular'        ? true
                  : false;

    const isCircularType  = listType === 'circular' || listType === 'doubly_circular';
    const showNextCycle   = this._canFinish && isCircularType;

    const BY = VIRTUAL_H - 78, BH = 50, GAP = 15;

    if (showNextCycle) {
      // Estado final circular: posiciona todos os botões dinamicamente para evitar sobreposição
      // Botões da direita para a esquerda: Encerrar, Próximo Ciclo, Vagão Seguinte
      let rx = VIRTUAL_W - 30;

      rx -= 200;
      this._btnFinish = { x: rx, y: BY, w: 200, h: BH };
      this.input.addButton(this._btnFinish, () => this.manager.goto('victory'));
      rx -= GAP;

      rx -= 200;
      this._btnNextCycle = { x: rx, y: BY, w: 200, h: BH };
      this.input.addButton(this._btnNextCycle, () => this._startNextCycle());
      rx -= GAP;

      if (hasNext) {
        rx -= 180;
        this._btnNext = { x: rx, y: BY, w: 180, h: BH };
        this.input.addButton(this._btnNext, () => this._goNext());
        rx -= GAP;
      }

      // Entrar: centralizado entre o grupo esquerdo e o primeiro botão da direita
      if (showEnter) {
        const firstRightX = hasNext ? this._btnNext.x : this._btnNextCycle.x;
        const leftEdge    = hasPrev ? 30 + 160 + GAP : 30;
        const enterX      = Math.round(leftEdge + (firstRightX - GAP - leftEdge - 220) / 2);
        this._btnEnter = { x: Math.max(leftEdge, enterX), y: BY, w: 220, h: BH };
        this.input.addButton(this._btnEnter, () => this._enterRoom());
      }
      if (showSkipMaintenance) {
        const firstRightX = hasNext ? this._btnNext.x : this._btnNextCycle.x;
        const leftEdge    = hasPrev ? 30 + 160 + GAP : 30;
        const skipW       = Math.min(460, firstRightX - GAP - leftEdge);
        const skipX       = Math.round(leftEdge + (firstRightX - GAP - leftEdge - skipW) / 2);
        this._btnSkipMaintenance = { x: Math.max(leftEdge, skipX), y: BY, w: skipW, h: BH };
        this.input.addButton(this._btnSkipMaintenance, () => this._advancePastMaintenance());
      }

      if (hasPrev) {
        this._btnPrev = { x: 30, y: BY, w: 160, h: BH };
        this.input.addButton(this._btnPrev, () => this._goPrev());
      }

    } else {
      // Posicionamento normal
      if (showEnter) {
        this._btnEnter = { x: VIRTUAL_W / 2 - 110, y: BY, w: 220, h: BH };
        this.input.addButton(this._btnEnter, () => this._enterRoom());
      }
      if (showSkipMaintenance) {
        this._btnSkipMaintenance = { x: VIRTUAL_W / 2 - 230, y: BY, w: 460, h: BH };
        this.input.addButton(this._btnSkipMaintenance, () => this._advancePastMaintenance());
      }

      if (hasPrev) {
        this._btnPrev = { x: 50, y: BY, w: 160, h: BH };
        this.input.addButton(this._btnPrev, () => this._goPrev());
      }

      if (hasNext) {
        const nextX = this._canFinish ? VIRTUAL_W - 430 : VIRTUAL_W - 230;
        this._btnNext = { x: nextX, y: BY, w: 180, h: BH };
        this.input.addButton(this._btnNext, () => this._goNext());
      }

      if (this._canFinish) {
        this._btnFinish = { x: VIRTUAL_W - 230, y: BY, w: 200, h: BH };
        this.input.addButton(this._btnFinish, () => this.manager.goto('victory'));
      }
    }
  }

  _setupAbandonPopupButtons() {
    this.input.clearButtons();
    this._btnPopupConfirm = { x: VIRTUAL_W / 2 - 180, y: VIRTUAL_H / 2 + 30, w: 150, h: 44 };
    this._btnPopupCancel  = { x: VIRTUAL_W / 2 + 30,  y: VIRTUAL_H / 2 + 30, w: 150, h: 44 };
    this.input.addButton(this._btnPopupConfirm, () => this._confirmAbandon());
    this.input.addButton(this._btnPopupCancel,  () => this._cancelAbandon());
  }

  _confirmAbandon() {
    this.manager.resetState();
    this.manager.goto('phaseSelect');
  }

  _cancelAbandon() {
    this._showAbandonPopup = false;
    this._setupButtons();
  }

  _advancePastMaintenance() {
    const st       = this.manager.state;
    const listType = st.phase ? st.phase.listType : 'linked';
    if (listType === 'circular' || listType === 'doubly_circular') {
      st.currentRoom = (st.currentRoom + 1) % st.rooms.length;
      if (listType === 'doubly_circular')
        st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
    } else {
      st.currentRoom++;
      st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
    }
    this._setupButtons();
  }

  // ── Ações de navegação ────────────────────────────────────────────────────

  _enterRoom() {
    const st   = this.manager.state;
    const type = st.rooms[st.currentRoom];
    if (type === 'mimic')            this.manager.goto('mimic');
    else if (type === 'shop')        this.manager.goto('shop');
    else if (type === 'maintenance') this.manager.goto('maintenance');
    else                             this.manager.goto('battle'); // enemy ou boss
  }

  _goPrev() {
    const st       = this.manager.state;
    const listType = st.phase ? st.phase.listType : 'linked';
    const cur      = st.currentRoom;

    if (listType === 'doubly_circular' && cur === 0) {
      // Comportamento circular: volta ao boss (último vagão)
      st.currentRoom = st.rooms.length - 1;
    } else {
      st.currentRoom = Math.max(0, cur - 1);
    }
    this._setupButtons();
  }

  _goNext() {
    const st       = this.manager.state;
    const listType = st.phase ? st.phase.listType : 'linked';
    const bossIdx  = st.rooms.length - 1;
    const isCircular = listType === 'circular' || listType === 'doubly_circular';
    if (isCircular && st.currentRoom === bossIdx) {
      st.currentRoom = 0; // wrap: boss → vagão 1
    } else {
      st.currentRoom = st.currentRoom + 1;
    }
    this._setupButtons();
  }

  _startNextCycle() {
    const st = this.manager.state;
    st.listCycle++;
    st.enemyScale   = 1 + st.listCycle * 0.15;
    st.bossDefeated    = false;
    st.clearedRooms    = new Set();
    st.shopCycleItems  = new Set();
    st.currentRoom     = 0;
    st.maxRoom         = 0;
    // Restaura os tipos originais de sala (desfaz mutações como 'mimic_enemy')
    if (st.baseRooms) st.rooms = [...st.baseRooms];
    this._setupButtons();
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(dt) {
    this._anim += dt;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render(r) {
    r.drawGradientBg('#070a15', '#0d1528');

    const st     = this.manager.state;
    const rooms  = st.rooms;
    const cur    = st.currentRoom;
    const phase  = st.phase;
    const listType = phase ? phase.listType : 'linked';

    // ── Cabeçalho ────────────────────────────────────────────────────────
    const cycleStr = st.listCycle > 0 ? ` · Ciclo ${st.listCycle + 1}` : '';
    r.drawTextShadow(
      'LINHA: ' + (phase ? phase.name.toUpperCase() : '') + cycleStr,
      VIRTUAL_W / 2, 42, phase ? phase.color : '#5ab4ff', 22, 'center', 'Rajdhani'
    );
    if (st.enemyScale > 1.0) {
      r.drawText(
        `⚠ Inimigos +${Math.round((st.enemyScale - 1) * 100)}% mais fortes`,
        VIRTUAL_W / 2, 64, '#ff8800', 13, 'center', 'Rajdhani'
      );
    }
    r.drawLine(50, 76, VIRTUAL_W - 50, 76, '#1a3a5c', 1);

    // ── Ouro ─────────────────────────────────────────────────────────────
    r.fillRoundRect(VIRTUAL_W - 170, 86, 130, 40, 8, 'rgba(10,20,50,0.85)');
    r.strokeRoundRect(VIRTUAL_W - 170, 86, 130, 40, 8, '#443300', 1);
    r.drawText(`💰 ${st.gold}`, VIRTUAL_W - 110, 112, '#ffcc44', 16, 'center', 'Rajdhani');

    // ── Trilho ────────────────────────────────────────────────────────────
    const railY   = 340;
    const roomW   = 100;
    const roomH   = 100;
    const spacing = (VIRTUAL_W - 160) / (rooms.length - 1);
    const startX  = 80;

    // Linha base do trilho
    r.drawLine(startX, railY, startX + (rooms.length - 1) * spacing, railY, '#1a3a5c', 4);

    rooms.forEach((type, i) => {
      const cx        = startX + i * spacing;
      // linked: concluído = todos os vagões antes do atual ou em clearedRooms
      // demais (incluindo boss): rastreia clearedRooms
      const isCleared = listType === 'linked'
        ? (i < cur || st.clearedRooms.has(i))
        : st.clearedRooms.has(i);
      const isCurrent  = i === cur;
      const isUnlocked = listType === 'linked' ? i <= st.maxRoom : true;

      // Conector entre vagões (frente)
      if (i > 0) {
        const prevCx    = startX + (i - 1) * spacing;
        const connected = listType === 'linked' ? i <= cur : true;
        r.drawLine(prevCx + roomW / 2, railY, cx - roomW / 2, railY,
          connected ? '#2a6aaa' : '#1a2a4a', 5);

      }

      const bx = cx - roomW / 2;
      const by = railY - roomH / 2;

      // Cor e fundo do card
      const color  = ROOM_COLORS[type] || '#aaa';
      // linked: bloqueia vagões não alcançados; demais: nunca bloqueia
      const locked = listType === 'linked' && !isCurrent && !isUnlocked;
      const bg = isCleared && !isCurrent ? 'rgba(10,20,40,0.5)'
               : isCurrent               ? 'rgba(20,50,100,0.95)'
               : locked                  ? 'rgba(8,14,30,0.6)'
               :                           'rgba(10,20,45,0.7)';
      const border = isCleared && !isCurrent ? '#2a4a6a'
                   : isCurrent               ? color
                   : locked                  ? '#111a33'
                   :                           '#1a2a4a';

      r.fillRoundRect(bx, by, roomW, roomH, 10, bg);
      r.strokeRoundRect(bx, by, roomW, roomH, 10, border, isCurrent ? 3 : 2);

      // Pulsação na sala atual
      if (isCurrent) {
        const pulse = 0.4 + 0.3 * Math.sin(this._anim * 3);
        r.strokeRoundRect(bx - 4, by - 4, roomW + 8, roomH + 8, 12, color, 2, pulse);
      }

      // Ícone — sempre mostra o tipo do vagão (dimmed quando concluído)
      if (isCleared && !isCurrent) r.ctx.globalAlpha = 0.4;
      r.drawText(
        locked ? '🔒' : ROOM_ICONS[type],
        cx, by + 46,
        locked ? '#2a3a5a' : color,
        24, 'center', 'Arial'
      );
      r.ctx.globalAlpha = 1;

      // Label — sempre mostra o tipo do vagão
      r.drawText(
        locked ? 'Bloqueado' : ROOM_LABELS[type],
        cx, by + 76,
        locked ? '#ffffff' : isCurrent ? color : '#446688',
        11, 'center', 'Rajdhani'
      );

      // Vagão número
      r.drawText(`Vagão ${i + 1}`, cx, by + 90, '#777777', 10, 'center', 'Rajdhani');

      // Badge de concluído — ✔ no canto superior direito do card
      if (isCleared) {
        const badgeX = bx + roomW - 14;
        const badgeY = by + 14;
        r.fillCircle(badgeX, badgeY, 10, '#0d2210');
        r.fillCircle(badgeX, badgeY,  8, '#44dd88');
        r.drawText('✔', badgeX, badgeY + 5, '#0a1a0a', 11, 'center', 'Arial');
      }

    });

    // ── Legenda (topo central, entre HP e ouro) ───────────────────────────
    const legendW = 580;
    const legendX = VIRTUAL_W / 2 - legendW / 2;
    const legendY = 97;
    r.fillRoundRect(legendX, legendY, legendW, 28, 6, 'rgba(5,10,25,0.8)');
    let lx = legendX + 16;
    Object.entries(ROOM_ICONS).forEach(([type, icon]) => {
      r.drawText(`${icon} ${ROOM_LABELS[type]}`, lx, legendY + 19, ROOM_COLORS[type], 12, 'left', 'Rajdhani');
      lx += 116;
    });

    // ── Botões de navegação ───────────────────────────────────────────────
    // Prev
    if (this._btnPrev) {
      const hover = this.input.isHover(this._btnPrev);
      r.drawButton(this._btnPrev.x, this._btnPrev.y, this._btnPrev.w, this._btnPrev.h,
        '◀ Vagão Anterior', hover, false, '#1a2a3a');
    }

    // Skip maintenance (vagão de manutenção já concluído)
    if (this._btnSkipMaintenance) {
      const hover = this.input.isHover(this._btnSkipMaintenance);
      r.drawButton(
        this._btnSkipMaintenance.x, this._btnSkipMaintenance.y,
        this._btnSkipMaintenance.w, this._btnSkipMaintenance.h,
        'Esse vagão já foi enfrentado, ir para o próximo vagão ▶',
        hover, false, '#1a3a2a'
      );
    }

    // Enter
    if (this._btnEnter) {
      const curType  = rooms[cur];
      const btnLabel = curType === 'boss' ? '⚔ Enfrentar BOSS' : 'Entrar no Vagão ▶';
      const btnColor = curType === 'boss' ? '#5a1a00' : '#1a3a6a';
      const hover    = this.input.isHover(this._btnEnter);
      r.drawButton(this._btnEnter.x, this._btnEnter.y, this._btnEnter.w, this._btnEnter.h,
        btnLabel, hover, false, btnColor);
    }

    // Próximo ciclo
    if (this._btnNextCycle) {
      const hover = this.input.isHover(this._btnNextCycle);
      r.drawButton(this._btnNextCycle.x, this._btnNextCycle.y,
        this._btnNextCycle.w, this._btnNextCycle.h,
        '↻ Próximo Ciclo (+15%)', hover, false, '#3a1a5a');
    }

    // Próximo vagão
    if (this._btnNext) {
      const hover = this.input.isHover(this._btnNext);
      r.drawButton(this._btnNext.x, this._btnNext.y, this._btnNext.w, this._btnNext.h,
        'Vagão Seguinte ▶', hover, false, '#1a2a3a');
    }

    // Encerrar
    if (this._btnFinish) {
      const hover = this.input.isHover(this._btnFinish);
      r.drawButton(this._btnFinish.x, this._btnFinish.y, this._btnFinish.w, this._btnFinish.h,
        '🚪 Encerrar', hover, false, '#1a4a2a');
    }

    // Botão Voltar (abandonar)
    if (this._btnBack) {
      const hover = this.input.isHover(this._btnBack);
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', hover, false, '#1a2a3a');
    }

    // Botão configurações
    if (this._btnSettings) {
      const { x, y, w, h } = this._btnSettings;
      const hover = this.input.isHover(this._btnSettings);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(30,70,140,0.95)' : 'rgba(10,25,60,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#5ab4ff' : '#1a4a8c', hover ? 2 : 1);
      r.drawText('⚙', x + w / 2, y + h / 2 + 8, hover ? '#5ab4ff' : '#3a6a9c', 24, 'center', 'sans-serif');
    }

    // ── Dica de navegação ─────────────────────────────────────────────────
    if (!this._canFinish && !this._showAbandonPopup) {
      const tip =
        listType === 'linked'          ? 'Conclua o vagão para avançar!' :
        listType === 'circular'        ? 'O trem é circular/infinito — até aonde você chega?' :
        listType === 'doubly_linked'   ? 'Conclua os vagões na ordem de sua escolha.' :
        listType === 'doubly_circular' ? 'Bidirecional circular — navegue livremente pelos vagões!' : '';
      r.drawText(tip, VIRTUAL_W / 2, VIRTUAL_H - 15, '#ffffff', 12, 'center', 'Rajdhani');
    }

    // ── Popup abandonar trem ──────────────────────────────────────────────
    if (this._showAbandonPopup) {
      r.drawOverlay(0.75);

      const popW = 500;
      const popH = 170;
      const popX = (VIRTUAL_W - popW) / 2;
      const popY = VIRTUAL_H / 2 - popH / 2;

      r.fillRoundRect(popX, popY, popW, popH, 14, 'rgba(5,10,25,0.98)');
      r.strokeRoundRect(popX, popY, popW, popH, 14, '#4a1a1a', 2);

      r.drawTextShadow('⚠ Atenção!', VIRTUAL_W / 2, popY + 40, '#ff8800', 20, 'center', 'Rajdhani');
      r.drawText('Deseja Abandonar o trem?', VIRTUAL_W / 2, popY + 75, '#c0d8ee', 16, 'center', 'Rajdhani');

      if (this._btnPopupConfirm) {
        const hC = this.input.isHover(this._btnPopupConfirm);
        r.drawButton(this._btnPopupConfirm.x, this._btnPopupConfirm.y,
          this._btnPopupConfirm.w, this._btnPopupConfirm.h,
          '✔ Confirmar', hC, false, '#5a1a00');
      }
      if (this._btnPopupCancel) {
        const hX = this.input.isHover(this._btnPopupCancel);
        r.drawButton(this._btnPopupCancel.x, this._btnPopupCancel.y,
          this._btnPopupCancel.w, this._btnPopupCancel.h,
          '✘ Cancelar', hX, false, '#1a2a3a');
      }
    }
  }
}

export default MapScene;