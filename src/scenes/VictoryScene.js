/**
 * @file VictoryScene.js
 * @description Tela de vitória após derrotar o boss.
 */
import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

export class VictoryScene {
  constructor({ assets, input }) {
    this.assets      = assets;
    this.input       = input;
    this.manager     = null;
    this._btnNew     = null;
    this._btnPhases  = null;
    this._btnReplay  = null;
    this._anim       = 0;
    this._stars      = [];
  }

  _allPhasesCompleted(userId) {
    const PHASE_IDS = ['lista_encadeada', 'lista_circular', 'lista_dupla', 'lista_dupla_circular', 'todas_as_listas'];
    return PHASE_IDS.every(id => {
      try {
        const val = JSON.parse(localStorage.getItem(`phase_completion_${userId}_${id}`) || 'null');
        return val && val.completed === true;
      } catch { return false; }
    });
  }

  enter() {
    this._anim = 0;
    this._showEnding = false;

    // Salva resultado no servidor se houver usuário logado
    const user = this.manager.state.currentUser;
    const st   = this.manager.state;

    // Persiste selo de conclusão localmente (medal ou troféu)
    if (st.phase && user) {
      const key     = `phase_completion_${user.userId}_${st.phase.id}`;
      const perfect = (st.questionsWrong || 0) === 0;
      const existing = JSON.parse(localStorage.getItem(key) || 'null');
      // Nunca rebaixa: se já tem troféu, mantém troféu
      localStorage.setItem(key, JSON.stringify({
        completed: true,
        perfect: existing?.perfect === true ? true : perfect
      }));

      // Verifica se todas as fases estão concluídas E modo história ativado
      const skipStory = localStorage.getItem(`dataexpress_skip_story_${user.userId}`) === 'true';
      this._showEnding = this._allPhasesCompleted(user.userId) && !skipStory;
    }

    if (user && st.phase && !st._resultPosted) {
      st._resultPosted = true;
      const total = (st.questionsCorrect || 0) + (st.questionsWrong || 0);
      fetch(`https://${window.location.hostname}:3000/player/result`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId:           user.userId,
          phaseId:          st.phase.id,
          phaseName:        st.phase.name,
          won:              true,
          questionsCorrect: st.questionsCorrect || 0,
          totalAnswers:     total,
          listCycle:        st.listCycle        || 0,
          runQuestions:     st.runQuestions    || []
        })
      })
        .then(r => r.json())
        .then(data => { if (data.success) user.profile = data.profile; })
        .catch(() => {});
    }

    // Gera estrelas aleatórias para animação
    this._stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * VIRTUAL_W,
      y: Math.random() * VIRTUAL_H,
      speed: 20 + Math.random() * 60,
      size: 1 + Math.random() * 3,
      alpha: Math.random()
    }));

    this.input.clearButtons();

    // Três botões centralizados (largura total: 3×180 + 2×20 = 580)
    const btnY = VIRTUAL_H - 90;
    const btnW = 180;
    const btnH = 50;
    const startX = VIRTUAL_W / 2 - 290;

    this._btnPhases = { x: startX, y: btnY, w: btnW, h: btnH };
    this.input.addButton(this._btnPhases, () => {
      this.manager.resetState();
      this.manager.goto(this._showEnding ? 'ending' : 'phaseSelect');
    });

    this._btnReplay = { x: startX + btnW + 20, y: btnY, w: btnW, h: btnH };
    this.input.addButton(this._btnReplay, () => {
      this.manager.state.replayReturnTo = 'victory';
      this.manager.goto('runReplay');
    });

    this._btnNew = { x: startX + (btnW + 20) * 2, y: btnY, w: btnW, h: btnH };
    this.input.addButton(this._btnNew, () => {
      this.manager.restartPhase();
      this.manager.goto('charSelect');
    });
  }

  exit() { this.input.clearButtons(); }

  update(dt) {
    this._anim += dt;
    for (const s of this._stars) {
      s.y -= s.speed * dt;
      if (s.y < 0) { s.y = VIRTUAL_H; s.x = Math.random() * VIRTUAL_W; }
      s.alpha = 0.3 + 0.7 * Math.abs(Math.sin(this._anim * 0.5 + s.x));
    }
  }

  render(r) {
    r.drawGradientBg('#040812', '#08122a');

    // Estrelas cadentes
    for (const s of this._stars) {
      r.fillCircle(s.x, s.y, s.size, '#ffcc44', s.alpha * 0.6);
    }

    const st = this.manager.state;
    const phase = st.phase;
    const player = st.player;

    // Brilho central
    const glow = 0.15 + 0.1 * Math.sin(this._anim * 1.5);
    r.fillCircle(VIRTUAL_W / 2, VIRTUAL_H / 2, 300, `rgba(255,200,50,${glow})`);

    r.drawTextShadow('🏆 VITÓRIA!', VIRTUAL_W / 2, 120, '#ffcc00', 60, 'center', 'Rajdhani');
    r.drawText('Linha liberada com sucesso!', VIRTUAL_W / 2, 185, '#ffaa00', 22, 'center', 'Rajdhani');

    if (phase) {
      r.drawText(`Fase: ${phase.name}`, VIRTUAL_W / 2, 220, phase.color, 18, 'center', 'Rajdhani');
    }

    // Stats da corrida
    const isCyclic = phase && (phase.listType === 'circular' || phase.listType === 'doubly_circular');
    const boxH = isCyclic ? 250 : 225;
    r.fillRoundRect(VIRTUAL_W / 2 - 260, 245, 520, boxH, 12, 'rgba(5,12,30,0.92)');
    r.strokeRoundRect(VIRTUAL_W / 2 - 260, 245, 520, boxH, 12, '#ffcc00', 2);

    r.drawText('RESUMO DA JORNADA', VIRTUAL_W / 2, 272, '#ffcc44', 16, 'center', 'Rajdhani');
    r.drawLine(VIRTUAL_W / 2 - 220, 284, VIRTUAL_W / 2 + 220, 284, '#332200', 1);

    const total = (st.questionsCorrect || 0) + (st.questionsWrong || 0);
    r.drawText(`Perguntas respondidas: ${total}`, VIRTUAL_W / 2, 308, '#8ab4c8', 15, 'center', 'Rajdhani');
    r.drawText(`✔ ${st.questionsCorrect || 0} corretas`, VIRTUAL_W / 2 - 20, 328, '#44dd88', 14, 'right', 'Rajdhani');
    r.drawText(`✘ ${st.questionsWrong || 0} incorretas`, VIRTUAL_W / 2 + 20, 328, '#ff6666', 14, 'left', 'Rajdhani');

    r.drawText(`Bosses derrotados: ${st.bossesDefeated || 0}`, VIRTUAL_W / 2, 354, '#ff8800', 15, 'center', 'Rajdhani');
    r.drawText(`Mímicos hackeados: ${st.mimicsHacked || 0}`, VIRTUAL_W / 2, 378, '#cc44ff', 15, 'center', 'Rajdhani');
    r.drawText(`Mímicos enfrentados: ${st.mimicsFought || 0}`, VIRTUAL_W / 2, 402, '#ff88ff', 15, 'center', 'Rajdhani');

    if (isCyclic) {
      r.drawText(`Ciclos realizados: ${st.listCycle || 0}`, VIRTUAL_W / 2, 426, '#44ccff', 15, 'center', 'Rajdhani');
    }

    r.drawText('O metrô está salvo! A linha voltou a funcionar.', VIRTUAL_W / 2, 516, '#8a9aaa', 15, 'center', 'Rajdhani');

    // Botões
    if (this._btnPhases) {
      const hover = this.input.isHover(this._btnPhases);
      const label = this._showEnding ? '★ Ver Final ▶' : '▶ Outra Linha';
      const color = this._showEnding ? '#3a2a00' : '#1a3a6a';
      r.drawButton(this._btnPhases.x, this._btnPhases.y, this._btnPhases.w, this._btnPhases.h,
        label, hover, false, color);
    }
    if (this._btnReplay) {
      const hover = this.input.isHover(this._btnReplay);
      r.drawButton(this._btnReplay.x, this._btnReplay.y, this._btnReplay.w, this._btnReplay.h,
        '📋 Ver Run', hover, false, '#1a2a3a');
    }
    if (this._btnNew) {
      const hover = this.input.isHover(this._btnNew);
      r.drawButton(this._btnNew.x, this._btnNew.y, this._btnNew.w, this._btnNew.h,
        '↺ Jogar Novamente', hover, false, '#2a4a1a');
    }
  }
}

export default VictoryScene;
