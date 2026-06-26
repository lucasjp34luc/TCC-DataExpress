/**
 * @file PvpBattleScene.js
 * @description Cena de batalha PvP: dois jogadores respondem a mesma pergunta
 * simultaneamente. O servidor controla o fluxo de perguntas e calcula dano.
 *
 * Fluxo de estados:
 *   QUESTION -> WAITING_OPPONENT -> ROUND_RESULT (2.5s auto) -> QUESTION
 *   QUESTION -> WAITING_OPPONENT -> ROUND_RESULT             -> GAME_OVER -> pvpResult
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { CHARACTERS }           from '../data/characters.js';
import { getPvpNetwork }        from '../core/PvpNetworkManager.js';

const STATE = {
  QUESTION:          'question',
  WAITING_OPPONENT:  'waiting_opponent',
  ROUND_RESULT:      'round_result',
  GAME_OVER:         'game_over'
};

export class PvpBattleScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._state          = STATE.QUESTION;
    this._question       = null;
    this._questionLayout = null;
    this._answerBtns     = [];
    this._roundResult    = null;
    this._gameOverData   = null;
    this._anim           = 0;
    this._resultTimer    = 0;
    this._floatDmg       = [];
    this._p1Spr          = 'idle';
    this._p2Spr          = 'idle';
    this._animTimer      = 0;
    this._btnContinue    = null;
    this._localAnswered  = false;
  }

  enter() {
    this._state        = STATE.QUESTION;
    this._question     = null;
    this._roundResult  = null;
    this._gameOverData = null;
    this._anim         = 0;
    this._floatDmg     = [];
    this._p1Spr        = 'idle';
    this._p2Spr        = 'idle';
    this._localAnswered = false;

    const pvp = this.manager.state.pvp;
    pvp.questionsCorrect = 0;
    pvp.questionsWrong   = 0;
    pvp.totalQuestions   = 0;

    this.input.clearButtons();

    const net = getPvpNetwork();
    net.clearHandlers();

    net.on('question', (msg) => {
      pvp.totalQuestions++;
      this._question      = msg.question;
      this._localAnswered = false;
      this._state         = STATE.QUESTION;
      this._p1Spr         = 'idle';
      this._p2Spr         = 'idle';
      this._setupAnswerButtons();
    });

    net.on('round_result', (msg) => {
      this._roundResult = msg;
      pvp.p1Hp = msg.p1Hp;
      pvp.p2Hp = msg.p2Hp;

      const isP1 = pvp.role === 'p1';
      const myCorrect = isP1 ? msg.p1Correct : msg.p2Correct;
      if (myCorrect) pvp.questionsCorrect++;
      else           pvp.questionsWrong++;

      // Animacoes de sprites
      this._p1Spr = msg.p1Correct ? 'attack' : (msg.p2Dmg > 0 ? 'hurt' : 'idle');
      this._p2Spr = msg.p2Correct ? 'attack' : (msg.p1Dmg > 0 ? 'hurt' : 'idle');

      // Dano flutuante: p1 ataca p2 (direita), p2 ataca p1 (esquerda)
      if (msg.p1Dmg > 0) {
        const label = msg.p1Crit ? `-${msg.p1Dmg}!` : `-${msg.p1Dmg}`;
        this._addFloatDmg(label, VIRTUAL_W * 0.72, 200, msg.p1Crit ? '#ffcc00' : '#ff4444');
      }
      if (msg.p2Dmg > 0) {
        const label = msg.p2Crit ? `-${msg.p2Dmg}!` : `-${msg.p2Dmg}`;
        this._addFloatDmg(label, VIRTUAL_W * 0.28, 200, msg.p2Crit ? '#ffcc00' : '#ff4444');
      }

      this._resultTimer = 0;
      this._state       = STATE.ROUND_RESULT;
      this.input.clearButtons();
      this._answerBtns  = [];
    });

    net.on('game_over', (msg) => {
      this._gameOverData = msg;
      this._state        = STATE.GAME_OVER;
      this.input.clearButtons();
      this._answerBtns  = [];
      // Aguarda um breve momento para o round_result ser visto antes de ir para o resultado
      setTimeout(() => this._goToResult(), 1500);
    });

    net.on('opponent_disconnected', () => {
      this._gameOverData = { result: 'win', disconnected: true, stats: null };
      this._state        = STATE.GAME_OVER;
      this.input.clearButtons();
      setTimeout(() => this._goToResult(), 1500);
    });
  }

  exit() {
    this.input.clearButtons();
    this._answerBtns  = [];
    this._btnContinue = null;
    getPvpNetwork().clearHandlers();
  }

  // ─── Logica de resposta ──────────────────────────────────────────────────

  _computeQuestionLayout(question, visibleOptions) {
    const popW    = 700;
    const PAD     = 20;
    const FONT    = 17;
    const LINE    = 24;
    const headerH = 28;

    const textW  = popW - PAD * 2;
    const cpl    = Math.max(1, Math.floor(textW / (FONT * 0.54)));
    const qLines = Math.max(1, Math.ceil(question.text.length / cpl));
    const questionH = qLines * LINE + 12;

    const n    = visibleOptions.length;
    const cols = n <= 2 ? n : 2;
    const rows = Math.ceil(n / cols);
    const gapX = 12, gapY = 12;
    const btnW = cols <= 1 ? textW : (textW - gapX) / 2;
    const btnH = 50;
    const optH = rows * (btnH + gapY) - gapY;

    const popH  = headerH + questionH + 14 + optH + 20;
    const popX  = (VIRTUAL_W - popW) / 2;
    const popY  = Math.max(80, Math.min(VIRTUAL_H - popH - 15, (VIRTUAL_H - popH) / 2 + 50));

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

    return { popX, popY, popW, popH, btns };
  }

  _setupAnswerButtons() {
    this.input.clearButtons();
    this._answerBtns     = [];
    this._questionLayout = null;

    if (!this._question) return;

    const pvp  = this.manager.state.pvp;
    const char = pvp.character;

    // Passiva Estudioso: oculta 2 alternativas erradas
    let hiddenIndices = new Set();
    if (char && char.passive.id === 'olho_critico') {
      const correct   = this._question.correct;
      const wrongIdxs = this._question.options.map((_, i) => i).filter(i => i !== correct);
      for (let i = wrongIdxs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wrongIdxs[i], wrongIdxs[j]] = [wrongIdxs[j], wrongIdxs[i]];
      }
      hiddenIndices = new Set(wrongIdxs.slice(0, 2));
    }

    const visibleOptions = this._question.options
      .map((opt, i) => ({ opt, i }))
      .filter(({ i }) => !hiddenIndices.has(i));

    this._questionLayout = this._computeQuestionLayout(this._question, visibleOptions);

    this._questionLayout.btns.forEach(btn => {
      this._answerBtns.push(btn);
      this.input.addButton(btn.rect, () => this._answer(btn.index));
    });
  }

  _answer(idx) {
    if (this._state !== STATE.QUESTION || this._localAnswered) return;
    this._localAnswered = true;

    getPvpNetwork().send({ type: 'answer', answerIndex: idx });

    // Marca qual opcao o jogador clicou (para highlight)
    this._localChoice = idx;

    // Passa para estado de espera
    this._state = STATE.WAITING_OPPONENT;
    this.input.clearButtons();
    this._answerBtns = [];
  }

  _addFloatDmg(text, x, y, color) {
    this._floatDmg.push({ text, x, y, t: 0, color });
  }

  _goToResult() {
    const pvp = this.manager.state.pvp;
    if (this._gameOverData) {
      pvp.result    = this._gameOverData.result;
      pvp.endStats  = this._gameOverData.stats;
      pvp.disconnected = this._gameOverData.disconnected || false;
    }
    this.manager.goto('pvpResult');
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(dt) {
    this._anim      += dt;
    this._animTimer += dt;

    this._floatDmg = this._floatDmg.filter(fd => {
      fd.t += dt;
      fd.y -= dt * 55;
      return fd.t < 1.6;
    });

    if (this._state === STATE.ROUND_RESULT) {
      this._resultTimer += dt;
      // Apos 2.5s, volta para estado de espera de pergunta (servidor envia a proxima)
      if (this._resultTimer > 2.5) {
        this._state       = STATE.WAITING_OPPONENT;
        this._roundResult = null;
        this._p1Spr       = 'idle';
        this._p2Spr       = 'idle';
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  render(r) {
    const pvp    = this.manager.state.pvp;
    const isP1   = pvp.role === 'p1';
    const myChar = pvp.character;
    const oppChr = pvp.opponentCharacter || CHARACTERS.find(c => c.id === pvp.opponentCharacterId);

    // Fundo
    const bgImg = this.assets.get('assets/image/Cenario/Cabine_Lacaio/Cabine_Sem_Acentos.png');
    if (bgImg) r.drawImage(bgImg, 0, 0, VIRTUAL_W, VIRTUAL_H);
    else r.drawGradientBg('#060c1a', '#101c30');

    r.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H, 'rgba(0,0,10,0.4)');

    // ── HUD ──────────────────────────────────────────────────────────────
    const p1Hp    = pvp.p1Hp;
    const p1MaxHp = pvp.p1MaxHp;
    const p2Hp    = pvp.p2Hp;
    const p2MaxHp = pvp.p2MaxHp;

    const p1Name   = isP1 ? `${pvp.playerName} (Voce)` : pvp.opponentName;
    const p2Name   = isP1 ? pvp.opponentName : `${pvp.playerName} (Voce)`;
    const p1Char   = isP1 ? myChar : oppChr;
    const p2Char   = isP1 ? oppChr : myChar;
    const p1Color  = p1Char ? p1Char.color : '#5ab4ff';
    const p2Color  = p2Char ? p2Char.color : '#ff5a5a';

    // Barra HP P1 (esquerda)
    r.fillRoundRect(20, 20, 280, 65, 8, 'rgba(5,10,25,0.9)');
    r.strokeRoundRect(20, 20, 280, 65, 8, isP1 ? '#5ab4ff' : '#3a5a7c', 1);
    r.drawText(p1Name, 40, 42, p1Color, 14, 'left', 'Rajdhani');
    r.drawProgressBar(40, 50, 230, 14, p1Hp, p1MaxHp, '#44dd44', '#222', `${p1Hp}/${p1MaxHp}`);

    // Barra HP P2 (direita)
    r.fillRoundRect(VIRTUAL_W - 300, 20, 280, 65, 8, 'rgba(5,10,25,0.9)');
    r.strokeRoundRect(VIRTUAL_W - 300, 20, 280, 65, 8, !isP1 ? '#5ab4ff' : '#7c3a3a', 1);
    r.drawText(p2Name, VIRTUAL_W - 280, 42, p2Color, 14, 'left', 'Rajdhani');
    r.drawProgressBar(VIRTUAL_W - 280, 50, 230, 14, p2Hp, p2MaxHp, '#dd4444', '#222', `${p2Hp}/${p2MaxHp}`);

    // Fase no topo central
    if (pvp.phase) {
      r.drawText(pvp.phase.name, VIRTUAL_W / 2, 35, '#446688', 13, 'center', 'Rajdhani');
    }

    // ── Sprites ──────────────────────────────────────────────────────────
    const p1SprPath = p1Char ? (p1Char.sprites[this._p1Spr] || p1Char.sprites.idle) : null;
    const p2SprPath = p2Char ? (p2Char.sprites[this._p2Spr] || p2Char.sprites.idle) : null;
    const p1SprImg  = p1SprPath ? this.assets.get(p1SprPath) : null;
    const p2SprImg  = p2SprPath ? this.assets.get(p2SprPath) : null;

    const py = 0.6 * (0.5 + 0.5 * Math.sin(this._anim * 1.2));

    // P1 - esquerda
    if (p1SprImg) {
      const shakeX = this._p1Spr === 'hurt' ? (Math.random() - 0.5) * 6 : 0;
      r.drawImage(p1SprImg, -90 + shakeX, 265 + py, 480, 408);
    }

    // P2 - direita, espelhado horizontalmente, mesma posicao do inimigo basico
    if (p2SprImg) {
      const shakeX = this._p2Spr === 'hurt' ? (Math.random() - 0.5) * 6 : 0;
      const x = VIRTUAL_W - 310 + shakeX;
      const y = 228;
      const w = 360;
      const h = 456;
      r.ctx.save();
      r.ctx.scale(-1, 1);
      r.ctx.drawImage(p2SprImg, -(x + w) * r.scale, y * r.scale, w * r.scale, h * r.scale);
      r.ctx.restore();
    }

    // ── Dano flutuante ───────────────────────────────────────────────────
    for (const fd of this._floatDmg) {
      const alpha = Math.max(0, 1 - fd.t / 1.6);
      const prev  = r.ctx.globalAlpha;
      r.ctx.globalAlpha = alpha;
      r.drawTextShadow(fd.text, fd.x, fd.y, fd.color, 26, 'center', 'Rajdhani');
      r.ctx.globalAlpha = prev;
    }

    // ── Conteudo por estado ───────────────────────────────────────────────
    if (this._state === STATE.QUESTION) {
      this._renderQuestionPopup(r);
    } else if (this._state === STATE.WAITING_OPPONENT) {
      this._renderWaiting(r);
    } else if (this._state === STATE.ROUND_RESULT) {
      this._renderRoundResult(r, pvp);
    } else if (this._state === STATE.GAME_OVER) {
      this._renderGameOverOverlay(r);
    }
  }

  _renderQuestionPopup(r) {
    if (!this._question || !this._questionLayout) return;

    const { popX, popY, popW, popH } = this._questionLayout;

    r.fillRoundRect(popX, popY, popW, popH, 12, 'rgba(5,12,30,0.97)');
    r.strokeRoundRect(popX, popY, popW, popH, 12, '#2a5a9c', 2);
    r.fillRoundRect(popX, popY, popW, 4, 4, '#2a6aaa');

    r.drawWrappedText(this._question.text, popX + 20, popY + 28, popW - 40, 24, '#d0e8ff', 17, 'Rajdhani');

    this._answerBtns.forEach(btn => {
      const hover = this.input.isHover(btn.rect);
      const { rect } = btn;
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        hover ? 'rgba(30,70,130,0.95)' : 'rgba(12,25,60,0.9)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        hover ? '#5ab4ff' : '#1a3a6a', hover ? 2 : 1);
      r.drawWrappedText(
        String.fromCharCode(65 + btn.index) + ') ' + btn.label,
        rect.x + 10, rect.y + 14, rect.w - 20, 18,
        hover ? '#d0e8ff' : '#9ab4cc', 13, 'Rajdhani'
      );
    });
  }

  _renderWaiting(r) {
    const popW = 500, popH = 80;
    const popX = (VIRTUAL_W - popW) / 2;
    const popY = VIRTUAL_H / 2 - popH / 2 + 60;

    r.fillRoundRect(popX, popY, popW, popH, 10, 'rgba(5,12,30,0.95)');
    r.strokeRoundRect(popX, popY, popW, popH, 10, '#2a5a9c', 1);

    const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
    r.drawText(`Aguardando adversario${dots}`, VIRTUAL_W / 2, popY + popH / 2 + 8,
      '#8ab4d4', 18, 'center', 'Rajdhani');
  }

  _renderRoundResult(r, pvp) {
    const isP1 = pvp.role === 'p1';
    const res  = this._roundResult;
    if (!res) return;

    const myCorrect  = isP1 ? res.p1Correct : res.p2Correct;
    const oppCorrect = isP1 ? res.p2Correct : res.p1Correct;
    const myDmgDealt = isP1 ? res.p1Dmg     : res.p2Dmg;
    const myDmgRecv  = isP1 ? res.p2Dmg     : res.p1Dmg;

    const popW = 660, popH = 260;
    const popX = (VIRTUAL_W - popW) / 2;
    const popY = VIRTUAL_H / 2 - popH / 2 + 40;

    r.fillRoundRect(popX, popY, popW, popH, 12, 'rgba(5,12,30,0.97)');
    r.strokeRoundRect(popX, popY, popW, popH, 12, '#2a5a9c', 2);

    // Resultado local
    r.drawTextShadow(
      myCorrect ? 'Voce acertou!' : 'Voce errou...',
      VIRTUAL_W / 2, popY + 40,
      myCorrect ? '#44dd88' : '#ff4444', 22, 'center', 'Rajdhani'
    );

    // Adversario
    r.drawText(
      oppCorrect ? 'Adversario acertou' : 'Adversario errou',
      VIRTUAL_W / 2, popY + 68,
      oppCorrect ? '#ff8888' : '#88dd88', 15, 'center', 'Rajdhani'
    );

    // Resposta correta
    const correctText = this._question ? this._question.options[res.correctAnswer] : '';
    r.drawText('Resposta correta:', VIRTUAL_W / 2, popY + 95, '#8ab4cc', 13, 'center', 'Rajdhani');
    r.drawWrappedText(correctText, popX + 30, popY + 112, popW - 60, 20, '#44dd88', 14, 'Rajdhani');

    // Danos
    if (myDmgDealt > 0) r.drawText(`Voce causou: -${myDmgDealt} HP`, VIRTUAL_W / 2 - 20, popY + 155, '#ffcc44', 14, 'right', 'Rajdhani');
    if (myDmgRecv  > 0) r.drawText(`Recebeu: -${myDmgRecv} HP`,       VIRTUAL_W / 2 + 20, popY + 155, '#ff6666', 14, 'left',  'Rajdhani');

    // HP bars
    r.drawProgressBar(popX + 40, popY + 178, (popW - 100) / 2, 14, pvp.p1Hp, pvp.p1MaxHp, '#44dd44', '#222', `P1: ${pvp.p1Hp}`);
    r.drawProgressBar(popX + popW / 2 + 10, popY + 178, (popW - 100) / 2, 14, pvp.p2Hp, pvp.p2MaxHp, '#dd4444', '#222', `P2: ${pvp.p2Hp}`);

    // Contagem regressiva
    const remaining = Math.max(0, 2.5 - this._resultTimer);
    r.drawText(`Proxima pergunta em ${Math.ceil(remaining)}s`, VIRTUAL_W / 2, popY + popH - 18, '#3a6a9c', 13, 'center', 'Rajdhani');
  }

  _renderGameOverOverlay(r) {
    r.drawOverlay(0.75);

    const isDisconnect = this._gameOverData && this._gameOverData.disconnected;
    const result       = this._gameOverData ? this._gameOverData.result : 'draw';

    const colorMap = { win: '#44dd88', lose: '#ff4444', draw: '#ffcc44' };
    const msgMap   = {
      win:  isDisconnect ? 'Adversario saiu — Vitoria!' : 'Voce Venceu!',
      lose: 'Voce Perdeu...',
      draw: 'Empate!'
    };
    const color = colorMap[result] || '#fff';
    const msg   = msgMap[result]   || 'Fim de Partida';

    const popW = 500, popH = 160;
    const popX = (VIRTUAL_W - popW) / 2;
    const popY = VIRTUAL_H / 2 - popH / 2;

    r.fillRoundRect(popX, popY, popW, popH, 14, 'rgba(5,10,25,0.97)');
    r.strokeRoundRect(popX, popY, popW, popH, 14, color, 3);

    r.drawTextShadow(msg, VIRTUAL_W / 2, popY + 65, color, 32, 'center', 'Rajdhani');
    r.drawText('Indo para o resultado...', VIRTUAL_W / 2, popY + 110, '#5a8aaa', 14, 'center', 'Rajdhani');
  }
}

export default PvpBattleScene;
