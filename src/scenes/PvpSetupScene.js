/**
 * @file PvpSetupScene.js
 * @description Fluxo de configuracao do Modo PvP:
 *   CHAR_SELECT -> ROOM_CHOICE
 *     -> CREATE_PHASE -> WAITING (codigo da sala)
 *     -> JOIN_INPUT   -> CONNECTING -> (game_start => pvpBattle)
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { CHARACTERS }           from '../data/characters.js';
import { PHASES }               from '../data/questions.js';
import { getPvpNetwork }        from '../core/PvpNetworkManager.js';

const LIST_META = {
  linked:          { arrow: '→',    label: 'só avançar',      icon: '▶' },
  circular:        { arrow: '↻',    label: 'ciclo infinito',   icon: '↻' },
  doubly_linked:   { arrow: '← →',   label: 'avançar e voltar', icon: '◀▶' },
  doubly_circular: { arrow: '← → + ↺',   label: 'bidirecional + ciclo', icon: '◀▶ + ↺' }
};

const S = {
  CHAR_SELECT:   'char_select',
  ROOM_CHOICE:   'room_choice',
  CREATE_PHASE:  'create_phase',
  WAITING:       'waiting',
  JOIN_INPUT:    'join_input',
  CONNECTING:    'connecting'
};

export class PvpSetupScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._state        = S.CHAR_SELECT;
    this._nameText     = '';
    this._codeText     = '';
    this._selectedChar = null;
    this._roomCode     = '';
    this._errorMsg     = '';
    this._anim         = 0;
    this._cursorBlink  = 0;
    this._buttons      = [];
    this._btnConfirm   = null;
    this._btnBack      = null;
    this._btnSettings  = null;

    this._keyHandler = (e) => this._onKey(e);
    this._serverIp   = '';
  }

  enter(params = {}) {
    if (!params.resume) {
      this._state        = S.CHAR_SELECT;
      this._nameText     = this.manager.state.currentUser?.username || '';
      this._codeText     = '';
      this._selectedChar = null;
      this._roomCode     = '';
      this._errorMsg     = '';
      this._anim         = 0;
    }

    document.addEventListener('keydown', this._keyHandler);
    this._setupButtons();

    if (!params.resume) {
      // Busca o IP real do servidor para exibir o link correto na rede local
      fetch(`https://${window.location.hostname}:3000/server-ip`)
        .then(r => r.json())
        .then(d => { this._serverIp = d.ip; })
        .catch(() => {});
    }

    // Conecta ao servidor e registra handlers globais desta cena
    const net = getPvpNetwork();
    net.clearHandlers();

    if (!params.resume) {
      net.connect().catch(() => {
        this._errorMsg = 'Nao foi possivel conectar ao servidor PvP (wss://localhost:3000). Verifique se o servidor esta rodando.';
      });
    }

    net.on('room_created', (msg) => {
      this._roomCode = msg.code;
      this._state    = S.WAITING;
      this._setupButtons();
    });

    net.on('game_start', (msg) => {
      this._storeAndStart(msg);
    });

    net.on('error', (msg) => {
      this._errorMsg = msg.message;
      if (this._state === S.CONNECTING) {
        this._state = S.JOIN_INPUT;
        this._setupButtons();
      }
    });

    net.on('_disconnect', () => {
      this._errorMsg = 'Conexao com o servidor perdida.';
    });
  }

  exit() {
    document.removeEventListener('keydown', this._keyHandler);
    this.input.clearButtons();
    this._buttons    = [];
    this._btnConfirm = null;
    this._btnBack    = null;
    getPvpNetwork().clearHandlers();
  }

  // ─── Input de teclado ────────────────────────────────────────────────────

  _onKey(e) {
    if (this._state !== S.JOIN_INPUT) return;

    if (e.key === 'Backspace') {
      this._codeText = this._codeText.slice(0, -1);
      this._errorMsg = '';
      return;
    }

    if (e.key === 'Enter') {
      this._submitJoinCode();
      return;
    }

    if (e.key.length === 1 && this._codeText.length < 6) {
      const ch = e.key.toUpperCase();
      if (/[A-Z0-9]/.test(ch)) {
        this._codeText += ch;
        this._errorMsg  = '';
      }
    }
  }

  // ─── Transicoes de estado ────────────────────────────────────────────────

  _confirmChar() {
    if (!this._selectedChar) return;
    this._state = S.ROOM_CHOICE;
    this._setupButtons();
  }

  _goCreateRoom() {
    this._state = S.CREATE_PHASE;
    this._setupButtons();
  }

  _goJoinRoom() {
    this._codeText = '';
    this._state    = S.JOIN_INPUT;
    this._setupButtons();
  }

  _selectPhase(phase) {
    const net = getPvpNetwork();
    net.send({
      type:        'create_room',
      playerName:  this._nameText.trim(),
      characterId: this._selectedChar.id,
      phase: {
        id:        phase.id,
        name:      phase.name,
        color:     phase.color,
        listType:  phase.listType,
        questions: phase.questions
      }
    });
    // A resposta 'room_created' vai para o handler registrado no enter()
    // Enquanto aguarda, mostra WAITING antecipadamente com espinner
    this._state = S.WAITING;
    this._setupButtons();
  }

  _submitJoinCode() {
    const code = this._codeText.trim();
    if (code.length !== 6) {
      this._errorMsg = 'O codigo deve ter exatamente 6 caracteres.';
      return;
    }
    this._roomCode = code;
    const net = getPvpNetwork();
    net.send({
      type:        'join_room',
      code,
      playerName:  this._nameText.trim(),
      characterId: this._selectedChar.id
    });
    this._state = S.CONNECTING;
    this._setupButtons();
  }

  _storeAndStart(msg) {
    const st  = this.manager.state;
    const opp = CHARACTERS.find(c => c.id === msg.opponent.characterId) || null;

    st.pvp = {
      playerName:          this._nameText.trim(),
      character:           this._selectedChar,
      opponentName:        msg.opponent.name,
      opponentCharacterId: msg.opponent.characterId,
      opponentCharacter:   opp,
      role:                msg.role,   // 'p1' | 'p2'
      phase:               msg.phase,
      roomCode:            this._roomCode || this._codeText,
      p1Hp:                msg.p1.hp,
      p1MaxHp:             msg.p1.maxHp,
      p2Hp:                msg.p2.hp,
      p2MaxHp:             msg.p2.maxHp,
      questionsCorrect:    0,
      questionsWrong:      0,
      totalQuestions:      0
    };
    this.manager.goto('pvpBattle');
  }

  _goBack() {
    this._errorMsg = '';
    const prev = {
      [S.CHAR_SELECT]:  () => this.manager.goto('modeSelect'),
      [S.ROOM_CHOICE]:  () => { this._state = S.CHAR_SELECT;  this._setupButtons(); },
      [S.CREATE_PHASE]: () => { this._state = S.ROOM_CHOICE;  this._setupButtons(); },
      [S.JOIN_INPUT]:   () => { this._state = S.ROOM_CHOICE;  this._setupButtons(); },
      [S.WAITING]:      () => { this._roomCode = ''; this._state = S.ROOM_CHOICE; this._setupButtons(); }
    };
    if (prev[this._state]) prev[this._state]();
  }

  // ─── Setup de botoes ──────────────────────────────────────────────────────

  _setupButtons() {
    this.input.clearButtons();
    this._buttons    = [];
    this._btnConfirm = null;
    this._btnBack    = null;
    this._btnSettings = null;

    // Botao voltar (exceto CONNECTING)
    if (this._state !== S.CONNECTING) {
      this._btnBack = { x: 50, y: 35, w: 150, h: 46 };
      this.input.addButton(this._btnBack, () => this._goBack());
    }

    // Botão configurações (canto superior direito, exceto CHAR_SELECT)
    if (this._state !== S.CHAR_SELECT) {
      const gearSize = 44;
      this._btnSettings = { x: VIRTUAL_W - gearSize - 50, y: 35, w: gearSize, h: gearSize };
      this.input.addButton(this._btnSettings, () => this.manager.goto('settings', { from: 'pvpSetup' }));
    }

    if (this._state === S.CHAR_SELECT) {
      this._buildCharButtons();
      this._btnConfirm = { x: VIRTUAL_W - 230, y: 35, w: 180, h: 46 };
      this.input.addButton(this._btnConfirm, () => this._confirmChar());

    } else if (this._state === S.ROOM_CHOICE) {
      const bW = 260, bH = 80;
      const bY = VIRTUAL_H / 2 - bH / 2;
      const bCreate = { x: VIRTUAL_W / 2 - bW - 20, y: bY, w: bW, h: bH };
      const bJoin   = { x: VIRTUAL_W / 2 + 20,       y: bY, w: bW, h: bH };
      this._buttons.push({ rect: bCreate, label: 'Criar Sala',    color: '#1a4a2a' });
      this._buttons.push({ rect: bJoin,   label: 'Entrar na Sala', color: '#3a1a5a' });
      this.input.addButton(bCreate, () => this._goCreateRoom());
      this.input.addButton(bJoin,   () => this._goJoinRoom());

    } else if (this._state === S.CREATE_PHASE) {
      this._buildPhaseButtons();

    } else if (this._state === S.JOIN_INPUT) {
      this._btnConfirm = { x: VIRTUAL_W / 2 - 100, y: VIRTUAL_H / 2 + 100, w: 200, h: 50 };
      this.input.addButton(this._btnConfirm, () => this._submitJoinCode());
    }
    // WAITING e CONNECTING nao tem botoes interativos (apenas animacao)
  }

  _buildCharButtons() {
    const cardW  = Math.floor(VIRTUAL_W * 0.22);
    const cardH  = Math.floor(VIRTUAL_H * 0.58);
    const gap    = Math.floor(VIRTUAL_W * 0.065);
    const totalW = CHARACTERS.length * cardW + (CHARACTERS.length - 1) * gap;
    const startX = (VIRTUAL_W - totalW) / 2;
    const cardY  = Math.floor(VIRTUAL_H * 0.17);

    CHARACTERS.forEach((char, i) => {
      const bx   = startX + i * (cardW + gap);
      const rect = { x: bx, y: cardY, w: cardW, h: cardH };
      this._buttons.push({ rect, char });
      this.input.addButton(rect, () => { this._selectedChar = char; });
    });
  }

  _buildPhaseButtons() {
    const n      = PHASES.length;
    const cols   = n > 4 ? 3 : 2;
    const cardW  = cols > 2 ? Math.floor(VIRTUAL_W * 0.28) : Math.floor(VIRTUAL_W * 0.38);
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
      const rect = {
        x: startX + col * (cardW + gapX) + rowOffset,
        y: startY + row * (cardH + gapY),
        w: cardW, h: cardH
      };
      this._buttons.push({ rect, phase });
      this.input.addButton(rect, () => this._selectPhase(phase));
    });
  }

  // ─── Update / Render ──────────────────────────────────────────────────────

  update(dt) {
    this._anim        += dt;
    this._cursorBlink += dt;
  }

  render(r) {
    r.drawGradientBg('#060a18', '#0c1428');

    const TITLES = {
      [S.CHAR_SELECT]:  'MODO PvP — PERSONAGEM',
      [S.ROOM_CHOICE]:  'MODO PvP — SALA',
      [S.CREATE_PHASE]: 'MODO PvP — SELECIONE A FASE',
      [S.WAITING]:      'MODO PvP — AGUARDANDO ADVERSARIO',
      [S.JOIN_INPUT]:   'MODO PvP — CODIGO DA SALA',
      [S.CONNECTING]:   'MODO PvP — CONECTANDO...'
    };
    r.drawTextShadow(TITLES[this._state] || 'MODO PvP', VIRTUAL_W / 2, 50, '#5ab4ff', 26, 'center', 'Rajdhani');

    // Mensagem de erro
    if (this._errorMsg) {
      r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(80,0,0,0.8)');
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#ff8888', 14, 'center', 'Rajdhani');
    }

    // Botao voltar
    if (this._btnBack) {
      const hover = this.input.isHover(this._btnBack);
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h, '◀ Voltar', hover, false, '#1a2a3a');
    }

    // Botão configurações
    if (this._btnSettings) {
      const { x, y, w, h } = this._btnSettings;
      const hover = this.input.isHover(this._btnSettings);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(30,70,140,0.95)' : 'rgba(10,25,60,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#5ab4ff' : '#1a4a8c', hover ? 2 : 1);
      r.drawText('⚙', x + w / 2, y + h / 2 + 8, hover ? '#5ab4ff' : '#3a6a9c', 24, 'center', 'sans-serif');
    }

    // Conteudo por estado
    if (this._state === S.CHAR_SELECT)  this._renderCharSelect(r);
    if (this._state === S.ROOM_CHOICE)  this._renderRoomChoice(r);
    if (this._state === S.CREATE_PHASE) this._renderPhaseSelect(r);
    if (this._state === S.WAITING)      this._renderWaiting(r);
    if (this._state === S.JOIN_INPUT)   this._renderJoinInput(r);
    if (this._state === S.CONNECTING)   this._renderConnecting(r);
  }

  _renderCharSelect(r) {
    r.drawText(`Jogador: ${this._nameText}`, VIRTUAL_W / 2, 92, '#7a9aaa', 15, 'center', 'Rajdhani');
    r.drawLine(50, 108, VIRTUAL_W - 50, 108, '#1a3a5c', 1);

    for (const btn of this._buttons) {
      if (!btn.char) continue;
      const { rect, char } = btn;
      const isSelected = this._selectedChar && this._selectedChar.id === char.id;
      const hover      = this.input.isHover(rect);

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        isSelected ? 'rgba(30,70,130,0.95)' : hover ? 'rgba(20,45,90,0.9)' : 'rgba(10,20,45,0.85)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        isSelected ? char.color : hover ? '#2a5a9c' : '#1a3060', isSelected ? 3 : 2);

      const spr  = this.assets.get(char.sprites.idle);
      const sprH = Math.floor(rect.h * 0.46);
      const sprY = isSelected ? -3 * Math.sin(this._anim * 2) : 0;
      if (spr) r.drawImage(spr, rect.x + 30, rect.y + 15 + sprY, rect.w - 60, sprH);

      const nameY = rect.y + sprH + 30;
      r.drawTextShadow(char.name, rect.x + rect.w / 2, nameY, char.color, 22, 'center', 'Rajdhani');

      const sy = nameY + 28;
      r.drawText(`HP: ${char.hp}`,  rect.x + 20, sy,      '#ff6666', 14, 'left', 'Rajdhani');
      r.drawText(`ATK: ${char.atk}`, rect.x + 20, sy + 22, '#ffcc44', 14, 'left', 'Rajdhani');

      const passY = sy + 50;
      const passH = rect.y + rect.h - passY - 8;
      r.fillRoundRect(rect.x + 10, passY, rect.w - 20, passH, 6, 'rgba(0,0,0,0.4)');
      r.drawText(`${char.passive.name}`, rect.x + 20, passY + 18, char.color, 13, 'left', 'Rajdhani');
      r.drawWrappedText(char.passive.pvpDescription || char.passive.description, rect.x + 20, passY + 36, rect.w - 40, 18, '#8ab4c8', 11, 'Rajdhani');

      if (isSelected) {
        r.drawText('SELECIONADO', rect.x + rect.w / 2, rect.y + rect.h + 18, char.color, 13, 'center', 'Rajdhani');
      }
    }

    if (this._btnConfirm) {
      const hover = this.input.isHover(this._btnConfirm);
      r.drawButton(this._btnConfirm.x, this._btnConfirm.y, this._btnConfirm.w, this._btnConfirm.h,
        'Confirmar ▶', hover, !this._selectedChar, '#1a4a2a');
    }
  }

  _renderRoomChoice(r) {
    r.drawLine(50, 108, VIRTUAL_W - 50, 108, '#1a3a5c', 1);
    r.drawText('Como deseja jogar?', VIRTUAL_W / 2, VIRTUAL_H / 2 - 90, '#d0e8ff', 24, 'center', 'Rajdhani');

    for (const btn of this._buttons) {
      if (!btn.label) continue;
      const { rect, label, color } = btn;
      const hover = this.input.isHover(rect);
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        hover ? 'rgba(40,80,60,0.98)' : 'rgba(10,25,18,0.9)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        hover ? '#44dd88' : color, hover ? 3 : 2);
      r.drawText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 8, hover ? '#d0ffd0' : '#8ab4a8', 20, 'center', 'Rajdhani');
    }
  }

  _renderPhaseSelect(r) {
    r.drawText('Escolha a fase que sera jogada:', VIRTUAL_W / 2, 95, '#8ab4d4', 16, 'center', 'Rajdhani');
    r.drawLine(50, 112, VIRTUAL_W - 50, 112, '#1a3a5c', 1);

    for (const btn of this._buttons) {
      if (!btn.phase) continue;
      const { rect, phase } = btn;
      const hover = this.input.isHover(rect);
      const meta  = LIST_META[phase.listType] || LIST_META.linked;

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        hover ? 'rgba(30,60,120,0.95)' : 'rgba(12,22,50,0.92)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        hover ? phase.color : '#1a3060', hover ? 3 : 2);

      r.fillRoundRect(rect.x, rect.y + 12, 6, rect.h - 24, 3, phase.color);

      r.ctx.globalAlpha = 0.07;
      r.drawText(meta.icon, rect.x + rect.w - 30, rect.y + rect.h / 2 + 18, phase.color, 64, 'right', 'Arial');
      r.ctx.globalAlpha = 1;

      r.drawTextShadow(phase.name, rect.x + 22, rect.y + 44, phase.color, 20, 'left', 'Rajdhani');
      r.drawWrappedText(phase.description, rect.x + 22, rect.y + 68, rect.w - 44, 20, '#8ab4c8', 13, 'Rajdhani');

      const badgeX = rect.x + 22;
      const badgeY = rect.y + rect.h - 38;
      r.fillRoundRect(badgeX, badgeY, rect.w - 44, 26, 5, 'rgba(0,0,0,0.45)');
      r.strokeRoundRect(badgeX, badgeY, rect.w - 44, 26, 5, phase.color + '55', 1);
      r.drawText(`${meta.arrow}  ${meta.label}`,
        badgeX + (rect.w - 44) / 2, badgeY + 17,
        hover ? phase.color : '#5a8aaa', 12, 'center', 'Rajdhani');
      r.drawText(`${phase.questions.length} perguntas`,
        rect.x + rect.w - 16, rect.y + 18, '#334466', 11, 'right', 'Rajdhani');
    }
  }

  _renderWaiting(r) {
    r.drawText('Sala criada! Compartilhe com seu adversario:', VIRTUAL_W / 2, VIRTUAL_H / 2 - 140, '#8ab4d4', 17, 'center', 'Rajdhani');

    // Link que o adversario deve abrir (substitui localhost pelo IP real da rede)
    const host    = this._serverIp || window.location.hostname;
    const gameUrl = window.location.origin.replace(window.location.hostname, host) + window.location.pathname;
    const urlW = 700, urlH = 44;
    const urlX = VIRTUAL_W / 2 - urlW / 2;
    const urlY = VIRTUAL_H / 2 - 110;
    r.fillRoundRect(urlX, urlY, urlW, urlH, 8, 'rgba(5,20,40,0.95)');
    r.strokeRoundRect(urlX, urlY, urlW, urlH, 8, '#2a6aaa', 1);
    r.drawText('Link:', urlX + 16, urlY + urlH / 2 + 6, '#4a8aaa', 13, 'left', 'Rajdhani');
    r.drawText(gameUrl, urlX + urlW / 2 + 20, urlY + urlH / 2 + 6, '#88ccff', 14, 'center', 'Rajdhani');

    // Codigo da sala
    r.drawText('Codigo da sala:', VIRTUAL_W / 2, VIRTUAL_H / 2 - 28, '#8ab4d4', 14, 'center', 'Rajdhani');
    const cW = 380, cH = 88;
    const cX = VIRTUAL_W / 2 - cW / 2;
    const cY = VIRTUAL_H / 2 - 10;
    r.fillRoundRect(cX, cY, cW, cH, 14, 'rgba(5,20,55,0.97)');
    r.strokeRoundRect(cX, cY, cW, cH, 14, '#5ab4ff', 3);

    const displayCode = this._roomCode || '......';
    r.drawTextShadow(displayCode, VIRTUAL_W / 2, cY + cH / 2 + 20, '#5ab4ff', 48, 'center', 'Rajdhani');

    const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
    r.drawText(`Aguardando adversario${dots}`, VIRTUAL_W / 2, cY + cH + 28, '#7a9aaa', 17, 'center', 'Rajdhani');
  }

  _renderJoinInput(r) {
    r.drawLine(50, 108, VIRTUAL_W - 50, 108, '#1a3a5c', 1);
    r.drawText('Digite o codigo de 6 letras/numeros:', VIRTUAL_W / 2, VIRTUAL_H / 2 - 90, '#8ab4d4', 18, 'center', 'Rajdhani');

    const bW = 380, bH = 70;
    const bX = VIRTUAL_W / 2 - bW / 2;
    const bY = VIRTUAL_H / 2 - bH / 2;
    r.fillRoundRect(bX, bY, bW, bH, 10, 'rgba(5,12,30,0.95)');
    r.strokeRoundRect(bX, bY, bW, bH, 10, '#2a6aaa', 2);

    const cursor = Math.floor(this._cursorBlink * 2) % 2 === 0 ? '|' : '';
    r.drawText(this._codeText + cursor, VIRTUAL_W / 2, bY + bH / 2 + 11, '#d0e8ff', 32, 'center', 'Rajdhani');

    r.drawText('(apenas letras e numeros, sem espacos)', VIRTUAL_W / 2, bY + bH + 20, '#2a4a5a', 12, 'center', 'Rajdhani');

    if (this._btnConfirm) {
      const hover = this.input.isHover(this._btnConfirm);
      r.drawButton(this._btnConfirm.x, this._btnConfirm.y, this._btnConfirm.w, this._btnConfirm.h,
        'Entrar >', hover, this._codeText.trim().length === 0, '#3a1a5a');
    }
  }

  _renderConnecting(r) {
    const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
    r.drawText(`Entrando na sala${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2, '#8ab4d4', 24, 'center', 'Rajdhani');
    r.drawText('Aguarde a conexao com o adversario', VIRTUAL_W / 2, VIRTUAL_H / 2 + 40, '#3a6a8a', 15, 'center', 'Rajdhani');
  }
}

export default PvpSetupScene;
