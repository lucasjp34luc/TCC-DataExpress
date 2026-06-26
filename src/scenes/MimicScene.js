/**
 * @file MimicScene.js
 * @description Evento do Mímico: 3 baús para escolher.
 * Estudioso vê recompensa sem desfoque. Hackear desafia com pergunta.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { ITEMS } from '../data/items.js';

const CHEST_STATE = {
  CHOOSING:    'choosing',    // Jogador escolhe um baú
  REVEAL:      'reveal',      // Baú aberto, mostra recompensa (blur ou não)
  QUESTION:    'question',    // Pergunta de hack
  WIN_REWARD:  'win_reward',  // Ganhou recompensa
  LOSE_FIGHT:  'lose_fight',  // Perdeu hack → vai lutar
  FIGHT:       'fight'        // Redirecionou para batalha
};

export class MimicScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._state       = CHEST_STATE.CHOOSING;
    this._chests      = [];
    this._selectedIdx = -1;
    this._reward      = null;
    this._question    = null;
    this._answerBtns  = [];
    this._btnHack     = null;
    this._btnBack     = null;
    this._btnContinue = null;
    this._resultMsg   = '';
    this._resultColor = '#fff';
    this._cryptName   = '';
    this._cryptDesc   = '';
    this._anim        = 0;
    this._hackLayout  = null;
  }

  enter() {
    this._state = CHEST_STATE.CHOOSING;
    this._anim  = 0;

    // Sorteia 3 recompensas diferentes
    const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
    this._chests = [0, 1, 2].map(i => ({
      item:    shuffled[i % shuffled.length],
      visible: true
    }));
    this._selectedIdx = -1;
    this._reward      = null;
    this._question    = null;
    this._answerBtns  = [];
    this._btnBack     = null;
    this._btnHack     = null;
    this._cryptName   = '';
    this._cryptDesc   = '';

    this._setupChestButtons();
  }

  exit() {
    this.input.clearButtons();
  }

  _setupChestButtons() {
    this.input.clearButtons();
    this._chestBtns = [];

    const chestW = 160;
    const chestH = 160;
    const gap    = 80;
    const total  = 3 * chestW + 2 * gap;
    const startX = (VIRTUAL_W - total) / 2;
    const chestY = 250;

    this._chests.forEach((ch, i) => {
      if (!ch.visible) return;
      const bx   = startX + i * (chestW + gap);
      const rect = { x: bx, y: chestY, w: chestW, h: chestH };
      this._chests[i].rect = rect;
      this.input.addButton(rect, () => this._openChest(i));
    });
  }

  _openChest(idx) {
    if (this._state !== CHEST_STATE.CHOOSING) return;
    this._selectedIdx = idx;
    this._reward      = this._chests[idx].item;
    this._state       = CHEST_STATE.REVEAL;

    // Pré-computa textos criptografados
    this._cryptName = this._cryptify(this._reward.name);
    this._cryptDesc = this._cryptify(this._reward.description);

    this.input.clearButtons();
    // Botão voltar
    this._btnBack = { x: VIRTUAL_W / 2 - 210, y: VIRTUAL_H - 100, w: 180, h: 50 };
    this.input.addButton(this._btnBack, () => this._goBack());
    // Botão hackear
    this._btnHack = { x: VIRTUAL_W / 2 + 30, y: VIRTUAL_H - 100, w: 180, h: 50 };
    this.input.addButton(this._btnHack, () => this._hack());
  }

  _goBack() {
    this._state       = CHEST_STATE.CHOOSING;
    this._selectedIdx = -1;
    this._reward      = null;
    this._btnBack     = null;
    this._btnHack     = null;
    this._cryptName   = '';
    this._cryptDesc   = '';
    this._hackLayout  = null;
    this._setupChestButtons();
  }

  _cryptify(text) {
    const junk = ['#', '*', '@', '$', '%', '&'];
    return text.split('').map(ch => {
      if (ch === ' ') return ch;
      if (Math.random() < 0.55) return junk[Math.floor(Math.random() * junk.length)];
      return ch;
    }).join('');
  }

  _computeHackLayout(question, visibleOptions) {
    const popW    = 680;
    const PAD     = 20;
    const FONT    = 16;
    const LINE    = 24;
    const headerH = 28;

    const textW  = popW - PAD * 2;
    const cpl    = Math.max(1, Math.floor(textW / (FONT * 0.54)));
    const qLines = Math.max(1, Math.ceil(question.text.length / cpl));
    const questionH = qLines * LINE + 12;

    const n    = visibleOptions.length;
    const cols = n <= 2 ? n : 2;
    const rows = Math.ceil(n / cols);
    const gapX = 14, gapY = 12;
    const btnW = cols <= 1 ? textW : (textW - gapX) / 2;
    const btnH = 50;
    const optH = rows * (btnH + gapY) - gapY;

    const popH  = headerH + questionH + 14 + optH + 20;
    const popX  = (VIRTUAL_W - popW) / 2;
    const popY  = Math.max(130, Math.min(VIRTUAL_H - popH - 20, 140));

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

  _hack() {
    // Seleciona pergunta aleatória da fase
    const questions = this.manager.state.phase.questions;
    this._question  = questions[Math.floor(Math.random() * questions.length)];
    this._state     = CHEST_STATE.QUESTION;

    this.input.clearButtons();
    this._answerBtns = [];
    this._hackLayout = null;

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

    this._hackLayout = this._computeHackLayout(this._question, visibleOptions);

    this._hackLayout.btns.forEach(btn => {
      this._answerBtns.push(btn);
      this.input.addButton(btn.rect, () => this._answerHack(btn.index));
    });
  }

  _answerHack(idx) {
    const correct = idx === this._question.correct;
    this.input.clearButtons();
    this._answerBtns = [];

    const st = this.manager.state;
    if (correct) { st.questionsCorrect++; st.mimicsHacked++; }
    else           st.questionsWrong++;

    if (!st.runQuestions) st.runQuestions = [];
    st.runQuestions.push({
      text:    this._question.text,
      options: [...this._question.options],
      correct: this._question.correct,
      chosen:  idx
    });

    if (correct) {
      // Aplica recompensa
      st.player.atk     += this._reward.effect.atk;
      st.player.baseAtk += this._reward.effect.atk;
      // Reaplica bônus passivo do Assassino preservando o percentual acumulado
      if (st.player.character.passive.id === 'golpe_critico' && st.player.atkBonusPct) {
        st.player.atk = Math.round(st.player.baseAtk * (1 + st.player.atkBonusPct));
      }
      st.player.maxHp  += this._reward.effect.hp;
      st.player.hp      = Math.min(st.player.hp + this._reward.effect.hp, st.player.maxHp);
      st.player.items.push(this._reward.id);

      this._resultMsg   = '✔ Correto! Recompensa obtida!';
      this._resultColor = '#44dd88';
      this._state       = CHEST_STATE.WIN_REWARD;
    } else {
      this._resultMsg   = '✘ Errado! O Mímico acorda com fúria!';
      this._resultColor = '#ff4444';
      this._state       = CHEST_STATE.LOSE_FIGHT;
    }

    this._btnContinue = { x: VIRTUAL_W / 2 - 110, y: VIRTUAL_H - 100, w: 220, h: 50 };
    this.input.addButton(this._btnContinue, () => this._continueAfterResult());
  }

  _continueAfterResult() {
    if (this._state === CHEST_STATE.WIN_REWARD) {
      // Avança sem combate
      const st = this.manager.state;
      st.clearedRooms = st.clearedRooms || new Set();
      st.clearedRooms.add(st.currentRoom);
      st.currentRoom++;
      st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
      this.manager.goto('map');
    } else {
      // Vai lutar com o mímico
      this.manager.state.rooms[this.manager.state.currentRoom] = 'mimic_enemy';
      this.manager.goto('battle');
    }
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#060a18', '#0c1428');

    // Título
    r.drawTextShadow('VAGÃO DO MÍMICO', VIRTUAL_W / 2, 55, '#cc44ff', 28, 'center', 'Rajdhani');

    // ─── Estado: escolhendo baú ──────────────────────────────────────────
    if (this._state === CHEST_STATE.CHOOSING) {
      r.drawText('Escolha um baú... mas cuidado com o que está dentro!',
        VIRTUAL_W / 2, 100, '#8a7aaa', 16, 'center', 'Rajdhani');

      const chestImg = this.assets.get('assets/image/Inimigos/Mimico/Sem Fundo/Bau/Mimico_Bau.png');
      this._chests.forEach((ch, i) => {
        if (!ch.visible || !ch.rect) return;
        const { rect } = ch;
        const hover    = this.input.isHover(rect);
        const bobY     = Math.sin(this._anim * 2 + i * 1.2) * 5;

        // Sombra do baú
        r.fillCircle(rect.x + rect.w / 2, rect.y + rect.h + 10, rect.w * 0.4, 'rgba(0,0,0,0.4)');

        if (chestImg) {
          r.drawImage(chestImg, rect.x, rect.y + bobY, rect.w, rect.h, hover ? 1 : 0.85);
        } else {
          r.fillRoundRect(rect.x, rect.y + bobY, rect.w, rect.h, 10, hover ? '#554422' : '#332211');
          r.drawText('📦', rect.x + rect.w / 2, rect.y + bobY + rect.h / 2 + 10, '#fff', 40, 'center', 'Arial');
        }

        if (hover) {
          r.strokeRoundRect(rect.x - 4, rect.y + bobY - 4, rect.w + 8, rect.h + 8, 12, '#cc44ff', 2);
          r.drawText('Clique para abrir', rect.x + rect.w / 2, rect.y + rect.h + 25, '#cc44ff', 13, 'center', 'Rajdhani');
        }

        r.drawText(`Baú ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h + 42, '#9966bb', 12, 'center', 'Rajdhani');
      });
    }

    // ─── Estado: revelando recompensa ────────────────────────────────────
    else if (this._state === CHEST_STATE.REVEAL) {
      this._renderReveal(r);
    }

    // ─── Estado: pergunta de hack ────────────────────────────────────────
    else if (this._state === CHEST_STATE.QUESTION) {
      this._renderQuestion(r);
    }

    // ─── Estado: resultado ───────────────────────────────────────────────
    else if (this._state === CHEST_STATE.WIN_REWARD || this._state === CHEST_STATE.LOSE_FIGHT) {
      this._renderResult(r);
    }
  }

  _renderReveal(r) {
    if (!this._reward) return;
    const isEstudioso = this.manager.state.player.character.id === 'estudioso';
    const itemImg     = this.assets.get(this._reward.image);

    r.drawText('Você encontrou algo no baú!', VIRTUAL_W / 2, 100, '#cc44ff', 18, 'center', 'Rajdhani');

    // Popup
    const pw = 420, ph = 320, px = VIRTUAL_W / 2 - pw / 2, py = 130;
    r.fillRoundRect(px, py, pw, ph, 14, 'rgba(10,5,30,0.97)');
    r.strokeRoundRect(px, py, pw, ph, 14, '#6622aa', 2);
    r.fillRoundRect(px, py, pw, 4, 4, '#8833cc');

    // Imagem do item
    if (itemImg) {
      if (isEstudioso) {
        r.drawImage(itemImg, px + pw / 2 - 55, py + 20, 110, 110);
      } else {
        r.drawImageBlurred(itemImg, px + pw / 2 - 55, py + 20, 110, 110);
      }
    }

    // Nome
    if (isEstudioso) {
      r.drawText(this._reward.name, VIRTUAL_W / 2, py + 152, '#44dd88', 18, 'center', 'Rajdhani');
    } else {
      r.drawText(this._cryptName, VIRTUAL_W / 2, py + 152, '#9966bb', 18, 'center', 'Rajdhani');
    }

    // Descrição
    if (isEstudioso) {
      r.drawWrappedText(this._reward.description, px + 20, py + 178, pw - 40, 22, '#8ab4c8', 13, 'Rajdhani');
      r.drawText(`Custo base: ${this._reward.cost} 💰`, VIRTUAL_W / 2, py + 224, '#ffcc44', 13, 'center', 'Rajdhani');
    } else {
      r.drawWrappedText(this._cryptDesc, px + 20, py + 178, pw - 40, 22, '#9966bb', 13, 'Rajdhani');
      r.drawText('Acerte → Ganhe a recompensa | Erre → Enfrente o Mímico!',
        VIRTUAL_W / 2, py + 264, '#7777aa', 11, 'center', 'Rajdhani');
    }

    // Botão voltar
    if (this._btnBack) {
      const hover = this.input.isHover(this._btnBack);
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h, '← Voltar', hover, false, '#1a2040');
    }

    // Botão hackear
    if (this._btnHack) {
      const hover = this.input.isHover(this._btnHack);
      r.drawButton(this._btnHack.x, this._btnHack.y, this._btnHack.w, this._btnHack.h, '🔓 Hackear', hover, false, '#4a1a7a');
    }
  }

  _renderQuestion(r) {
    if (!this._question || !this._hackLayout) return;
    r.drawText('Responda para hackear o baú!', VIRTUAL_W / 2, 110, '#cc44ff', 18, 'center', 'Rajdhani');

    const { popX: px, popY: py, popW: pw, popH: ph } = this._hackLayout;

    r.fillRoundRect(px, py, pw, ph, 12, 'rgba(8,4,25,0.97)');
    r.strokeRoundRect(px, py, pw, ph, 12, '#6622aa', 2);
    r.fillRoundRect(px, py, pw, 4, 4, '#8833cc');

    r.drawWrappedText(this._question.text, px + 20, py + 28, pw - 40, 24, '#d0ccff', 16, 'Rajdhani');

    this._answerBtns.forEach(btn => {
      const hover = this.input.isHover(btn.rect);
      const { rect } = btn;
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        hover ? 'rgba(80,20,120,0.95)' : 'rgba(25,10,50,0.9)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 8, hover ? '#cc44ff' : '#441166', hover ? 2 : 1);
      r.drawWrappedText(
        String.fromCharCode(65 + btn.index) + ') ' + btn.label,
        rect.x + 10, rect.y + 14, rect.w - 20, 18, hover ? '#d0ccff' : '#9a88aa', 13, 'Rajdhani'
      );
    });
  }

  _renderResult(r) {
    const won = this._state === CHEST_STATE.WIN_REWARD;

    r.drawOverlay(0.6);

    const pw = 500, ph = 200;
    const px = (VIRTUAL_W - pw) / 2, py = VIRTUAL_H / 2 - ph / 2;

    r.fillRoundRect(px, py, pw, ph, 14, 'rgba(8,4,25,0.97)');
    r.strokeRoundRect(px, py, pw, ph, 14, won ? '#44dd88' : '#ff4444', 3);

    r.drawTextShadow(this._resultMsg, VIRTUAL_W / 2, py + 50, this._resultColor, 20, 'center', 'Rajdhani');

    if (won && this._reward) {
      r.drawText(`+ ${this._reward.name}`, VIRTUAL_W / 2, py + 85, '#44dd88', 16, 'center', 'Rajdhani');
      r.drawText(this._reward.description, VIRTUAL_W / 2, py + 108, '#8ab4c8', 13, 'center', 'Rajdhani');
    } else if (!won) {
      const mimico = this.assets.get('assets/image/Inimigos/Mimico/Sem Fundo/Atacando/Mimico_Atacando.png');
      if (mimico) r.drawImage(mimico, VIRTUAL_W / 2 - 40, py + 60, 80, 90);
    }

    if (this._btnContinue) {
      const hover = this.input.isHover(this._btnContinue);
      const lbl   = won ? 'Continuar ▶' : '⚔ Lutar contra o Mímico';
      r.drawButton(this._btnContinue.x, this._btnContinue.y, this._btnContinue.w, this._btnContinue.h,
        lbl, hover, false, won ? '#1a4a2a' : '#4a1a1a');
    }
  }
}

export default MimicScene;
