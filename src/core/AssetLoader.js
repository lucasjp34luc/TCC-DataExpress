/**
 * @file AssetLoader.js
 * @description Gerencia o carregamento de imagens e assets do jogo.
 * Retorna promessas e rastreia progresso de carregamento.
 */

export class AssetLoader {
  constructor() {
    /** @type {Map<string, HTMLImageElement>} Cache de imagens carregadas */
    this.images = new Map();
    this.total = 0;
    this.loaded = 0;
    this.onProgress = null; // callback(percent)
  }

  /**
   * Carrega uma lista de imagens em paralelo.
   * @param {string[]} paths - Lista de caminhos de imagens
   * @returns {Promise<void>}
   */
  async loadImages(paths) {
    this.total += paths.length;
    const promises = paths.map(path => this._loadImage(path));
    await Promise.allSettled(promises);
  }

  /**
   * Carrega uma imagem individualmente.
   * @param {string} path
   * @returns {Promise<void>}
   */
  _loadImage(path) {
    return new Promise((resolve) => {
      if (this.images.has(path)) {
        this.loaded++;
        this._reportProgress();
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.images.set(path, img);
        this.loaded++;
        this._reportProgress();
        resolve();
      };
      img.onerror = () => {
        // Imagem não encontrada: cria placeholder colorido
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.fillText('?', 90, 110);
        // Converte canvas em imagem
        const placeholder = new Image();
        placeholder.src = canvas.toDataURL();
        placeholder.onload = () => {
          this.images.set(path, placeholder);
          this.loaded++;
          this._reportProgress();
          resolve();
        };
      };
      img.src = path;
    });
  }

  /** @param {string} path @returns {HTMLImageElement|null} */
  get(path) {
    return this.images.get(path) || null;
  }

  _reportProgress() {
    if (this.onProgress) {
      const pct = this.total > 0 ? Math.floor((this.loaded / this.total) * 100) : 100;
      this.onProgress(pct);
    }
  }

  /** Retorna percentual de carregamento 0-100 */
  getProgress() {
    return this.total > 0 ? Math.floor((this.loaded / this.total) * 100) : 100;
  }
}

export default AssetLoader;
