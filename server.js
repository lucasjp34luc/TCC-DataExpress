/**
 * @file server.js
 * @description Servidor WebSocket para o Modo PvP do MetroQuiz.
 * Gerencia salas, perguntas e calculos de dano entre dois jogadores.
 *
 * Uso: node server.js
 * Porta padrao: 3000
 */

const https            = require('https');
const os               = require('os');
const fs               = require('fs');
const path             = require('path');
const crypto           = require('crypto');
const selfsigned       = require('selfsigned');
const { WebSocketServer, WebSocket } = require('ws');

// ─── Certificado TLS auto-assinado (gerado em memória) ────────────────────────
// Permite HTTPS/WSS sem precisar instalar certificado externo.
// O navegador vai exibir aviso de "não confiável" na primeira vez — basta
// clicar em "Avançado → Prosseguir" para aceitar o certificado local.
const _pems = selfsigned.generate(
  [{ name: 'commonName', value: 'localhost' }],
  { days: 3650, algorithm: 'sha256' }
);

const PORT = process.env.PORT || 3000;

// ─── Persistência de jogadores ───────────────────────────────────────────────
const PLAYERS_FILE = path.join(__dirname, 'players.json');

function loadPlayers() {
  try {
    if (fs.existsSync(PLAYERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
      if (!data.classes) data.classes = {};
      return data;
    }
  } catch {}
  return { players: {}, classes: {} };
}

function savePlayers(data) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(JSON.stringify(data));
}

function getLocalIP() {
  // Preferencia: redes privadas reais (192.168.x.x ou 10.x.x.x)
  // Evita adaptadores virtuais Hyper-V/WSL (tipicamente 172.x.x.x)
  const candidates = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      const ip = iface.address;
      if (ip.startsWith('192.168.') || ip.startsWith('10.')) return ip;
      candidates.push(ip);
    }
  }
  return candidates[0] || 'localhost';
}

const CYCLIC_PHASES = new Set(['lista_circular', 'lista_dupla_circular', 'todas_as_listas']);

function _buildRanking(data, phaseId) {
  const isCyclic = CYCLIC_PHASES.has(phaseId);
  const entries  = [];

  for (const [userId, player] of Object.entries(data.players)) {
    const h = (player.history || {})[phaseId];
    if (!h || !h.victories) continue;

    const winRuns = (h.runs || []).filter(r => r.won);

    let bestAccuracy = 0;
    let hasPerfect   = false;
    let bestCycles   = 0;
    for (const run of winRuns) {
      if (run.totalAnswers > 0) {
        const acc = run.questionsCorrect / run.totalAnswers;
        if (acc > bestAccuracy) bestAccuracy = acc;
        if (run.questionsCorrect === run.totalAnswers) hasPerfect = true;
      }
      if ((run.listCycle || 0) > bestCycles) bestCycles = run.listCycle || 0;
    }

    entries.push({ userId, username: player.username, victories: h.victories, bestAccuracy, hasPerfect, bestCycles });
  }

  if (isCyclic) {
    entries.sort((a, b) => b.bestCycles - a.bestCycles || b.victories - a.victories || b.bestAccuracy - a.bestAccuracy);
  } else {
    entries.sort((a, b) => b.victories - a.victories || b.bestAccuracy - a.bestAccuracy);
  }

  let rank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0) {
      const prev = entries[i - 1];
      const curr = entries[i];
      const tied = isCyclic
        ? curr.bestCycles === prev.bestCycles && curr.victories === prev.victories && curr.bestAccuracy === prev.bestAccuracy
        : curr.victories === prev.victories && curr.bestAccuracy === prev.bestAccuracy;
      if (!tied) rank = i + 1;
    }
    entries[i].rank = rank;
  }

  return entries;
}

const httpServer = https.createServer({ key: _pems.private, cert: _pems.cert }, async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  if (req.url === '/server-ip') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ip: getLocalIP() }));
    return;
  }

  // ── POST /auth/register ──────────────────────────────────────────────────
  if (req.url === '/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const { username, password, role } = body;
    if (!username || !password) {
      sendJson(res, 400, { success: false, message: 'Nome e senha são obrigatórios.' });
      return;
    }
    const validRole = role === 'professor' ? 'professor' : 'aluno';
    const data = loadPlayers();
    const exists = Object.values(data.players).some(p => p.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      sendJson(res, 409, { success: false, message: 'Nome de usuário já existe.' });
      return;
    }
    const userId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    data.players[userId] = {
      username,
      passwordHash: hashPassword(password),
      role: validRole,
      classId: null,
      createdAt: new Date().toISOString(),
      history: {}
    };
    savePlayers(data);
    sendJson(res, 201, { success: true, userId, username, role: validRole, classId: null, profile: { history: {} } });
    return;
  }

  // ── POST /auth/login ─────────────────────────────────────────────────────
  if (req.url === '/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { username, password } = body;
    const data = loadPlayers();
    const entry = Object.entries(data.players)
      .find(([, p]) => p.username.toLowerCase() === (username || '').toLowerCase());
    if (!entry || entry[1].passwordHash !== hashPassword(password || '')) {
      sendJson(res, 401, { success: false, message: 'Nome ou senha incorretos.' });
      return;
    }
    const [userId, player] = entry;
    const role    = player.role    || 'aluno';
    const classId = player.classId || null;
    sendJson(res, 200, { success: true, userId, username: player.username, role, classId, profile: { history: player.history } });
    return;
  }

  // ── POST /player/result ──────────────────────────────────────────────────
  if (req.url === '/player/result' && req.method === 'POST') {
    const body = await parseBody(req);
    const { userId, phaseId, phaseName, won, questionsCorrect, totalAnswers, listCycle, runQuestions } = body;
    const data = loadPlayers();
    if (!data.players[userId]) {
      sendJson(res, 404, { success: false, message: 'Usuário não encontrado.' });
      return;
    }
    const player = data.players[userId];
    if (!player.history[phaseId]) {
      player.history[phaseId] = { phaseName, victories: 0, defeats: 0, totalCorrect: 0, totalAnswers: 0, runs: [] };
    }
    const h = player.history[phaseId];
    h.phaseName    = phaseName;
    if (!h.runs) h.runs = [];
    if (won) h.victories++; else h.defeats++;
    h.totalCorrect += questionsCorrect || 0;
    h.totalAnswers += totalAnswers    || 0;
    h.runs.push({
      timestamp:        new Date().toISOString(),
      won:              !!won,
      questionsCorrect: questionsCorrect || 0,
      totalAnswers:     totalAnswers     || 0,
      listCycle:        listCycle        || 0,
      questions:        Array.isArray(runQuestions) ? runQuestions : [],
      classId:          player.classId   || null
    });
    if (h.runs.length > 20) h.runs = h.runs.slice(-20);
    savePlayers(data);
    sendJson(res, 200, { success: true, profile: { history: player.history } });
    return;
  }

  // ── GET /player/runs/:userId/:phaseId ────────────────────────────────────
  const runsMatch = req.url.match(/^\/player\/runs\/([^/]+)\/(.+)$/);
  if (runsMatch && req.method === 'GET') {
    const [, userId, phaseId] = runsMatch;
    const data = loadPlayers();
    if (!data.players[userId]) {
      sendJson(res, 404, { success: false, message: 'Usuário não encontrado.' });
      return;
    }
    const h = (data.players[userId].history || {})[phaseId] || {};
    const allRuns = h.runs || [];
    const runs    = allRuns.slice(-5).reverse(); // últimas 5, mais recente primeiro
    sendJson(res, 200, { success: true, runs });
    return;
  }

  // ── GET /player/profile/:userId ──────────────────────────────────────────
  const profileMatch = req.url.match(/^\/player\/profile\/(.+)$/);
  if (profileMatch && req.method === 'GET') {
    const userId = profileMatch[1];
    const data   = loadPlayers();
    if (!data.players[userId]) {
      sendJson(res, 404, { success: false, message: 'Usuário não encontrado.' });
      return;
    }
    const p = data.players[userId];
    sendJson(res, 200, { success: true, username: p.username, profile: { history: p.history } });
    return;
  }

  // ── GET /ranking/:phaseId ────────────────────────────────────────────────
  const rankingMatch = req.url.match(/^\/ranking\/([^/]+)$/);
  if (rankingMatch && req.method === 'GET') {
    const phaseId = rankingMatch[1];
    const data    = loadPlayers();
    const ranking = _buildRanking(data, phaseId);
    sendJson(res, 200, { success: true, phaseId, count: ranking.length, ranking });
    return;
  }

  // ── GET /achievements/stats ──────────────────────────────────────────────
  if (req.url === '/achievements/stats' && req.method === 'GET') {
    const data    = loadPlayers();
    const players = Object.values(data.players);
    const total   = players.length;

    const ACHIEVEMENT_IDS = [
      'first_win','veteran','champion','legend',
      'explorer','traveler','line_master',
      'good_student','specialist','perfect','all_perfect_master',
      'insistent','overcome',
      // Por fase
      'enc_first','enc_veteran','enc_master',
      'cir_first','cir_loops','cir_master','cir_perfect',
      'dup_first','dup_veteran','dup_master',
      'dcir_first','dcir_loops','dcir_master','dcir_perfect',
      'all_first','all_veteran','all_legend',
    ];

    const counts = {};
    for (const id of ACHIEVEMENT_IDS) counts[id] = 0;

    for (const player of players) {
      const phaseH = player.history || {};
      const phases = Object.values(phaseH);

      const totalVictories = phases.reduce((s, p) => s + (p.victories || 0), 0);
      const totalDefeats   = phases.reduce((s, p) => s + (p.defeats   || 0), 0);
      const phasesPlayed   = phases.filter(p => (p.victories || 0) + (p.defeats || 0) > 0).length;
      const bestAccuracy   = phases.reduce((best, p) => {
        const acc = p.totalAnswers > 0 ? p.totalCorrect / p.totalAnswers : 0;
        return acc > best ? acc : best;
      }, 0);

      let hasPerfect = false;
      outer: for (const ph of phases) {
        for (const run of (ph.runs || [])) {
          if (run.won && run.totalAnswers > 0 && run.questionsCorrect === run.totalAnswers) {
            hasPerfect = true;
            break outer;
          }
        }
      }

      const phVictories    = (id) => (phaseH[id] || {}).victories || 0;
      const phAccuracy     = (id) => {
        const ph = phaseH[id] || {};
        return ph.totalAnswers > 0 ? ph.totalCorrect / ph.totalAnswers : 0;
      };
      const phMaxCycles    = (id) =>
        ((phaseH[id] || {}).runs || []).reduce((m, r) => Math.max(m, r.listCycle || 0), 0);
      const phHasPerfectRun = (id) =>
        ((phaseH[id] || {}).runs || []).some(r => r.won && r.totalAnswers > 0 && r.questionsCorrect === r.totalAnswers);

      // ── Gerais ─────────────────────────────────────────────────────────────
      if (totalVictories >= 1)                         counts.first_win++;
      if (totalVictories >= 10)                        counts.veteran++;
      if (totalVictories >= 25)                        counts.champion++;
      if (totalVictories >= 50)                        counts.legend++;
      if (phasesPlayed   >= 2)                         counts.explorer++;
      if (phasesPlayed   >= 4)                         counts.traveler++;
      if (phasesPlayed   >= 5)                         counts.line_master++;
      if (bestAccuracy   >= 0.70)                      counts.good_student++;
      if (bestAccuracy   >= 0.90)                      counts.specialist++;
      if (hasPerfect)                                  counts.perfect++;
      if (totalDefeats   >= 5)                         counts.insistent++;
      if (totalVictories >= 20 && totalDefeats >= 10)  counts.overcome++;

      const PHASE_IDS = ['lista_encadeada','lista_circular','lista_dupla','lista_dupla_circular','todas_as_listas'];
      const allPhasePerfect = PHASE_IDS.every(id => phAccuracy(id) >= 1.00 || phHasPerfectRun(id));
      if (allPhasePerfect)                             counts.all_perfect_master++;

      // ── Linha Encadeada ────────────────────────────────────────────────────
      if (phVictories('lista_encadeada') >= 1)                                     counts.enc_first++;
      if (phVictories('lista_encadeada') >= 5)                                     counts.enc_veteran++;
      if (phAccuracy('lista_encadeada')  >= 1.00 || phHasPerfectRun('lista_encadeada')) counts.enc_master++;

      // ── Linha Circular ─────────────────────────────────────────────────────
      if (phVictories('lista_circular') >= 1)                                      counts.cir_first++;
      if (phMaxCycles('lista_circular') >= 5)                                      counts.cir_loops++;
      if (phMaxCycles('lista_circular') >= 10)                                     counts.cir_master++;
      if (phAccuracy('lista_circular')  >= 1.00 || phHasPerfectRun('lista_circular'))  counts.cir_perfect++;

      // ── Linha Dupla ────────────────────────────────────────────────────────
      if (phVictories('lista_dupla') >= 1)                                         counts.dup_first++;
      if (phVictories('lista_dupla') >= 5)                                         counts.dup_veteran++;
      if (phAccuracy('lista_dupla')  >= 1.00 || phHasPerfectRun('lista_dupla'))    counts.dup_master++;

      // ── Linha Dupla Circular ───────────────────────────────────────────────
      if (phVictories('lista_dupla_circular') >= 1)                                counts.dcir_first++;
      if (phMaxCycles('lista_dupla_circular') >= 5)                                counts.dcir_loops++;
      if (phMaxCycles('lista_dupla_circular') >= 10)                               counts.dcir_master++;
      if (phAccuracy('lista_dupla_circular')  >= 1.00 || phHasPerfectRun('lista_dupla_circular')) counts.dcir_perfect++;

      // ── Todas as Listas ────────────────────────────────────────────────────
      if (phVictories('todas_as_listas') >= 1)                                     counts.all_first++;
      if (phVictories('todas_as_listas') >= 3)                                     counts.all_veteran++;
      if (phAccuracy('todas_as_listas')  >= 1.00 || phHasPerfectRun('todas_as_listas')) counts.all_legend++;
    }

    const stats = {};
    for (const id of ACHIEVEMENT_IDS) {
      stats[id] = total > 0 ? Math.round((counts[id] / total) * 100) : 0;
    }

    sendJson(res, 200, { success: true, total, stats });
    return;
  }

  // ── GET /classes/owned/:userId ───────────────────────────────────────────
  const ownedMatch = req.url.match(/^\/classes\/owned\/(.+)$/);
  if (ownedMatch && req.method === 'GET') {
    const ownerId = ownedMatch[1];
    const data    = loadPlayers();
    const classes = Object.entries(data.classes || {})
      .filter(([, c]) => c.ownerId === ownerId)
      .map(([classId, c]) => ({ classId, name: c.name, studentCount: (c.students || []).length, createdAt: c.createdAt }));
    sendJson(res, 200, { success: true, classes });
    return;
  }

  // ── POST /class/create ───────────────────────────────────────────────────
  if (req.url === '/class/create' && req.method === 'POST') {
    const body = await parseBody(req);
    const { ownerId, name } = body;
    if (!ownerId || !name || !name.trim()) {
      sendJson(res, 400, { success: false, message: 'ownerId e nome são obrigatórios.' });
      return;
    }
    const data = loadPlayers();
    if (!data.players[ownerId]) {
      sendJson(res, 404, { success: false, message: 'Usuário não encontrado.' });
      return;
    }
    const existingCount = Object.values(data.classes || {}).filter(c => c.ownerId === ownerId).length;
    if (existingCount >= 5) {
      sendJson(res, 400, { success: false, message: 'Limite de 5 turmas atingido.' });
      return;
    }
    const slug    = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'TURMA';
    let   classId;
    let   attempts = 0;
    do {
      const digits = String(Math.floor(Math.random() * 900) + 100);
      classId = slug + digits;
      attempts++;
    } while ((data.classes || {})[classId] && attempts < 20);

    if (!data.classes) data.classes = {};
    data.classes[classId] = {
      name: name.trim(),
      ownerId,
      createdAt: new Date().toISOString(),
      students: [],
      questions: {
        lista_encadeada: [], lista_circular: [],
        lista_dupla: [], lista_dupla_circular: [], todas_as_listas: []
      }
    };
    savePlayers(data);
    sendJson(res, 201, { success: true, classId, name: name.trim() });
    return;
  }

  // ── GET /class/:classId ──────────────────────────────────────────────────
  const classGetMatch = req.url.match(/^\/class\/([^/]+)$/);
  if (classGetMatch && req.method === 'GET') {
    const classId = classGetMatch[1];
    const data    = loadPlayers();
    const cls     = (data.classes || {})[classId];
    if (!cls) {
      sendJson(res, 404, { success: false, message: 'Turma não encontrada.' });
      return;
    }
    const students = (cls.students || []).map(uid => ({
      userId:   uid,
      username: (data.players[uid] || {}).username || uid
    }));
    sendJson(res, 200, { success: true, class: { classId, name: cls.name, ownerId: cls.ownerId, students, questions: cls.questions || {} } });
    return;
  }

  // ── DELETE /class/:classId ───────────────────────────────────────────────
  const classDelMatch = req.url.match(/^\/class\/([^/]+)$/);
  if (classDelMatch && req.method === 'DELETE') {
    const classId = classDelMatch[1];
    const data    = loadPlayers();
    const cls     = (data.classes || {})[classId];
    if (!cls) {
      sendJson(res, 404, { success: false, message: 'Turma não encontrada.' });
      return;
    }
    // Cascade: zerar classId dos alunos
    for (const uid of (cls.students || [])) {
      if (data.players[uid]) data.players[uid].classId = null;
    }
    delete data.classes[classId];
    savePlayers(data);
    sendJson(res, 200, { success: true });
    return;
  }

  // ── POST /class/:classId/join ────────────────────────────────────────────
  const joinMatch = req.url.match(/^\/class\/([^/]+)\/join$/);
  if (joinMatch && req.method === 'POST') {
    const classId = joinMatch[1];
    const body    = await parseBody(req);
    const { studentId } = body;
    const data    = loadPlayers();
    const cls     = (data.classes || {})[classId];
    if (!cls) {
      sendJson(res, 404, { success: false, message: 'Turma não encontrada.' });
      return;
    }
    if (!data.players[studentId]) {
      sendJson(res, 404, { success: false, message: 'Usuário não encontrado.' });
      return;
    }
    if (data.players[studentId].classId && data.players[studentId].classId !== classId) {
      sendJson(res, 400, { success: false, message: 'Aluno já está em outra turma.' });
      return;
    }
    if (!cls.students.includes(studentId)) cls.students.push(studentId);
    data.players[studentId].classId = classId;
    savePlayers(data);
    sendJson(res, 200, { success: true, className: cls.name });
    return;
  }

  // ── POST /class/:classId/kick ────────────────────────────────────────────
  const kickMatch = req.url.match(/^\/class\/([^/]+)\/kick$/);
  if (kickMatch && req.method === 'POST') {
    const classId = kickMatch[1];
    const body    = await parseBody(req);
    const { studentId } = body;
    const data    = loadPlayers();
    const cls     = (data.classes || {})[classId];
    if (!cls) {
      sendJson(res, 404, { success: false, message: 'Turma não encontrada.' });
      return;
    }
    cls.students = (cls.students || []).filter(id => id !== studentId);
    if (data.players[studentId]) data.players[studentId].classId = null;
    savePlayers(data);
    sendJson(res, 200, { success: true });
    return;
  }

  // ── PUT /class/:classId/questions ────────────────────────────────────────
  const questPutMatch = req.url.match(/^\/class\/([^/]+)\/questions$/);
  if (questPutMatch && req.method === 'PUT') {
    const classId = questPutMatch[1];
    const body    = await parseBody(req);
    const { phaseId, questions } = body;
    const VALID_PHASES = ['lista_encadeada','lista_circular','lista_dupla','lista_dupla_circular','todas_as_listas'];
    if (!VALID_PHASES.includes(phaseId)) {
      sendJson(res, 400, { success: false, message: 'phaseId inválido.' });
      return;
    }
    if (!Array.isArray(questions)) {
      sendJson(res, 400, { success: false, message: 'questions deve ser um array.' });
      return;
    }
    if (questions.length > 30) {
      sendJson(res, 400, { success: false, message: 'Máximo de 30 questões por fase.' });
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || typeof q.text !== 'string' || !q.text.trim()) {
        sendJson(res, 400, { success: false, message: `Questão ${i+1}: campo "text" inválido.` });
        return;
      }
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) {
        sendJson(res, 400, { success: false, message: `Questão ${i+1}: "options" deve ter 2 a 4 itens.` });
        return;
      }
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
        sendJson(res, 400, { success: false, message: `Questão ${i+1}: "correct" inválido.` });
        return;
      }
    }
    const data = loadPlayers();
    const cls  = (data.classes || {})[classId];
    if (!cls) {
      sendJson(res, 404, { success: false, message: 'Turma não encontrada.' });
      return;
    }
    if (!cls.questions) cls.questions = {};
    cls.questions[phaseId] = questions.map(q => ({
      text:    q.text.trim(),
      options: q.options.map(o => String(o).trim()),
      correct: q.correct
    }));
    savePlayers(data);
    sendJson(res, 200, { success: true, count: cls.questions[phaseId].length });
    return;
  }

  // ── GET /class/:classId/dashboard ────────────────────────────────────────
  const dashMatch = req.url.match(/^\/class\/([^/]+)\/dashboard$/);
  if (dashMatch && req.method === 'GET') {
    const classId = dashMatch[1];
    const data    = loadPlayers();
    const cls     = (data.classes || {})[classId];
    if (!cls) {
      sendJson(res, 404, { success: false, message: 'Turma não encontrada.' });
      return;
    }
    const PHASES = ['lista_encadeada','lista_circular','lista_dupla','lista_dupla_circular','todas_as_listas'];
    const dashboard = {};
    for (const phaseId of PHASES) {
      const students = [];
      for (const uid of (cls.students || [])) {
        const player = data.players[uid];
        if (!player) continue;
        const h = (player.history || {})[phaseId] || {};
        const classRuns = (h.runs || []).filter(r => r.classId === classId);
        if (classRuns.length === 0) continue;
        const victories = classRuns.filter(r => r.won).length;
        const defeats   = classRuns.filter(r => !r.won).length;
        const totalCorrect  = classRuns.reduce((s, r) => s + (r.questionsCorrect || 0), 0);
        const totalAnswers  = classRuns.reduce((s, r) => s + (r.totalAnswers     || 0), 0);
        students.push({
          userId:    uid,
          username:  player.username,
          victories,
          defeats,
          accuracy:  totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0
        });
      }
      students.sort((a, b) => b.accuracy - a.accuracy);
      const total    = students.reduce((s, st) => s + st.victories + st.defeats, 0);
      const avgAcc   = students.length > 0
        ? Math.round(students.reduce((s, st) => s + st.accuracy, 0) / students.length)
        : 0;
      const topStudent = students.length > 0 ? students[0].username : null;
      dashboard[phaseId] = { students, aggregate: { avgAccuracy: avgAcc, totalRuns: total, topStudent } };
    }
    sendJson(res, 200, { success: true, dashboard });
    return;
  }

  // ── Arquivos estáticos ───────────────────────────────────────────────────
  const MIME = {
    '.html': 'text/html', '.js': 'application/javascript',
    '.css':  'text/css',  '.png': 'image/png',
    '.jpg':  'image/jpeg','.svg': 'image/svg+xml',
    '.ico':  'image/x-icon', '.json': 'application/json',
    '.mp3':  'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
    '.ttf':  'font/ttf',   '.woff': 'font/woff', '.woff2': 'font/woff2',
  };
  const urlPath   = decodeURIComponent(req.url.split('?')[0]);
  const filePath  = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  const ext       = path.extname(filePath).toLowerCase();
  const mime      = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, CORS);
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
      res.end(content);
    }
  });
});

const wss = new WebSocketServer({ server: httpServer });

// ─── Salas ───────────────────────────────────────────────────────────────────
// Map<code, Room>
const rooms = new Map();

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

// ─── Stats de personagens (deve espelhar characters.js) ──────────────────────
const CHAR_STATS = {
  estudioso: { hp: 100, atk: 20, passive: 'olho_critico' },
  assassino: { hp: 80,  atk: 30,  passive: 'golpe_critico' }
};

function getCharStats(id) {
  return CHAR_STATS[id] || { hp: 100, atk: 20, passive: null };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function send(ws, msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function pickNextQuestion(room) {
  const qs        = room.phase.questions;
  const available = qs.filter((_, i) => !room.usedQs.has(i));
  const pool      = available.length > 0 ? available : qs;
  const q         = pool[Math.floor(Math.random() * pool.length)];
  const idx       = qs.indexOf(q);
  room.usedQs.add(idx);
  room.currentQuestion = { text: q.text, options: q.options, correct: q.correct };
  room.answers         = { p1: null, p2: null };

  const payload = { type: 'question', question: room.currentQuestion };
  send(room.p1.ws, payload);
  send(room.p2.ws, payload);
}

function startGame(room) {
  const s1 = getCharStats(room.p1.characterId);
  const s2 = getCharStats(room.p2.characterId);

  Object.assign(room.p1, { hp: s1.hp, maxHp: s1.hp, atk: s1.atk, atkBonusPct: 0, passive: s1.passive });
  Object.assign(room.p2, { hp: s2.hp, maxHp: s2.hp, atk: s2.atk, atkBonusPct: 0, passive: s2.passive });

  room.usedQs   = new Set();
  room.stats    = { p1Correct: 0, p1Wrong: 0, p2Correct: 0, p2Wrong: 0 };
  room.rematch  = { p1: false, p2: false };
  room.finished = false;

  const sharedState = {
    p1: { hp: room.p1.maxHp, maxHp: room.p1.maxHp },
    p2: { hp: room.p2.maxHp, maxHp: room.p2.maxHp }
  };

  send(room.p1.ws, {
    type: 'game_start',
    role: 'p1',
    opponent: { name: room.p2.name, characterId: room.p2.characterId },
    phase: room.phase,
    ...sharedState
  });
  send(room.p2.ws, {
    type: 'game_start',
    role: 'p2',
    opponent: { name: room.p1.name, characterId: room.p1.characterId },
    phase: room.phase,
    ...sharedState
  });

  // Pequena pausa para o cliente renderizar a tela de batalha antes da primeira pergunta
  setTimeout(() => pickNextQuestion(room), 800);
}

function applyPassiveAtk(player) {
  if (player.passive === 'golpe_critico') {
    const base = getCharStats(player.characterId).atk;
    player.atk = Math.round(base * (1 + (player.atkBonusPct || 0)));
  }
}

function computeRound(room) {
  const p1Correct = room.answers.p1 === room.currentQuestion.correct;
  const p2Correct = room.answers.p2 === room.currentQuestion.correct;

  // ── Dano de P1 em P2 ─────────────────────────────────────────────────────
  let p1Dmg   = 0;
  let p1Crit  = false;
  if (p1Correct) {
    p1Dmg = room.p1.atk;
    if (room.p1.passive === 'golpe_critico') {
      room.p1.atkBonusPct = Math.min((room.p1.atkBonusPct || 0) + 0.025, 0.25);
    }
    room.stats.p1Correct++;
  } else {
    if (room.p1.passive === 'golpe_critico') room.p1.atkBonusPct = 0;
    room.stats.p1Wrong++;
  }
  applyPassiveAtk(room.p1);

  // ── Dano de P2 em P1 ─────────────────────────────────────────────────────
  let p2Dmg  = 0;
  let p2Crit = false;
  if (p2Correct) {
    p2Dmg = room.p2.atk;
    if (room.p2.passive === 'golpe_critico') {
      room.p2.atkBonusPct = Math.min((room.p2.atkBonusPct || 0) + 0.025, 0.25);
    }
    room.stats.p2Correct++;
  } else {
    if (room.p2.passive === 'golpe_critico') room.p2.atkBonusPct = 0;
    room.stats.p2Wrong++;
  }
  applyPassiveAtk(room.p2);

  room.p2.hp = Math.max(0, room.p2.hp - p1Dmg);
  room.p1.hp = Math.max(0, room.p1.hp - p2Dmg);

  const roundResult = {
    type: 'round_result',
    p1Correct, p2Correct,
    p1Dmg, p2Dmg,
    p1Crit, p2Crit,
    p1Hp: room.p1.hp, p2Hp: room.p2.hp,
    p1MaxHp: room.p1.maxHp, p2MaxHp: room.p2.maxHp,
    correctAnswer: room.currentQuestion.correct
  };
  send(room.p1.ws, roundResult);
  send(room.p2.ws, roundResult);

  // ── Fim de partida ────────────────────────────────────────────────────────
  if (room.p1.hp <= 0 || room.p2.hp <= 0) {
    room.finished = true;
    const p1Dead  = room.p1.hp <= 0;
    const p2Dead  = room.p2.hp <= 0;
    const total   = room.stats.p1Correct + room.stats.p1Wrong;

    const stats = {
      total,
      p1Correct: room.stats.p1Correct,
      p1Wrong:   room.stats.p1Wrong,
      p2Correct: room.stats.p2Correct,
      p2Wrong:   room.stats.p2Wrong
    };

    const isDraw = p1Dead && p2Dead;

    // Aguarda a animacao do resultado antes de encerrar
    setTimeout(() => {
      send(room.p1.ws, {
        type: 'game_over',
        result: isDraw ? 'draw' : (p2Dead ? 'win' : 'lose'),
        stats
      });
      send(room.p2.ws, {
        type: 'game_over',
        result: isDraw ? 'draw' : (p1Dead ? 'win' : 'lose'),
        stats
      });
    }, 2500);

  } else {
    // Proxima pergunta apos mostrar o resultado
    setTimeout(() => pickNextQuestion(room), 2500);
  }
}

// ─── Conexoes ─────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  let playerRoom = null;
  let playerRole = null; // 'p1' | 'p2'

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── Criar sala ──────────────────────────────────────────────────────────
    if (msg.type === 'create_room') {
      const code = genCode();
      const room = {
        code,
        p1: { ws, name: msg.playerName, characterId: msg.characterId, hp: 0, maxHp: 0, atk: 0, atkBonusPct: 0, passive: null },
        p2: null,
        phase:           msg.phase,
        usedQs:          new Set(),
        currentQuestion: null,
        answers:         { p1: null, p2: null },
        stats:           { p1Correct: 0, p1Wrong: 0, p2Correct: 0, p2Wrong: 0 },
        rematch:         { p1: false, p2: false },
        finished:        false
      };
      rooms.set(code, room);
      playerRoom = room;
      playerRole = 'p1';
      send(ws, { type: 'room_created', code });

    // ── Entrar na sala ──────────────────────────────────────────────────────
    } else if (msg.type === 'join_room') {
      const code = (msg.code || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        send(ws, { type: 'error', message: 'Sala nao encontrada. Verifique o codigo.' });
        return;
      }
      if (room.p2 !== null) {
        send(ws, { type: 'error', message: 'Sala ja esta cheia.' });
        return;
      }

      room.p2    = { ws, name: msg.playerName, characterId: msg.characterId, hp: 0, maxHp: 0, atk: 0, atkBonusPct: 0, passive: null };
      playerRoom = room;
      playerRole = 'p2';
      startGame(room);

    // ── Resposta de pergunta ────────────────────────────────────────────────
    } else if (msg.type === 'answer') {
      if (!playerRoom || !playerRoom.currentQuestion || playerRoom.finished) return;

      if (playerRole === 'p1' && playerRoom.answers.p1 === null) {
        playerRoom.answers.p1 = msg.answerIndex;
      } else if (playerRole === 'p2' && playerRoom.answers.p2 === null) {
        playerRoom.answers.p2 = msg.answerIndex;
      }

      // Quando os dois responderem, calcula o round
      if (playerRoom.answers.p1 !== null && playerRoom.answers.p2 !== null) {
        computeRound(playerRoom);
      }

    // ── Revanche ────────────────────────────────────────────────────────────
    } else if (msg.type === 'rematch') {
      if (!playerRoom || !playerRoom.finished) return;
      playerRoom.rematch[playerRole] = true;
      if (playerRoom.rematch.p1 && playerRoom.rematch.p2) {
        startGame(playerRoom);
      }
    }
  });

  ws.on('close', () => {
    if (!playerRoom) return;
    const other = playerRole === 'p1' ? playerRoom.p2 : playerRoom.p1;
    if (other) send(other.ws, { type: 'opponent_disconnected' });
    rooms.delete(playerRoom.code);
    playerRoom = null;
  });
});

httpServer.listen(PORT, () => {
  const ip = getLocalIP();
  console.log(`[MetroQuiz PvP] Servidor rodando na porta ${PORT} (HTTPS/WSS)`);
  console.log(`[MetroQuiz PvP] Rede local: https://${ip}:${PORT}`);
  console.log(`[MetroQuiz PvP] WebSocket:  wss://${ip}:${PORT}`);
});
