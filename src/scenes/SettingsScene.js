/**
 * @file SettingsScene.js
 * @description Tela de configurações do jogo. Seção "Som" com controle
 * de volume e ativar/desativar música. Seção "História" aparece após
 * concluir todas as fases, permitindo pular introdução e final.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

// ── Layout ────────────────────────────────────────────────────────────────────
const CARD_W      = 760;
const CARD_X      = (VIRTUAL_W - CARD_W) / 2;
const CARD_Y      = 110;

// A seção "SOM" ocupa 175px; "HISTÓRIA" (opcional) acrescenta 110px
const SOM_SEC_H   = 175;
const STORY_SEC_H = 110;
const CARD_H_BASE = SOM_SEC_H;

// Slider de volume — centrado em rowVolY = CARD_Y + 80
const SLIDER_W    = 320;
const SLIDER_H    = 14;
const SLIDER_X    = CARD_X + CARD_W - SLIDER_W - 60;
const SLIDER_Y    = CARD_Y + 80 - SLIDER_H / 2;

// Toggles
const TOG_W       = 130;
const TOG_H       = 38;
const TOG_X       = CARD_X + CARD_W - TOG_W - 60;
const MUTE_TOG_Y  = CARD_Y + 116;                    // centro em +135
const STORY_TOG_Y = CARD_Y + SOM_SEC_H + 38;         // centro em +232

const BACK_BTN    = { x: 50, y: 35, w: 150, h: 46 };

const PHASE_IDS = [
  'lista_encadeada', 'lista_circular',
  'lista_dupla', 'lista_dupla_circular', 'todas_as_listas',
];

export class SettingsScene {
  constructor({ assets, input, audio }) {
    this.assets  = assets;
    this.input   = input;
    this.audio   = audio;
    this.manager = null;

    this._anim   = 0;
    this._stars  = [];

    this._sliderRect = { x: SLIDER_X - 10, y: SLIDER_Y - 10, w: SLIDER_W + 20, h: SLIDER_H + 20 };
    this._muteRect   = { x: TOG_X, y: MUTE_TOG_Y,  w: TOG_W, h: TOG_H };
    this._storyRect  = { x: TOG_X, y: STORY_TOG_Y, w: TOG_W, h: TOG_H };

    this._showStoryToggle = false;
    this._skipStory       = false;
    this._cardH           = CARD_H_BASE;
  }

  // ── Helpers de persistência ────────────────────────────────────────────────
  _allPhasesCompleted(userId) {
    return PHASE_IDS.every(id => {
      try {
        const val = JSON.parse(localStorage.getItem(`phase_completion_${userId}_${id}`) || 'null');
        return val && val.completed === true;
      } catch { return false; }
    });
  }

  _loadSkipStory(userId) {
    if (!userId) return false;
    return localStorage.getItem(`dataexpress_skip_story_${userId}`) === 'true';
  }

  _saveSkipStory(userId, val) {
    if (!userId) return;
    localStorage.setItem(`dataexpress_skip_story_${userId}`, String(val));
  }

  // ── Ciclo de vida ──────────────────────────────────────────────────────────
  enter(params = {}) {
    this._from  = params.from || 'modeSelect';
    this._anim  = 0;
    this._stars = Array.from({ length: 80 }, () => ({
      x:     Math.random() * VIRTUAL_W,
      y:     Math.random() * VIRTUAL_H,
      size:  0.5 + Math.random() * 2,
      alpha: Math.random(),
    }));

    const user = this.manager?.state?.currentUser;
    this._showStoryToggle = user ? this._allPhasesCompleted(user.userId) : false;
    this._skipStory       = this._loadSkipStory(user?.userId);
    this._cardH           = this._showStoryToggle ? CARD_H_BASE + STORY_SEC_H : CARD_H_BASE;

    this.input.clearButtons();

    // Slider de volume
    this.input.addButton(this._sliderRect, (clickX) => {
      const ratio = (clickX - SLIDER_X) / SLIDER_W;
      this.audio.setVolume(ratio);
    });

    // Toggle mute
    this.input.addButton(this._muteRect, () => {
      this.audio.setMuted(!this.audio.muted);
    });

    // Toggle história (só quando todas as fases concluídas)
    if (this._showStoryToggle) {
      this.input.addButton(this._storyRect, () => {
        this._skipStory = !this._skipStory;
        this._saveSkipStory(user?.userId, this._skipStory);
      });
    }

    // Botão voltar
    this.input.addButton(BACK_BTN, () => {
      const resumeScenes = new Set(['pvpSetup']);
      const backParams   = resumeScenes.has(this._from) ? { resume: true } : {};
      this.manager.goto(this._from, backParams);
    });
  }

  exit() {
    this.input.clearButtons();
  }

  update(dt) {
    this._anim += dt;
    for (const s of this._stars) {
      s.alpha = 0.2 + 0.8 * Math.abs(Math.sin(this._anim * 0.4 + s.x * 0.01));
    }
  }

  // ── Renderização ───────────────────────────────────────────────────────────
  render(r) {
    // Fundo
    r.drawGradientBg('#04060f', '#080e1e');
    for (const s of this._stars) {
      r.fillCircle(s.x, s.y, s.size, '#8ab4cc', s.alpha * 0.5);
    }

    // ── Cabeçalho padrão ──────────────────────────────────────────────────
    r.drawTextShadow('CONFIGURAÇÕES', VIRTUAL_W / 2, 48, '#5ab4ff', 30, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#1a3a5c', 1);

    // Botão voltar (canto superior esquerdo)
    r.drawButton(
      BACK_BTN.x, BACK_BTN.y, BACK_BTN.w, BACK_BTN.h,
      '◀ Voltar', this.input.isHover(BACK_BTN), false, '#1a2a3a',
    );

    // ── Card principal ────────────────────────────────────────────────────
    r.fillRoundRect(CARD_X, CARD_Y, CARD_W, this._cardH, 14, 'rgba(8,18,40,0.92)');
    r.strokeRoundRect(CARD_X, CARD_Y, CARD_W, this._cardH, 14, '#1a4a8c', 2);

    // ── Seção: SOM ────────────────────────────────────────────────────────
    r.drawText('SOM', CARD_X + 28, CARD_Y + 36, '#5ab4ff', 18, 'left', 'Rajdhani');

    // Linha: Volume da Música
    const rowVolY = CARD_Y + 80;
    r.drawText('Volume da Música', CARD_X + 28, rowVolY + 6, '#a8cfe0', 17, 'left', 'Rajdhani');

    r.fillRoundRect(SLIDER_X, SLIDER_Y, SLIDER_W, SLIDER_H, 7, 'rgba(26,74,140,0.4)');
    r.strokeRoundRect(SLIDER_X, SLIDER_Y, SLIDER_W, SLIDER_H, 7, '#1a4a8c', 1);

    const fillW = Math.max(0, Math.min(SLIDER_W, SLIDER_W * this.audio.volume));
    if (fillW > 0) {
      r.fillRoundRect(SLIDER_X, SLIDER_Y, fillW, SLIDER_H, 7, '#5ab4ff');
    }

    const thumbX = SLIDER_X + fillW;
    r.fillCircle(thumbX, SLIDER_Y + SLIDER_H / 2, 12, '#ffffff');
    r.fillCircle(thumbX, SLIDER_Y + SLIDER_H / 2, 9, '#5ab4ff');

    const pct = Math.round(this.audio.volume * 100);
    r.drawText(`${pct}%`, SLIDER_X + SLIDER_W + 22, rowVolY + 6, '#a8cfe0', 16, 'left', 'Rajdhani');

    // Linha: Música (mute)
    const muteCenterY = MUTE_TOG_Y + TOG_H / 2;
    r.drawText('Música', CARD_X + 28, muteCenterY + 6, '#a8cfe0', 17, 'left', 'Rajdhani');
    this._drawToggle(r, this._muteRect, !this.audio.muted);

    // ── Seção: HISTÓRIA (apenas após concluir todas as fases) ─────────────
    if (this._showStoryToggle) {
      const divY = CARD_Y + SOM_SEC_H;
      r.drawLine(CARD_X + 20, divY, CARD_X + CARD_W - 20, divY, '#1a3a5c', 1);
      r.drawText('HISTÓRIA', CARD_X + 28, divY + 30, '#5ab4ff', 18, 'left', 'Rajdhani');

      const storyCenterY = STORY_TOG_Y + TOG_H / 2;
      r.drawText('Modo História', CARD_X + 28, storyCenterY + 6, '#a8cfe0', 17, 'left', 'Rajdhani');
      this._drawToggle(r, this._storyRect, !this._skipStory);
    }
  }

  /**
   * Desenha um botão de toggle On/Off padronizado.
   * @param {object} r     Renderer
   * @param {object} rect  { x, y, w, h }
   * @param {boolean} on   Estado atual
   */
  _drawToggle(r, rect, on) {
    const hover   = this.input.isHover(rect);
    const bgAlpha = hover ? 0.98 : 0.90;

    const bg     = on
      ? `rgba(12,48,18,${bgAlpha})`
      : `rgba(60,12,12,${bgAlpha})`;
    const border = on
      ? (hover ? '#66ff88' : '#1a8c33')
      : (hover ? '#ff6666' : '#8c1a1a');
    const label  = on ? 'Ativado'  : 'Desativado';
    const color  = on ? '#88ccaa'  : '#cc8888';

    r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 8, bg);
    r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 8, border, 2);
    r.drawText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 6, color, 16, 'center', 'Rajdhani');
  }
}

export default SettingsScene;
