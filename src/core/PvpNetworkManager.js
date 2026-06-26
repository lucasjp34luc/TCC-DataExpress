/**
 * @file PvpNetworkManager.js
 * @description Gerencia a conexao WebSocket do cliente com o servidor PvP.
 * Singleton: use getPvpNetwork() para obter a instancia.
 */

// IP detectado automaticamente pelo hostname da pagina — funciona em localhost e em rede local.
// Usa wss:// para ser compatível com o servidor HTTPS (evita bloqueio de firewall e mixed-content).
const WS_URL = `wss://${window.location.hostname}:3000`;

class PvpNetworkManager {
  constructor() {
    this._ws        = null;
    this._handlers  = {};
    this._connected = false;
  }

  /**
   * Conecta ao servidor WebSocket.
   * Se ja estiver conectado, resolve imediatamente.
   * @returns {Promise<void>}
   */
  connect() {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // Fecha conexao anterior se houver
    if (this._ws) {
      this._ws.onopen    = null;
      this._ws.onerror   = null;
      this._ws.onmessage = null;
      this._ws.onclose   = null;
      this._ws.close();
    }

    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(WS_URL);

      this._ws.onopen = () => {
        this._connected = true;
        resolve();
      };

      this._ws.onerror = () => {
        reject(new Error(`Nao foi possivel conectar ao servidor PvP em ${WS_URL}`));
      };

      this._ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        const handlers = this._handlers[msg.type];
        if (handlers) handlers.forEach(h => h(msg));
      };

      this._ws.onclose = () => {
        this._connected = false;
        const handlers = this._handlers['_disconnect'];
        if (handlers) handlers.forEach(h => h());
      };
    });
  }

  /** Envia mensagem JSON ao servidor */
  send(msg) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Registra um handler para um tipo de mensagem.
   * @param {string} type - Tipo da mensagem (ou '_disconnect' para desconexao)
   * @param {Function} handler
   */
  on(type, handler) {
    if (!this._handlers[type]) this._handlers[type] = [];
    this._handlers[type].push(handler);
  }

  /** Remove um handler especifico */
  off(type, handler) {
    if (!this._handlers[type]) return;
    this._handlers[type] = this._handlers[type].filter(h => h !== handler);
  }

  /** Remove todos os handlers (chame no enter() de cada cena PvP) */
  clearHandlers() {
    this._handlers = {};
  }

  /** Fecha a conexao WebSocket */
  disconnect() {
    if (this._ws) {
      this._ws.onclose = null; // Evita disparar handler de desconexao
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
    this._handlers  = {};
  }

  isConnected() {
    return this._connected && this._ws && this._ws.readyState === WebSocket.OPEN;
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let _instance = null;

export function getPvpNetwork() {
  if (!_instance) _instance = new PvpNetworkManager();
  return _instance;
}

export default PvpNetworkManager;
