/**
 * @file AudioManager.js
 * @description Gerencia a trilha sonora do jogo com duas faixas:
 *   - Lobby: telas iniciais (modeSelect, story, phaseSelect, charSelect, settings)
 *   - Batalha: gameplay (map, battle, mimic, shop, maintenance, gameover, victory, pvp)
 * Persiste volume e mute em localStorage.
 */

const LOBBY_SCENES = new Set([
  'modeSelect', 'story', 'phaseSelect', 'charSelect', 'settings'
]);

export class AudioManager {
  constructor() {
    this._lobby  = new Audio('assets/music/Lobby.mp3');
    this._battle = new Audio('assets/music/Batalha.mp3');
    this._lobby.loop  = true;
    this._battle.loop = true;

    /** 'lobby' | 'battle' | null */
    this._current = null;
    this._volume  = 0.7;
    this._muted   = false;

    this._loadPrefs();
    this._applyVolume();

    // Tenta retomar reprodução após primeira interação do usuário
    // (necessário por políticas de autoplay dos navegadores)
    document.addEventListener('pointerdown', () => {
      if (this._current && !this._muted) {
        const audio = this._current === 'lobby' ? this._lobby : this._battle;
        if (audio.paused) audio.play().catch(() => {});
      }
    }, { once: true });
  }

  /**
   * Chamado pelo SceneManager ao trocar de cena.
   * @param {string} sceneName
   */
  onSceneChange(sceneName) {
    const track = LOBBY_SCENES.has(sceneName) ? 'lobby' : 'battle';
    this._play(track);
  }

  /** @param {number} v - 0.0 a 1.0 */
  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    this._applyVolume();
    this._savePrefs();
  }

  /** @param {boolean} m */
  setMuted(m) {
    this._muted = m;
    this._applyVolume();
    this._savePrefs();
    // Retoma reprodução ao desmutar
    if (!m && this._current) {
      const audio = this._current === 'lobby' ? this._lobby : this._battle;
      if (audio.paused) audio.play().catch(() => {});
    }
  }

  get volume() { return this._volume; }
  get muted()  { return this._muted;  }

  // ── Privado ────────────────────────────────────────────────────────────────

  _play(track) {
    const next = track === 'lobby' ? this._lobby  : this._battle;
    const prev = track === 'lobby' ? this._battle : this._lobby;

    if (this._current !== track) {
      prev.pause();
      prev.currentTime = 0;
      this._current = track;
    }

    if (!this._muted) {
      next.play().catch(() => {});
    }
  }

  _applyVolume() {
    const v = this._muted ? 0 : this._volume;
    this._lobby.volume  = v;
    this._battle.volume = v;
  }

  _loadPrefs() {
    try {
      const s = JSON.parse(localStorage.getItem('audioPrefs') || '{}');
      if (typeof s.volume === 'number') this._volume = Math.max(0, Math.min(1, s.volume));
      if (typeof s.muted  === 'boolean') this._muted  = s.muted;
    } catch { /* ignora erros de localStorage */ }
  }

  _savePrefs() {
    try {
      localStorage.setItem('audioPrefs', JSON.stringify({
        volume: this._volume,
        muted:  this._muted
      }));
    } catch { /* ignora */ }
  }
}

export default AudioManager;
