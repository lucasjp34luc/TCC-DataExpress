/**
 * @file achievements.js
 * @description Definição das conquistas do jogo e função para calcular
 * o status de desbloqueio de cada uma a partir do perfil do jogador.
 */

export const RARITY_COLORS = {
  common:    '#7a9aaa',
  rare:      '#5ab4ff',
  epic:      '#cc44ff',
  legendary: '#ffcc44',
};

export const RARITY_LABELS = {
  common:    'Comum',
  rare:      'Raro',
  epic:      'Épico',
  legendary: 'Lendário',
};

/**
 * Lista de todas as conquistas do jogo.
 * check(stats) → { unlocked, progress, total }
 *
 * stats = {
 *   totalVictories, totalDefeats, phasesPlayed, bestAccuracy, hasPerfect,
 *   phase: {
 *     [phaseId]: { victories, accuracy, maxCycles }
 *   }
 * }
 */
export const ACHIEVEMENTS = [
  // ── Vitórias gerais ────────────────────────────────────────────────────────
  {
    id: 'first_win',
    name: 'Primeira Vitória',
    description: 'Vença sua primeira partida.',
    icon: '🏅',
    rarity: 'common',
    check: (s) => ({ unlocked: s.totalVictories >= 1,  progress: Math.min(s.totalVictories, 1),  total: 1  }),
  },
  {
    id: 'veteran',
    name: 'Veterano',
    description: 'Acumule 10 vitórias.',
    icon: '⭐',
    rarity: 'rare',
    check: (s) => ({ unlocked: s.totalVictories >= 10, progress: Math.min(s.totalVictories, 10), total: 10 }),
  },
  {
    id: 'champion',
    name: 'Campeão',
    description: 'Acumule 25 vitórias.',
    icon: '💎',
    rarity: 'epic',
    check: (s) => ({ unlocked: s.totalVictories >= 25, progress: Math.min(s.totalVictories, 25), total: 25 }),
  },
  {
    id: 'legend',
    name: 'Lendário',
    description: 'Acumule 50 vitórias.',
    icon: '👑',
    rarity: 'legendary',
    check: (s) => ({ unlocked: s.totalVictories >= 50, progress: Math.min(s.totalVictories, 50), total: 50 }),
  },
  // ── Precisão absoluta em todas as 5 listas ────────────────────────────────
  {
    id: 'all_perfect_master',
    name: 'Precisão Absoluta',
    description: 'Atinja 100% de acerto em todas as 5 linhas.',
    icon: '💯',
    rarity: 'legendary',
    check: (s) => {
      const LISTS = ['lista_encadeada', 'lista_circular', 'lista_dupla', 'lista_dupla_circular', 'todas_as_listas'];
      const done = LISTS.filter(id => {
        const ph = s.phase?.[id];
        return (ph?.accuracy || 0) >= 1.00 || ph?.hasPerfectRun === true;
      }).length;
      return { unlocked: done >= 5, progress: done, total: 5 };
    },
  },
  // ── Exploração de linhas ──────────────────────────────────────────────────
  {
    id: 'explorer',
    name: 'Explorador',
    description: 'Jogue em 2 linhas diferentes.',
    icon: '🗺️',
    rarity: 'common',
    check: (s) => ({ unlocked: s.phasesPlayed >= 2, progress: Math.min(s.phasesPlayed, 2), total: 2 }),
  },
  {
    id: 'traveler',
    name: 'Viajante',
    description: 'Jogue em 4 linhas diferentes.',
    icon: '🚆',
    rarity: 'rare',
    check: (s) => ({ unlocked: s.phasesPlayed >= 4, progress: Math.min(s.phasesPlayed, 4), total: 4 }),
  },
  {
    id: 'line_master',
    name: 'Conhecedor das Linhas',
    description: 'Jogue em todas as 5 linhas.',
    icon: '🌐',
    rarity: 'epic',
    check: (s) => ({ unlocked: s.phasesPlayed >= 5, progress: Math.min(s.phasesPlayed, 5), total: 5 }),
  },
  // ── Precisão geral ────────────────────────────────────────────────────────
  {
    id: 'good_student',
    name: 'Bom Aluno',
    description: 'Atinja 70% de acerto em qualquer linha.',
    icon: '📚',
    rarity: 'common',
    check: (s) => ({ unlocked: s.bestAccuracy >= 0.70, progress: s.bestAccuracy >= 0.70 ? 1 : 0, total: 1 }),
  },
  {
    id: 'specialist',
    name: 'Especialista',
    description: 'Atinja 90% de acerto em qualquer linha.',
    icon: '🎯',
    rarity: 'rare',
    check: (s) => ({ unlocked: s.bestAccuracy >= 0.90, progress: s.bestAccuracy >= 0.90 ? 1 : 0, total: 1 }),
  },
  {
    id: 'perfect',
    name: 'Perfeito',
    description: 'Complete uma fase sem nenhum erro.',
    icon: '🏆',
    rarity: 'epic',
    check: (s) => ({ unlocked: s.hasPerfect, progress: s.hasPerfect ? 1 : 0, total: 1 }),
  },
  // ── Linha Encadeada ───────────────────────────────────────────────────────
  {
    id: 'enc_first',
    name: 'Trilho Encadeado',
    description: 'Vença 1 partida na Linha Encadeada.',
    icon: '🔗',
    rarity: 'common',
    check: (s) => {
      const v = s.phase?.lista_encadeada?.victories || 0;
      return { unlocked: v >= 1, progress: Math.min(v, 1), total: 1 };
    },
  },
  {
    id: 'enc_veteran',
    name: 'Cadeia Inabalável',
    description: 'Vença 5 partidas na Linha Encadeada.',
    icon: '⛓️',
    rarity: 'rare',
    check: (s) => {
      const v = s.phase?.lista_encadeada?.victories || 0;
      return { unlocked: v >= 5, progress: Math.min(v, 5), total: 5 };
    },
  },
  {
    id: 'enc_master',
    name: 'Mestre da Encadeada',
    description: 'Atinja 100% de acerto na Linha Encadeada.',
    icon: '🔵',
    rarity: 'legendary',
    check: (s) => {
      const ph = s.phase?.lista_encadeada;
      const ok = (ph?.accuracy || 0) >= 1.00 || ph?.hasPerfectRun === true;
      return { unlocked: ok, progress: ok ? 1 : 0, total: 1 };
    },
  },

  // ── Linha Circular ────────────────────────────────────────────────────────
  {
    id: 'cir_first',
    name: 'Primeira Volta',
    description: 'Vença 1 partida na Linha Circular.',
    icon: '🔄',
    rarity: 'common',
    check: (s) => {
      const v = s.phase?.lista_circular?.victories || 0;
      return { unlocked: v >= 1, progress: Math.min(v, 1), total: 1 };
    },
  },
  {
    id: 'cir_loops',
    name: 'Rodada de Honra',
    description: 'Complete 5 ciclos em uma única partida (Circular).',
    icon: '🔁',
    rarity: 'rare',
    check: (s) => {
      const mc = s.phase?.lista_circular?.maxCycles || 0;
      return { unlocked: mc >= 5, progress: Math.min(mc, 5), total: 5 };
    },
  },
  {
    id: 'cir_master',
    name: 'Eterno Circulante',
    description: 'Complete 10 ciclos em uma única partida (Circular).',
    icon: '🌀',
    rarity: 'epic',
    check: (s) => {
      const mc = s.phase?.lista_circular?.maxCycles || 0;
      return { unlocked: mc >= 10, progress: Math.min(mc, 10), total: 10 };
    },
  },
  {
    id: 'cir_perfect',
    name: 'Volta Perfeita',
    description: 'Atinja 100% de acerto na Linha Circular.',
    icon: '🔵',
    rarity: 'legendary',
    check: (s) => {
      const ph = s.phase?.lista_circular;
      const ok = (ph?.accuracy || 0) >= 1.00 || ph?.hasPerfectRun === true;
      return { unlocked: ok, progress: ok ? 1 : 0, total: 1 };
    },
  },

  // ── Linha Duplamente Encadeada ───────────────────────────────────────────────────────────
  {
    id: 'dup_first',
    name: 'Via Dupla',
    description: 'Vença 1 partida na Linha Duplamente Encadeada.',
    icon: '↔️',
    rarity: 'common',
    check: (s) => {
      const v = s.phase?.lista_dupla?.victories || 0;
      return { unlocked: v >= 1, progress: Math.min(v, 1), total: 1 };
    },
  },
  {
    id: 'dup_veteran',
    name: 'Tráfego Intenso',
    description: 'Vença 5 partidas na Linha Duplamente Encadeada.',
    icon: '🛤️',
    rarity: 'rare',
    check: (s) => {
      const v = s.phase?.lista_dupla?.victories || 0;
      return { unlocked: v >= 5, progress: Math.min(v, 5), total: 5 };
    },
  },
  {
    id: 'dup_master',
    name: 'Mestre da Dupla',
    description: 'Atinja 100% de acerto na Linha Duplamente Encadeada.',
    icon: '🟢',
    rarity: 'legendary',
    check: (s) => {
      const ph = s.phase?.lista_dupla;
      const ok = (ph?.accuracy || 0) >= 1.00 || ph?.hasPerfectRun === true;
      return { unlocked: ok, progress: ok ? 1 : 0, total: 1 };
    },
  },

  // ── Linha duplamente encadeada Circular ──────────────────────────────────────────────────
  {
    id: 'dcir_first',
    name: 'Laço Duplo',
    description: 'Vença 1 partida na Linha Duplamente Encadeada Circular.',
    icon: '♾️',
    rarity: 'common',
    check: (s) => {
      const v = s.phase?.lista_dupla_circular?.victories || 0;
      return { unlocked: v >= 1, progress: Math.min(v, 1), total: 1 };
    },
  },
  {
    id: 'dcir_loops',
    name: 'Ciclo Perfeito',
    description: 'Complete 5 ciclos em uma única partida (Duplamente Encadeada Circular).',
    icon: '🔃',
    rarity: 'rare',
    check: (s) => {
      const mc = s.phase?.lista_dupla_circular?.maxCycles || 0;
      return { unlocked: mc >= 5, progress: Math.min(mc, 5), total: 5 };
    },
  },
  {
    id: 'dcir_master',
    name: 'Eterno Duplo',
    description: 'Complete 10 ciclos em uma única partida (Duplamente Encadeada Circular).',
    icon: '🟣',
    rarity: 'epic',
    check: (s) => {
      const mc = s.phase?.lista_dupla_circular?.maxCycles || 0;
      return { unlocked: mc >= 10, progress: Math.min(mc, 10), total: 10 };
    },
  },
  {
    id: 'dcir_perfect',
    name: 'Laço Impecável',
    description: 'Atinja 100% de acerto na Linha Duplamente Encadeada Circular.',
    icon: '🟣',
    rarity: 'legendary',
    check: (s) => {
      const ph = s.phase?.lista_dupla_circular;
      const ok = (ph?.accuracy || 0) >= 1.00 || ph?.hasPerfectRun === true;
      return { unlocked: ok, progress: ok ? 1 : 0, total: 1 };
    },
  },

  // ── Todas as Listas ───────────────────────────────────────────────────────
  {
    id: 'all_first',
    name: 'Desafiante Final',
    description: 'Vença 1 partida na linha "Todas as Listas".',
    icon: '🎖️',
    rarity: 'rare',
    check: (s) => {
      const v = s.phase?.todas_as_listas?.victories || 0;
      return { unlocked: v >= 1, progress: Math.min(v, 1), total: 1 };
    },
  },
  {
    id: 'all_veteran',
    name: 'Domínio Total',
    description: 'Vença 3 partidas na linha "Todas as Listas".',
    icon: '🏆',
    rarity: 'epic',
    check: (s) => {
      const v = s.phase?.todas_as_listas?.victories || 0;
      return { unlocked: v >= 3, progress: Math.min(v, 3), total: 3 };
    },
  },
  {
    id: 'all_legend',
    name: 'Lendário do Metrô',
    description: 'Atinja 100% de acerto na linha "Todas as Listas".',
    icon: '🌟',
    rarity: 'legendary',
    check: (s) => {
      const ph = s.phase?.todas_as_listas;
      const ok = (ph?.accuracy || 0) >= 1.00 || ph?.hasPerfectRun === true;
      return { unlocked: ok, progress: ok ? 1 : 0, total: 1 };
    },
  },
];

/**
 * Calcula o status de cada conquista para o perfil fornecido.
 * @param {object|null} profile  - profile do jogador (com .history)
 * @param {string|null} userId   - ID do usuário (para busca no localStorage)
 * @returns {Array<{id, name, description, icon, rarity, unlocked, progress, total}>}
 */
export function computeAchievements(profile, userId) {
  const history = (profile && profile.history) ? profile.history : {};
  const phases  = Object.values(history);

  const totalVictories = phases.reduce((s, p) => s + (p.victories || 0), 0);
  const totalDefeats   = phases.reduce((s, p) => s + (p.defeats   || 0), 0);
  const phasesPlayed   = phases.filter(p => (p.victories || 0) + (p.defeats || 0) > 0).length;

  const bestAccuracy = phases.reduce((best, p) => {
    const acc = p.totalAnswers > 0 ? p.totalCorrect / p.totalAnswers : 0;
    return acc > best ? acc : best;
  }, 0);

  // Verifica run perfeita via localStorage
  let hasPerfect = false;
  if (userId) {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(`phase_completion_${userId}_`)) {
        try {
          const val = JSON.parse(localStorage.getItem(key));
          if (val && val.perfect === true) { hasPerfect = true; break; }
        } catch { /* ignora */ }
      }
    }
  }

  // Stats por fase
  const PHASE_IDS = ['lista_encadeada', 'lista_circular', 'lista_dupla', 'lista_dupla_circular', 'todas_as_listas'];

  // Checa troféu (run perfeita) por fase via localStorage — mesma fonte usada pela PhaseSelectScene
  const phasePerfect = {};
  if (userId) {
    for (const id of PHASE_IDS) {
      try {
        const val = JSON.parse(localStorage.getItem(`phase_completion_${userId}_${id}`) || 'null');
        phasePerfect[id] = val?.perfect === true;
      } catch { phasePerfect[id] = false; }
    }
  }

  const phaseStats = {};
  for (const id of PHASE_IDS) {
    const ph   = history[id] || {};
    const runs = ph.runs || [];
    phaseStats[id] = {
      victories:     ph.victories || 0,
      accuracy:      ph.totalAnswers > 0 ? ph.totalCorrect / ph.totalAnswers : 0,
      maxCycles:     runs.reduce((m, r) => Math.max(m, r.listCycle || 0), 0),
      hasPerfectRun: phasePerfect[id] || false,
    };
  }

  const stats = { totalVictories, totalDefeats, phasesPlayed, bestAccuracy, hasPerfect, phase: phaseStats };

  return ACHIEVEMENTS.map(a => {
    const { unlocked, progress, total } = a.check(stats);
    return { ...a, unlocked, progress, total };
  });
}
