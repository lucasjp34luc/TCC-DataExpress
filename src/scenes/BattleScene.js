/**
 * @file BattleScene.js
 * @description Cena de batalha por turnos baseada em perguntas.
 * Fluxo: Pergunta → Resposta → Animações → Turno inimigo → Próxima pergunta
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

// ─── Dados de inimigos ───────────────────────────────────────────────────────
const ENEMIES = {
  enemy: {
    name:    'Invasor',
    hp:      60,
    atk:     15,
    gold:    [20, 25],
    sprites: {
      idle:   'assets/image/Inimigos/Lacaios/Inimigo fraco/Sem Fundo/Batalha/Inimigo_Fraco_Batalha.png',
      attack: 'assets/image/Inimigos/Lacaios/Inimigo fraco/Sem Fundo/Atacando/Inimigo_Fraco_Atacando.png',
      hurt:   'assets/image/Inimigos/Lacaios/Inimigo fraco/Sem Fundo/Sofrendo Dano/Inimigo_Fraco_Sofrendo_Dano.png'
    },
    bg: 'assets/image/Cenario/Cabine_Lacaio/Cabine_Sem_Acentos.png'
  },
  mimic_enemy: {
    name:    'Mímico Furioso',
    hp:      60,
    atk:     20,
    gold:    [0, 0],
    sprites: {
      idle:   'assets/image/Inimigos/Mimico/Sem Fundo/Batalha/Mimico_Batalha.png',
      attack: 'assets/image/Inimigos/Mimico/Sem Fundo/Atacando/Mimico_Atacando.png',
      hurt:   'assets/image/Inimigos/Mimico/Sem Fundo/Sofrendo Dano/Mimico_Sofrendo_Dano.png'
    },
    bg: 'assets/image/Cenario/Cabine_Mimico/Cabine_Mimico.png'
  },
  boss: {
    name:    'Chefe Armadura',
    hp:      100,
    atk:     25,
    gold:    [80, 80],
    sprites: {
      idle:   'assets/image/Inimigos/Boss/Armadura/Sem Fundo/Batalha/BossArmadura_Batalha.png',
      attack: 'assets/image/Inimigos/Boss/Armadura/Sem Fundo/Atacando/BossArmadura_Atacando.png',
      hurt:   'assets/image/Inimigos/Boss/Armadura/Sem Fundo/Sofrendo Dano/BossArmadura_Sofrendo_Dano.png'
    },
    bg: 'assets/image/Cenario/Cabine_Boss/Cabine_Chefe.png'
  }
};

// Estados da batalha
const STATE = {
  QUESTION:      'question',
  PLAYER_ATTACK: 'player_attack',
  ENEMY_ATTACK:  'enemy_attack',
  RESULT:        'result',
  WIN:           'win',
  LOSE:          'lose'
};

export class BattleScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._state       = STATE.QUESTION;
    this._enemy       = null;
    this._enemyHp     = 0;
    this._question    = null;
    this._usedQs      = new Set();
    this._answerBtns  = [];
    this._timer       = 0;
    this._animTimer   = 0;
    this._resultMsg   = '';
    this._resultColor = '#fff';
    this._isCrit      = false;
    this._dmgDealt    = 0;
    this._dmgTaken    = 0;
    this._shakeX      = 0;
    this._playerSpr   = 'idle';
    this._enemySpr    = 'idle';
    this._anim        = 0;
    this._floatDmg    = []; // [{text, x, y, t, color}]
    this._btnContinue    = null;
    this._isBoss         = false;
    this._enemyOffsetX   = 0;
    this._playerOffsetX  = 0;
    this._questionLayout = null;
  }

  enter() {
    const st   = this.manager.state;
    const type = st.rooms[st.currentRoom]; // 'enemy', 'mimic_enemy', ou 'boss'
    this._isBoss      = type === 'boss';
    this._isMimicEnemy = type === 'mimic_enemy';

    const base  = ENEMIES[type] || ENEMIES.enemy;
    const scale = st.enemyScale || 1.0;
    this._enemy   = { ...base, hp: Math.round(base.hp * scale), atk: Math.round(base.atk * scale) };
    this._enemyHp = this._enemy.hp;
    this._state   = STATE.QUESTION;
    this._usedQs  = new Set();
    this._floatDmg = [];
    this._playerSpr = 'idle';
    this._enemySpr  = 'idle';
    this._anim = 0;
    this._enemyOffsetX  = 0;
    this._playerOffsetX = 0;

    this._nextQuestion();
    this._setupAnswerButtons();
  }

  exit() {
    this.input.clearButtons();
    this._answerBtns  = [];
    this._btnContinue = null;
  }

  // ─── Questões ────────────────────────────────────────────────────────────

  _nextQuestion() {
    const questions = this.manager.state.phase.questions;
    const available = questions.filter((_, i) => !this._usedQs.has(i));
    const pool      = available.length > 0 ? available : questions; // recicla se esgotado

    const idx = questions.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    this._usedQs.add(idx);
    this._question = questions[idx];
    this._state    = STATE.QUESTION;
    this._setupAnswerButtons();
  }

  _computeQuestionLayout(question, visibleOptions) {
    const popW    = 700;
    const PAD     = 20;
    const FONT    = 17;
    const LINE    = 24;
    const headerH = 28; // espaço antes do texto da pergunta (barra decorativa + offset)

    // Estima linhas da pergunta
    const textW  = popW - PAD * 2;
    const cpl    = Math.max(1, Math.floor(textW / (FONT * 0.54)));
    const qLines = Math.max(1, Math.ceil(question.text.length / cpl));
    const questionH = qLines * LINE + 12;

    // Botões de alternativas
    const n    = visibleOptions.length;
    const cols = n <= 2 ? n : 2;
    const rows = Math.ceil(n / cols);
    const gapX = 12, gapY = 12;
    const btnW = cols <= 1 ? textW : (textW - gapX) / 2;
    const btnH = 50;
    const optH = rows * (btnH + gapY) - gapY;

    const popH  = headerH + questionH + 14 + optH + 20;
    const popX  = (VIRTUAL_W - popW) / 2;
    const popY  = Math.max(80, Math.min(VIRTUAL_H - popH - 15,
                    (VIRTUAL_H - popH) / 2 + 50));

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
    this._btnContinue    = null;
    this._questionLayout = null;

    if (!this._question) return;

    // Passiva Estudioso: oculta 2 alternativas erradas aleatórias
    const char = this.manager?.state?.player?.character;
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
    if (this._state !== STATE.QUESTION) return;

    const correct  = this._question.correct;
    const isRight  = idx === correct;
    const st       = this.manager.state;
    const player   = st.player;
    const char     = player.character;

    if (isRight) st.questionsCorrect++;
    else         st.questionsWrong++;

    if (!st.runQuestions) st.runQuestions = [];
    st.runQuestions.push({
      text:    this._question.text,
      options: [...this._question.options],
      correct: this._question.correct,
      chosen:  idx
    });

    this._lastCorrect = correct;
    this._lastChosen  = idx;

    if (isRight) {
      // Jogador ataca o inimigo
      let dmg = Math.round(player.atk);

      // Passiva Assassino: crítico 15% de chance
      this._isCrit = false;
      if (char.passive.id === 'golpe_critico' && Math.random() < 0.15) {
        dmg = Math.round(dmg * 1.8);
        this._isCrit = true;
      }

      // Passiva Assassino: bônus de ATK progressivo
      if (char.passive.id === 'golpe_critico') {
        st.player.atkBonusPct = Math.min((st.player.atkBonusPct || 0) + 0.025, 0.25);
        player.atk = Math.round(player.baseAtk * (1 + st.player.atkBonusPct));
      }

      this._dmgDealt = dmg;
      this._dmgTaken = 0;
      this._enemyHp  = Math.max(0, this._enemyHp - dmg);

      this._resultMsg   = this._isCrit ? '💥 CRÍTICO! ✔ Resposta correta!' : '✔ Resposta correta!';
      this._resultColor = '#44dd88';

      // Animação: jogador ataca
      this._playerSpr = 'attack';
      this._enemySpr  = 'hurt';
      this._animTimer = 0;
      this._state     = STATE.PLAYER_ATTACK;

      this._addFloatDmg(`-${dmg}${this._isCrit ? '!' : ''}`, VIRTUAL_W * 0.72, 280, this._isCrit ? '#ffcc00' : '#ff4444');
    } else {
      // Inimigo ataca o jogador
      // Passiva Assassino: reseta bônus de ATK
      if (char.passive.id === 'golpe_critico') {
        st.player.atkBonusPct = 0;
        player.atk = Math.round(player.baseAtk);
      }

      this._isCrit   = false;
      this._dmgDealt = 0;
      this._enemyTurn(); // define _dmgTaken e aplica dano no player

      this._resultMsg   = '✘ Resposta errada...';
      this._resultColor = '#ff4444';

      // Animação: inimigo ataca
      this._enemySpr  = 'attack';
      this._playerSpr = 'hurt';
      this._animTimer = 0;
      this._state     = STATE.ENEMY_ATTACK;
    }

    this.input.clearButtons();
  }

  _enemyTurn() {
    const player = this.manager.state.player;
    const atk    = this._enemy.atk;
    player.hp    = Math.max(0, player.hp - atk);
    this._dmgTaken = atk;
    this._addFloatDmg(`-${atk}`, VIRTUAL_W * 0.28, 280, '#ff6666');
  }

  _addFloatDmg(text, x, y, color) {
    this._floatDmg.push({ text, x, y, t: 0, color });
  }

  update(dt) {
    this._anim    += dt;
    this._animTimer += dt;

    // Atualiza dano flutuante
    this._floatDmg = this._floatDmg.filter(fd => {
      fd.t += dt;
      fd.y -= dt * 60;
      return fd.t < 1.5;
    });

    const player = this.manager.state.player;

    switch (this._state) {
      case STATE.PLAYER_ATTACK: {
        const attackChar = this.manager.state.player.character;
        if (this._playerSpr === 'attack' && attackChar.id !== 'estudioso') {
          // Arco suave: avança em direção ao inimigo e volta
          this._playerOffsetX = 600 * Math.sin(Math.PI * Math.min(this._animTimer / 0.8, 1.0));
        }
        if (this._animTimer > 0.8) {
          this._playerOffsetX = 0;
          this._playerSpr = 'idle';
          this._enemySpr  = 'idle';
          if (this._enemyHp <= 0) {
            this._state = STATE.WIN;
            this._setupContinueButton('Continuar');
          } else {
            // Acerto não gera contra-ataque; mostra resultado
            this._state     = STATE.RESULT;
            this._animTimer = 0;
            this._setupContinueButton('Próxima Pergunta');
          }
        }
        break;
      }

      case STATE.ENEMY_ATTACK:
        if (this._enemySpr === 'attack') {
          // Arco suave: avança até o meio e volta ao final (igual ao Mímico)
          this._enemyOffsetX = -600 * Math.sin(Math.PI * Math.min(this._animTimer, 1.0));
        }
        if (this._animTimer > 1.0) {
          this._enemyOffsetX = 0;
          this._enemySpr  = 'idle';
          this._playerSpr = 'idle';
          if (player.hp <= 0) {
            this._state = STATE.LOSE;
            this._setupContinueButton('Tentar Novamente');
          } else {
            // Erro: inimigo atacou; mostra resultado antes da próxima pergunta
            this._state     = STATE.RESULT;
            this._animTimer = 0;
            this._setupContinueButton('Próxima Pergunta');
          }
        }
        break;

      case STATE.RESULT:
        // Espera o jogador clicar
        break;
    }
  }

  _setupContinueButton(label) {
    this.input.clearButtons();
    this._answerBtns  = [];
    this._btnContinue = { x: VIRTUAL_W / 2 - 120, y: VIRTUAL_H - 85, w: 240, h: 50 };
    this.input.addButton(this._btnContinue, () => this._onContinue());
    this._continueLbl = label;
  }

  _onContinue() {
    const st = this.manager.state;
    if (this._state === STATE.WIN) {
      // Concede ouro
      const [minG, maxG] = this._enemy.gold;
      const earned = minG + Math.floor(Math.random() * (maxG - minG));
      st.gold += earned;
      st.totalEnemiesDefeated++;
      if (this._isBoss)            st.bossesDefeated++;
      else if (this._isMimicEnemy) st.mimicsFought++;

      if (this._isBoss) {
        // Boss derrotado → marca estado e volta ao mapa (player escolhe encerrar ou continuar)
        st.bossDefeated = true;
        st.canFinish    = true;
        st.clearedRooms = st.clearedRooms || new Set();
        st.clearedRooms.add(st.currentRoom);
        // Se há mais vagões após este boss (ex: boss extra adicionado pelo maintenance),
        // avança currentRoom para que o próximo fique acessível em listas lineares.
        const listType = st.phase ? st.phase.listType : 'linked';
        if (st.currentRoom < st.rooms.length - 1 &&
            (listType === 'linked' || listType === 'doubly_linked')) {
          st.currentRoom++;
          st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
        }
        this.manager.goto('map');
      } else {
        // Avança sala conforme o listType
        const listType = st.phase ? st.phase.listType : 'linked';
        st.clearedRooms = st.clearedRooms || new Set();
        st.clearedRooms.add(st.currentRoom);
        // Restaura tipo original para não quebrar o mapa (mimic_enemy → mimic)
        if (st.rooms[st.currentRoom] === 'mimic_enemy') {
          st.rooms[st.currentRoom] = 'mimic';
        }

        if (listType === 'circular' || listType === 'doubly_circular') {
          st.currentRoom = (st.currentRoom + 1) % st.rooms.length;
          if (listType === 'doubly_circular') {
            st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
          }
        } else {
          // linked ou doubly_linked: avança e atualiza maxRoom
          st.currentRoom++;
          st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
        }
        this.manager.goto('map');
      }
    } else if (this._state === STATE.LOSE) {
      // Salva derrota no servidor antes de resetar o estado
      const user = this.manager.state.currentUser;
      const st   = this.manager.state;
      if (user && st.phase) {
        const total = (st.questionsCorrect || 0) + (st.questionsWrong || 0);
        fetch(`https://${window.location.hostname}:3000/player/result`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            userId:           user.userId,
            phaseId:          st.phase.id,
            phaseName:        st.phase.name,
            won:              false,
            questionsCorrect: st.questionsCorrect || 0,
            totalAnswers:     total,
            runQuestions:     st.runQuestions    || []
          })
        })
          .then(r => r.json())
          .then(data => { if (data.success) user.profile = data.profile; })
          .catch(() => {});
      }
      this.manager.resetState();
      this.manager.goto('phaseSelect');
    } else if (this._state === STATE.RESULT) {
      this._nextQuestion();
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  render(r) {
    const st     = this.manager.state;
    const player = st.player;
    const char   = player.character;

    // Fundo do cenário
    const bgPath = this._enemy.bg;
    const bgImg  = this.assets.get(bgPath);
    if (bgImg) r.drawImage(bgImg, 0, 0, VIRTUAL_W, VIRTUAL_H);
    else r.drawGradientBg('#060c1a', '#101c30');

    // Overlay suave
    r.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H, 'rgba(0,0,10,0.35)');

    // ── HUD ──────────────────────────────────────────────────────────────
    this._renderHUD(r, player, char);

    // ── Sprites ──────────────────────────────────────────────────────────
    const pSprImg = this.assets.get(char.sprites[this._playerSpr] || char.sprites.idle);
    const eSprImg = this.assets.get(this._enemy.sprites[this._enemySpr] || this._enemy.sprites.idle);

    // Shake se tomando dano
    const pShake = this._playerSpr === 'hurt' ? (Math.random() - 0.5) * 6 : 0;
    const eShake = this._enemySpr  === 'hurt' ? (Math.random() - 0.5) * 6 : 0;

    // Personagem jogador (esquerda)
    // Aumenta o valor Y para mover o personagem para baixo
    const py = 0.6 * (0.5 + 0.5 * Math.sin(this._anim * 1.2));
    r.drawImage(pSprImg, -90 + pShake + this._playerOffsetX, 265 + py, 480, 408);

    // Inimigo (direita)
    // Se for o Mímico
    if (this._enemy.name === 'Mímico Furioso') {
      if (this._enemySpr === 'attack') {
        // Mímico atacando: maior e se move em direção ao jogador
        r.drawImage(eSprImg, VIRTUAL_W - 320 + eShake + this._enemyOffsetX, 320, 317, 400);
      } else {
        // Mímico normal: menor
        r.drawImage(eSprImg, VIRTUAL_W - 320 + eShake, 380, 246, 311);
      }
    }
    // Se for o Boss 
    else if (this._enemy.name === 'Chefe Armadura') {
      if (this._enemySpr === 'hurt') {
        // Boss sofrendo dano:
        r.drawImage(eSprImg, VIRTUAL_W - 360 + eShake, 218, 367, 465);
      }
      else if (this._enemySpr === 'attack') {
        // Boss atacando: avança em direção ao jogador
        r.drawImage(eSprImg, VIRTUAL_W - 360 + eShake + this._enemyOffsetX, 228, 360, 456);
      }
      else {
        // Boss normal:
        r.drawImage(eSprImg, VIRTUAL_W - 360 + eShake, 228, 353, 447);
      }
    }
    
    else {
      r.drawImage(eSprImg, VIRTUAL_W - 310 + eShake + this._enemyOffsetX, 228, 360, 456);
    }

    // ── Damage flutuante ─────────────────────────────────────────────────
    for (const fd of this._floatDmg) {
      const alpha = Math.max(0, 1 - fd.t / 1.5);
      r.fillRect(0, 0, 0, 0, '#000', 0); // noop to preserve state
      const prevA = r.ctx.globalAlpha;
      r.ctx.globalAlpha = alpha;
      r.drawTextShadow(fd.text, fd.x, fd.y, fd.color, 26, 'center', 'Rajdhani');
      r.ctx.globalAlpha = prevA;
    }

    // ── Popup de pergunta / resultado / vitória / derrota ─────────────────
    if (this._state === STATE.QUESTION) {
      this._renderQuestionPopup(r);
    } else if (this._state === STATE.RESULT) {
      this._renderResultPopup(r);
    } else if (this._state === STATE.WIN || this._state === STATE.LOSE) {
      this._renderEndPopup(r, player);
    }

    // ── Mensagem de estado durante animação ──────────────────────────────
    if (this._state === STATE.PLAYER_ATTACK || this._state === STATE.ENEMY_ATTACK) {
      const msg = this._state === STATE.PLAYER_ATTACK
        ? `${char.name} atacou!${this._isCrit ? ' CRÍTICO!' : ''}`
        : `${this._enemy.name} atacou!`;
      r.fillRoundRect(VIRTUAL_W / 2 - 200, VIRTUAL_H / 2 - 25, 400, 50, 8, 'rgba(0,0,0,0.7)');
      r.drawTextShadow(msg, VIRTUAL_W / 2, VIRTUAL_H / 2 + 10,
        this._state === STATE.PLAYER_ATTACK ? '#44dd88' : '#ff6666', 20, 'center', 'Rajdhani');
    }
  }

  _renderHUD(r, player, char) {
    // Barra HP jogador
    r.fillRoundRect(20, 20, 280, 65, 8, 'rgba(5,10,25,0.9)');
    r.strokeRoundRect(20, 20, 280, 65, 8, '#1a3a5c', 1);
    r.drawText(char.name, 40, 42, char.color, 16, 'left', 'Rajdhani');
    r.drawProgressBar(40, 50, 230, 14, player.hp, player.maxHp, '#44dd44', '#222',
      `${player.hp}/${player.maxHp}`);
    r.drawText(`ATK: ${player.atk}  💰${this.manager.state.gold}`, 40, 78, '#aaa', 12, 'left', 'Rajdhani');

    // Barra HP inimigo
    r.fillRoundRect(VIRTUAL_W - 300, 20, 280, 65, 8, 'rgba(5,10,25,0.9)');
    r.strokeRoundRect(VIRTUAL_W - 300, 20, 280, 65, 8, this._isBoss ? '#882200' : '#3a1a1a', 1);
    r.drawText(this._enemy.name, VIRTUAL_W - 280, 42, this._isBoss ? '#ff8800' : '#ff4444', 16, 'left', 'Rajdhani');
    r.drawProgressBar(VIRTUAL_W - 280, 50, 230, 14, this._enemyHp, this._enemy.hp, '#dd4444', '#222',
      `${this._enemyHp}/${this._enemy.hp}`);

    // Fase e sala
    const phase = this.manager.state.phase;
    const room  = this.manager.state.currentRoom + 1;
    const total     = this.manager.state.rooms.length;
    const cycleStr  = (this.manager.state.listCycle || 0) > 0 ? ` · Ciclo ${this.manager.state.listCycle + 1}` : '';
    r.drawText(`${phase ? phase.name : ''} - Vagão ${room}/${total}${cycleStr}`, VIRTUAL_W / 2, 35, '#446688', 13, 'center', 'Rajdhani');
  }

  _renderQuestionPopup(r) {
    if (!this._question || !this._questionLayout) return;

    const { popX, popY, popW, popH } = this._questionLayout;

    // Fundo do popup
    r.fillRoundRect(popX, popY, popW, popH, 12, 'rgba(5,12,30,0.97)');
    r.strokeRoundRect(popX, popY, popW, popH, 12, '#2a5a9c', 2);

    // Linha superior decorativa
    r.fillRoundRect(popX, popY, popW, 4, 4, '#2a6aaa');

    // Texto da pergunta
    r.drawWrappedText(this._question.text, popX + 20, popY + 28, popW - 40, 24, '#d0e8ff', 17, 'Rajdhani');

    // Opções de resposta
    this._answerBtns.forEach(btn => {
      const hover = this.input.isHover(btn.rect);
      const { rect } = btn;
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        hover ? 'rgba(30,70,130,0.95)' : 'rgba(12,25,60,0.9)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        hover ? '#5ab4ff' : '#1a3a6a', hover ? 2 : 1);
      r.drawWrappedText(
        String.fromCharCode(65 + btn.index) + ') ' + btn.label,
        rect.x + 10, rect.y + 14, rect.w - 20, 18, hover ? '#d0e8ff' : '#9ab4cc', 13, 'Rajdhani'
      );
    });
  }

  _renderResultPopup(r) {
    const popW = 660;
    const popH = 280;
    const popX = (VIRTUAL_W - popW) / 2;
    const popY = VIRTUAL_H / 2 - popH / 2 + 40;

    r.fillRoundRect(popX, popY, popW, popH, 12, 'rgba(5,12,30,0.97)');
    r.strokeRoundRect(popX, popY, popW, popH, 12, '#2a5a9c', 2);

    r.drawTextShadow(this._resultMsg, VIRTUAL_W / 2, popY + 40, this._resultColor, 20, 'center', 'Rajdhani');

    // Resposta correta
    const correct = this._question.options[this._question.correct];
    r.drawText('Resposta correta:', VIRTUAL_W / 2, popY + 75, '#8ab4cc', 14, 'center', 'Rajdhani');
    r.drawWrappedText(correct, popX + 30, popY + 95, popW - 60, 22, '#44dd88', 15, 'Rajdhani');

    if (this._dmgDealt > 0) {
      r.drawText(`Dano causado ao inimigo: ${this._dmgDealt}`, VIRTUAL_W / 2, popY + 155, '#ffcc44', 15, 'center', 'Rajdhani');
    }
    if (this._dmgTaken > 0) {
      r.drawText(`Dano recebido: ${this._dmgTaken}`, VIRTUAL_W / 2, popY + 178, '#ff6666', 15, 'center', 'Rajdhani');
    }

    const player = this.manager.state.player;
    r.drawProgressBar(popX + 40, popY + 205, popW - 80, 14, player.hp, player.maxHp, '#44dd44', '#222',
      `HP: ${player.hp}/${player.maxHp}`);

    if (this._btnContinue) {
      const hover = this.input.isHover(this._btnContinue);
      r.drawButton(this._btnContinue.x, this._btnContinue.y, this._btnContinue.w, this._btnContinue.h,
        this._continueLbl, hover, false, '#1a3a6a');
    }
  }

  _renderEndPopup(r, player) {
    const won  = this._state === STATE.WIN;
    const color = won ? '#44dd88' : '#ff4444';
    const msg   = won ? (this._isBoss ? '🏆 BOSS DERROTADO!' : '⚔ Inimigo Derrotado!') : '💀 Você foi Derrotado';

    r.drawOverlay(0.75);

    const popW = 500;
    const popH = 220;
    const popX = (VIRTUAL_W - popW) / 2;
    const popY = VIRTUAL_H / 2 - popH / 2;

    r.fillRoundRect(popX, popY, popW, popH, 14, 'rgba(5,10,25,0.97)');
    r.strokeRoundRect(popX, popY, popW, popH, 14, color, 3);

    r.drawTextShadow(msg, VIRTUAL_W / 2, popY + 55, color, 26, 'center', 'Rajdhani');

    if (won) {
      const [minG, maxG] = this._enemy.gold;
      const estG = Math.round((minG + maxG) / 2);
      r.drawText(`+${estG} 💰 ouro`, VIRTUAL_W / 2, popY + 95, '#ffcc44', 18, 'center', 'Rajdhani');
      r.drawProgressBar(popX + 40, popY + 115, popW - 80, 14, player.hp, player.maxHp, '#44dd44', '#222',
        `HP restante: ${player.hp}/${player.maxHp}`);
    } else {
      r.drawText('Você retorna ao início da jornada...', VIRTUAL_W / 2, popY + 105, '#aa6666', 15, 'center', 'Rajdhani');
    }

    if (this._btnContinue) {
      const hover = this.input.isHover(this._btnContinue);
      r.drawButton(this._btnContinue.x, this._btnContinue.y, this._btnContinue.w, this._btnContinue.h,
        this._continueLbl, hover, false, won ? '#1a4a2a' : '#4a1a1a');
    }
  }
}

export default BattleScene;
