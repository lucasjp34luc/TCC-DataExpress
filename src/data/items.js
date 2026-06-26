/**
 * @file items.js
 * @description Itens disponíveis na loja com efeitos e preços
 */

export const ITEMS = [
  {
    id: 'buff_dano_5',
    name: '+5 ATK',
    description: 'Aumenta o ATK em 5 permanentemente.',
    image: 'assets/image/Itens/Sem Fundo/Buff_Dano_5.png',
    cost: 25,
    effect: { atk: 5, hp: 0 }
  },
  {
    id: 'buff_dano_10',
    name: '+10 ATK',
    description: 'Aumenta o ATK em 10 permanentemente.',
    image: 'assets/image/Itens/Sem Fundo/Buff_Dano_10 - Copia.png',
    cost: 45,
    effect: { atk: 10, hp: 0 }
  },
  {
    id: 'buff_dano_15',
    name: '+15 ATK',
    description: 'Aumenta o ATK em 15, mas reduz o HP máximo em 10.',
    image: 'assets/image/Itens/Sem Fundo/Buff_Dano_15.png',
    cost: 65,
    effect: { atk: 15, hp: -10 }
  },
  {
    id: 'buff_vida_10',
    name: 'Cura 15%',
    description: 'Restaura 15% do HP máximo.',
    image: 'assets/image/Itens/Sem Fundo/Buff_Vida_10.png',
    cost: 35,
    effect: { atk: 0, hp: 0, healPercent: 0.15 }
  },
  {
    id: 'buff_dano_vida_5',
    name: '+5 ATK / Cura 5%',
    description: 'Aumenta o ATK em 5 e restaura 5% do HP máximo.',
    image: 'assets/image/Itens/Sem Fundo/Buff_Dano_e_Vida_5.png',
    cost: 40,
    effect: { atk: 5, hp: 0, healPercent: 0.05 }
  }
];

export default ITEMS;
