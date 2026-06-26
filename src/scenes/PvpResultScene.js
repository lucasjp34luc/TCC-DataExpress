/**
 * @file PvpResultScene.js
 * @description Tela de resultado do Modo PvP.
 * Exibe vitoria/derrota/empate, resumo de perguntas e opcoes de sair ou jogar de novo.
 * Jogar de novo mantem a sala existente e aguarda o servidor iniciar nova partida.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { CHARACTERS }           from '../data/characters.js';
import { getPvpNetwork }        from '../core/PvpNetworkManager.js';

export class PvpResultScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._btnExit    = null;
    this._btnRematch = null;
    this._anim       = 0;
    this._stars      = [];
    this._waitingRematch  = false;
    this._opponentReady   = false;
    this._opponentLeft    = false;
  }

  enter() {
    this._anim           = 0;
    this._waitingRematch = false;
    this._opponentReady  = false;
    this._opponentLeft   = false;

    this._stars = Array.from({ length: 60 }, () => ({
      x:     Math.random() * VIRTUAL_W,
      y:     Math.random() * VIRTUAL_H,
      speed: 20 + Math.random() * 50,
      size:  1 + Math.random() * 2.5,
      alpha: Math.random()
    }));

    this.input.clearButtons();

    this._btnExit = { x: VIRTUAL_W / 2 - 230, y: VIRTUAL_H - 90, w: 210, h: 52 };
    this.input.addButton(this._btnExit, () => this._exit());

    this._btnRematch = { x: VIRTUAL_W / 2 + 20, y: VIRTUAL_H - 90, w: 210, h: 52 };
    this.input.addButton(this._btnRematch, () => this._requestRematch());

    // Handlers de rede para esta cena
    const net = getPvpNetwork();
    net.clearHandlers();

    net.on('game_start', (msg) => {
      // Revanche: servidor reiniciou a partida
      const pvp = this.manager.state.pvp;
      pvp.p1Hp              = msg.p1.hp;
      pvp.p1MaxHp           = msg.p1.maxHp;
      pvp.p2Hp              = msg.p2.hp;
      pvp.p2MaxHp           = msg.p2.maxHp;
      pvp.role              = msg.role;
      pvp.questionsCorrect  = 0;
      pvp.questionsWrong    = 0;
      pvp.totalQuestions    = 0;
      pvp.result            = null;
      pvp.endStats          = null;
      pvp.disconnected      = false;
      this.manager.goto('pvpBattle');
    });

    net.on('opponent_disconnected', () => {
      this._opponentLeft = true;
    });

    net.on('_disconnect', () => {
      this._opponentLeft = true;
    });
  }

  exit() {
    this.input.clearButtons();
    getPvpNetwork().clearHandlers();
  }

  _exit() {
    getPvpNetwork().disconnect();
    this.manager.resetState();
    this.manager.goto('modeSelect');
  }

  _requestRematch() {
    if (this._opponentLeft) return;
    if (this._waitingRematch) return;
    this._waitingRematch = true;
    getPvpNetwork().send({ type: 'rematch' });
  }

  update(dt) {
    this._anim += dt;
    for (const s of this._stars) {
      s.y -= s.speed * dt;
      if (s.y < 0) { s.y = VIRTUAL_H; s.x = Math.random() * VIRTUAL_W; }
      s.alpha = 0.3 + 0.7 * Math.abs(Math.sin(this._anim * 0.5 + s.x));
    }
  }

  render(r) {
    const pvp    = this.manager.state.pvp;
    const result = pvp.result || 'draw';

    const colorMap = { win: '#44dd88', lose: '#ff4444', draw: '#ffcc44' };
    const titleMap = {
      win:  'VITORIA!',
      lose: 'DERROTA',
      draw: 'EMPATE!'
    };
    const bgMap = {
      win:  ['#040c10', '#082818'],
      lose: ['#100004', '#200008'],
      draw: ['#0c0c04', '#1a1808']
    };
    const color = colorMap[result] || '#fff';
    const title = titleMap[result] || 'FIM DE PARTIDA';
    const [bgTop, bgBot] = bgMap[result] || ['#060a18', '#0c1428'];

    r.drawGradientBg(bgTop, bgBot);

    // Particulas
    for (const s of this._stars) {
      r.fillCircle(s.x, s.y, s.size, color, s.alpha * 0.45);
    }

    // Brilho central
    const glow = 0.12 + 0.08 * Math.sin(this._anim * 1.4);
    r.fillCircle(VIRTUAL_W / 2, VIRTUAL_H / 2, 280, color.replace('#', 'rgba(').replace(/(..)(..)(..)/, (_,r2,g,b) =>
      `${parseInt(r2,16)},${parseInt(g,16)},${parseInt(b,16)},${glow})`));

    // Titulo
    r.drawTextShadow(title, VIRTUAL_W / 2, 130, color, 64, 'center', 'Rajdhani');

    // Nomes dos jogadores
    const isP1 = pvp.role === 'p1';
    const p1Name = isP1 ? `${pvp.playerName} (Voce)` : pvp.opponentName;
    const p2Name = isP1 ? pvp.opponentName : `${pvp.playerName} (Voce)`;
    r.drawText(`${p1Name}  vs  ${p2Name}`, VIRTUAL_W / 2, 200, '#7a9aaa', 18, 'center', 'Rajdhani');

    // Fase
    if (pvp.phase) {
      r.drawText(`Fase: ${pvp.phase.name}`, VIRTUAL_W / 2, 232, '#5a8aaa', 15, 'center', 'Rajdhani');
    }

    // ── Caixa de resumo ──────────────────────────────────────────────────
    const stats   = pvp.endStats;
    const boxW    = 540;
    const boxH    = stats ? 220 : 100;
    const boxX    = VIRTUAL_W / 2 - boxW / 2;
    const boxY    = 260;

    r.fillRoundRect(boxX, boxY, boxW, boxH, 12, 'rgba(5,12,30,0.94)');
    r.strokeRoundRect(boxX, boxY, boxW, boxH, 12, color, 2);

    r.drawText('RESUMO DA PARTIDA', VIRTUAL_W / 2, boxY + 28, color.replace(')', ',0.9)').replace('rgb', 'rgba') || '#aaccdd', 16, 'center', 'Rajdhani');
    r.drawLine(boxX + 30, boxY + 38, boxX + boxW - 30, boxY + 38, '#1a3050', 1);

    if (stats) {
      const myCorrect  = isP1 ? stats.p1Correct : stats.p2Correct;
      const myWrong    = isP1 ? stats.p1Wrong   : stats.p2Wrong;
      const oppCorrect = isP1 ? stats.p2Correct : stats.p1Correct;
      const oppWrong   = isP1 ? stats.p2Wrong   : stats.p1Wrong;
      const total      = stats.total;

      r.drawText(`Perguntas respondidas: ${total}`, VIRTUAL_W / 2, boxY + 62, '#8ab4c8', 15, 'center', 'Rajdhani');

      r.drawLine(boxX + 30, boxY + 75, boxX + boxW - 30, boxY + 75, '#1a3050', 1);

      // Suas stats
      r.drawText('Seus resultados:', boxX + 80, boxY + 100, '#8ab4c8', 14, 'left', 'Rajdhani');
      r.drawText(`Acertos: ${myCorrect}`, boxX + 80, boxY + 122, '#44dd88', 14, 'left', 'Rajdhani');
      r.drawText(`Erros: ${myWrong}`,     boxX + 80, boxY + 144, '#ff6666', 14, 'left', 'Rajdhani');
      const myPct = total > 0 ? Math.round((myCorrect / total) * 100) : 0;
      r.drawText(`Precisao: ${myPct}%`,   boxX + 80, boxY + 166, '#ffcc44', 14, 'left', 'Rajdhani');

      // Stats adversario
      r.drawLine(boxX + boxW / 2, boxY + 85, boxX + boxW / 2, boxY + 185, '#1a3050', 1);
      r.drawText('Adversario:', boxX + boxW / 2 + 30, boxY + 100, '#8ab4c8', 14, 'left', 'Rajdhani');
      r.drawText(`Acertos: ${oppCorrect}`, boxX + boxW / 2 + 30, boxY + 122, '#44dd88', 14, 'left', 'Rajdhani');
      r.drawText(`Erros: ${oppWrong}`,     boxX + boxW / 2 + 30, boxY + 144, '#ff6666', 14, 'left', 'Rajdhani');
      const oppPct = total > 0 ? Math.round((oppCorrect / total) * 100) : 0;
      r.drawText(`Precisao: ${oppPct}%`,   boxX + boxW / 2 + 30, boxY + 166, '#ffcc44', 14, 'left', 'Rajdhani');

    } else if (pvp.disconnected) {
      r.drawText('O adversario saiu da partida.', VIRTUAL_W / 2, boxY + 60, '#ff8888', 15, 'center', 'Rajdhani');
    }

    // ── Botoes ────────────────────────────────────────────────────────────
    if (this._btnExit) {
      const hover = this.input.isHover(this._btnExit);
      r.drawButton(this._btnExit.x, this._btnExit.y, this._btnExit.w, this._btnExit.h,
        'Sair', hover, false, '#2a1a1a');
    }

    if (this._btnRematch) {
      const disabled = this._opponentLeft;
      const hover    = !disabled && this.input.isHover(this._btnRematch);
      const label    = this._waitingRematch
        ? `Aguardando${'.'.repeat((Math.floor(this._anim * 2) % 3) + 1)}`
        : 'Jogar Novamente';
      r.drawButton(this._btnRematch.x, this._btnRematch.y, this._btnRematch.w, this._btnRematch.h,
        label, hover, disabled, '#1a3a2a');
    }

    // Aviso adversario saiu
    if (this._opponentLeft && !pvp.disconnected) {
      r.drawText('Adversario desconectado — nao e possivel revocar.',
        VIRTUAL_W / 2, VIRTUAL_H - 105, '#ff8888', 13, 'center', 'Rajdhani');
    }
  }
}

export default PvpResultScene;
