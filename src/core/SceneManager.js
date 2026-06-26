/**
 * @file SceneManager.js
 * @description Gerencia troca de cenas, transições e estado do jogo entre cenas.
 */

export class SceneManager {
  constructor() {
    /** @type {Map<string, Object>} Cenas registradas */
    this._scenes = new Map();
    /** @type {Object|null} Cena atual */
    this._current = null;
    this._currentName = null;

    /** Estado global compartilhado entre cenas */
    this.state = this._defaultState();

    /** Callback chamado após cada troca de cena: (name) => void */
    this.onSceneChange = null;
  }

  _defaultState() {
    return {
      phase: null,          // { id, name, listType, questions[] }
      character: null,      // dados do personagem selecionado
      player: null,         // estado dinâmico do jogador em batalha
      rooms: [],            // array de 5 tipos: 'enemy'|'mimic'|'shop'|'boss'
      currentRoom: 0,       // 0-4
      gold: 0,
      totalEnemiesDefeated: 0,
      questionsCorrect:     0,
      questionsWrong:       0,
      bossesDefeated:       0,
      mimicsHacked:         0,
      mimicsFought:         0,
      storyDone: false,
      // ── Navegação de lista ───────────────────────────────────────────────
      listCycle:    0,      // quantos ciclos completados (listas circulares)
      enemyScale:   1.0,    // multiplicador de HP/ATK dos inimigos por ciclo
      bossDefeated: false,  // boss do ciclo atual foi derrotado
      canFinish:    false,  // jogador pode encerrar a exploração (vitória)
      maxRoom:      0,      // maior sala desbloqueada (listas duplas)
      clearedRooms: new Set(), // salas limpas no ciclo atual (listas circulares)
      shopCycleItems: new Set(), // itens comprados na loja no ciclo atual
      currentUser:    null,     // { userId, username, profile } após login
      runQuestions:   []        // [{text, options, correct, chosen}] acumulado na run atual
    };
  }

  /** Reseta o estado para nova partida (preserva o usuário logado) */
  resetState() {
    const currentUser = this.state.currentUser;
    this.state = this._defaultState();
    this.state.currentUser = currentUser;
  }

  /** Reinicia a fase atual mantendo phase, storyDone e usuário logado */
  restartPhase() {
    const phase       = this.state.phase;
    const storyDone   = this.state.storyDone;
    const currentUser = this.state.currentUser;
    this.state = this._defaultState();
    this.state.phase       = phase;
    this.state.storyDone   = storyDone;
    this.state.currentUser = currentUser;
  }

  /**
   * Registra uma cena.
   * @param {string} name
   * @param {Object} scene - Objeto com enter(), exit(), update(dt), render(renderer)
   */
  register(name, scene) {
    this._scenes.set(name, scene);
    scene.manager = this;
  }

  /**
   * Troca para outra cena.
   * @param {string} name - Nome da cena registrada
   * @param {Object} [params] - Parâmetros opcionais para a cena
   */
  goto(name, params = {}) {
    if (this._current && typeof this._current.exit === 'function') {
      this._current.exit();
    }
    const scene = this._scenes.get(name);
    if (!scene) {
      console.error(`Cena "${name}" não encontrada.`);
      return;
    }
    this._current = scene;
    this._currentName = name;
    if (typeof scene.enter === 'function') {
      scene.enter(params);
    }
    if (typeof this.onSceneChange === 'function') {
      this.onSceneChange(name);
    }
  }

  /** Delega update para cena atual */
  update(dt) {
    if (this._current && typeof this._current.update === 'function') {
      this._current.update(dt);
    }
  }

  /** Delega render para cena atual */
  render(renderer) {
    if (this._current && typeof this._current.render === 'function') {
      this._current.render(renderer);
    }
  }

  /** Retorna nome da cena atual */
  getCurrentName() {
    return this._currentName;
  }
}

export default SceneManager;
