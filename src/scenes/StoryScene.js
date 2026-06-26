/**
 * @file StoryScene.js
 * @description Cena de introdução com imagens estáticas e texto narrativo.
 * Botões: "Próximo" e "Pular história".
 */

import { VIRTUAL_W, VIRTUAL_H, Renderer } from '../core/Renderer.js';

const STORY_SLIDES = [
  {
    image: 'assets/image/Historia/Primeira pessoa/P_SOS.png',
    text: 'Durante sua jornada espacial em busca de reconhecimento e conhecimento, o aventureiro intercepta uma mensagem de socorro vinda do Planeta Lista.'
  },
  {
    image: 'assets/image/Historia/Primeira pessoa/P_recepicao_sem_plataforma.png',
    text: 'Ao pousar na cidade central do planeta, ele é recebido pessoalmente pelo líder local, que o conduz solenemente até a sala de reunião.'
  },
  {
    image: 'assets/image/Historia/Primeira pessoa/P_lider_explicando.png',
    text: 'Já na sala, o líder passa a explicar a gravidade da situação: o planeta foi invadido por outra civilização e, após árduas batalhas, os defensores conseguiram conter as ameaças, mas parte dos invasores remanescentes refugiou-se na estação de trens, principal meio de transporte da população e do comércio.'
  },
  {
    image: 'assets/image/Historia/Primeira pessoa/P_lider_explicando2.png',
    text: 'Desde então, a estação permanece paralisada, pois toda tentativa de retomada é frustrada pelos invasores, que derrotam repetidamente as forças locais.'
  },
  {
    image: 'assets/image/Historia/Primeira pessoa/P_entrada_central.png',
    text: 'Com a situação esclarecida, o aventureiro se direciona e chega na estação central.'
  },
  {
    image: 'assets/image/Historia/Primeira pessoa/P_seleção_linha.png',
    text: 'Ao atravessar a entrada da estação, ele percebe que precisa decidir por qual linha de trem começará sua investida para derrotar os invasores.'
  }
];

export class StoryScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._slide  = 0;
    this._btnNext  = null;
    this._btnSkip  = null;
    this._alpha    = 1;
    this._fadeIn   = 0; // 0→1
  }

  enter() {
    const user = this.manager?.state?.currentUser;
    if (user && localStorage.getItem(`dataexpress_skip_story_${user.userId}`) === 'true') {
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

    // Botão "Próximo"
    this._btnNext = { x: VIRTUAL_W - 230, y: VIRTUAL_H - 80, w: 180, h: 50 };
    this.input.addButton(this._btnNext, () => this._next());

    // Botão "Pular"
    this._btnSkip = { x: 50, y: VIRTUAL_H - 80, w: 150, h: 50 };
    this.input.addButton(this._btnSkip, () => this._skip());
  }

  _next() {
    if (this._slide < STORY_SLIDES.length - 1) {
      this._slide++;
      this._fadeIn = 0;
    } else {
      this._skip();
    }
  }

  _skip() {
    this.manager.goto('phaseSelect');
  }

  update(dt) {
    this._fadeIn = Math.min(1, this._fadeIn + dt * 2);
  }

  render(r) {
    const slide = STORY_SLIDES[this._slide];
    const img   = this.assets.get(slide.image);

    // Fundo escuro
    r.clear('#0a0a1a');

    // Imagem do slide
    if (img) {
      r.drawImage(img, 0, 0, VIRTUAL_W, VIRTUAL_H * 0.75, this._fadeIn);
    }

    // Faixa inferior para texto
    r.fillRect(0, VIRTUAL_H * 0.68, VIRTUAL_W, VIRTUAL_H * 0.32, 'rgba(5,10,25,0.92)');
    r.drawLine(0, VIRTUAL_H * 0.68, VIRTUAL_W, VIRTUAL_H * 0.68, '#2a6aaa', 2);

    // Texto da narrativa
    r.drawWrappedText(slide.text, 60, VIRTUAL_H * 0.73, VIRTUAL_W - 120, 26, '#d0e8ff', 19, 'Rajdhani');

    // Indicador de slide
    const totalSlides = STORY_SLIDES.length;
    for (let i = 0; i < totalSlides; i++) {
      const cx = VIRTUAL_W / 2 - (totalSlides * 20) / 2 + i * 20 + 10;
      r.fillCircle(cx, VIRTUAL_H - 100, 5, i === this._slide ? '#5ab4ff' : '#334');
    }

    // Botão pular
    const skipHover = this.input.isHover(this._btnSkip);
    r.drawButton(this._btnSkip.x, this._btnSkip.y, this._btnSkip.w, this._btnSkip.h, 'Pular', skipHover, false, '#1a2a3a');

    // Botão próximo
    const nextLabel = this._slide < STORY_SLIDES.length - 1 ? 'Próximo ▶' : 'Começar ▶';
    const nextHover  = this.input.isHover(this._btnNext);
    r.drawButton(this._btnNext.x, this._btnNext.y, this._btnNext.w, this._btnNext.h, nextLabel, nextHover, false, '#1a3a6a');

  }
}

export default StoryScene;
