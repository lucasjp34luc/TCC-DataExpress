/**
 * @file characters.js
 * @description Dados dos personagens jogáveis com stats e passivas
 */

export const CHARACTERS = [
  {
    id: 'estudioso',
    name: 'Estudioso',
    description: 'Mestre do conhecimento, lê o inimigo como um livro.',
    hp: 180,
    atk: 20,
    passive: {
      name: 'Olho Crítico',
      description: 'Consegue ver as recompensas do Mímico sem desfoque.\nElimina automaticamente 2 alternativas erradas nas perguntas.',
      pvpDescription: 'Elimina automaticamente 2 alternativas erradas nas perguntas.',
      id: 'olho_critico'
    },
    sprites: {
      idle:    'assets/image/Personagens/Estudioso/Sem Fundo/Em Batalha/Batalha/Estudioso_Batalha.png',
      attack:  'assets/image/Personagens/Estudioso/Sem Fundo/Em Batalha/Atacando/Estudioso_Atacando.png',
      hurt:    'assets/image/Personagens/Estudioso/Sem Fundo/Em Batalha/Sofrendo Dano/Estudioso_Sofrendo_Dano.png'
    },
    color: '#4a9eff'
  },
  {
    id: 'assassino',
    name: 'Assassino',
    description: 'Rápido e letal. Conhecimento é uma arma afiada.',
    hp: 160,
    atk: 30,
    passive: {
      name: 'Golpe Crítico',
      description: 'Acertos têm 15% de chance de causar dano crítico (1.8x).\nAo acertar ganha +2,5% de ATK (máx 25%); ao errar, perde o bônus.',
      pvpDescription: 'Ao acertar ganha +2,5% de ATK (máx 25%); ao errar, perde o bônus.',
      id: 'golpe_critico'
    },
    sprites: {
      idle:    'assets/image/Personagens/Assasino/Sem Fundo/Em Batalha/Batalha/Assasino_Batalha.png',
      attack:  'assets/image/Personagens/Assasino/Sem Fundo/Em Batalha/Atacando/Assasino_Atacando.png',
      hurt:    'assets/image/Personagens/Assasino/Sem Fundo/Em Batalha/Sofrendo Dano/Assasino_Sofrendo_Dano.png'
    },
    color: '#ff4a4a'
  }
];

export default CHARACTERS;
