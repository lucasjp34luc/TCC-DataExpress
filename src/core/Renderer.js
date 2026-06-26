/**
 * @file Renderer.js
 * @description Renderizador próprio baseado em Canvas 2D.
 * Mantém um sistema de coordenadas virtual (1280x720) e escala para o tamanho real.
 */

export const VIRTUAL_W = 1280;
export const VIRTUAL_H = 720;

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this._resize();
  }

  /** Adapta o canvas ao tamanho da janela mantendo proporção 16:9 */
  _resize() {
    const win_w = window.innerWidth;
    const win_h = window.innerHeight;
    const ratio = VIRTUAL_W / VIRTUAL_H;

    let w, h;
    if (win_w / win_h > ratio) {
      h = win_h;
      w = h * ratio;
    } else {
      w = win_w;
      h = w / ratio;
    }

    this.canvas.width = Math.floor(w);
    this.canvas.height = Math.floor(h);
    this.scale = w / VIRTUAL_W;
    this.offsetX = (win_w - w) / 2;
    this.offsetY = (win_h - h) / 2;

    this.canvas.style.position = 'absolute';
    this.canvas.style.left = this.offsetX + 'px';
    this.canvas.style.top = this.offsetY + 'px';
  }

  /** Deve ser chamado no início de cada frame */
  begin() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Limpa com cor sólida */
  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ─── Conversão de coordenadas ─────────────────────────────────────────────

  /** Converte coordenada virtual para pixel real */
  vx(x) { return x * this.scale; }
  vy(y) { return y * this.scale; }
  vw(w) { return w * this.scale; }
  vh(h) { return h * this.scale; }

  /** Converte pixel real para coordenada virtual */
  toVirtual(px, py) {
    return { x: px / this.scale, y: py / this.scale };
  }

  // ─── Primitivas de desenho ────────────────────────────────────────────────

  /**
   * Desenha imagem no espaço virtual.
   * @param {HTMLImageElement} img
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {number} [alpha=1]
   */
  drawImage(img, x, y, w, h, alpha = 1) {
    if (!img) return;
    const prev = this.ctx.globalAlpha;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, this.vx(x), this.vy(y), this.vw(w), this.vh(h));
    this.ctx.globalAlpha = prev;
  }

  /**
   * Desenha imagem com filtro de desfoque (para mímico).
   */
  drawImageBlurred(img, x, y, w, h) {
    if (!img) return;
    this.ctx.save();
    this.ctx.filter = 'blur(8px)';
    this.ctx.drawImage(img, this.vx(x), this.vy(y), this.vw(w), this.vh(h));
    this.ctx.filter = 'none';
    this.ctx.restore();
  }

  /**
   * Retângulo preenchido.
   */
  fillRect(x, y, w, h, color, alpha = 1) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.vx(x), this.vy(y), this.vw(w), this.vh(h));
    this.ctx.restore();
  }

  /**
   * Retângulo com borda.
   */
  strokeRect(x, y, w, h, color, lineWidth = 2) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.vw(lineWidth);
    this.ctx.strokeRect(this.vx(x), this.vy(y), this.vw(w), this.vh(h));
    this.ctx.restore();
  }

  /**
   * Retângulo com bordas arredondadas.
   */
  fillRoundRect(x, y, w, h, r, color, alpha = 1) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this._roundRectPath(x, y, w, h, r);
    this.ctx.fill();
    this.ctx.restore();
  }

  /**
   * Retângulo arredondado com borda.
   */
  strokeRoundRect(x, y, w, h, r, color, lineWidth = 2) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.vw(lineWidth);
    this._roundRectPath(x, y, w, h, r);
    this.ctx.stroke();
    this.ctx.restore();
  }

  _roundRectPath(x, y, w, h, r) {
    const rx = this.vx(x), ry = this.vy(y), rw = this.vw(w), rh = this.vh(h), rr = this.vw(r);
    this.ctx.beginPath();
    this.ctx.moveTo(rx + rr, ry);
    this.ctx.lineTo(rx + rw - rr, ry);
    this.ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
    this.ctx.lineTo(rx + rw, ry + rh - rr);
    this.ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
    this.ctx.lineTo(rx + rr, ry + rh);
    this.ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
    this.ctx.lineTo(rx, ry + rr);
    this.ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
    this.ctx.closePath();
  }

  /**
   * Texto simples.
   * @param {string} text @param {number} x @param {number} y
   * @param {string} [color] @param {number} [size] em px virtuais
   * @param {string} [align] 'left'|'center'|'right'
   * @param {string} [font]
   */
  drawText(text, x, y, color = '#fff', size = 18, align = 'left', font = 'Rajdhani') {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.font = `${this.vh(size)}px '${font}', sans-serif`;
    this.ctx.fillText(text, this.vx(x), this.vy(y));
    this.ctx.restore();
  }

  /**
   * Texto com sombra.
   */
  drawTextShadow(text, x, y, color = '#fff', size = 18, align = 'left', font = 'Rajdhani') {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.textAlign = align;
    this.ctx.font = `bold ${this.vh(size)}px '${font}', sans-serif`;
    this.ctx.fillText(text, this.vx(x) + 2, this.vy(y) + 2);
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, this.vx(x), this.vy(y));
    this.ctx.restore();
  }

  /**
   * Texto com quebra de linha automática.
   * @param {string} text @param {number} x @param {number} y
   * @param {number} maxW largura máxima virtual
   * @param {number} lineH altura de linha virtual
   * @param {string} color @param {number} size
   * @returns {number} Y final após o texto
   */
  drawWrappedText(text, x, y, maxW, lineH, color = '#fff', size = 16, font = 'Rajdhani') {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = `${this.vh(size)}px '${font}', sans-serif`;
    this.ctx.textAlign = 'left';

    const paragraphs = text.split('\n');
    let cy = y;

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let line = '';
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        const metrics = this.ctx.measureText(test);
        if (metrics.width > this.vw(maxW) && line) {
          this.ctx.fillText(line, this.vx(x), this.vy(cy));
          line = word;
          cy += lineH;
        } else {
          line = test;
        }
      }
      if (line) {
        this.ctx.fillText(line, this.vx(x), this.vy(cy));
        cy += lineH;
      }
    }
    this.ctx.restore();
    return cy;
  }

  /**
   * Botão estilizado - retorna { x, y, w, h } em coordenadas virtuais para hit testing.
   */
  drawButton(x, y, w, h, label, hover = false, disabled = false, color = '#1a3a5c') {
    const bg     = disabled ? '#333' : hover ? '#2a5a8c' : color;
    const border = disabled ? '#555' : hover ? '#5ab4ff' : '#2a6aaa';
    const text   = disabled ? '#666' : '#fff';

    this.fillRoundRect(x, y, w, h, 8, bg, disabled ? 0.6 : 1);
    this.strokeRoundRect(x, y, w, h, 8, border, 2);
    this.drawText(label, x + w / 2, y + h / 2 + 7, text, 18, 'center', 'Rajdhani');
    return { x, y, w, h };
  }

  /**
   * Barra de progresso (HP, etc).
   */
  drawProgressBar(x, y, w, h, value, max, colorFill, colorBg = '#222', label = null) {
    const pct = Math.max(0, Math.min(1, value / max));
    this.fillRoundRect(x, y, w, h, 4, colorBg);
    if (pct > 0) {
      this.fillRoundRect(x, y, w * pct, h, 4, colorFill);
    }
    this.strokeRoundRect(x, y, w, h, 4, '#000', 1);
    if (label) {
      this.drawText(label, x + w / 2, y + h / 2 + 5, '#fff', 12, 'center');
    }
  }

  /**
   * Overlay escuro semi-transparente.
   */
  drawOverlay(alpha = 0.7) {
    this.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H, '#000', alpha);
  }

  /** Gradiente vertical de fundo */
  drawGradientBg(colorTop, colorBottom) {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, colorTop);
    grad.addColorStop(1, colorBottom);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Linha */
  drawLine(x1, y1, x2, y2, color, lineW = 1) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.vw(lineW);
    this.ctx.beginPath();
    this.ctx.moveTo(this.vx(x1), this.vy(y1));
    this.ctx.lineTo(this.vx(x2), this.vy(y2));
    this.ctx.stroke();
    this.ctx.restore();
  }

  /** Círculo preenchido */
  fillCircle(cx, cy, r, color, alpha = 1) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(this.vx(cx), this.vy(cy), this.vw(r), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  /**
   * Verifica se ponto (px, py) em coordenadas virtuais está dentro do rect.
   */
  static hitTest(rect, px, py) {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  }
}

export default Renderer;
