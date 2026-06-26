/**
 * @file questions.js
 * @description Banco de perguntas por fase/tema.
 * listType define o comportamento de navegação dos vagões:
 *   'linked'          → apenas avançar
 *   'circular'        → avança e wraps ao primeiro
 *   'doubly_linked'   → avança e volta livremente
 *   'doubly_circular' → avança/volta circular + popup no room 0
 */

export const PHASES = [
  // ─── Linha 1 ─────────────────────────────────────────────────────────────
  {
    id: 'lista_encadeada',
    name: 'Lista Encadeada',
    description: 'Vagões ligados em sequência — só avance!',
    color: '#4a9eff',
    listType: 'linked',
    questions: [
      {
        text: 'O que é um nó (node) em uma lista encadeada?',
        options: [
          'Correta',
          'Um índice numérico do array',
          'Uma função de busca binária',
          'Um bloco de memória contígua'
        ],
        correct: 0
      }
    ]
  },

  // ─── Linha 2 ─────────────────────────────────────────────────────────────
  {
    id: 'lista_circular',
    name: 'Lista Circular',
    description: 'O último vagão conecta ao primeiro — ciclos infinitos!',
    color: '#ff6b4a',
    listType: 'circular',
    questions: [
      {
        text: 'O que diferencia uma lista circular de uma lista encadeada simples?',
        options: [
          'Correta',
          'O último nó aponta de volta para o primeiro',
          'Não possui nós, apenas índices',
          'Os elementos são armazenados em ordem decrescente'
        ],
        correct: 0
      }
    ]
  },

  // ─── Linha 3 ─────────────────────────────────────────────────────────────
  {
    id: 'lista_dupla',
    name: 'Lista Duplamente Encadeada',
    description: 'Avance e volte livremente entre os vagões!',
    color: '#4aff8c',
    listType: 'doubly_linked',
    questions: [
      {
        text: 'O que diferencia um nó de lista duplamente encadeada de um nó de lista simples?',
        options: [
          'Correta',
          'Possui ponteiro para o próximo E para o anterior',
          'Não possui ponteiros, só índices',
          'Armazena apenas o endereço do head'
        ],
        correct: 0
      }
    ]
  },

  // ─── Linha 4 ─────────────────────────────────────────────────────────────
  {
    id: 'lista_dupla_circular',
    name: 'Lista Duplamente Encadeada Circular',
    description: 'Bidirecional e cíclica — o trem nunca para!',
    color: '#c44aff',
    listType: 'doubly_circular',
    questions: [
      {
        text: 'Questão 1 ?',
        options: [
          'Correta',
          'Ponteiros bidirecionais + último nó ligado ao primeiro',
          'Array dinâmico + ponteiro duplo',
          'Árvore binária + ciclo'
        ],
        correct: 0
      },
      {
        text: 'Questão 2 ?',
        options: [
          'ImCorreta',
          'Ponteiros bidirecionais + último nó ligado ao primeiro',
          'Correta',
          'Árvore binária + ciclo'
        ],
        correct: 2
      },
      {
        text: 'Questão 3 ?',
        options: [
          'ImCorreta',
          'Ponteiros bidirecionais + último nó ligado ao primeiro',
          'ImCorreta',
          'Correta'
        ],
        correct: 3
      }
    ]
  },

  // ─── Linha 5 ─────────────────────────────────────────────────────────────
  {
    id: 'todas_as_listas',
    name: 'Todas as Listas',
    description: 'Domínio total — encadeada, circular, dupla e dupla circular!',
    color: '#ffaa22',
    listType: 'doubly_circular',
    questions: [
      // ── Lista Encadeada ──
      {
        text: 'O que é um nó (node) em uma lista encadeada?',
        options: [
          'Correta',
          'Um índice numérico do array',
          'Uma função de busca binária',
          'Um bloco de memória contígua'
        ],
        correct: 0
      },
      // ── Lista Circular ──
      {
        text: 'O que diferencia uma lista circular de uma lista encadeada simples?',
        options: [
          'Correta',
          'O último nó aponta de volta para o primeiro',
          'Não possui nós, apenas índices',
          'Os elementos são armazenados em ordem decrescente'
        ],
        correct: 0
      },
      // ── Lista Duplamente Encadeada ──
      {
        text: 'O que diferencia um nó de lista duplamente encadeada de um nó de lista simples?',
        options: [
          'Correta',
          'Possui ponteiro para o próximo E para o anterior',
          'Não possui ponteiros, só índices',
          'Armazena apenas o endereço do head'
        ],
        correct: 0
      },
      // ── Lista Duplamente Encadeada Circular ──
      {
        text: 'Questão 1 ?',
        options: [
          'Correta',
          'Ponteiros bidirecionais + último nó ligado ao primeiro',
          'Array dinâmico + ponteiro duplo',
          'Árvore binária + ciclo'
        ],
        correct: 0
      },
      {
        text: 'Questão 2 ?',
        options: [
          'ImCorreta',
          'Ponteiros bidirecionais + último nó ligado ao primeiro',
          'Correta',
          'Árvore binária + ciclo'
        ],
        correct: 2
      },
      {
        text: 'Questão 3 ?',
        options: [
          'ImCorreta',
          'Ponteiros bidirecionais + último nó ligado ao primeiro',
          'ImCorreta',
          'Correta'
        ],
        correct: 3
      }
    ]
  },
];

// ── Perguntas do Vagão de Manutenção ─────────────────────────────────────────
// Uma pergunta por operação (add / remove / move) por tipo de lista.
// correct = índice da opção correta (variado para não ser sempre A).
export const MAINTENANCE_QUESTIONS = {

  // ── Lista Encadeada ────────────────────────────────────────────────────────
  lista_encadeada: {
    add: {
      text: 'Ao inserir um novo nó entre dois existentes em uma lista encadeada simples, o que deve ser ajustado para não quebrar a lista?',
      options: [
        'O "next" do predecessor aponta para o novo nó, e o "next" do novo nó aponta para o sucessor',
        'O novo nó herda automaticamente os ponteiros dos vizinhos ao ser criado',
        'Apenas o ponteiro do novo nó precisa ser configurado; os demais se ajustam',
        'Todos os nós seguintes ao ponto de inserção precisam ser reindexados'
      ],
      correct: 0
    },
    remove: {
      text: 'Em uma lista encadeada simples, ao remover um nó intermediário, o que garante a continuidade da lista?',
      options: [
        'Basta apagar o nó; os ponteiros vizinhos se ajustam automaticamente',
        'O nó removido mantém seu "next" para guiar o sucessor até encontrar o fim',
        'O "next" do antecessor passa a apontar diretamente para o sucessor do nó removido',
        'Todos os nós seguintes têm seus valores copiados uma posição para trás'
      ],
      correct: 2
    },
    move: {
      text: 'Mover um nó em uma lista encadeada simples equivale a qual sequência de operações sobre a estrutura?',
      options: [
        'Copiar o valor do nó para a nova posição sem modificar os ponteiros existentes',
        'Remover o nó da posição original, ajustar ponteiros dos vizinhos, e inseri-lo no destino',
        'Trocar apenas os valores dos dois nós envolvidos, mantendo os ponteiros inalterados',
        'Percorrer toda a lista e recriar a sequência de ponteiros em nova ordem'
      ],
      correct: 1
    }
  },

  // ── Lista Circular ─────────────────────────────────────────────────────────
  lista_circular: {
    add: {
      text: 'Em uma lista circular, ao inserir um nó no final, qual ponteiro diferencia esta operação de uma lista linear?',
      options: [
        'O "next" do novo nó deve ser null, igual a uma lista encadeada simples',
        'O "next" do novo nó deve apontar para o head, fechando o ciclo',
        'O head precisa ser atualizado para apontar diretamente para o novo nó',
        'Nenhum ponteiro extra é necessário; o ciclo se fecha de forma automática'
      ],
      correct: 1
    },
    remove: {
      text: 'Ao remover o último nó de uma lista circular, o que deve ser atualizado para manter o ciclo?',
      options: [
        'O head é atualizado para null, encerrando o ciclo de ponteiros',
        'O nó removido permanece no ciclo com valor nulo para evitar quebra',
        'Basta remover o nó; a lista circular se fecha automaticamente em seguida',
        'O "next" do penúltimo nó passa a apontar para o head, mantendo o ciclo'
      ],
      correct: 3
    },
    move: {
      text: 'Em uma lista circular, ao reposicionar um nó, qual cuidado extra é necessário em relação a uma lista linear?',
      options: [
        'Sempre mover o nó para o início, pois é a única posição segura em listas circulares',
        'Copiar o valor do nó para evitar quebra do anel circular durante a operação',
        'Garantir que o nó final continue apontando para o head após a reposição',
        'Remover o nó sem atualizar o predecessor, pois o ciclo se fecha sozinho'
      ],
      correct: 2
    }
  },

  // ── Lista Duplamente Encadeada ─────────────────────────────────────────────
  lista_dupla: {
    add: {
      text: 'Ao inserir um nó em uma lista duplamente encadeada, quais ponteiros precisam ser atualizados?',
      options: [
        'Apenas "next" do predecessor e "prev" do sucessor; o novo nó não precisa de ponteiros próprios',
        '"next" e "prev" do novo nó, "next" do predecessor e "prev" do sucessor — quatro no total',
        'Somente o "next" do novo nó; o "prev" é considerado opcional em listas duplas',
        'Apenas o "next" do nó que precede o ponto de inserção na lista'
      ],
      correct: 1
    },
    remove: {
      text: 'Em uma lista duplamente encadeada, ao remover um nó intermediário, quais ponteiros garantem a continuidade bidirecional?',
      options: [
        '"next" do predecessor aponta para o sucessor; "prev" do sucessor aponta para o predecessor',
        'Somente o "next" do predecessor precisa ser atualizado para o sucessor',
        'Somente o "prev" do sucessor precisa ser atualizado para o predecessor',
        'Os ponteiros "next" e "prev" do nó removido devem ser zerados antes da exclusão'
      ],
      correct: 0
    },
    move: {
      text: 'Qual é a vantagem estrutural ao mover um nó em uma lista duplamente encadeada?',
      options: [
        'Não é necessário atualizar nenhum ponteiro ao reposicionar o nó na lista',
        'O valor do nó pode ser copiado sem precisar removê-lo e reinseri-lo na estrutura',
        'A operação requer exatamente metade dos ponteiros de uma lista simples',
        'O ponteiro "prev" permite acessar o antecessor diretamente, sem percorrer a lista do início'
      ],
      correct: 3
    }
  },

  // ── Todas as Listas ────────────────────────────────────────────────────────
  todas_as_listas: {
    add: {
      text: 'Em qual tipo de lista a inserção de um nó no final exige atualizar o ponteiro do novo nó para apontar de volta ao head?',
      options: [
        'Lista encadeada simples, pois o último nó aponta para null',
        'Lista circular e lista duplamente encadeada circular, pois ambas mantêm o ciclo',
        'Lista duplamente encadeada linear, pois possui ponteiro "prev" no head',
        'Qualquer lista, pois todos os tipos requerem ponteiro de retorno ao head'
      ],
      correct: 1
    },
    remove: {
      text: 'Ao remover um nó intermediário, qual estrutura exige a atualização de mais ponteiros para manter a integridade?',
      options: [
        'Lista encadeada simples, pois só há ponteiro "next"',
        'Lista circular, pois o ciclo precisa ser reconstituído nos dois sentidos',
        'Lista duplamente encadeada circular, pois "next" e "prev" de ambos os vizinhos devem ser atualizados',
        'Todas as listas exigem a mesma quantidade de atualizações de ponteiros'
      ],
      correct: 2
    },
    move: {
      text: 'Qual característica torna o acesso ao antecessor direto ao reposicionar um nó, sem percorrer a lista do início?',
      options: [
        'A propriedade circular de listas circulares, que permite chegar ao nó anterior via head',
        'O índice de posição presente em listas encadeadas simples',
        'O ponteiro "prev" presente em listas duplamente encadeadas (linear ou circular)',
        'A estrutura de cabeçalho sentinela usada em todas as listas encadeadas'
      ],
      correct: 2
    }
  },

  // ── Lista Duplamente Encadeada Circular ────────────────────────────────────
  lista_dupla_circular: {
    add: {
      text: 'Na lista duplamente encadeada circular, ao inserir um novo nó, o que a distingue da lista dupla linear?',
      options: [
        'Nenhuma diferença; a lógica de inserção é idêntica à lista duplamente encadeada linear',
        'O novo nó é sempre inserido no início para preservar o ciclo bidirecional',
        'O "prev" do head e o "next" do novo nó se ajustam para manter o ciclo bidirecional',
        'Apenas os ponteiros "next" precisam ser configurados; o ciclo garante os "prev"'
      ],
      correct: 2
    },
    remove: {
      text: 'Em uma lista duplamente encadeada circular, ao remover um nó intermediário, quais ponteiros preservam o ciclo bidirecional?',
      options: [
        'O nó removido mantém seus ponteiros intactos para não quebrar o ciclo',
        '"next" do predecessor aponta para o sucessor; "prev" do sucessor aponta para o predecessor',
        'Somente o "next" do predecessor precisa ser atualizado para o sucessor do removido',
        'Apenas o ponteiro "prev" do sucessor precisa ser atualizado para o predecessor'
      ],
      correct: 1
    },
    move: {
      text: 'Ao trocar dois nós de posição em uma lista duplamente encadeada circular, qual é a quantidade mínima de ponteiros a atualizar?',
      options: [
        'Dois: somente os ponteiros "next" dos dois nós trocados entre si',
        'Quatro: apenas os ponteiros internos ("next" e "prev") dos dois nós trocados',
        'Nenhum: apenas os valores armazenados nos nós são trocados, os ponteiros ficam',
        'Oito: "next" e "prev" de cada nó trocado e dos respectivos vizinhos de cada um'
      ],
      correct: 3
    }
  }
};

export default PHASES;