/**
 * @file CharSelectScene.js
 * @description Tela de seleção de personagem com visualização de stats e passiva.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { CHARACTERS } from '../data/characters.js';

export class CharSelectScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;
    this._buttons = [];
    this._selected = null;
    this._btnConfirm = null;
    this._btnBack    = null;
    this._anim = 0;
  }

  enter() {
    this._selected = null;
    this._anim     = 0;
    this._setupButtons();
  }

  exit() {
    this.input.clearButtons();
    this._buttons = [];
  }

  _setupButtons() {
    this.input.clearButtons();
    this._buttons = [];

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
      this.input.addButton(rect, () => this._selectChar(char, rect));
    });

    // Botão voltar
    this._btnBack = { x: 50, y: 35, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => this.manager.goto('phaseSelect'));

    // Botão confirmar
    this._btnConfirm = { x: VIRTUAL_W - 230, y: 35, w: 180, h: 46 };
    this.input.addButton(this._btnConfirm, () => this._confirm());
  }

  _selectChar(char, rect) {
    this._selected = char;
  }

  _confirm() {
    if (!this._selected) return;
    const c  = this._selected;
    const st = this.manager.state;
    st.character = c;
    st.player = {
      hp:        c.hp,
      maxHp:     c.hp,
      atk:       c.atk,
      baseAtk:   c.atk,
      character: c,
      items:     []
    };
    st.gold = 0;
    // Reinicia estado de navegação de lista
    st.listCycle    = 0;
    st.enemyScale   = 1.0;
    st.bossDefeated = false;
    st.canFinish    = false;
    st.maxRoom      = 0;
    st.clearedRooms    = new Set();
    st.shopCycleItems  = new Set();
    // Gera os tipos de sala
    this._generateRooms();
    this.manager.goto('map');
  }

  _generateRooms() {
    const rand = () => {
      const r = Math.random();
      if (r < 0.60) return 'enemy';
      if (r < 0.80) return 'mimic';
      return 'maintenance';
    };
    const types = [
      'enemy',       // vagão 1 — sempre inimigo
      rand(),        // vagão 2 — inimigo, mímico ou manutenção
      'shop',        // vagão 3 — sempre loja
      rand(),        // vagão 4 — inimigo, mímico ou manutenção
      'boss'         // vagão 5 — sempre boss
    ];
    this.manager.state.rooms     = types;
    this.manager.state.baseRooms = [...types]; // cópia original para restaurar nos ciclos
    this.manager.state.currentRoom = 0;
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#080b18', '#111a2e');

    // Título
    r.drawTextShadow('ESCOLHA SEU PERSONAGEM', VIRTUAL_W / 2, 50, '#5ab4ff', 28, 'center', 'Rajdhani');

    const phase = this.manager.state.phase;
    if (phase) {
      r.drawText(`Fase: ${phase.name}`, VIRTUAL_W / 2, 90, phase.color, 16, 'center', 'Rajdhani');
    }

    r.drawLine(50, 110, VIRTUAL_W - 50, 110, '#1a3a5c', 1);

    // Cards de personagens
    for (const btn of this._buttons) {
      const { rect, char } = btn;
      const isSelected = this._selected && this._selected.id === char.id;
      const hover       = this.input.isHover(rect);

      // Background card
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        isSelected ? 'rgba(30,70,130,0.95)' : hover ? 'rgba(20,45,90,0.9)' : 'rgba(10,20,45,0.85)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 12,
        isSelected ? char.color : hover ? '#2a5a9c' : '#1a3060', isSelected ? 3 : 2);

      // Sprite do personagem
      const sprPath  = char.sprites.idle;
      const spr      = this.assets.get(sprPath);
      const sprH     = Math.floor(rect.h * 0.46);
      const sprY     = isSelected ? -3 * Math.sin(this._anim * 2) : 0;
      if (spr) {
        r.drawImage(spr, rect.x + 30, rect.y + 15 + sprY, rect.w - 60, sprH);
      } else {
        r.fillRoundRect(rect.x + 30, rect.y + 15, rect.w - 60, sprH, 8, char.color + '44');
        r.drawText('?', rect.x + rect.w / 2, rect.y + 15 + sprH / 2 + sprY, char.color, 60, 'center', 'Rajdhani');
      }

      // Nome
      const nameY = rect.y + sprH + 30;
      r.drawTextShadow(char.name, rect.x + rect.w / 2, nameY, char.color, 22, 'center', 'Rajdhani');

      // Stats
      const sy = nameY + 28;
      r.drawText(`❤ HP: ${char.hp}`,   rect.x + 20, sy,      '#ff6666', 14, 'left', 'Rajdhani');
      r.drawText(`⚔ ATK: ${char.atk}`, rect.x + 20, sy + 22, '#ffcc44', 14, 'left', 'Rajdhani');

      // Passiva
      const passY = sy + 50;
      const passH = rect.y + rect.h - passY - 8;
      r.fillRoundRect(rect.x + 10, passY, rect.w - 20, passH, 6, 'rgba(0,0,0,0.4)');
      r.drawText(`✦ ${char.passive.name}`, rect.x + 20, passY + 18, char.color, 13, 'left', 'Rajdhani');
      r.drawWrappedText(char.passive.description, rect.x + 20, passY + 36, rect.w - 40, 18, '#8ab4c8', 12, 'Rajdhani');

      // Label "selecionado" abaixo do card
      if (isSelected) {
        r.drawText('✔ SELECIONADO', rect.x + rect.w / 2, rect.y + rect.h + 18, char.color, 13, 'center', 'Rajdhani');
      }
    }

    // Botão voltar
    const backHover = this.input.isHover(this._btnBack);
    r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h, '◀ Voltar', backHover, false, '#1a2a3a');

    // Botão confirmar
    const confirmHover    = this.input.isHover(this._btnConfirm);
    const confirmDisabled = !this._selected;
    r.drawButton(this._btnConfirm.x, this._btnConfirm.y, this._btnConfirm.w, this._btnConfirm.h,
      'Confirmar ▶', confirmHover, confirmDisabled, '#1a4a2a');

  }
}

export default CharSelectScene;
