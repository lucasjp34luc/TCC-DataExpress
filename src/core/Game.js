/**
 * @file Game.js
 * @description Loop principal do jogo. Inicializa todos os subsistemas e cenas.
 * Ponto de entrada: importado pelo index.html.
 */

import { Renderer, VIRTUAL_W, VIRTUAL_H } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { AssetLoader } from './AssetLoader.js';
import { AudioManager } from './AudioManager.js';

// ─── Importação de cenas ────────────────────────────────────────────────────
import { LoginScene }        from '../scenes/LoginScene.js';
import { CreateAccountScene } from '../scenes/CreateAccountScene.js';
import { ProfileScene }      from '../scenes/ProfileScene.js';
import { AchievementsScene } from '../scenes/AchievementsScene.js';
import { ModeSelectScene }   from '../scenes/ModeSelectScene.js';
import { StoryScene }        from '../scenes/StoryScene.js';
import { PhaseSelectScene }  from '../scenes/PhaseSelectScene.js';
import { CharSelectScene }   from '../scenes/CharSelectScene.js';
import { MapScene }          from '../scenes/MapScene.js';
import { BattleScene }       from '../scenes/BattleScene.js';
import { MimicScene }        from '../scenes/MimicScene.js';
import { ShopScene }         from '../scenes/ShopScene.js';
import { MaintenanceScene }  from '../scenes/MaintenanceScene.js';
import { GameOverScene }     from '../scenes/GameOverScene.js';
import { VictoryScene }      from '../scenes/VictoryScene.js';
import { PvpSetupScene }     from '../scenes/PvpSetupScene.js';
import { PvpBattleScene }    from '../scenes/PvpBattleScene.js';
import { PvpResultScene }    from '../scenes/PvpResultScene.js';
import { SettingsScene }     from '../scenes/SettingsScene.js';
import { TutorialScene }    from '../scenes/TutorialScene.js';
import { RunHistoryScene }  from '../scenes/RunHistoryScene.js';
import { RunReviewScene }   from '../scenes/RunReviewScene.js';
import { RunReplayScene }   from '../scenes/RunReplayScene.js';
import { RankingScene }          from '../scenes/RankingScene.js';
import { TeacherProfileScene }   from '../scenes/TeacherProfileScene.js';
import { TeacherTutorialScene }  from '../scenes/TeacherTutorialScene.js';
import { ClassRoomScene }        from '../scenes/ClassRoomScene.js';
import { ClassQuestionsScene }   from '../scenes/ClassQuestionsScene.js';
import { ClassDashboardScene }   from '../scenes/ClassDashboardScene.js';
import { JoinClassScene }        from '../scenes/JoinClassScene.js';
import { EndingScene }           from '../scenes/EndingScene.js';

// ─── Lista completa de assets ───────────────────────────────────────────────
const ASSET_PATHS = [
  // Cenários
  'assets/image/Cenario/Cabine_Boss/Cabine_Chefe.png',
  'assets/image/Cenario/Cabine_Lacaio/Cabine_Sem_Acentos.png',
  'assets/image/Cenario/Cabine_Lacaio/Cabine_Acentos_Curtos.png',
  'assets/image/Cenario/Cabine_Lacaio/Cabine_Acentos_Longo.png',
  'assets/image/Cenario/Cabine_Mimico/Cabine_Mimico.png',
  // História
  'assets/image/Historia/Primeira pessoa/P_entrada_central.png',
  'assets/image/Historia/Primeira pessoa/P_lider_explicando.png',
  'assets/image/Historia/Primeira pessoa/P_lider_explicando2.png',
  'assets/image/Historia/Primeira pessoa/P_recepicao_sem_plataforma.png',
  'assets/image/Historia/Primeira pessoa/P_seleção_linha.png',
  'assets/image/Historia/Primeira pessoa/P_SOS.png',
  'assets/image/Historia/Primeira pessoa/P_lider_agradece.png',
  'assets/image/Historia/Primeira pessoa/P_nave_partida.png',
  // Itens
  'assets/image/Itens/Sem Fundo/Buff_Dano_5.png',
  'assets/image/Itens/Sem Fundo/Buff_Dano_10 - Copia.png',
  'assets/image/Itens/Sem Fundo/Buff_Dano_15.png',
  'assets/image/Itens/Sem Fundo/Buff_Vida_10.png',
  'assets/image/Itens/Sem Fundo/Buff_Dano_e_Vida_5.png',
  // Boss
  'assets/image/Inimigos/Boss/Armadura/Sem Fundo/Atacando/BossArmadura_Atacando.png',
  'assets/image/Inimigos/Boss/Armadura/Sem Fundo/Batalha/BossArmadura_Batalha.png',
  'assets/image/Inimigos/Boss/Armadura/Sem Fundo/Sofrendo Dano/BossArmadura_Sofrendo_Dano.png',
  // Lacaio
  'assets/image/Inimigos/Lacaios/Inimigo fraco/Sem Fundo/Atacando/Inimigo_Fraco_Atacando.png',
  'assets/image/Inimigos/Lacaios/Inimigo fraco/Sem Fundo/Batalha/Inimigo_Fraco_Batalha.png',
  'assets/image/Inimigos/Lacaios/Inimigo fraco/Sem Fundo/Sofrendo Dano/Inimigo_Fraco_Sofrendo_Dano.png',
  // Mímico
  'assets/image/Inimigos/Mimico/Sem Fundo/Atacando/Mimico_Atacando.png',
  'assets/image/Inimigos/Mimico/Sem Fundo/Batalha/Mimico_Batalha.png',
  'assets/image/Inimigos/Mimico/Sem Fundo/Bau/Mimico_Bau.png',
  'assets/image/Inimigos/Mimico/Sem Fundo/Sofrendo Dano/Mimico_Sofrendo_Dano.png',
  // Estudioso
  'assets/image/Personagens/Estudioso/Sem Fundo/Em Batalha/Batalha/Estudioso_Batalha.png',
  'assets/image/Personagens/Estudioso/Sem Fundo/Em Batalha/Atacando/Estudioso_Atacando.png',
  'assets/image/Personagens/Estudioso/Sem Fundo/Em Batalha/Sofrendo Dano/Estudioso_Sofrendo_Dano.png',
  // Assassino
  'assets/image/Personagens/Assasino/Sem Fundo/Em Batalha/Batalha/Assasino_Batalha.png',
  'assets/image/Personagens/Assasino/Sem Fundo/Em Batalha/Atacando/Assasino_Atacando.png',
  'assets/image/Personagens/Assasino/Sem Fundo/Em Batalha/Sofrendo Dano/Assasino_Sofrendo_Dano.png',
];

class Game {
  constructor() {
    this.canvas   = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input    = new InputManager(this.canvas, this.renderer);
    this.assets   = new AssetLoader();
    this.scenes   = new SceneManager();
    this.audio    = new AudioManager();

    this._lastTime = 0;
    this._running  = false;

    window.addEventListener('resize', () => this.renderer._resize());
  }

  async init() {
    this._showLoading(true);

    // Progresso de carregamento
    this.assets.onProgress = (pct) => {
      const fill = document.getElementById('loading-fill');
      const txt  = document.getElementById('loading-text');
      if (fill) fill.style.width = pct + '%';
      if (txt)  txt.textContent  = `Carregando assets... ${pct}%`;
    };

    await this.assets.loadImages(ASSET_PATHS);

    // Conecta AudioManager ao SceneManager
    this.scenes.onSceneChange = (name) => this.audio.onSceneChange(name);

    // Registra cenas passando dependências
    const deps = { assets: this.assets, input: this.input, audio: this.audio };

    // ── Autenticação / Perfil ────────────────────────────────────────────────
    this.scenes.register('login',         new LoginScene(deps));
    this.scenes.register('createAccount', new CreateAccountScene(deps));
    this.scenes.register('profile',       new ProfileScene(deps));
    this.scenes.register('achievements',  new AchievementsScene(deps));

    // ── Modo História ───────────────────────────────────────────────────────
    this.scenes.register('modeSelect',  new ModeSelectScene(deps));
    this.scenes.register('tutorial',    new TutorialScene(deps));
    this.scenes.register('story',       new StoryScene(deps));
    this.scenes.register('phaseSelect', new PhaseSelectScene(deps));
    this.scenes.register('charSelect',  new CharSelectScene(deps));
    this.scenes.register('map',         new MapScene(deps));
    this.scenes.register('battle',      new BattleScene(deps));
    this.scenes.register('mimic',       new MimicScene(deps));
    this.scenes.register('shop',        new ShopScene(deps));
    this.scenes.register('maintenance', new MaintenanceScene(deps));
    this.scenes.register('gameover',    new GameOverScene(deps));
    this.scenes.register('victory',     new VictoryScene(deps));
    this.scenes.register('ending',      new EndingScene(deps));

    // ── Modo PvP ────────────────────────────────────────────────────────────
    this.scenes.register('pvpSetup',    new PvpSetupScene(deps));
    this.scenes.register('pvpBattle',   new PvpBattleScene(deps));
    this.scenes.register('pvpResult',   new PvpResultScene(deps));

    // ── Histórico / Revisão de Runs ─────────────────────────────────────────
    this.scenes.register('runHistory',  new RunHistoryScene(deps));
    this.scenes.register('runReview',   new RunReviewScene(deps));
    this.scenes.register('runReplay',   new RunReplayScene(deps));
    this.scenes.register('ranking',     new RankingScene(deps));

    // ── Configurações ───────────────────────────────────────────────────────
    this.scenes.register('settings',    new SettingsScene(deps));

    // ── Sistema de Turmas ────────────────────────────────────────────────────
    this.scenes.register('teacherProfile',  new TeacherProfileScene(deps));
    this.scenes.register('teacherTutorial', new TeacherTutorialScene(deps));
    this.scenes.register('classRoom',       new ClassRoomScene(deps));
    this.scenes.register('classQuestions',  new ClassQuestionsScene(deps));
    this.scenes.register('classDashboard',  new ClassDashboardScene(deps));
    this.scenes.register('joinClass',       new JoinClassScene(deps));

    this._showLoading(false);
    this._running = true;

    // Verifica sessão salva (válida por 30 minutos)
    const SESSION_TTL = 30 * 60 * 1000;
    try {
      const raw = localStorage.getItem('dataexpress_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (Date.now() - session.loginTime < SESSION_TTL) {
          this.scenes.state.currentUser = {
            userId:   session.userId,
            username: session.username,
            role:     session.role    || 'aluno',
            classId:  session.classId || null,
            profile:  session.profile
          };
          if ((session.role || 'aluno') === 'professor') {
            this.scenes.goto('teacherProfile');
          } else {
            this.scenes.goto('modeSelect');
          }
        } else {
          localStorage.removeItem('dataexpress_session');
          this.scenes.goto('login');
        }
      } else {
        this.scenes.goto('login');
      }
    } catch {
      this.scenes.goto('login');
    }

    // Sobe o loop
    requestAnimationFrame(ts => this._loop(ts));
  }

  _loop(timestamp) {
    if (!this._running) return;

    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05); // max 50ms
    this._lastTime = timestamp;

    // Update
    this.scenes.update(dt);

    // Render
    this.renderer.begin();
    this.scenes.render(this.renderer);

    requestAnimationFrame(ts => this._loop(ts));
  }

  _showLoading(show) {
    const el = document.getElementById('loading-screen');
    if (el) el.style.display = show ? 'flex' : 'none';
  }
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init().catch(console.error);
});
