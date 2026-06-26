/**
 * @file MaintenanceScene.js
 * @description Vagão de Manutenção — menu de operações sobre a lista de vagões.
 *
 * Fluxo:
 *   MENU → escolhe operação → QUESTION (pergunta sobre a operação)
 *     acerto → ADD_SELECT | REMOVE_SELECT | MOVE_SOURCE → (MOVE_DEST)
 *     erro   → mensagem com resposta correta → volta ao MENU
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { MAINTENANCE_QUESTIONS } from '../data/questions.js';

// ── Constantes visuais ────────────────────────────────────────────────────────

const ICONS = {
  enemy: '⚔', mimic: '📦', shop: '🛒', boss: '💀',
  maintenance: '🔧', mimic_enemy: '👹'
};
const LABELS = {
  enemy: 'Inimigo', mimic: 'Mímico', shop: 'Loja', boss: 'BOSS',
  maintenance: 'Manutenção', mimic_enemy: 'Mímico!'
};
const COLORS = {
  enemy: '#ff4a4a', mimic: '#cc44ff', shop: '#44dd88', boss: '#ff8800',
  maintenance: '#44bbff', mimic_enemy: '#ff6666'
};

const OP_LABELS = { add: 'Adicionar Vagão', remove: 'Remover Vagão' };

// ── Estados ───────────────────────────────────────────────────────────────────
const S = {
  MENU:          'menu',
  QUESTION:      'question',
  ADD_SELECT:    'add_select',
  REMOVE_SELECT: 'remove_select',
  ERROR:         'error',
  ANIM:          'anim'
};

// ── Helpers de lista ──────────────────────────────────────────────────────────

function _randomType() {
  const r = Math.random();
  if (r < 0.60) return 'enemy';
  if (r < 0.80) return 'mimic';
  return 'maintenance';
}

function _countType(rooms, type) {
  return rooms.filter(t => t === type).length;
}

function _shiftClearedAfterInsert(cleared, insertIdx) {
  const next = new Set();
  for (const idx of cleared) next.add(idx < insertIdx ? idx : idx + 1);
  return next;
}

function _shiftClearedAfterRemove(cleared, removeIdx) {
  const next = new Set();
  for (const idx of cleared) {
    if (idx !== removeIdx) next.add(idx < removeIdx ? idx : idx - 1);
  }
  return next;
}

// ── Cena ──────────────────────────────────────────────────────────────────────

export class MaintenanceScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._state      = S.MENU;
    this._errorMsg   = '';
    this._anim       = 0;

    // Botões de menu
    this._menuBtns    = [];
    // Botões de seleção de vagão / slot
    this._wagonBtns   = [];
    this._slotBtns    = [];
    // Botões de pergunta
    this._questionBtns    = [];
    this._currentQuestion = null;
    this._questionOp      = '';   // 'add' | 'remove'
    this._questionResult  = null; // null | 'correct' | 'wrong'

    this._btnContinue    = null;
    this._btnBack        = null;
    this._btnOk          = null;
    this._btnAnswer      = null;  // botão após resposta (prosseguir / voltar ao mapa)
    this._questionLayout = null;

    // Animação educativa
    this._animSteps      = [];
    this._animStep       = 0;
    this._animOnComplete = null;
    this._btnAnimNext    = null;
    this._btnAnimSkip    = null;
  }

  enter() {
    this._state           = S.MENU;
    this._anim            = 0;
    this._currentQuestion = null;
    this._questionResult  = null;
    this._questionLayout  = null;
    this._setupMenu();
  }

  exit() {
    this.input.clearButtons();
  }

  // ── Setup de estados ─────────────────────────────────────────────────────────

  _setupMenu() {
    this._state = S.MENU;
    this.input.clearButtons();
    this._menuBtns  = [];
    this._wagonBtns = [];
    this._slotBtns  = [];
    this._btnOk     = null;
    this._btnAnswer = null;

    const cx = VIRTUAL_W / 2;
    const btnW = 280, btnH = 54, gap = 20;
    const startY = 340;

    const opts = [
      { label: '➕  Adicionar Vagão', color: '#1a3a6a', op: 'add'    },
      { label: '➖  Remover Vagão',   color: '#3a1a1a', op: 'remove' }
    ];
    opts.forEach((opt, i) => {
      const rect = { x: cx - btnW / 2, y: startY + i * (btnH + gap), w: btnW, h: btnH };
      this._menuBtns.push({ rect, ...opt });
      this.input.addButton(rect, () => this._setupQuestion(opt.op));
    });

  }

  _computeQuestionLayout(question, visibleOptions) {
    const popW    = Math.min(720, VIRTUAL_W - 80);
    const PAD     = 20;
    const FONT    = 15;
    const LINE    = 22;
    const headerH = 80; // título + divisor + label operação + offset até texto da pergunta

    const textW  = popW - PAD * 2;
    const cpl    = Math.max(1, Math.floor(textW / (FONT * 0.54)));
    const qLines = Math.max(1, Math.ceil(question.text.length / cpl));
    const questionH = qLines * LINE + 12;

    const n    = visibleOptions.length;
    const cols = n <= 2 ? n : 2;
    const rows = Math.ceil(n / cols);
    const gapX = 10, gapY = 10;
    const btnW = cols <= 1 ? textW : (textW - gapX) / 2;
    const btnH = 52;
    const optH = rows * (btnH + gapY) - gapY;

    const popH  = Math.max(300, headerH + questionH + 14 + optH + 36);
    const popX  = (VIRTUAL_W - popW) / 2;
    const popY  = Math.max(20, Math.min(VIRTUAL_H - popH - 20, (VIRTUAL_H - popH) / 2));

    const btnStartX = popX + PAD;
    const btnStartY = popY + headerH + questionH + 14;

    const btns = visibleOptions.map(({ opt, i }, pos) => ({
      index: i,
      label: opt,
      rect: {
        x: btnStartX + (pos % cols) * (btnW + gapX),
        y: btnStartY + Math.floor(pos / cols) * (btnH + gapY),
        w: btnW,
        h: btnH
      }
    }));

    return { popX, popY, popW, popH, headerH, questionH, btns };
  }

  /** Exibe popup de pergunta antes da operação. */
  _setupQuestion(operation) {
    this._state          = S.QUESTION;
    this._questionOp     = operation;
    this._questionResult = null;
    this._questionBtns   = [];
    this._btnAnswer      = null;
    this._questionLayout = null;

    const phaseId = this.manager.state.phase ? this.manager.state.phase.id : null;
    const phaseQs = phaseId ? MAINTENANCE_QUESTIONS[phaseId] : null;
    this._currentQuestion = phaseQs ? (phaseQs[operation] ?? null) : null;

    if (!this._currentQuestion) {
      // Sem pergunta cadastrada: prossegue direto
      this._proceedToOperation();
      return;
    }

    // Passiva Estudioso: oculta 2 alternativas erradas aleatórias
    this.input.clearButtons();
    const char = this.manager?.state?.player?.character;
    let hiddenIndices = new Set();
    if (char && char.passive.id === 'olho_critico') {
      const correct   = this._currentQuestion.correct;
      const wrongIdxs = this._currentQuestion.options.map((_, i) => i).filter(i => i !== correct);
      for (let i = wrongIdxs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wrongIdxs[i], wrongIdxs[j]] = [wrongIdxs[j], wrongIdxs[i]];
      }
      hiddenIndices = new Set(wrongIdxs.slice(0, 2));
    }

    const visibleOptions = this._currentQuestion.options
      .map((opt, i) => ({ opt, i }))
      .filter(({ i }) => !hiddenIndices.has(i));

    this._questionLayout = this._computeQuestionLayout(this._currentQuestion, visibleOptions);

    this._questionLayout.btns.forEach(btn => {
      this._questionBtns.push(btn);
      this.input.addButton(btn.rect, () => this._answerQuestion(btn.index));
    });
  }

  _answerQuestion(idx) {
    const isCorrect = idx === this._currentQuestion.correct;
    this._questionResult = isCorrect ? 'correct' : 'wrong';
    this.input.clearButtons();
    this._questionBtns = [];

    const st = this.manager.state;
    if (isCorrect) st.questionsCorrect++;
    else           st.questionsWrong++;

    if (!st.runQuestions) st.runQuestions = [];
    st.runQuestions.push({
      text:    this._currentQuestion.text,
      options: [...this._currentQuestion.options],
      correct: this._currentQuestion.correct,
      chosen:  idx
    });

    // Troca para um layout dedicado ao resultado (dimensões adequadas ao conteúdo)
    const popW = Math.min(680, VIRTUAL_W - 80);
    const popH = isCorrect ? 210 : 280;
    const popX = (VIRTUAL_W - popW) / 2;
    const popY = Math.max(20, Math.min(VIRTUAL_H - popH - 20, (VIRTUAL_H - popH) / 2));
    this._questionLayout = { popX, popY, popW, popH, headerH: 0, questionH: 0 };

    const btnY = popY + popH - 62;
    this._btnAnswer = { x: VIRTUAL_W / 2 - 110, y: btnY, w: 220, h: 46 };
    this.input.addButton(this._btnAnswer,
      isCorrect ? () => this._proceedToOperation() : () => this._leave());
  }

  _proceedToOperation() {
    if      (this._questionOp === 'add')    this._setupAddSelect();
    else if (this._questionOp === 'remove') this._setupRemoveSelect();
  }

  _setupAddSelect() {
    this._state = S.ADD_SELECT;
    this.input.clearButtons();
    this._menuBtns  = [];
    this._wagonBtns = [];
    this._slotBtns  = [];

    const st       = this.manager.state;
    const rooms    = st.rooms;
    const cur      = st.currentRoom;
    const listType = st.phase ? st.phase.listType : 'linked';
    const n        = rooms.length;

    const maxSlots = n + 1;
    const cardW = Math.min(80, Math.floor((VIRTUAL_W - 120) / maxSlots) - 6);
    const gap   = Math.min(10, Math.floor(Math.max(0, VIRTUAL_W - 120 - maxSlots * cardW) / Math.max(1, maxSlots - 1)));
    const totalW = maxSlots * cardW + Math.max(0, maxSlots - 1) * gap;
    const slotY  = 330, cardH = 60;

    for (let i = 0; i <= n; i++) {
      const isDisabled = listType === 'linked' && i <= cur;
      const bx   = (VIRTUAL_W - totalW) / 2 + i * (cardW + gap);
      const rect = { x: bx, y: slotY, w: cardW, h: cardH };
      this._slotBtns.push({ rect, insertIdx: i, disabled: isDisabled });
      if (!isDisabled) this.input.addButton(rect, () => this._doAdd(i));
    }

    this._btnBack = { x: 50, y: VIRTUAL_H - 78, w: 160, h: 50 };
    this.input.addButton(this._btnBack, () => this._setupMenu());
  }

  _setupRemoveSelect() {
    this._state = S.REMOVE_SELECT;
    this.input.clearButtons();
    this._menuBtns  = [];
    this._wagonBtns = [];
    this._slotBtns  = [];

    const st    = this.manager.state;
    const rooms = st.rooms;
    const cur   = st.currentRoom;
    const { startX, cardW, cardH, gap, rowY } = this._wagonGridLayout(rooms.length);

    rooms.forEach((type, i) => {
      const bossCount  = _countType(rooms, 'boss');
      const isDisabled =
        i === cur                           ||
        type === 'shop'                     ||
        (type === 'boss' && bossCount <= 1);
      const rect = { x: startX + i * (cardW + gap), y: rowY, w: cardW, h: cardH };
      this._wagonBtns.push({ rect, idx: i, type, disabled: isDisabled });
      if (!isDisabled) this.input.addButton(rect, () => this._doRemove(i));
    });

    this._btnBack = { x: 50, y: VIRTUAL_H - 78, w: 160, h: 50 };
    this.input.addButton(this._btnBack, () => this._setupMenu());
  }

  _showError(msg) {
    this._errorMsg = msg;
    this._state    = S.ERROR;
    const ph = 190, py = VIRTUAL_H / 2 - ph / 2;
    this.input.clearButtons();
    this._btnOk = { x: VIRTUAL_W / 2 - 80, y: py + 128, w: 160, h: 46 };
    // Volta para a seleção da operação (a pergunta já foi aprovada)
    this.input.addButton(this._btnOk, () => this._proceedToOperation());
  }

  // ── Layout helper ────────────────────────────────────────────────────────────

  _wagonGridLayout(n) {
    const cardW  = Math.min(100, Math.floor((VIRTUAL_W - 120) / Math.max(1, n)) - 8);
    const cardH  = 90;
    const gap    = Math.min(12, Math.floor(Math.max(0, VIRTUAL_W - 120 - n * cardW) / Math.max(1, n - 1)));
    const totalW = n * cardW + Math.max(0, n - 1) * gap;
    return { cardW, cardH, gap, startX: (VIRTUAL_W - totalW) / 2, rowY: 310 };
  }

  // ── Operações de lista ────────────────────────────────────────────────────────

  _doAdd(insertIdx) {
    const st       = this.manager.state;
    const rooms    = st.rooms;
    const cur      = st.currentRoom;
    const listType = st.phase ? st.phase.listType : 'linked';

    if (listType === 'linked' && insertIdx <= cur) {
      this._showError('Esse vagão tem prioridade suprema. Não é possível mexer nele');
      return;
    }

    const preN  = rooms.length;
    const newType = insertIdx === rooms.length ? 'boss' : _randomType();

    rooms.splice(insertIdx, 0, newType);
    if (st.baseRooms) st.baseRooms.splice(insertIdx, 0, newType);

    st.clearedRooms = _shiftClearedAfterInsert(st.clearedRooms || new Set(), insertIdx);
    if (insertIdx <= cur) st.currentRoom++;
    if ((st.maxRoom || 0) >= insertIdx) st.maxRoom = (st.maxRoom || 0) + 1;

    const steps = this._buildAnimSteps('add', listType, preN, insertIdx);
    this._setupAnim(steps, () => this._leave());
  }

  _doRemove(removeIdx) {
    const st    = this.manager.state;
    const rooms = st.rooms;
    const cur   = st.currentRoom;

    if (removeIdx === cur) {
      this._showError('Esse vagão tem prioridade suprema. Não é possível mexer nele'); return;
    }
    if (rooms[removeIdx] === 'shop') {
      this._showError('Esse vagão tem prioridade suprema. Não é possível mexer nele'); return;
    }
    if (rooms[removeIdx] === 'boss' && _countType(rooms, 'boss') <= 1) {
      this._showError('Esse vagão tem prioridade suprema. Não é possível mexer nele'); return;
    }
    if (rooms.length <= 1) {
      this._showError('Esse vagão tem prioridade suprema. Não é possível mexer nele'); return;
    }

    const preN     = rooms.length;
    const listType = st.phase ? st.phase.listType : 'linked';

    rooms.splice(removeIdx, 1);
    if (st.baseRooms) st.baseRooms.splice(removeIdx, 1);

    st.clearedRooms = _shiftClearedAfterRemove(st.clearedRooms || new Set(), removeIdx);
    if (removeIdx < cur) st.currentRoom--;
    if (st.maxRoom > removeIdx) st.maxRoom--;
    else if (st.maxRoom === removeIdx) st.maxRoom = Math.max(0, (st.maxRoom || 0) - 1);

    const steps = this._buildAnimSteps('remove', listType, preN, removeIdx);
    this._setupAnim(steps, () => this._leave());
  }

  _leave() {
    const st       = this.manager.state;
    const listType = st.phase ? st.phase.listType : 'linked';
    st.clearedRooms = st.clearedRooms || new Set();
    st.clearedRooms.add(st.currentRoom);
    // Avança a sala atual como BattleScene faz para inimigos comuns
    if (listType === 'circular' || listType === 'doubly_circular') {
      st.currentRoom = (st.currentRoom + 1) % st.rooms.length;
      if (listType === 'doubly_circular')
        st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
    } else {
      st.currentRoom++;
      st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
    }
    this.manager.goto('map');
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  update(dt) {
    this._anim += dt;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  render(r) {
    r.drawGradientBg('#04080f', '#080f1e');
    r.drawTextShadow('🔧 VAGÃO DE MANUTENÇÃO', VIRTUAL_W / 2, 50, '#44bbff', 26, 'center', 'Rajdhani');
    r.drawLine(60, 68, VIRTUAL_W - 60, 68, '#1a3a5c', 1);

    if (this._state === S.ANIM) {
      this._renderAnim(r);
      return;
    }

    this._renderRail(r);

    // Conteúdo por estado (o menu fica visível como fundo no estado QUESTION)
    if (this._state === S.MENU || this._state === S.QUESTION) {
      this._renderMenu(r);
    } else if (this._state === S.ADD_SELECT) {
      this._renderAddSelect(r);
    } else if (this._state === S.REMOVE_SELECT) {
      this._renderWagonSelect(r);
    }

    // Popups sobrepõem tudo
    if (this._state === S.QUESTION) this._renderQuestion(r);
    if (this._state === S.ERROR)    this._renderError(r);
  }

  // ── Sub-renders ──────────────────────────────────────────────────────────────

  _renderRail(r) {
    const st    = this.manager.state;
    const rooms = st.rooms;
    const cur   = st.currentRoom;
    const n     = rooms.length;

    const railY   = 160;
    const cardW   = Math.min(88, n > 1 ? Math.floor((VIRTUAL_W - 120) / (n - 1)) - 12 : 88);
    const cardH   = 74;
    const spacing = n > 1 ? (VIRTUAL_W - 120) / (n - 1) : 0;
    const startX  = n > 1 ? 60 : VIRTUAL_W / 2;

    if (n > 1) r.drawLine(startX, railY, startX + (n - 1) * spacing, railY, '#1a3a5c', 3);

    rooms.forEach((type, i) => {
      const cx    = n > 1 ? startX + i * spacing : startX;
      const bx    = cx - cardW / 2;
      const by    = railY - cardH / 2;
      const isCur = i === cur;
      const color = COLORS[type] || '#aaa';

      r.fillRoundRect(bx, by, cardW, cardH, 8,
        isCur ? 'rgba(20,50,100,0.95)' : 'rgba(10,20,45,0.7)');
      r.strokeRoundRect(bx, by, cardW, cardH, 8,
        isCur ? color : '#1a2a4a', isCur ? 2 : 1);

      if (isCur) {
        const p = 0.35 + 0.25 * Math.sin(this._anim * 3);
        r.strokeRoundRect(bx - 3, by - 3, cardW + 6, cardH + 6, 10, color, 2, p);
      }

      r.drawText(ICONS[type] || '?',   cx, by + 34, color,                     17, 'center', 'Arial');
      r.drawText(LABELS[type] || type, cx, by + 52, isCur ? color : '#ffffff', 10, 'center', 'Rajdhani');
      r.drawText(`Vagão ${i + 1}`,          cx, by + 65, '#ffffff',                  9, 'center', 'Rajdhani');
    });
  }

  _renderMenu(r) {
    const st = this.manager.state;
    
    r.drawText('Selecione uma operação de lista:', VIRTUAL_W / 2, 308, '#8ab4c8', 16, 'center', 'Rajdhani');

    for (const btn of this._menuBtns) {
      const hover = this.input.isHover(btn.rect);
      r.drawButton(btn.rect.x, btn.rect.y, btn.rect.w, btn.rect.h, btn.label, hover, false, btn.color);
    }

  }

  _renderAddSelect(r) {
    const st       = this.manager.state;
    const listType = st.phase ? st.phase.listType : 'linked';

    r.drawText('Onde inserir o novo nó na lista?', VIRTUAL_W / 2, 242, '#44bbff', 17, 'center', 'Rajdhani');
    r.drawText(
      'Final → novo BOSS  |  Demais → Inimigo 60%, Mímico 20%, Manutenção 20%',
      VIRTUAL_W / 2, 263, '#777777', 12, 'center', 'Rajdhani'
    );
    if (listType === 'linked') {
      r.drawText('⚠ Lista Encadeada: inserção apenas à frente do nó atual.',
        VIRTUAL_W / 2, 283, '#ff8800', 12, 'center', 'Rajdhani');
    }
    r.drawText('↓ posições de inserção', VIRTUAL_W / 2, 314, '#777777', 11, 'center', 'Rajdhani');

    for (const slot of this._slotBtns) {
      const { rect, insertIdx, disabled } = slot;
      const hover   = !disabled && this.input.isHover(rect);
      const isFinal = insertIdx === st.rooms.length;
      const label   = isFinal ? `Após Vagão ${insertIdx}` : `Antes Vagão ${insertIdx + 1}`;

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        disabled ? 'rgba(12,12,22,0.5)' : hover ? 'rgba(20,80,160,0.95)' : 'rgba(20,55,110,0.90)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        disabled ? '#111a2a' : hover ? '#44bbff' : '#2a5a8c', hover ? 2 : 1);

      if (disabled) {
        r.drawText('🔒', rect.x + rect.w / 2, rect.y + 24, '#1a1a3a', 14, 'center', 'Arial');
        r.drawText(label,  rect.x + rect.w / 2, rect.y + 47, '#1a1a3a',  9, 'center', 'Rajdhani');
      } else {
        r.drawText(isFinal ? '⭐' : '+', rect.x + rect.w / 2, rect.y + 26,
          isFinal ? '#ff8800' : '#44bbff', isFinal ? 14 : 20, 'center', 'Arial');
        r.drawText(label, rect.x + rect.w / 2, rect.y + 47,
          hover ? '#44bbff' : '#7ab4d8', 9, 'center', 'Rajdhani');
      }
    }

    if (this._btnBack) {
      const hover = this.input.isHover(this._btnBack);
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', hover, false, '#1a2a3a');
    }
  }

  _renderWagonSelect(r) {
    const st  = this.manager.state;
    const cur = st.currentRoom;

    r.drawText('Qual nó remover da lista? (🔒 = protegido)', VIRTUAL_W / 2, 248, '#44bbff', 16, 'center', 'Rajdhani');

    for (const btn of this._wagonBtns) {
      const { rect, idx, type, disabled } = btn;
      const hover = !disabled && this.input.isHover(rect);
      const isCur = idx === cur;
      const color = COLORS[type] || '#aaa';

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 10,
        disabled ? 'rgba(10,10,20,0.6)'
        : hover  ? 'rgba(20,50,100,0.95)'
        :          'rgba(10,20,50,0.8)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 10,
        disabled ? '#111a2a'
        : hover  ? color
        :          '#1a2a4a',
        hover ? 2 : 1);

      if (disabled) {
        r.drawText('🔒', rect.x + rect.w / 2, rect.y + 30, '#2a2a4a', 20, 'center', 'Arial');
        r.drawText('Protegido', rect.x + rect.w / 2, rect.y + 55, '#2a2a4a', 10, 'center', 'Rajdhani');
      } else {
        r.drawText(ICONS[type] || '?', rect.x + rect.w / 2, rect.y + 32, color, 20, 'center', 'Arial');
        r.drawText(LABELS[type] || type, rect.x + rect.w / 2, rect.y + 56,
          hover ? color : '#446688', 10, 'center', 'Rajdhani');
      }

      r.drawText(`Vagão ${idx + 1}`, rect.x + rect.w / 2, rect.y + 70,
        isCur ? '#44bbff' : '#334466', 9, 'center', 'Rajdhani');

      if (isCur) r.drawText('▲ você', rect.x + rect.w / 2, rect.y + 82, '#44bbff', 9, 'center', 'Rajdhani');
    }

    if (this._btnBack) {
      const hover = this.input.isHover(this._btnBack);
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', hover, false, '#1a2a3a');
    }
  }

  _renderQuestion(r) {
    if (!this._questionLayout) return;
    r.drawOverlay(0.68);

    const { popX: px, popY: py, popW, popH, headerH, questionH } = this._questionLayout;

    // Painel
    r.fillRoundRect(px, py, popW, popH, 14, 'rgba(4,7,18,0.98)');
    r.strokeRoundRect(px, py, popW, popH, 14, '#2266aa', 2);
    r.fillRoundRect(px, py, popW, 4, 4, '#3388cc');

    if (this._questionResult === null) {
      // ── Exibindo pergunta ──────────────────────────────────────────────────
      r.drawText(
        'Prove sua capacitação para realizar a manutenção do trem',
        VIRTUAL_W / 2, py + 26, '#44bbff', 13, 'center', 'Rajdhani'
      );
      r.drawLine(px + 20, py + 38, px + popW - 20, py + 38, '#1a3a5c', 1);

      const opLabel = OP_LABELS[this._questionOp] || this._questionOp;
      r.drawText(`Operação: ${opLabel}`, VIRTUAL_W / 2, py + 56, '#446688', 12, 'center', 'Rajdhani');

      if (this._currentQuestion) {
        r.drawWrappedText(
          this._currentQuestion.text,
          px + 20, py + headerH, popW - 40, 22, '#d0e8ff', 15, 'Rajdhani'
        );
      }

      this._questionBtns.forEach(btn => {
        const hover  = this.input.isHover(btn.rect);
        const { rect } = btn;
        r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
          hover ? 'rgba(20,60,120,0.95)' : 'rgba(8,18,45,0.9)');
        r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
          hover ? '#44bbff' : '#1a3a5c', hover ? 2 : 1);
        r.drawWrappedText(
          String.fromCharCode(65 + btn.index) + ') ' + btn.label,
          rect.x + 10, rect.y + 14, rect.w - 20, 18,
          hover ? '#d0e8ff' : '#8ab4c8', 12, 'Rajdhani'
        );
      });

    } else if (this._questionResult === 'correct') {
      // ── Acertou ───────────────────────────────────────────────────────────
      r.drawTextShadow('✔ Correto!', VIRTUAL_W / 2, py + popH * 0.34, '#44dd88', 28, 'center', 'Rajdhani');
      r.drawText(
        'Você demonstrou conhecimento suficiente para realizar a operação.',
        VIRTUAL_W / 2, py + popH * 0.52, '#8addb8', 14, 'center', 'Rajdhani'
      );

      if (this._btnAnswer) {
        const hover = this.input.isHover(this._btnAnswer);
        r.drawButton(
          this._btnAnswer.x, this._btnAnswer.y,
          this._btnAnswer.w, this._btnAnswer.h,
          'Prosseguir ▶', hover, false, '#1a4a2a'
        );
      }

    } else {
      // ── Errou ─────────────────────────────────────────────────────────────
      r.drawTextShadow('✘ Errado!', VIRTUAL_W / 2, py + popH * 0.22, '#ff4444', 26, 'center', 'Rajdhani');
      r.drawText(
        'Não foi dessa vez, quem sabe na próxima.',
        VIRTUAL_W / 2, py + popH * 0.38, '#cc8888', 15, 'center', 'Rajdhani'
      );

      if (this._currentQuestion) {
        const correctText = this._currentQuestion.options[this._currentQuestion.correct];
        r.fillRoundRect(px + 20, py + popH * 0.47, popW - 40, 2, 1, '#1a2a4a');
        r.drawText('Resposta correta:', px + 26, py + popH * 0.57, '#446688', 13, 'left', 'Rajdhani');
        r.drawWrappedText(correctText, px + 26, py + popH * 0.67, popW - 52, 20, '#44bbff', 13, 'Rajdhani');
      }

      if (this._btnAnswer) {
        const hover = this.input.isHover(this._btnAnswer);
        r.drawButton(
          this._btnAnswer.x, this._btnAnswer.y,
          this._btnAnswer.w, this._btnAnswer.h,
          'Voltar ao Mapa', hover, false, '#4a1a1a'
        );
      }
    }
  }

  // ── Animação Educativa ────────────────────────────────────────────────────────

  _setupAnim(steps, onComplete) {
    this._state          = S.ANIM;
    this._animSteps      = steps.length ? steps : [{ title: '', nodeOrder: [], below: new Set(), fading: new Set(), highlight: new Set(), newNodes: new Set(), arrows: [], backArrows: [], circular: null, circBack: null, nullEnd: false, nullStart: false }];
    this._animStep       = 0;
    this._animOnComplete = onComplete;
    this.input.clearButtons();
    this._btnAnimSkip = { x: 50,              y: VIRTUAL_H - 72, w: 160, h: 46 };
    this._btnAnimNext = { x: VIRTUAL_W - 210, y: VIRTUAL_H - 72, w: 160, h: 46 };
    this.input.addButton(this._btnAnimSkip, () => { this._animOnComplete && this._animOnComplete(); });
    this.input.addButton(this._btnAnimNext, () => this._animNext());
  }

  _animNext() {
    this._animStep++;
    if (this._animStep >= this._animSteps.length) {
      this._animOnComplete && this._animOnComplete();
    }
  }

  // ── Step factory helpers ──────────────────────────────────────────────────────

  _mkStep(title, nodeOrder, opts = {}) {
    return {
      title,
      nodeOrder:  [...nodeOrder],
      below:      new Set(opts.below      || []),
      fading:     new Set(opts.fading     || []),
      highlight:  new Set(opts.highlight  || []),
      newNodes:   new Set(opts.newNodes   || []),
      arrows:     (opts.arrows     || []).map(a => ({ ...a })),
      backArrows: (opts.backArrows || []).map(a => ({ ...a })),
      circular:   opts.circular  || null,
      circBack:   opts.circBack  || null,
      nullEnd:    opts.nullEnd   !== undefined ? opts.nullEnd   : true,
      nullStart:  opts.nullStart || false,
    };
  }

  _ar(from, to, hi = false, isNew = false, label = '') {
    return { from, to, hi, isNew, label };
  }

  _circArc(from, to, hi = false, isNew = false) {
    return { from, to, hi, isNew };
  }

  _linkedArrows(nodeOrder, hiPairs = [], newPairs = []) {
    const hiSet  = new Set(hiPairs.map(p => `${p[0]}|${p[1]}`));
    const newSet = new Set(newPairs.map(p => `${p[0]}|${p[1]}`));
    const arrows = [];
    for (let i = 0; i < nodeOrder.length - 1; i++) {
      const k = `${nodeOrder[i]}|${nodeOrder[i + 1]}`;
      arrows.push(this._ar(nodeOrder[i], nodeOrder[i + 1], hiSet.has(k), newSet.has(k)));
    }
    return arrows;
  }

  _doublyArrows(nodeOrder) {
    const fwd = [], bck = [];
    for (let i = 0; i < nodeOrder.length - 1; i++) {
      fwd.push(this._ar(nodeOrder[i],     nodeOrder[i + 1]));
      bck.push(this._ar(nodeOrder[i + 1], nodeOrder[i]));
    }
    return { fwd, bck };
  }

  // ── Step builders ─────────────────────────────────────────────────────────────

  _buildAnimSteps(operation, listType, n, idx1, idx2 = -1) {
    switch (listType) {
      case 'doubly_linked':    return this._stepsDoubly(operation, n, idx1, idx2);
      case 'circular':         return this._stepsCircular(operation, n, idx1, idx2);
      case 'doubly_circular':  return this._stepsDoublyCircular(operation, n, idx1, idx2);
      default:                 return this._stepsLinked(operation, n, idx1, idx2);
    }
  }

  // ── Singly Linked ─────────────────────────────────────────────────────────────

  _stepsLinked(op, n, idx1, idx2) {
    const nodes = Array.from({ length: n }, (_, i) => `N${i + 1}`);
    if (op === 'add')    return this._stepsLinkedAdd(nodes, idx1);
    if (op === 'remove') return this._stepsLinkedRemove(nodes, idx1);
    return [];
  }

  _stepsLinkedAdd(nodes, idx) {
    const n = nodes.length;
    const NOVO = 'NOVO';
    const prev = idx > 0 ? nodes[idx - 1] : null;
    const next = idx < n ? nodes[idx]     : null;
    const withNovo = [...nodes.slice(0, idx), NOVO, ...nodes.slice(idx)];
    const steps = [];

    steps.push(this._mkStep(`Estado inicial — lista encadeada com ${n} nós`, nodes,
      { arrows: this._linkedArrows(nodes), nullEnd: true }));

    steps.push(this._mkStep(
      prev ? `Percorrer até ${prev} — ponto antes da inserção` : 'Inserção no início da lista',
      nodes, { arrows: this._linkedArrows(nodes), highlight: prev ? [prev] : [nodes[0]], nullEnd: true }));

    const arrs3 = this._linkedArrows(nodes);
    if (next) arrs3.push(this._ar(NOVO, next, true, true, 'next'));
    steps.push(this._mkStep(
      `Criar NOVO e definir NOVO.next → ${next || 'NULL'}`,
      withNovo, { arrows: arrs3, below: [NOVO], newNodes: [NOVO], highlight: [NOVO], nullEnd: true }));

    const arrs4 = this._linkedArrows(nodes).filter(a => !(a.from === prev && a.to === next));
    if (prev) arrs4.push(this._ar(prev, NOVO, true, true, 'next'));
    if (next) arrs4.push(this._ar(NOVO, next, false, true));
    steps.push(this._mkStep(
      prev ? `Atualizar ${prev}.next → NOVO` : 'Atualizar ponteiro de cabeça → NOVO',
      withNovo, { arrows: arrs4, below: [NOVO], newNodes: [NOVO], highlight: prev ? [prev] : [], nullEnd: true }));

    steps.push(this._mkStep(`Resultado final — NOVO inserido na posição ${idx + 1}`, withNovo,
      { arrows: this._linkedArrows(withNovo), newNodes: [NOVO], nullEnd: true }));

    return steps;
  }

  _stepsLinkedRemove(nodes, idx) {
    const n      = nodes.length;
    const target = nodes[idx];
    const prev   = idx > 0     ? nodes[idx - 1] : null;
    const succ   = idx < n - 1 ? nodes[idx + 1] : null;
    const final  = nodes.filter((_, i) => i !== idx);
    const steps  = [];

    steps.push(this._mkStep(`Estado inicial — lista encadeada com ${n} nós`, nodes,
      { arrows: this._linkedArrows(nodes), nullEnd: true }));

    steps.push(this._mkStep(`Identificar ${target} (posição ${idx + 1}) para remoção`, nodes,
      { arrows: this._linkedArrows(nodes), highlight: [target], nullEnd: true }));

    const arrs3 = this._linkedArrows(nodes).map(a =>
      a.from === prev && a.to === target ? { ...a, hi: true } : a);
    steps.push(this._mkStep(
      prev ? `Destacar ${prev}.next → ${target}` : `${target} é a cabeça da lista`,
      nodes, { arrows: arrs3, highlight: [prev || target], fading: [target], nullEnd: true }));

    const arrs4 = this._linkedArrows(nodes)
      .filter(a => !(a.from === prev && a.to === target))
      .concat(prev && succ ? [this._ar(prev, succ, true, true, 'next')] : []);
    steps.push(this._mkStep(
      prev ? `Atualizar ${prev}.next → ${succ || 'NULL'}` : `Cabeça → ${succ || 'NULL'}`,
      nodes, { arrows: arrs4, fading: [target], nullEnd: true }));

    steps.push(this._mkStep(`Resultado final — ${target} removido`, final,
      { arrows: this._linkedArrows(final), nullEnd: true }));

    return steps;
  }

  // ── Circular ──────────────────────────────────────────────────────────────────

  _stepsCircular(op, n, idx1, idx2) {
    const nodes = Array.from({ length: n }, (_, i) => `N${i + 1}`);
    if (op === 'add')    return this._stepsCircularAdd(nodes, idx1);
    if (op === 'remove') return this._stepsCircularRemove(nodes, idx1);
    return [];
  }

  _stepsCircularAdd(nodes, idx) {
    const n     = nodes.length;
    const NOVO  = 'NOVO';
    const first = nodes[0], last = nodes[n - 1];
    const prev  = idx > 0 ? nodes[idx - 1] : last;
    const next  = idx < n ? nodes[idx]     : first;
    const withNovo  = [...nodes.slice(0, idx), NOVO, ...nodes.slice(idx)];
    const newLast   = withNovo[withNovo.length - 1];
    const newFirst  = withNovo[0];
    const steps = [];

    steps.push(this._mkStep(`Estado inicial — lista circular com ${n} nós`, nodes,
      { arrows: this._linkedArrows(nodes), circular: this._circArc(last, first), nullEnd: false }));

    steps.push(this._mkStep(`Localizar ponto de inserção: após ${prev}`, nodes,
      { arrows: this._linkedArrows(nodes), circular: this._circArc(last, first), highlight: [prev], nullEnd: false }));

    const arrs3 = this._linkedArrows(nodes);
    arrs3.push(this._ar(NOVO, next, true, true, 'next'));
    steps.push(this._mkStep(`Criar NOVO e definir NOVO.next → ${next}`, withNovo,
      { arrows: arrs3, circular: this._circArc(newLast, newFirst), below: [NOVO], newNodes: [NOVO], highlight: [NOVO], nullEnd: false }));

    const arrs4 = this._linkedArrows(nodes).filter(a => !(a.from === prev && a.to === next));
    arrs4.push(this._ar(prev, NOVO, true, true, 'next'));
    arrs4.push(this._ar(NOVO, next, false, true));
    steps.push(this._mkStep(`Atualizar ${prev}.next → NOVO`, withNovo,
      { arrows: arrs4, circular: this._circArc(newLast, newFirst, true), below: [NOVO], newNodes: [NOVO], highlight: [prev], nullEnd: false }));

    steps.push(this._mkStep(`Resultado final — NOVO na posição ${idx + 1}, arco circular mantido`, withNovo,
      { arrows: this._linkedArrows(withNovo), circular: this._circArc(newLast, newFirst), newNodes: [NOVO], nullEnd: false }));

    return steps;
  }

  _stepsCircularRemove(nodes, idx) {
    const n      = nodes.length;
    const target = nodes[idx];
    const first  = nodes[0], last = nodes[n - 1];
    const prev   = idx > 0     ? nodes[idx - 1] : last;
    const succ   = idx < n - 1 ? nodes[idx + 1] : first;
    const final  = nodes.filter((_, i) => i !== idx);
    const newLast  = final[final.length - 1];
    const newFirst = final[0];
    const steps = [];

    steps.push(this._mkStep(`Estado inicial — lista circular com ${n} nós`, nodes,
      { arrows: this._linkedArrows(nodes), circular: this._circArc(last, first), nullEnd: false }));

    steps.push(this._mkStep(`Identificar ${target} (posição ${idx + 1}) para remoção`, nodes,
      { arrows: this._linkedArrows(nodes), circular: this._circArc(last, first), highlight: [target], nullEnd: false }));

    const arrs3 = this._linkedArrows(nodes).map(a =>
      a.from === prev && a.to === target ? { ...a, hi: true } : a);
    steps.push(this._mkStep(`Destacar ${prev}.next → ${target}`, nodes,
      { arrows: arrs3, circular: this._circArc(last, first), highlight: [prev], fading: [target], nullEnd: false }));

    const arrs4 = this._linkedArrows(nodes).filter(a => !(a.from === prev && a.to === target));
    arrs4.push(this._ar(prev, succ, true, true, 'next'));
    steps.push(this._mkStep(`Atualizar ${prev}.next → ${succ}`, nodes,
      { arrows: arrs4, circular: this._circArc(newLast, newFirst, true), fading: [target], nullEnd: false }));

    steps.push(this._mkStep(`Resultado final — ${target} removido, arco circular preservado`, final,
      { arrows: this._linkedArrows(final), circular: this._circArc(newLast, newFirst), nullEnd: false }));

    return steps;
  }

  // ── Doubly Linked ─────────────────────────────────────────────────────────────

  _stepsDoubly(op, n, idx1, idx2) {
    const nodes = Array.from({ length: n }, (_, i) => `N${i + 1}`);
    if (op === 'add')    return this._stepsDoublyAdd(nodes, idx1);
    if (op === 'remove') return this._stepsDoublyRemove(nodes, idx1);
    return [];
  }

  _stepsDoublyAdd(nodes, idx) {
    const n    = nodes.length;
    const NOVO = 'NOVO';
    const prev = idx > 0 ? nodes[idx - 1] : null;
    const next = idx < n ? nodes[idx]     : null;
    const withNovo = [...nodes.slice(0, idx), NOVO, ...nodes.slice(idx)];
    const { fwd: f0, bck: b0 } = this._doublyArrows(nodes);
    const steps = [];

    steps.push(this._mkStep(`Estado inicial — lista duplamente encadeada com ${n} nós`, nodes,
      { arrows: f0, backArrows: b0, nullEnd: true, nullStart: true }));

    steps.push(this._mkStep(
      `Identificar ponto de inserção: entre ${prev || 'NULL'} e ${next || 'NULL'}`,
      nodes, { arrows: f0, backArrows: b0,
        highlight: [...(prev ? [prev] : []), ...(next ? [next] : [])],
        nullEnd: true, nullStart: true }));

    // Create NOVO below with its own arrows
    const arrs3fwd = [...f0];
    const arrs3bck = [...b0];
    if (next) arrs3fwd.push(this._ar(NOVO, next, true, true, 'next'));
    if (prev) arrs3bck.push(this._ar(NOVO, prev, true, true, 'prev'));
    steps.push(this._mkStep(
      `Criar NOVO: NOVO.next → ${next || 'NULL'}, NOVO.prev → ${prev || 'NULL'}`,
      withNovo, { arrows: arrs3fwd, backArrows: arrs3bck,
        below: [NOVO], newNodes: [NOVO], highlight: [NOVO], nullEnd: true, nullStart: true }));

    // Update adjacent pointers, remove old prev→next connections
    const arrs4fwd = f0.filter(a => !(a.from === prev && a.to === next))
      .concat(prev ? [this._ar(prev, NOVO, true, true, 'next')] : [])
      .concat(next ? [this._ar(NOVO, next, false, true)] : []);
    const arrs4bck = b0.filter(a => !(a.from === next && a.to === prev))
      .concat(next ? [this._ar(next, NOVO, true, true, 'prev')] : [])
      .concat(prev ? [this._ar(NOVO, prev, false, true)] : []);
    steps.push(this._mkStep(
      `Atualizar: ${prev ? `${prev}.next → NOVO` : 'cabeça → NOVO'}${next ? `, ${next}.prev → NOVO` : ''}`,
      withNovo, { arrows: arrs4fwd, backArrows: arrs4bck,
        below: [NOVO], newNodes: [NOVO],
        highlight: [...(prev ? [prev] : []), ...(next ? [next] : [])],
        nullEnd: true, nullStart: true }));

    const { fwd: fF, bck: bF } = this._doublyArrows(withNovo);
    steps.push(this._mkStep(`Resultado final — NOVO inserido na posição ${idx + 1}`, withNovo,
      { arrows: fF, backArrows: bF, newNodes: [NOVO], nullEnd: true, nullStart: true }));

    return steps;
  }

  _stepsDoublyRemove(nodes, idx) {
    const n      = nodes.length;
    const target = nodes[idx];
    const prev   = idx > 0     ? nodes[idx - 1] : null;
    const succ   = idx < n - 1 ? nodes[idx + 1] : null;
    const final  = nodes.filter((_, i) => i !== idx);
    const { fwd: f0, bck: b0 } = this._doublyArrows(nodes);
    const { fwd: fF, bck: bF } = this._doublyArrows(final);
    const steps = [];

    steps.push(this._mkStep(`Estado inicial — lista duplamente encadeada com ${n} nós`, nodes,
      { arrows: f0, backArrows: b0, nullEnd: true, nullStart: true }));

    steps.push(this._mkStep(`Identificar ${target} (posição ${idx + 1}) para remoção`, nodes,
      { arrows: f0, backArrows: b0, highlight: [target], nullEnd: true, nullStart: true }));

    const arrs3fwd = f0.map(a => a.from === prev && a.to === target ? { ...a, hi: true } : a);
    const arrs3bck = b0.map(a => a.from === succ && a.to === target ? { ...a, hi: true } : a);
    steps.push(this._mkStep(
      `Destacar ponteiros: ${prev || 'NULL'} ↔ ${target} ↔ ${succ || 'NULL'}`,
      nodes, { arrows: arrs3fwd, backArrows: arrs3bck,
        highlight: [target], fading: [target], nullEnd: true, nullStart: true }));

    const arrs4fwd = f0.filter(a => a.from !== target && a.to !== target)
      .concat(prev && succ ? [this._ar(prev, succ, true, true, 'next')] : []);
    const arrs4bck = b0.filter(a => a.from !== target && a.to !== target)
      .concat(succ && prev ? [this._ar(succ, prev, true, true, 'prev')] : []);
    steps.push(this._mkStep(
      `Atualizar: ${prev ? `${prev}.next → ${succ || 'NULL'}` : ''}${succ ? `, ${succ}.prev → ${prev || 'NULL'}` : ''}`,
      nodes, { arrows: arrs4fwd, backArrows: arrs4bck,
        fading: [target], nullEnd: true, nullStart: true }));

    steps.push(this._mkStep(`Resultado final — ${target} removido`, final,
      { arrows: fF, backArrows: bF, nullEnd: true, nullStart: true }));

    return steps;
  }

  // ── Doubly Circular ───────────────────────────────────────────────────────────

  _stepsDoublyCircular(op, n, idx1, idx2) {
    const nodes = Array.from({ length: n }, (_, i) => `N${i + 1}`);
    if (op === 'add')    return this._stepsDoublyCircAdd(nodes, idx1);
    if (op === 'remove') return this._stepsDoublyCircRemove(nodes, idx1);
    return [];
  }

  _stepsDoublyCircAdd(nodes, idx) {
    const n     = nodes.length;
    const NOVO  = 'NOVO';
    const first = nodes[0], last = nodes[n - 1];
    const prev  = idx > 0 ? nodes[idx - 1] : last;
    const next  = idx < n ? nodes[idx]     : first;
    const withNovo = [...nodes.slice(0, idx), NOVO, ...nodes.slice(idx)];
    const newLast  = withNovo[withNovo.length - 1];
    const newFirst = withNovo[0];
    const { fwd: f0, bck: b0 } = this._doublyArrows(nodes);
    const { fwd: fF, bck: bF } = this._doublyArrows(withNovo);
    const steps = [];

    steps.push(this._mkStep(`Estado inicial — lista duplamente circular com ${n} nós`, nodes,
      { arrows: f0, backArrows: b0, circular: this._circArc(last, first), circBack: this._circArc(first, last), nullEnd: false }));

    steps.push(this._mkStep(`Localizar ponto de inserção: entre ${prev} e ${next}`, nodes,
      { arrows: f0, backArrows: b0, circular: this._circArc(last, first), circBack: this._circArc(first, last),
        highlight: [prev, next], nullEnd: false }));

    const arrs3fwd = [...f0, this._ar(NOVO, next, true, true, 'next')];
    const arrs3bck = [...b0, this._ar(NOVO, prev, true, true, 'prev')];
    steps.push(this._mkStep(`Criar NOVO: NOVO.next → ${next}, NOVO.prev → ${prev}`, withNovo,
      { arrows: arrs3fwd, backArrows: arrs3bck,
        circular: this._circArc(newLast, newFirst), circBack: this._circArc(newFirst, newLast),
        below: [NOVO], newNodes: [NOVO], highlight: [NOVO], nullEnd: false }));

    const arrs4fwd = f0.filter(a => !(a.from === prev && a.to === next))
      .concat([this._ar(prev, NOVO, true, true, 'next'), this._ar(NOVO, next, false, true)]);
    const arrs4bck = b0.filter(a => !(a.from === next && a.to === prev))
      .concat([this._ar(next, NOVO, true, true, 'prev'), this._ar(NOVO, prev, false, true)]);
    steps.push(this._mkStep(`Atualizar ${prev}.next → NOVO e ${next}.prev → NOVO`, withNovo,
      { arrows: arrs4fwd, backArrows: arrs4bck,
        circular: this._circArc(newLast, newFirst, true), circBack: this._circArc(newFirst, newLast, true),
        below: [NOVO], newNodes: [NOVO], highlight: [prev, next], nullEnd: false }));

    steps.push(this._mkStep(`Resultado final — NOVO na posição ${idx + 1}, circular bidirecional mantida`, withNovo,
      { arrows: fF, backArrows: bF,
        circular: this._circArc(newLast, newFirst), circBack: this._circArc(newFirst, newLast),
        newNodes: [NOVO], nullEnd: false }));

    return steps;
  }

  _stepsDoublyCircRemove(nodes, idx) {
    const n      = nodes.length;
    const target = nodes[idx];
    const first  = nodes[0], last = nodes[n - 1];
    const prev   = idx > 0     ? nodes[idx - 1] : last;
    const succ   = idx < n - 1 ? nodes[idx + 1] : first;
    const final  = nodes.filter((_, i) => i !== idx);
    const newLast  = final[final.length - 1];
    const newFirst = final[0];
    const { fwd: f0, bck: b0 } = this._doublyArrows(nodes);
    const { fwd: fF, bck: bF } = this._doublyArrows(final);
    const steps = [];

    steps.push(this._mkStep(`Estado inicial — lista duplamente circular com ${n} nós`, nodes,
      { arrows: f0, backArrows: b0, circular: this._circArc(last, first), circBack: this._circArc(first, last), nullEnd: false }));

    steps.push(this._mkStep(`Identificar ${target} (posição ${idx + 1}) para remoção`, nodes,
      { arrows: f0, backArrows: b0, circular: this._circArc(last, first), circBack: this._circArc(first, last),
        highlight: [target], nullEnd: false }));

    const arrs3fwd = f0.map(a => a.from === prev && a.to === target ? { ...a, hi: true } : a);
    const arrs3bck = b0.map(a => a.from === succ && a.to === target ? { ...a, hi: true } : a);
    steps.push(this._mkStep(`Destacar: ${prev}.next → ${target} e ${succ}.prev → ${target}`, nodes,
      { arrows: arrs3fwd, backArrows: arrs3bck,
        circular: this._circArc(last, first), circBack: this._circArc(first, last),
        highlight: [prev, succ], fading: [target], nullEnd: false }));

    const arrs4fwd = f0.filter(a => a.from !== target && a.to !== target)
      .concat([this._ar(prev, succ, true, true, 'next')]);
    const arrs4bck = b0.filter(a => a.from !== target && a.to !== target)
      .concat([this._ar(succ, prev, true, true, 'prev')]);
    steps.push(this._mkStep(`Atualizar ${prev}.next → ${succ} e ${succ}.prev → ${prev}`, nodes,
      { arrows: arrs4fwd, backArrows: arrs4bck,
        circular: this._circArc(newLast, newFirst, true), circBack: this._circArc(newFirst, newLast, true),
        fading: [target], nullEnd: false }));

    steps.push(this._mkStep(`Resultado final — ${target} removido, circular bidirecional preservada`, final,
      { arrows: fF, backArrows: bF,
        circular: this._circArc(newLast, newFirst), circBack: this._circArc(newFirst, newLast),
        nullEnd: false }));

    return steps;
  }

  // ── Renderização da animação ──────────────────────────────────────────────────

  _getAnimLayout(n) {
    const nodeW   = 72, nodeH = 46;
    const maxSp   = 136, minSp = nodeW + 22;
    const avail   = VIRTUAL_W - 120;
    const spacing = n > 1
      ? Math.max(minSp, Math.min(maxSp, Math.floor(avail / (n - 1))))
      : maxSp;
    const totalW  = Math.max(nodeW, (n - 1) * spacing + nodeW);
    const startX  = (VIRTUAL_W - totalW) / 2;
    return { nodeW, nodeH, spacing, startX, rowY: 340 };
  }

  _renderAnim(r) {
    if (!this._animSteps.length) return;
    const step   = this._animSteps[Math.min(this._animStep, this._animSteps.length - 1)];
    const isLast = this._animStep >= this._animSteps.length - 1;

    // Panel
    r.fillRoundRect(40, 84, VIRTUAL_W - 80, 486, 12, 'rgba(4,8,20,0.88)');
    r.strokeRoundRect(40, 84, VIRTUAL_W - 80, 486, 12, '#1a3a5c', 1);

    // Header
    const st       = this.manager.state;
    const listType = st.phase ? st.phase.listType : 'linked';
    const listLabel = {
      linked:          'Lista Encadeada (Singly Linked)',
      circular:        'Lista Circular (Circular Linked)',
      doubly_linked:   'Lista Duplamente Encadeada (Doubly Linked)',
      doubly_circular: 'Lista Duplamente Encadeada Circular (Doubly Circular)',
    }[listType] || listType;
    r.drawText(`📊  ${listLabel}`, VIRTUAL_W / 2, 110, '#44bbff', 14, 'center', 'Rajdhani');
    r.drawLine(60, 122, VIRTUAL_W - 60, 122, '#1a3a5c', 1);
    r.drawText(`Passo ${this._animStep + 1} / ${this._animSteps.length}`,
      VIRTUAL_W - 60, 110, '#446688', 12, 'right', 'Rajdhani');

    // Step description box
    r.fillRoundRect(60, 542, VIRTUAL_W - 120, 54, 8, 'rgba(6,14,38,0.92)');
    r.strokeRoundRect(60, 542, VIRTUAL_W - 120, 54, 8, '#223366', 1);
    r.drawWrappedText(step.title, 80, 561, VIRTUAL_W - 160, 20, '#c8deff', 13, 'Rajdhani');

    // Compute layout
    const doubly  = listType === 'doubly_linked' || listType === 'doubly_circular';
    const rowNodes = step.nodeOrder.filter(id => !step.below.has(id));
    const layout   = this._getAnimLayout(rowNodes.length);

    // Node positions
    const pos = {};
    let ri = 0;
    for (const id of step.nodeOrder) {
      if (step.below.has(id)) {
        const beforeCount = step.nodeOrder.slice(0, step.nodeOrder.indexOf(id))
          .filter(x => !step.below.has(x)).length;
        const cx = rowNodes.length > 0
          ? layout.startX + Math.max(0, beforeCount - 0.5) * layout.spacing + layout.nodeW / 2
          : VIRTUAL_W / 2;
        pos[id] = { x: cx - layout.nodeW / 2, y: layout.rowY + 100 - layout.nodeH / 2, cx, cy: layout.rowY + 100 };
      } else {
        const cx = layout.startX + ri * layout.spacing + layout.nodeW / 2;
        pos[id] = { x: cx - layout.nodeW / 2, y: layout.rowY - layout.nodeH / 2, cx, cy: layout.rowY };
        ri++;
      }
    }

    const yFwd  = doubly ?  11 : 0;
    const yBck  = doubly ? -11 : 0;
    const half  = layout.nodeW / 2;

    // ── Forward arrows ──
    for (const a of step.arrows) {
      const f = pos[a.from], t = pos[a.to];
      if (!f || !t) continue;
      const fading = step.fading.has(a.from) || step.fading.has(a.to);
      const color  = fading ? '#1a3040'
        : a.hi   ? (a.isNew ? '#44dd88' : '#44bbff')
        : '#2d5a8a';
      this._drawAnimArrow(r, f.cx + half - 3, f.cy + yFwd, t.cx - half + 3, t.cy + yFwd,
        color, a.hi ? 2.5 : 1.5, doubly ? 'next' : '');
    }

    // ── Back arrows ──
    for (const a of step.backArrows) {
      const f = pos[a.from], t = pos[a.to];
      if (!f || !t) continue;
      const color = a.hi ? (a.isNew ? '#44dd88' : '#ff8844') : '#663320';
      this._drawAnimArrow(r, f.cx - half + 3, f.cy + yBck, t.cx + half - 3, t.cy + yBck,
        color, a.hi ? 2 : 1.2, 'prev');
    }

    // ── Circular forward arc (last → first, curves below) ──
    if (step.circular) {
      const f = pos[step.circular.from], t = pos[step.circular.to];
      if (f && t) {
        const color = step.circular.hi ? '#44bbff' : step.circular.isNew ? '#44dd88' : '#2d5a8a';
        this._drawCurvedArrow(r,
          f.cx + half - 3, f.cy + yFwd,
          t.cx - half + 3, t.cy + yFwd,
          layout.rowY + layout.nodeH / 2 + 140,
          color, doubly ? 2 : 1.5, doubly ? 'next' : '');
      }
    }

    // ── Circular back arc (first → last, curves above) ──
    if (step.circBack) {
      const f = pos[step.circBack.from], t = pos[step.circBack.to];
      if (f && t) {
        const color = step.circBack.hi ? '#ff8844' : '#663320';
        this._drawCurvedArrow(r,
          f.cx - half + 3, f.cy + yBck,
          t.cx + half - 3, t.cy + yBck,
          layout.rowY - layout.nodeH / 2 - 110,
          color, 1.2, 'prev');
      }
    }

    // ── NULL end ──
    if (step.nullEnd && rowNodes.length > 0) {
      const lp = pos[rowNodes[rowNodes.length - 1]];
      if (lp) {
        const nx = lp.cx + half + 2, ny = lp.cy + yFwd;
        this._drawAnimArrow(r, nx, ny, nx + 44, ny, '#2d4455', 1.2, '');
        r.drawText('NULL', nx + 48, ny + 5, '#2d4455', 10, 'left', 'Rajdhani');
      }
    }

    // ── NULL start (doubly) ──
    if (step.nullStart && rowNodes.length > 0) {
      const fp = pos[rowNodes[0]];
      if (fp) {
        const nx = fp.cx - half - 2, ny = fp.cy + yBck;
        this._drawAnimArrow(r, nx - 44, ny, nx, ny, '#552d20', 1.2, '');
        r.drawText('NULL', nx - 48, ny + 5, '#552d20', 10, 'right', 'Rajdhani');
      }
    }

    // ── Nodes (drawn over arrows) ──
    for (const id of step.nodeOrder) {
      const p = pos[id];
      if (!p) continue;
      const isHi     = step.highlight.has(id);
      const isNew    = step.newNodes.has(id);
      const isFading = step.fading.has(id);
      const alpha    = isFading ? 0.22 : 1;

      const fillCol   = isNew ? 'rgba(18,72,36,0.92)' : isHi ? 'rgba(8,44,96,0.94)' : 'rgba(6,14,46,0.90)';
      const borderCol = isNew ? '#44dd88' : isHi ? '#44bbff' : '#1c3060';
      const textCol   = isNew ? '#44dd88' : isHi ? '#88ddff' : '#8aacde';

      r.fillRoundRect(p.x, p.y, layout.nodeW, layout.nodeH, 8, fillCol, alpha);
      r.strokeRoundRect(p.x, p.y, layout.nodeW, layout.nodeH, 8, borderCol, isHi || isNew ? 2 : 1.5);
      if (isHi || isNew) {
        const pulse = 0.3 + 0.7 * (0.55 + 0.45 * Math.sin(this._anim * 4));
        r.strokeRoundRect(p.x - 3, p.y - 3, layout.nodeW + 6, layout.nodeH + 6, 10,
          `rgba(${isNew ? '68,221,136' : '68,187,255'},${pulse.toFixed(2)})`, 1.5);
      }
      r.drawText(id, p.cx, p.cy + 6, textCol, 13, 'center', 'Rajdhani');
    }

    // ── Buttons ──
    if (this._btnAnimSkip) {
      const hover = this.input.isHover(this._btnAnimSkip);
      r.drawButton(this._btnAnimSkip.x, this._btnAnimSkip.y,
        this._btnAnimSkip.w, this._btnAnimSkip.h, 'Pular ▶▶', hover, false, '#1a2a3a');
    }
    if (this._btnAnimNext) {
      const hover = this.input.isHover(this._btnAnimNext);
      r.drawButton(this._btnAnimNext.x, this._btnAnimNext.y,
        this._btnAnimNext.w, this._btnAnimNext.h,
        isLast ? 'Concluir ✔' : 'Próximo ▶', hover, false, isLast ? '#1a4a2a' : '#1a3a6a');
    }
  }

  _drawAnimArrow(r, x1, y1, x2, y2, color, lw, label = '') {
    const ctx   = r.ctx;
    const sx1   = r.vx(x1), sy1 = r.vy(y1), sx2 = r.vx(x2), sy2 = r.vy(y2);
    const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
    const ahLen = r.vw(8), ahAng = 0.38;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = r.vw(lw);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx2, sy2);
    ctx.lineTo(sx2 - ahLen * Math.cos(angle - ahAng), sy2 - ahLen * Math.sin(angle - ahAng));
    ctx.lineTo(sx2 - ahLen * Math.cos(angle + ahAng), sy2 - ahLen * Math.sin(angle + ahAng));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (label) {
      r.drawText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 10, color, 9, 'center', 'Rajdhani');
    }
  }

  _drawCurvedArrow(r, x1, y1, x2, y2, ctrlY, color, lw, label = '') {
    const ctx  = r.ctx;
    const sx1  = r.vx(x1), sy1 = r.vy(y1), sx2 = r.vx(x2), sy2 = r.vy(y2);
    const scx  = r.vx((x1 + x2) / 2), scy = r.vy(ctrlY);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = r.vw(lw);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.quadraticCurveTo(scx, scy, sx2, sy2);
    ctx.stroke();

    // Arrowhead using tangent at t=0.97
    const t  = 0.97;
    const tx = 2 * (1 - t) * (scx - sx1) + 2 * t * (sx2 - scx);
    const ty = 2 * (1 - t) * (scy - sy1) + 2 * t * (sy2 - scy);
    const angle = Math.atan2(ty, tx);
    const ahLen = r.vw(8), ahAng = 0.38;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx2, sy2);
    ctx.lineTo(sx2 - ahLen * Math.cos(angle - ahAng), sy2 - ahLen * Math.sin(angle - ahAng));
    ctx.lineTo(sx2 - ahLen * Math.cos(angle + ahAng), sy2 - ahLen * Math.sin(angle + ahAng));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (label) {
      r.drawText(label, (x1 + x2) / 2, ctrlY + (ctrlY > y1 ? 14 : -6), color, 9, 'center', 'Rajdhani');
    }
  }

  _renderError(r) {
    r.drawOverlay(0.76);

    const pw = 580, ph = 190;
    const px = (VIRTUAL_W - pw) / 2;
    const py = VIRTUAL_H / 2 - ph / 2;

    r.fillRoundRect(px, py, pw, ph, 14, 'rgba(5,0,12,0.98)');
    r.strokeRoundRect(px, py, pw, ph, 14, '#882222', 2);
    r.fillRoundRect(px, py, pw, 4, 4, '#aa2222');

    r.drawTextShadow('⛔ Operação Bloqueada', VIRTUAL_W / 2, py + 46, '#ff4444', 20, 'center', 'Rajdhani');
    r.drawWrappedText(this._errorMsg, px + 24, py + 74, pw - 48, 24, '#cc8888', 15, 'Rajdhani');

    if (this._btnOk) {
      const hover = this.input.isHover(this._btnOk);
      r.drawButton(this._btnOk.x, this._btnOk.y, this._btnOk.w, this._btnOk.h,
        'OK', hover, false, '#4a1a1a');
    }
  }
}

export default MaintenanceScene;
