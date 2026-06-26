/**
 * @file ShopScene.js
 * @description Loja de itens onde o jogador pode comprar melhorias com ouro.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';
import { ITEMS } from '../data/items.js';

export class ShopScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;
    this._itemBtns   = [];
    this._btnLeave   = null;
    this._msgTimer   = 0;
    this._msg        = '';
    this._msgColor   = '#fff';
    this._anim       = 0;
  }

  enter() {
    this._anim     = 0;
    this._msgTimer = 0;
    this._msg      = '';
    this._setupButtons();
  }

  exit() {
    this.input.clearButtons();
    this._itemBtns = [];
  }

  _setupButtons() {
    this.input.clearButtons();
    this._itemBtns = [];

    const cols    = 3;
    const cardW   = 240;
    const cardH   = 200;
    const gapX    = 40;
    const gapY    = 20;
    const rows    = Math.ceil(ITEMS.length / cols);
    const totalW  = cols * cardW + (cols - 1) * gapX;
    const startX  = (VIRTUAL_W - totalW) / 2;
    const startY  = 150;

    ITEMS.forEach((item, i) => {
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      const bx   = startX + col * (cardW + gapX);
      const by   = startY + row * (cardH + gapY);
      const rect = { x: bx, y: by, w: cardW, h: cardH };
      this._itemBtns.push({ rect, item });
      this.input.addButton(rect, () => this._buy(item));
    });

    // Botão sair
    this._btnLeave = { x: VIRTUAL_W / 2 - 100, y: VIRTUAL_H - 75, w: 200, h: 46 };
    this.input.addButton(this._btnLeave, () => {
      const st = this.manager.state;
      st.clearedRooms = st.clearedRooms || new Set();
      st.clearedRooms.add(st.currentRoom);
      st.currentRoom++;
      st.maxRoom = Math.max(st.maxRoom || 0, st.currentRoom);
      this.manager.goto('map');
    });
  }

  _buy(item) {
    const st = this.manager.state;
    if (st.gold < item.cost) {
      this._msg      = '💰 Ouro insuficiente!';
      this._msgColor = '#ff4444';
      this._msgTimer = 2;
      return;
    }
    st.shopCycleItems = st.shopCycleItems || new Set();
    if (st.shopCycleItems.has(item.id)) {
      this._msg      = 'Você já comprou este item neste ciclo!';
      this._msgColor = '#ffcc44';
      this._msgTimer = 2;
      return;
    }

    st.gold           -= item.cost;
    st.player.atk     += item.effect.atk;
    st.player.baseAtk += item.effect.atk;
    // Reaplica bônus passivo do Assassino preservando o percentual acumulado
    if (st.player.character.passive.id === 'golpe_critico' && st.player.atkBonusPct) {
      st.player.atk = Math.round(st.player.baseAtk * (1 + st.player.atkBonusPct));
    }
    st.player.maxHp  += item.effect.hp;
    const _heal = item.effect.healPercent
      ? Math.floor(st.player.maxHp * item.effect.healPercent)
      : item.effect.hp;
    st.player.hp = Math.min(st.player.hp + _heal, st.player.maxHp);
    st.shopCycleItems.add(item.id);
    if (!st.player.items.includes(item.id)) st.player.items.push(item.id);

    this._msg      = `✔ ${item.name} comprado!`;
    this._msgColor = '#44dd88';
    this._msgTimer = 2;
  }

  update(dt) {
    this._anim += dt;
    if (this._msgTimer > 0) this._msgTimer -= dt;
  }

  render(r) {
    r.drawGradientBg('#080510', '#120d20');

    // Título
    r.drawTextShadow('🛒 LOJA DO VAGÃO', VIRTUAL_W / 2, 50, '#44dd88', 28, 'center', 'Rajdhani');
    r.drawLine(100, 72, VIRTUAL_W - 100, 72, '#1a3a2a', 1);

    // Status do jogador
    const st     = this.manager.state;
    const player = st.player;
    r.fillRoundRect(30, 82, 250, 52, 8, 'rgba(5,15,10,0.85)');
    r.strokeRoundRect(30, 82, 250, 52, 8, '#1a3a2a', 1);
    r.drawText(`❤ HP: ${player.hp}/${player.maxHp}`, 50, 103, '#44dd44', 14, 'left', 'Rajdhani');
    r.drawText(`⚔ ATK: ${player.atk}`, 50, 124, '#ffcc44', 14, 'left', 'Rajdhani');

    r.fillRoundRect(VIRTUAL_W - 200, 82, 170, 52, 8, 'rgba(5,15,10,0.85)');
    r.strokeRoundRect(VIRTUAL_W - 200, 82, 170, 52, 8, '#443300', 1);
    r.drawText(`💰 ${st.gold} ouro`, VIRTUAL_W - 115, 113, '#ffcc44', 18, 'center', 'Rajdhani');

    // Cards de itens
    for (const btn of this._itemBtns) {
      const { rect, item } = btn;
      const owned  = (st.shopCycleItems || new Set()).has(item.id);
      const canBuy = !owned && st.gold >= item.cost;
      const hover  = this.input.isHover(rect);

      const bg     = owned   ? 'rgba(10,30,10,0.6)'
                   : hover   ? 'rgba(15,50,25,0.95)'
                   : canBuy  ? 'rgba(8,22,12,0.9)'
                   :           'rgba(20,10,10,0.7)';
      const border = owned   ? '#1a4a2a'
                   : hover   ? '#44dd88'
                   : canBuy  ? '#1a5a2a'
                   :           '#3a1a1a';

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 10, bg);
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 10, border, hover ? 2 : 1);

      // Imagem do item
      const itemImg = this.assets.get(item.image);
      if (itemImg) {
        r.drawImage(itemImg, rect.x + rect.w / 2 - 35, rect.y + 15, 70, 70, owned ? 0.4 : 1);
      } else {
        r.drawText('📦', rect.x + rect.w / 2, rect.y + 60, '#aaa', 36, 'center', 'Arial');
      }

      // Nome e descrição
      r.drawText(item.name, rect.x + rect.w / 2, rect.y + 98, owned ? '#779977' : '#44dd88', 15, 'center', 'Rajdhani');
      r.drawWrappedText(item.description, rect.x + 12, rect.y + 118, rect.w - 24, 18,
        owned ? '#88aa88' : '#7ab4a8', 12, 'Rajdhani');

      // Preço
      if (owned) {
        r.drawText('✔ Comprado', rect.x + rect.w / 2, rect.y + rect.h - 18, '#779977', 13, 'center', 'Rajdhani');
      } else {
        r.drawText(`💰 ${item.cost}`, rect.x + rect.w / 2, rect.y + rect.h - 18,
          canBuy ? '#ffcc44' : '#664444', 14, 'center', 'Rajdhani');
      }
    }

    // Mensagem feedback
    if (this._msgTimer > 0) {
      const alpha = Math.min(1, this._msgTimer);
      r.ctx.save();
      r.ctx.globalAlpha = alpha;
      r.fillRoundRect(VIRTUAL_W / 2 - 200, VIRTUAL_H - 115, 400, 36, 8, 'rgba(0,0,0,0.85)');
      r.drawText(this._msg, VIRTUAL_W / 2, VIRTUAL_H - 93, this._msgColor, 16, 'center', 'Rajdhani');
      r.ctx.restore();
    }

    // Botão sair
    const leaveHover = this.input.isHover(this._btnLeave);
    r.drawButton(this._btnLeave.x, this._btnLeave.y, this._btnLeave.w, this._btnLeave.h,
      'Sair da Loja ▶', leaveHover, false, '#1a2a1a');
  }
}

export default ShopScene;
