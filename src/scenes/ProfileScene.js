/**
 * @file ProfileScene.js
 * @description Tela de perfil do jogador: histórico de fases, vitórias/derrotas
 * e ranking de desempenho por linha de trem.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class ProfileScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim      = 0;
    this._loading   = false;
    this._errorMsg  = '';
    this._profile   = null;
    this._username  = '';
    this._btnBack         = null;
    this._btnLogout       = null;
    this._btnAchievements = null;
    this._btnClass        = null;
    this._sorted         = [];   // [{id, phaseName, victories, defeats, accuracy}]
    this._phaseCards     = []; // [{rect, phase}]
    this._isViewingOther = false;
    this._confirmLeave   = false;
  }

  enter(params = {}) {
    this._anim       = 0;
    this._errorMsg   = '';
    this._loading    = true;
    this._profile    = null;
    this._sorted     = [];
    this._phaseCards = [];

    this._viewUserId   = params.viewUserId   || null;
    this._viewUsername = params.viewUsername || null;
    this._from         = params.from         || 'modeSelect';
    this._phaseId      = params.phaseId      || null;
    this._fromClassId   = params.classId     || null;
    this._fromClassName = params.className   || null;
    this._isViewingOther = !!this._viewUserId;
    this._confirmLeave   = false;
    this._btnClass       = null;

    this.input.clearButtons();
    this._btnBack = { x: 50, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => {
      if (this._isViewingOther) {
        if (this._phaseId) {
          this.manager.goto(this._from, { phaseId: this._phaseId, from: 'modeSelect' });
        } else if (this._from === 'classRoom') {
          this.manager.goto('classRoom', { classId: this._fromClassId, className: this._fromClassName });
        } else {
          this.manager.goto(this._from, {});
        }
      } else {
        this.manager.goto('modeSelect');
      }
    });

    this._btnAchievements = { x: 220, y: 30, w: 180, h: 46 };
    this.input.addButton(this._btnAchievements, () => {
      const p = {};
      if (this._viewUserId)      p.viewUserId   = this._viewUserId;
      if (this._viewUsername)    p.viewUsername = this._viewUsername;
      if (this._from)            p.from         = this._from;
      if (this._phaseId)         p.phaseId      = this._phaseId;
      if (this._fromClassId)     p.classId      = this._fromClassId;
      if (this._fromClassName)   p.className    = this._fromClassName;
      this.manager.goto('achievements', p);
    });

    if (!this._isViewingOther) {
      this._btnLogout = { x: VIRTUAL_W - 50 - 100, y: 30, w: 100, h: 44 };
      this.input.addButton(this._btnLogout, () => {
        localStorage.removeItem('dataexpress_session');
        this.manager.state.currentUser = null;
        this.manager.goto('login');
      });

      // Botão de turma apenas para alunos (não professores, não visualizando outro)
      const user = this.manager.state.currentUser;
      if (user && (user.role || 'aluno') === 'aluno') {
        this._btnClass = { x: VIRTUAL_W - 50 - 100 - 10 - 180, y: 30, w: 180, h: 46 };
        this.input.addButton(this._btnClass, () => {
          const u = this.manager.state.currentUser;
          if (!u.classId) {
            this.manager.goto('joinClass');
          } else {
            if (!this._confirmLeave) {
              this._confirmLeave = true;
            } else {
              this._confirmLeave = false;
              this._leaveClass(u);
            }
          }
        });
      } else {
        this._btnClass = null;
      }
    } else {
      this._btnLogout = null;
      this._btnClass  = null;
    }

    const user = this.manager.state.currentUser;
    if (!this._isViewingOther && !user) {
      this._errorMsg = 'Nenhum usuário logado.';
      this._loading  = false;
      return;
    }

    const targetId = this._viewUserId || user.userId;
    this._username = this._viewUsername || user.username;

    fetch(`https://${window.location.hostname}:3000/player/profile/${targetId}`)
      .then(r  => r.json())
      .then(data => {
        this._profile = data.success ? data.profile : (this._isViewingOther ? {} : user.profile);
        if (!this._isViewingOther) this.manager.state.currentUser.profile = this._profile;
        this._loading = false;
        this._setupPhaseButtons();
      })
      .catch(() => {
        this._profile = this._isViewingOther ? {} : user.profile;
        this._loading = false;
        this._setupPhaseButtons();
      });
  }

  async _leaveClass(user) {
    try {
      await fetch(`https://${window.location.hostname}:3000/class/${user.classId}/kick`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId: user.userId })
      });
    } catch { /* ignora erro de rede */ }
    user.classId = null;
    this.manager.state.currentUser.classId = null;
    const raw = localStorage.getItem('dataexpress_session');
    if (raw) {
      try {
        const s = JSON.parse(raw);
        s.classId = null;
        localStorage.setItem('dataexpress_session', JSON.stringify(s));
      } catch { /* ignora */ }
    }
    // Refaz os botões para atualizar label
    this.input.clearButtons();
    this.enter({ viewUserId: this._viewUserId, viewUsername: this._viewUsername, from: this._from, phaseId: this._phaseId });
  }

  _setupPhaseButtons() {
    const history = (this._profile && this._profile.history) ? this._profile.history : {};
    const phases  = Object.entries(history);
    if (phases.length === 0) return;

    this._sorted = phases
      .map(([id, h]) => ({
        id,
        phaseName: h.phaseName || id,
        victories: h.victories    || 0,
        defeats:   h.defeats      || 0,
        accuracy:  h.totalAnswers > 0 ? h.totalCorrect / h.totalAnswers : 0
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const cardW = 1140;
    const cardH = 90;
    const cardX = (VIRTUAL_W - cardW) / 2;
    let   cardY = 142;

    this._phaseCards = [];
    this._sorted.forEach(phase => {
      const rect = { x: cardX, y: cardY, w: cardW, h: cardH };
      this._phaseCards.push({ rect, phase });
      this.input.addButton(rect, () => {
        this.manager.state.selectedPhaseId      = phase.id;
        this.manager.state.selectedPhaseName    = phase.phaseName;
        this.manager.state.viewUserId           = this._viewUserId;
        this.manager.state.viewUsername         = this._viewUsername;
        this.manager.state.viewFrom             = this._from;
        this.manager.state.viewFromClassId      = this._fromClassId;
        this.manager.state.viewFromClassName    = this._fromClassName;
        this.manager.goto('runHistory');
      });
      cardY += cardH + 10;
    });
  }

  exit() {
    this.input.clearButtons();
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    // Cabeçalho
    r.drawTextShadow(`PERFIL — ${this._username.toUpperCase()}`, VIRTUAL_W / 2, 48, '#5ab4ff', 30, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#1a3a5c', 1);

    // Botão voltar
    if (this._btnBack) {
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a');
    }

    // Botão Conquistas
    if (this._btnAchievements) {
      r.drawButton(this._btnAchievements.x, this._btnAchievements.y,
        this._btnAchievements.w, this._btnAchievements.h,
        '🏅 Conquistas', this.input.isHover(this._btnAchievements), false, '#1a2a3a');
    }

    // Botão turma (apenas alunos)
    if (this._btnClass) {
      const user      = this.manager.state.currentUser;
      const inClass   = user && user.classId;
      const label     = this._confirmLeave ? 'Confirmar saída?' : (inClass ? 'Sair da Turma' : 'Entrar em Turma');
      const bgColor   = inClass ? (this._confirmLeave ? 'rgba(80,20,0,0.95)' : 'rgba(40,10,0,0.85)') : 'rgba(5,25,50,0.85)';
      const bdColor   = inClass ? (this._confirmLeave ? '#ff8844' : '#cc5500') : '#2a8acc';
      const txtColor  = inClass ? (this._confirmLeave ? '#ffaa77' : '#ff9966') : '#5ab4ff';
      const hover     = this.input.isHover(this._btnClass);
      const { x, y, w, h } = this._btnClass;
      r.fillRoundRect(x, y, w, h, 10, bgColor);
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#ffffff' : bdColor, hover ? 2 : 1.5);
      r.drawText(label, x + w / 2, y + h / 2 + 7, txtColor, 14, 'center', 'Rajdhani');
    }

    // Botão Sair (alinhado ao fim da linha, mesma altura do Voltar)
    if (this._btnLogout) {
      const { x, y, w, h } = this._btnLogout;
      const hover = this.input.isHover(this._btnLogout);
      r.fillRoundRect(x, y, w, h, 10, hover ? 'rgba(80,15,15,0.95)' : 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(x, y, w, h, 10, hover ? '#ff6666' : '#8c1a1a', hover ? 2 : 1);
      r.drawText('Sair', x + w / 2, y + h / 2 + 7, hover ? '#ffb3b3' : '#e68080', 15, 'center', 'Rajdhani');
    }

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2, '#5ab4ff', 22, 'center', 'Rajdhani');
      return;
    }

    if (this._errorMsg) {
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H / 2, '#ff8888', 20, 'center', 'Rajdhani');
      return;
    }

    if (this._sorted.length === 0) {
      r.drawText('Nenhuma partida registrada ainda.', VIRTUAL_W / 2, VIRTUAL_H / 2 - 20, '#7c9eb5', 20, 'center', 'Rajdhani');
      r.drawText('Complete uma fase para ver seu desempenho aqui!', VIRTUAL_W / 2, VIRTUAL_H / 2 + 20, '#758891', 16, 'center', 'Rajdhani');
      return;
    }

    // Título
    r.drawText('DESEMPENHO POR LINHA', VIRTUAL_W / 2, 118, '#ffcc44', 17, 'center', 'Rajdhani');

    // Cards de fase
    const cardW = 1140;
    const cardH = 90;
    const cardX = (VIRTUAL_W - cardW) / 2;

    this._sorted.forEach((phase, idx) => {
      const pct    = Math.round(phase.accuracy * 100);
      const isTop  = idx === 0;
      const isLast = idx === this._sorted.length - 1 && this._sorted.length > 2;
      const rect   = this._phaseCards[idx] ? this._phaseCards[idx].rect : null;
      const hover  = rect ? this.input.isHover(rect) : false;
      const cardY  = rect ? rect.y : 0;

      const medals = ['🥇', '🥈', '🥉'];
      const medal  = idx < 3 ? medals[idx] : `#${idx + 1}`;

      let cardBg     = hover ? 'rgba(20,40,80,0.95)' : 'rgba(8,16,40,0.90)';
      let cardBorder = hover ? '#5ab4ff' : '#1a3060';
      if (isTop  && !hover) { cardBg = 'rgba(48,38,4,0.95)';  cardBorder = '#ffcc44'; }
      if (isTop  &&  hover) { cardBg = 'rgba(70,55,6,0.98)';  cardBorder = '#ffee88'; }
      if (isLast && !hover) { cardBg = 'rgba(40,8,8,0.90)';   cardBorder = '#8c2222'; }
      if (isLast &&  hover) { cardBg = 'rgba(60,12,12,0.95)'; cardBorder = '#cc4444'; }

      r.fillRoundRect(cardX, cardY, cardW, cardH, 10, cardBg);
      r.strokeRoundRect(cardX, cardY, cardW, cardH, 10, cardBorder, isTop ? 2.5 : 1.5);

      // Medalha / posição
      const medalColor = isTop ? '#ffcc44' : isLast ? '#cc4444' : '#5a8aaa';
      r.drawText(medal, cardX + 38, cardY + cardH / 2 + 9, medalColor, 22, 'center', 'Rajdhani');

      // Nome da fase
      r.drawText(phase.phaseName,
        cardX + 80, cardY + 30,
        isTop ? '#ffcc44' : '#d0e8ff', 18, 'left', 'Rajdhani');

      // V/D
      r.drawText(`✔ ${phase.victories} vitória${phase.victories !== 1 ? 's' : ''}`,
        cardX + 80, cardY + 58, '#44dd88', 13, 'left', 'Rajdhani');
      r.drawText(`✘ ${phase.defeats} derrota${phase.defeats !== 1 ? 's' : ''}`,
        cardX + 230, cardY + 58, '#ff6666', 13, 'left', 'Rajdhani');

      // Barra de acerto
      const barX = cardX + 430;
      const barW = 520;
      const barH = 24;
      const barY = cardY + (cardH - barH) / 2;
      const barColor = pct >= 70 ? '#44dd88' : pct >= 40 ? '#ffcc44' : '#ff5555';
      r.drawProgressBar(barX, barY, barW, barH,
        Math.round(pct), 100, barColor);

      // Percentual
      r.drawText(`${pct}%`,
        barX + barW + 14, barY + barH / 2 + 6,
        isTop ? '#ffcc44' : '#d0e8ff', 17, 'left', 'Rajdhani');



      // Indicador de clique
      r.drawText('▶', cardX + cardW - 30, cardY + cardH / 2 + 8,
        hover ? '#7ac8ff' : '#5a8aaa', 16, 'center', 'Rajdhani');
    });
  }
}

export default ProfileScene;
