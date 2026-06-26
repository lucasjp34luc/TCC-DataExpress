/**
 * @file InputManager.js
 * @description Gerencia eventos de mouse e toque, convertendo para coordenadas virtuais.
 */

import { VIRTUAL_W, VIRTUAL_H } from './Renderer.js';

export class InputManager {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./Renderer.js').Renderer} renderer
   */
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;

    /** Posição atual do mouse em coordenadas virtuais */
    this.mouseX = 0;
    this.mouseY = 0;

    /** Callbacks de clique registrados pelas cenas: [{rect, callback}] */
    this._clickHandlers = [];

    /** Callback genérico para clique simples */
    this._onClick = null;

    this._bindEvents();
  }

  _bindEvents() {
    // Mouse
    this.canvas.addEventListener('mousemove', e => this._onMove(e));
    this.canvas.addEventListener('click',     e => this._onMouseClick(e));

    // Touch
    this.canvas.addEventListener('touchmove',  e => { e.preventDefault(); this._onTouch(e); }, { passive: false });
    this.canvas.addEventListener('touchend',   e => { e.preventDefault(); this._onTouchEnd(e); }, { passive: false });
  }

  /** Converte evento de mouse para coordenadas virtuais */
  _toVirtual(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return this.renderer.toVirtual(px, py);
  }

  _onMove(e) {
    const v = this._toVirtual(e);
    this.mouseX = v.x;
    this.mouseY = v.y;
    const overButton = this._clickHandlers.some(({ rect }) =>
      v.x >= rect.x && v.x <= rect.x + rect.w &&
      v.y >= rect.y && v.y <= rect.y + rect.h
    );
    this.canvas.style.cursor = overButton ? 'pointer' : 'default';
  }

  _onMouseClick(e) {
    const v = this._toVirtual(e);
    this._fireClick(v.x, v.y);
  }

  _onTouch(e) {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const v = this.renderer.toVirtual(t.clientX - rect.left, t.clientY - rect.top);
      this.mouseX = v.x;
      this.mouseY = v.y;
    }
  }

  _onTouchEnd(e) {
    if (e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const v = this.renderer.toVirtual(t.clientX - rect.left, t.clientY - rect.top);
      this._fireClick(v.x, v.y);
    }
  }

  _fireClick(x, y) {
    // Dispara handlers registrados
    for (const { rect, callback } of this._clickHandlers) {
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        callback(x, y);
        return; // Consome o primeiro hit
      }
    }
    // Callback genérico
    if (this._onClick) this._onClick(x, y);
  }

  /**
   * Registra um botão clicável.
   * @param {{x,y,w,h}} rect - Em coordenadas virtuais
   * @param {Function} callback
   * @returns {number} id para remoção
   */
  addButton(rect, callback) {
    const id = Date.now() + Math.random();
    this._clickHandlers.push({ id, rect, callback });
    return id;
  }

  /** Remove todos os botões registrados */
  clearButtons() {
    this._clickHandlers = [];
  }

  /** Define callback genérico de clique (não baseado em rect) */
  setOnClick(cb) {
    this._onClick = cb;
  }

  /** Verifica se o mouse está sobre um rect (para hover) */
  isHover(rect) {
    return this.mouseX >= rect.x && this.mouseX <= rect.x + rect.w &&
           this.mouseY >= rect.y && this.mouseY <= rect.y + rect.h;
  }
}

export default InputManager;
