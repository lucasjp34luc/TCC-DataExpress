/**
 * @file EndingScene.js
 * @description Cena de final da história, exibida após o jogador completar
 * todas as fases. Exibe dois slides narrativos antes de retornar ao menu.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

const ENDING_SLIDES = [
  {
    image: 'assets/image/Historia/Primeira pessoa/P_lider_agradece.png',
    text: 'Com todas as linhas do metrô liberadas, o líder do Planeta Lista agradece pessoalmente ao aventureiro pela coragem e dedicação que salvaram a estação e devolveram a paz ao planeta.'
  },
  {
    image: 'assets/image/Historia/Primeira pessoa/P_nave_partida.png',
    text: 'Missão cumprida, o aventureiro embarca em sua nave e parte rumo a novos horizontes, levando consigo o conhecimento conquistado em cada batalha. O Planeta Lista jamais esquecerá seu nome.'
  }
];

export class EndingScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._slide  = 0;
    this._btnNext = null;
    this._btnSkip = null;
    this._fadeIn  = 0;
  }

  enter() {
    const user = this.manager?.state?.currentUser;
    if (user && localStorage.getItem(`dataexpress_skip_story_${user.userId}`) === 'true') {
      this.manager.resetState();
      this.manager.goto('phaseSelect');
      return;
    }
    this._slide  = 0;
    this._fadeIn = 0;
    this._setupButtons();
  }

  exit() {
    this.input.clearButtons();
  }

  _setupButtons() {
    this.input.clearButtons();

    this._btnNext = { x: VIRTUAL_W - 230, y: VIRTUAL_H - 80, w: 180, h: 50 };
    this.input.addButton(this._btnNext, () => this._next());

    this._btnSkip = { x: 50, y: VIRTUAL_H - 80, w: 150, h: 50 };
    this.input.addButton(this._btnSkip, () => this._finish());
  }

  _next() {
    if (this._slide < ENDING_SLIDES.length - 1) {
      this._slide++;
      this._fadeIn = 0;
    } else {
      this._finish();
    }
  }

  _finish() {
    this.manager.resetState();
    this.manager.goto('phaseSelect');
  }

  update(dt) {
    this._fadeIn = Math.min(1, this._fadeIn + dt * 2);
  }

  render(r) {
    const slide = ENDING_SLIDES[this._slide];
    const img   = this.assets.get(slide.image);

    r.clear('#0a0a1a');

    if (img) {
      r.drawImage(img, 0, 0, VIRTUAL_W, VIRTUAL_H * 0.75, this._fadeIn);
    }

    // Faixa inferior para texto
    r.fillRect(0, VIRTUAL_H * 0.68, VIRTUAL_W, VIRTUAL_H * 0.32, 'rgba(5,10,25,0.92)');
    r.drawLine(0, VIRTUAL_H * 0.68, VIRTUAL_W, VIRTUAL_H * 0.68, '#ffcc44', 2);

    r.drawWrappedText(slide.text, 60, VIRTUAL_H * 0.73, VIRTUAL_W - 120, 26, '#ffeebb', 19, 'Rajdhani');

    // Indicador de slide
    for (let i = 0; i < ENDING_SLIDES.length; i++) {
      const cx = VIRTUAL_W / 2 - (ENDING_SLIDES.length * 20) / 2 + i * 20 + 10;
      r.fillCircle(cx, VIRTUAL_H - 100, 5, i === this._slide ? '#ffcc44' : '#443300');
    }

    // Botão pular
    const skipHover = this.input.isHover(this._btnSkip);
    r.drawButton(this._btnSkip.x, this._btnSkip.y, this._btnSkip.w, this._btnSkip.h, 'Pular', skipHover, false, '#1a2a3a');

    // Botão próximo / fim
    const nextLabel = this._slide < ENDING_SLIDES.length - 1 ? 'Próximo ▶' : 'Fim ▶';
    const nextHover = this.input.isHover(this._btnNext);
    r.drawButton(this._btnNext.x, this._btnNext.y, this._btnNext.w, this._btnNext.h, nextLabel, nextHover, false, '#3a2a00');
  }
}

export default EndingScene;
