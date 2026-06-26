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
        text: "O que caracteriza uma lista dinâmica em comparação a uma lista estática?",
        options: [
          "Podem redimensionar-se dinamicamente",
          "São indexadas",
          "Usam vetor fixo",
          "Não usam ponteiros"
        ],
        correct: 0
      },
      {
        text: "Qual é uma vantagem das listas dinâmicas sobre listas estáticas sequenciais?",
        options: [
          "Inserções e remoções eficientes em qualquer posição",
          "Acesso indexado rápido",
          "Menor uso de memória",
          "Tamanho fixo"
        ],
        correct: 0
      },
      {
        text: "Qual é uma desvantagem comum das listas dinâmicas?",
        options: [
          "Maior sobrecarga de memória",
          "Acesso indexado rápido",
          "Implementação trivial",
          "Tamanho fixo"
        ],
        correct: 0
      },
      {
        text: "O que cada nó de uma lista simplesmente encadeada armazena?",
        options: [
          "Um valor e um ponteiro para o próximo",
          "Somente um valor",
          "Somente um ponteiro",
          "Dois valores numéricos"
        ],
        correct: 0
      },
      {
        text: "O que significa o atributo 'prox' em um nó da lista simplesmente encadeada?",
        options: [
          "Aponta para o próximo nó",
          "Armazena o valor do nó",
          "Aponta para o nó anterior",
          "Armazena o índice"
        ],
        correct: 0
      },
      {
        text: "O que o atributo 'prim' representa na classe Ldse?",
        options: [
          "Endereço do primeiro nó",
          "Quantidade de nós",
          "Último valor inserido",
          "Capacidade máxima"
        ],
        correct: 0
      },
      {
        text: "O que indica quando 'prim' e 'ult' são None?",
        options: [
          "Lista vazia",
          "Lista cheia",
          "Erro de execução",
          "Elemento duplicado"
        ],
        correct: 0
      },
      {
        text: "Qual operação insere um nó no início da lista simplesmente encadeada?",
        options: [
          "Inserir_inicio()",
          "Inserir_fim()",
          "Show()",
          "Remover_fim()"
        ],
        correct: 0
      },
      {
        text: "Qual operação remove o último nó da lista simplesmente encadeada?",
        options: [
          "Remover_fim()",
          "Inserir_fim()",
          "Inserir_inicio()",
          "Tamanho_atual()"
        ],
        correct: 0
      },
      {
        text: "O que faz o método estaVazia()?",
        options: [
          "Verifica se a lista está vazia",
          "Retorna o último valor",
          "Insere no fim",
          "Remove do início"
        ],
        correct: 0
      },
      {
        text: "Qual método retorna a quantidade de nós na lista?",
        options: [
          "Retorna quant",
          "Retorna ult",
          "Retorna prim",
          "Retorna prox"
        ],
        correct: 0
      },
      {
        text: "O que ocorre ao inserir o primeiro elemento em uma lista vazia?",
        options: [
          "Prim e ult apontam para o novo nó",
          "Nada acontece",
          "Ult aponta para None",
          "Prim aponta para None"
        ],
        correct: 0
      },
      {
        text: "Na inserção no início, o novo nó deve apontar para:",
        options: [
          "Para o antigo primeiro nó",
          "Para None sempre",
          "Para o último nó",
          "Para ele mesmo"
        ],
        correct: 0
      },
      {
        text: "Na inserção no fim, qual deve ser o valor do campo prox do novo nó?",
        options: [
          "None",
          "O primeiro nó",
          "O nó anterior",
          "Qualquer endereço aleatório"
        ],
        correct: 0
      },
      {
        text: "O que ocorre com o atributo ult ao inserir no fim em uma lista não vazia?",
        options: [
          "Passa a apontar para o novo nó",
          "Permanece igual",
          "Aponta para prim",
          "Aponta para None"
        ],
        correct: 0
      },
      {
        text: "O que é liberado automaticamente pelo garbage collector ao remover um nó?",
        options: [
          "O espaço de memória do nó removido",
          "Toda a lista",
          "O vetor de índices",
          "Nada"
        ],
        correct: 0
      },
      {
        text: "O que significa dizer que o acesso em listas encadeadas é sequencial?",
        options: [
          "Exige percorrer nó a nó",
          "É direto por índice",
          "É sempre O(1)",
          "Usa busca binária"
        ],
        correct: 0
      },
      {
        text: "Qual estrutura facilita inserir e remover elementos em qualquer posição?",
        options: [
          "Listas encadeadas",
          "Listas estáticas",
          "Vetores simples",
          "Matrizes"
        ],
        correct: 0
      },
      {
        text: "O que é uma lista circular?",
        options: [
          "O último aponta para o primeiro",
          "Tem dois ponteiros por nó",
          "Não possui prox",
          "É limitada em tamanho"
        ],
        correct: 0
      },
      {
        text: "Qual é a função de um nó cabeça (dummy node)?",
        options: [
          "Facilitar inserções e remoções",
          "Armazenar dados extras",
          "Reduzir memória",
          "Impedir remoções"
        ],
        correct: 0
      },
      {
        text: "Como se representa o fim de uma lista simplesmente encadeada em Python?",
        options: [
          "None",
          "0",
          "-1",
          "prim"
        ],
        correct: 0
      },
      {
        text: "O que acontece com quant após uma inserção?",
        options: [
          "É incrementado em 1",
          "É decrementado",
          "Não muda",
          "É zerado"
        ],
        correct: 0
      },
      {
        text: "Qual operação percorre e imprime todos os valores da lista?",
        options: [
          "Show()",
          "Inserir_fim()",
          "Remover_inicio()",
          "Ver_primeiro()"
        ],
        correct: 0
      },
      {
        text: "Por que listas duplamente encadeadas consomem mais memória?",
        options: [
          "Possuem dois ponteiros por nó",
          "Não usam ponteiros",
          "Usam vetor fixo",
          "São circulares"
        ],
        correct: 0
      },
      {
        text: "O que permite que skip lists realizem buscas mais rápidas?",
        options: [
          "Os múltiplos níveis",
          "O nó cabeça",
          "O uso de vetor",
          "A ausência de ponteiros"
        ],
        correct: 0
      },
      {
        text: "O que ocorre com o atributo prim ao inserir no início?",
        options: [
          "Passa a apontar para o novo nó",
          "Permanece inalterado",
          "Aponta para None",
          "É apagado"
        ],
        correct: 0
      },
      {
        text: "O que a classe No recebe em seu construtor?",
        options: [
          "Valor e endereço do próximo nó",
          "Somente o valor",
          "Somente o índice",
          "Somente o próximo"
        ],
        correct: 0
      },
      {
        text: "Quando é usado o valor None no campo prox?",
        options: [
          "Quando é o último nó",
          "Quando é o primeiro nó",
          "Nunca é usado",
          "Quando a lista está cheia"
        ],
        correct: 0
      },
      {
        text: "Por que listas dinâmicas não precisam de tam_maximo?",
        options: [
          "Porque crescem dinamicamente",
          "Porque usam vetor",
          "Porque possuem tamanho fixo",
          "Porque não usam memória"
        ],
        correct: 0
      },
      {
        text: "Qual atributo da Ldse aponta para o último nó da lista?",
        options: [
          "ult",
          "prim",
          "prox",
          "quant"
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
        text: "O que caracteriza uma lista circular?",
        options: [
          "O último elemento aponta para None",
          "O último elemento aponta para o primeiro",
          "Os elementos são armazenados de forma aleatória",
          "A lista não possui início definido"
        ],
        correct: 1
      },
      {
        text: "Qual a principal vantagem de uma lista estática sequencial circular?",
        options: [
          "Permite crescimento ilimitado",
          "Evita deslocamento de elementos em inserções e remoções",
          "Usa menos memória que uma lista encadeada",
          "Remove automaticamente elementos vazios"
        ],
        correct: 1
      },
      {
        text: "O operador módulo (%) é usado em listas circulares para:",
        options: [
          "Garantir acesso aleatório",
          "Evitar valores negativos",
          "Manter o índice dentro dos limites do vetor",
          "Criar novos elementos automaticamente"
        ],
        correct: 2
      },
      {
        text: "Em uma lista circular estática, a próxima posição após o índice 4 em um vetor de tamanho 5 é:",
        options: [
          "4",
          "5",
          "0",
          "1"
        ],
        correct: 2
      },
      {
        text: "Na função inserir_fim, após inserir o elemento, a posição fim é atualizada usando:",
        options: [
          "(fim + 1) % tam_maximo",
          "(fim - 1) % tam_maximo",
          "fim + 2",
          "fim = 0 sempre"
        ],
        correct: 0
      },
      {
        text: "Quando a lista está vazia, o que vale para inicio e fim?",
        options: [
          "inicio = 0 e fim = 1",
          "inicio e fim apontam para posições diferentes",
          "inicio e fim apontam para a mesma posição",
          "inicio é None"
        ],
        correct: 2
      },
      {
        text: "A operação remover_fim atualiza a posição fim para:",
        options: [
          "(fim + 1) % tam_maximo",
          "(fim - 1) % tam_maximo",
          "Sempre 0",
          "Sempre o último índice do vetor"
        ],
        correct: 1
      },
      {
        text: "Qual atributo indica onde será inserido o próximo elemento no fim da lista estática circular?",
        options: [
          "tam_maximo",
          "quant",
          "inicio",
          "fim"
        ],
        correct: 3
      },
      {
        text: "A função inserir_inicio atualiza o índice inicio usando:",
        options: [
          "(inicio + 1) % tam_maximo",
          "(inicio - 1) % tam_maximo",
          "inicio + tam_maximo",
          "inicio sempre volta para 0"
        ],
        correct: 1
      },
      {
        text: "Após remover do início, a posição inicio passa a ser:",
        options: [
          "(inicio + 1) % tam_maximo",
          "inicio + 1",
          "(inicio - 1) % tam_maximo",
          "Sempre 0"
        ],
        correct: 0
      },
      {
        text: "O método show percorre a lista circular utilizando:",
        options: [
          "Um for tradicional sem módulo",
          "Contagem fixa até tam_maximo",
          "(inicio + i) % tam_maximo",
          "Índices decrescentes"
        ],
        correct: 2
      },
      {
        text: "A função ver_primeiro retorna:",
        options: [
          "O último elemento da lista",
          "O primeiro elemento usando a posição inicio",
          "O total de elementos",
          "Sempre o valor None"
        ],
        correct: 1
      },
      {
        text: "A função ver_ultimo utiliza qual cálculo para acessar o último elemento?",
        options: [
          "fim + 1",
          "(fim - 1) % tam_maximo",
          "inicio - 1",
          "quant - 1"
        ],
        correct: 1
      },
      {
        text: "Qual condição indica que a lista circular está cheia?",
        options: [
          "quant == 0",
          "fim == inicio",
          "quant == tam_maximo",
          "fim - inicio == 1"
        ],
        correct: 2
      },
      {
        text: "Em uma lista simplesmente encadeada circular, o último nó aponta para:",
        options: [
          "None",
          "O nó anterior",
          "O primeiro nó",
          "Um nó especial sentinela"
        ],
        correct: 2
      },
      {
        text: "Na implementação dinâmica circular, o atributo prim representa:",
        options: [
          "O último nó",
          "O nó do meio",
          "O primeiro nó",
          "O tamanho da lista"
        ],
        correct: 2
      },
      {
        text: "Em listas circulares, percorrer sem controle adequado pode gerar:",
        options: [
          "Estouro de pilha",
          "Circularidade infinita",
          "Perda de memória",
          "Remoção automática"
        ],
        correct: 1
      },
      {
        text: "O atributo quant armazena:",
        options: [
          "O tamanho máximo do vetor",
          "A quantidade de elementos na lista",
          "O índice do último elemento",
          "O índice do primeiro elemento"
        ],
        correct: 1
      },
      {
        text: "A vantagem de listas circulares em jogos é:",
        options: [
          "Eliminar necessidade de memória",
          "Permitir navegação contínua de elementos",
          "Impedir repetições",
          "Criar gráficos automaticamente"
        ],
        correct: 1
      },
      {
        text: "Uma lista estática circular utiliza qual estrutura principal?",
        options: [
          "Árvore",
          "Fila",
          "Vetor de tamanho fixo",
          "Grafo"
        ],
        correct: 2
      },
      {
        text: "Quando inserir_fim adiciona um elemento, ele é colocado em:",
        options: [
          "inicio",
          "fim",
          "quant",
          "tam_maximo"
        ],
        correct: 1
      },
      {
        text: "Na lista circular estática, remover_inicio decrementa:",
        options: [
          "fim",
          "tam_maximo",
          "inicio",
          "quant"
        ],
        correct: 3
      },
      {
        text: "A lista circular evita desperdício de espaço porque:",
        options: [
          "Remove automaticamente espaços vazios",
          "Não deixa posições inutilizadas após remoções",
          "Reorganiza o vetor periodicamente",
          "Copia os elementos para outro vetor"
        ],
        correct: 1
      },
      {
        text: "Para percorrer uma lista circular, é essencial usar:",
        options: [
          "Operações de potência",
          "Operador módulo (%)",
          "Divisão inteira",
          "Operações bitwise"
        ],
        correct: 1
      },
      {
        text: "Fim representa:",
        options: [
          "A posição do último elemento",
          "A posição posterior ao último elemento",
          "A primeira posição livre sempre é 0",
          "O número total de nós"
        ],
        correct: 1
      },
      {
        text: "Em listas estáticas circulares, inserir no início exige:",
        options: [
          "Deslocar todos os elementos",
          "Redimensionar o vetor",
          "Atualizar inicio para trás circularmente",
          "Zerar quant"
        ],
        correct: 2
      },
      {
        text: "Uma lista dinâmica circular simplesmente encadeada difere da linear pois:",
        options: [
          "O último nó aponta para o primeiro",
          "Cada nó possui dois ponteiros",
          "É armazenada em vetor",
          "Não possui nós"
        ],
        correct: 0
      },
      {
        text: "O laço de exibição da lista circular deve parar quando:",
        options: [
          "aux == None",
          "aux == fim",
          "quant == 0",
          "inicio == 0"
        ],
        correct: 1
      },
      {
        text: "A lista circular permite inserir e remover sem:",
        options: [
          "Verificar limites",
          "Alterar quant",
          "Deslocar elementos",
          "Usar ponteiros"
        ],
        correct: 2
      },
      {
        text: "O primeiro elemento de uma lista circular está localizada na posição:",
        options: [
          "quant",
          "tam_maximo",
          "inicio",
          "fim"
        ],
        correct: 2
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
        text: "O que caracteriza uma lista duplamente encadeada?",
        options: [
          "Possui ponteiros para anterior e próximo",
          "É circular por padrão",
          "Não usa ponteiros",
          "Usa vetor fixo"
        ],
        correct: 0
      },
      {
        text: "Quantos ponteiros um nó da Ldde possui?",
        options: [
          "Dois",
          "Um",
          "Três",
          "Nenhum"
        ],
        correct: 0
      },
      {
        text: "Qual é a função do ponteiro 'ant' em um nó da Ldde?",
        options: [
          "Aponta para o nó anterior",
          "Aponta para o próximo nó",
          "Armazena o valor",
          "Armazena índice"
        ],
        correct: 0
      },
      {
        text: "Qual é a função do ponteiro 'prox' em um nó da Ldde?",
        options: [
          "Aponta para o próximo nó",
          "Aponta para o anterior",
          "Armazena posição",
          "Remove elementos"
        ],
        correct: 0
      },
      {
        text: "Qual classe representa os nós da Ldde?",
        options: [
          "No",
          "Ldde",
          "Nodo",
          "Estrutura"
        ],
        correct: 0
      },
      {
        text: "Qual classe representa a lista duplamente encadeada?",
        options: [
          "Ldde",
          "No",
          "Lista",
          "Encadeada"
        ],
        correct: 0
      },
      {
        text: "Qual atributo aponta para o primeiro nó da Ldde?",
        options: [
          "prim",
          "ult",
          "ant",
          "prox"
        ],
        correct: 0
      },
      {
        text: "Qual atributo aponta para o último nó da Ldde?",
        options: [
          "ult",
          "prim",
          "quant",
          "ant"
        ],
        correct: 0
      },
      {
        text: "Quando prim e ult são None, o que isso representa?",
        options: [
          "Lista vazia",
          "Lista cheia",
          "Erro de memória",
          "Último nó duplicado"
        ],
        correct: 0
      },
      {
        text: "Qual a principal vantagem da Ldde em relação à Ldse?",
        options: [
          "Acesso bidirecional",
          "Menor consumo de memória",
          "Implementação mais simples",
          "Tamanho fixo"
        ],
        correct: 0
      },
      {
        text: "O que ocorre ao inserir o primeiro nó em uma Ldde vazia?",
        options: [
          "Prim e ult apontam para o novo nó",
          "Nada muda",
          "Ult recebe None",
          "Prim recebe None"
        ],
        correct: 0
      },
      {
        text: "Na inserção no início, o ponteiro 'ant' do novo nó deve ser:",
        options: [
          "None",
          "O último nó",
          "O próprio nó",
          "O valor do próximo nó"
        ],
        correct: 0
      },
      {
        text: "Na inserção no início, o ponteiro 'prox' do novo nó deve apontar para:",
        options: [
          "O antigo primeiro nó",
          "None",
          "O último nó",
          "Ele mesmo"
        ],
        correct: 0
      },
      {
        text: "Na inserção no fim, o ponteiro 'prox' do novo nó deve ser:",
        options: [
          "None",
          "O primeiro nó",
          "O penúltimo nó",
          "O próprio nó"
        ],
        correct: 0
      },
      {
        text: "Na inserção no fim, o ponteiro 'ant' do novo nó deve apontar para:",
        options: [
          "O antigo último nó",
          "None",
          "O primeiro nó",
          "Ele mesmo"
        ],
        correct: 0
      },
      {
        text: "O que deve ser atualizado no antigo primeiro nó ao inserir no início?",
        options: [
          "O ponteiro ant",
          "O ponteiro prox",
          "O ponteiro quant",
          "Nenhum ponteiro"
        ],
        correct: 0
      },
      {
        text: "Qual ponteiro do antigo último nó deve ser atualizado ao inserir no fim?",
        options: [
          "O ponteiro prox",
          "O ponteiro ant",
          "O ponteiro prim",
          "Nenhum"
        ],
        correct: 0
      },
      {
        text: "Qual operação remove o primeiro elemento da Ldde?",
        options: [
          "remover_inicio()",
          "remover_fim()",
          "show()",
          "inserir_inicio()"
        ],
        correct: 0
      },
      {
        text: "Qual operação remove o último elemento da Ldde?",
        options: [
          "remover_fim()",
          "remover_inicio()",
          "show_inverso()",
          "ver_ultimo()"
        ],
        correct: 0
      },
      {
        text: "O que ocorre com prim ao remover o primeiro elemento?",
        options: [
          "Passa a apontar para o segundo nó",
          "Aponta para None",
          "Permanece igual",
          "É apagado"
        ],
        correct: 0
      },
      {
        text: "O que ocorre com ult ao remover o último elemento?",
        options: [
          "Passa a apontar para o penúltimo nó",
          "Aponta para None",
          "Permanece igual",
          "É apagado"
        ],
        correct: 0
      },
      {
        text: "Qual ponteiro é atualizado para None ao remover o primeiro elemento?",
        options: [
          "ant",
          "prox",
          "prim",
          "ult"
        ],
        correct: 0
      },
      {
        text: "Qual ponteiro é atualizado para None ao remover o último elemento?",
        options: [
          "prox",
          "ant",
          "prim",
          "ult"
        ],
        correct: 0
      },
      {
        text: "Qual método percorre a Ldde do início ao fim?",
        options: [
          "show()",
          "show_inverso()",
          "tamanho_atual()",
          "ver_primeiro()"
        ],
        correct: 0
      },
      {
        text: "Qual método percorre a Ldde do fim ao início?",
        options: [
          "show_inverso()",
          "show()",
          "remover_fim()",
          "buscar()"
        ],
        correct: 0
      },
      {
        text: "O que retorna a função tamanho_atual()?",
        options: [
          "O número de elementos da lista",
          "O valor do primeiro nó",
          "O valor do último nó",
          "A soma dos valores"
        ],
        correct: 0
      },
      {
        text: "O que verifica a função esta_vazia()?",
        options: [
          "Se a lista está vazia",
          "Se a lista está cheia",
          "Se há valores repetidos",
          "Se há erro"
        ],
        correct: 0
      },
      {
        text: "Qual função retorna o valor do último nó da lista?",
        options: [
          "ver_ultimo()",
          "ver_primeiro()",
          "tamanho_atual()",
          "esta_vazia()"
        ],
        correct: 0
      },
      {
        text: "Qual função retorna o valor do primeiro nó da lista?",
        options: [
          "ver_primeiro()",
          "ver_ultimo()",
          "esta_vazia()",
          "show()"
        ],
        correct: 0
      },
      {
        text: "Qual é uma desvantagem da Ldde?",
        options: [
          "Maior uso de memória",
          "Busca lenta",
          "Sem navegação reversa",
          "Tamanho fixo"
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
        text: "O que caracteriza uma lista duplamente encadeada circular?",
        options: [
          "O último nó aponta para o primeiro e o primeiro para o último",
          "Possui apenas um ponteiro",
          "Usa vetor fixo",
          "Não possui nós"
        ],
        correct: 0
      },
      {
        text: "Em uma lista duplamente encadeada circular, o ponteiro prox do último nó aponta para:",
        options: [
          "O primeiro nó",
          "None",
          "Ele mesmo",
          "O penúltimo nó"
        ],
        correct: 0
      },
      {
        text: "Em uma lista duplamente encadeada circular, o ponteiro ant do primeiro nó aponta para:",
        options: [
          "O último nó",
          "None",
          "Ele mesmo",
          "O segundo nó"
        ],
        correct: 0
      },
      {
        text: "Qual a principal vantagem da lista circular?",
        options: [
          "Permite percurso contínuo",
          "Usa menos memória",
          "Não usa ponteiros",
          "É estática"
        ],
        correct: 0
      },
      {
        text: "Uma lista circular está vazia quando:",
        options: [
          "O ponteiro head é None",
          "Head aponta para ele mesmo",
          "Existe apenas um nó",
          "O último é None"
        ],
        correct: 0
      },
      {
        text: "Ao inserir em uma lista circular vazia:",
        options: [
          "O nó aponta para ele mesmo em ant e prox",
          "O nó aponta para None",
          "A lista continua vazia",
          "O nó aponta para o último"
        ],
        correct: 0
      },
      {
        text: "Em uma lista circular, quantos ponteiros cada nó possui?",
        options: [
          "Dois",
          "Um",
          "Três",
          "Nenhum"
        ],
        correct: 0
      },
      {
        text: "O percurso em lista circular termina quando:",
        options: [
          "Retorna ao nó inicial",
          "Chega em None",
          "Chega no último",
          "Percorre metade"
        ],
        correct: 0
      },
      {
        text: "Para inserir no início da lista circular, deve-se atualizar:",
        options: [
          "O último e o primeiro nó",
          "Apenas o primeiro",
          "Apenas o último",
          "Nenhum"
        ],
        correct: 0
      },
      {
        text: "Para inserir no final da lista circular, deve-se atualizar:",
        options: [
          "O último e o primeiro nó",
          "Somente o primeiro",
          "Somente o último",
          "Nenhum"
        ],
        correct: 0
      },
      {
        text: "Ao remover o primeiro nó em lista circular:",
        options: [
          "O último deve apontar para o novo primeiro",
          "Nada muda",
          "A lista acaba",
          "O último vira None"
        ],
        correct: 0
      },
      {
        text: "Ao remover o último nó em lista circular:",
        options: [
          "O primeiro deve apontar para o novo último",
          "Nada muda",
          "O primeiro vira None",
          "A lista dobra"
        ],
        correct: 0
      },
      {
        text: "Se a lista circular tem apenas um nó e ele é removido:",
        options: [
          "A lista fica vazia",
          "A lista continua com um nó",
          "O nó aponta para None",
          "Erro obrigatório"
        ],
        correct: 0
      },
      {
        text: "Qual estrutura é usada para implementar lista encadeada circular?",
        options: [
          "Nós com ponteiros ant e prox",
          "Vetores",
          "Pilhas",
          "Filas"
        ],
        correct: 0
      },
      {
        text: "Lista circular permite acesso:",
        options: [
          "Bidirecional e contínuo",
          "Apenas direto",
          "Apenas reverso",
          "Aleatório"
        ],
        correct: 0
      },
      {
        text: "Em lista circular não existe:",
        options: [
          "None entre nós",
          "Primeiro nó",
          "Último nó",
          "Dados"
        ],
        correct: 0
      },
      {
        text: "A inserção em lista circular geralmente tem custo:",
        options: [
          "O(1)",
          "O(n)",
          "O(log n)",
          "O(n²)"
        ],
        correct: 0
      },
      {
        text: "A remoção em lista circular geralmente tem custo:",
        options: [
          "O(1)",
          "O(n)",
          "O(log n)",
          "O(n²)"
        ],
        correct: 0
      },
      {
        text: "Para percorrer uma lista circular devemos usar:",
        options: [
          "Um ponteiro auxiliar",
          "Um vetor",
          "Recursão infinita",
          "Matriz"
        ],
        correct: 0
      },
      {
        text: "Uma lista circular pode ser percorrida:",
        options: [
          "A partir de qualquer nó",
          "Apenas do primeiro",
          "Apenas do último",
          "Não pode"
        ],
        correct: 0
      },
      {
        text: "Em lista circular duplamente encadeada existe ponteiro para:",
        options: [
          "Anterior e próximo",
          "Apenas próximo",
          "Apenas anterior",
          "Índice"
        ],
        correct: 0
      },
      {
        text: "Se head->ant aponta para o último nó, então a lista é:",
        options: [
          "Circular duplamente encadeada",
          "Simples",
          "Estática",
          "Vetor"
        ],
        correct: 0
      },
      {
        text: "A principal desvantagem da lista circular duplamente encadeada é:",
        options: [
          "Maior uso de memória",
          "Não permite remoção",
          "Não permite inserção",
          "É fixa"
        ],
        correct: 0
      },
      {
        text: "Para identificar o fim da lista circular verificamos:",
        options: [
          "Se voltou ao início",
          "Se chegou em None",
          "Se chegou no último",
          "Se acabou memória"
        ],
        correct: 0
      },
      {
        text: "Uma lista circular duplamente encadeada possui:",
        options: [
          "Ligação entre primeiro e último",
          "Apenas início",
          "Apenas fim",
          "Sem ligações"
        ],
        correct: 0
      },
      {
        text: "O ponteiro head normalmente aponta para:",
        options: [
          "O primeiro nó",
          "O último nó",
          "None sempre",
          "O nó do meio"
        ],
        correct: 0
      },
      {
        text: "O ponteiro tail normalmente aponta para:",
        options: [
          "O último nó",
          "O primeiro nó",
          "None",
          "O nó do meio"
        ],
        correct: 0
      },
      {
        text: "Em lista circular, tail->prox aponta para:",
        options: [
          "Head",
          "None",
          "Tail",
          "Penúltimo"
        ],
        correct: 0
      },
      {
        text: "Em lista circular, head->ant aponta para:",
        options: [
          "Tail",
          "None",
          "Head",
          "Segundo"
        ],
        correct: 0
      },
      {
        text: "Lista circular é muito usada em:",
        options: [
          "Sistemas de escalonamento",
          "Árvores binárias",
          "Busca binária",
          "Ordenação rápida"
        ],
        correct: 0
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
      {
        text: "O que caracteriza uma lista dinâmica em comparação a uma lista estática?",
        options: [
          "Podem redimensionar-se dinamicamente",
          "São indexadas",
          "Usam vetor fixo",
          "Não usam ponteiros"
        ],
        correct: 0
      },
      {
        text: "Qual é uma vantagem das listas dinâmicas sobre listas estáticas sequenciais?",
        options: [
          "Inserções e remoções eficientes em qualquer posição",
          "Acesso indexado rápido",
          "Menor uso de memória",
          "Tamanho fixo"
        ],
        correct: 0
      },
      {
        text: "Qual é uma desvantagem comum das listas dinâmicas?",
        options: [
          "Maior sobrecarga de memória",
          "Acesso indexado rápido",
          "Implementação trivial",
          "Tamanho fixo"
        ],
        correct: 0
      },
      {
        text: "O que cada nó de uma lista simplesmente encadeada armazena?",
        options: [
          "Um valor e um ponteiro para o próximo",
          "Somente um valor",
          "Somente um ponteiro",
          "Dois valores numéricos"
        ],
        correct: 0
      },
      {
        text: "O que significa o atributo 'prox' em um nó da lista simplesmente encadeada?",
        options: [
          "Aponta para o próximo nó",
          "Armazena o valor do nó",
          "Aponta para o nó anterior",
          "Armazena o índice"
        ],
        correct: 0
      },
      {
        text: "O que o atributo 'prim' representa na classe Ldse?",
        options: [
          "Endereço do primeiro nó",
          "Quantidade de nós",
          "Último valor inserido",
          "Capacidade máxima"
        ],
        correct: 0
      },
      {
        text: "O que indica quando 'prim' e 'ult' são None?",
        options: [
          "Lista vazia",
          "Lista cheia",
          "Erro de execução",
          "Elemento duplicado"
        ],
        correct: 0
      },
      {
        text: "O que caracteriza uma lista circular?",
        options: [
          "O último elemento aponta para None",
          "O último elemento aponta para o primeiro",
          "Os elementos são armazenados de forma aleatória",
          "A lista não possui início definido"
        ],
        correct: 1
      },
      {
        text: "Qual a principal vantagem de uma lista estática sequencial circular?",
        options: [
          "Permite crescimento ilimitado",
          "Evita deslocamento de elementos em inserções e remoções",
          "Usa menos memória que uma lista encadeada",
          "Remove automaticamente elementos vazios"
        ],
        correct: 1
      },
      {
        text: "O operador módulo (%) é usado em listas circulares para:",
        options: [
          "Garantir acesso aleatório",
          "Evitar valores negativos",
          "Manter o índice dentro dos limites do vetor",
          "Criar novos elementos automaticamente"
        ],
        correct: 2
      },
      {
        text: "Em uma lista circular estática, a próxima posição após o índice 4 em um vetor de tamanho 5 é:",
        options: [
          "4",
          "5",
          "0",
          "1"
        ],
        correct: 2
      },
      {
        text: "Na função inserir_fim, após inserir o elemento, a posição fim é atualizada usando:",
        options: [
          "(fim + 1) % tam_maximo",
          "(fim - 1) % tam_maximo",
          "fim + 2",
          "fim = 0 sempre"
        ],
        correct: 0
      },
      {
        text: "Quando a lista está vazia, o que vale para inicio e fim?",
        options: [
          "inicio = 0 e fim = 1",
          "inicio e fim apontam para posições diferentes",
          "inicio e fim apontam para a mesma posição",
          "inicio é None"
        ],
        correct: 2
      },
      {
        text: "A operação remover_fim atualiza a posição fim para:",
        options: [
          "(fim + 1) % tam_maximo",
          "(fim - 1) % tam_maximo",
          "Sempre 0",
          "Sempre o último índice do vetor"
        ],
        correct: 1
      },
      {
        text: "O que caracteriza uma lista duplamente encadeada?",
        options: [
          "Possui ponteiros para anterior e próximo",
          "É circular por padrão",
          "Não usa ponteiros",
          "Usa vetor fixo"
        ],
        correct: 0
      },
      {
        text: "Quantos ponteiros um nó da Ldde possui?",
        options: [
          "Dois",
          "Um",
          "Três",
          "Nenhum"
        ],
        correct: 0
      },
      {
        text: "Qual é a função do ponteiro 'ant' em um nó da Ldde?",
        options: [
          "Aponta para o nó anterior",
          "Aponta para o próximo nó",
          "Armazena o valor",
          "Armazena índice"
        ],
        correct: 0
      },
      {
        text: "Qual é a função do ponteiro 'prox' em um nó da Ldde?",
        options: [
          "Aponta para o próximo nó",
          "Aponta para o anterior",
          "Armazena posição",
          "Remove elementos"
        ],
        correct: 0
      },
      {
        text: "Qual classe representa os nós da Ldde?",
        options: [
          "No",
          "Ldde",
          "Nodo",
          "Estrutura"
        ],
        correct: 0
      },
      {
        text: "Qual classe representa a lista duplamente encadeada?",
        options: [
          "Ldde",
          "No",
          "Lista",
          "Encadeada"
        ],
        correct: 0
      },
      {
        text: "Qual atributo aponta para o primeiro nó da Ldde?",
        options: [
          "prim",
          "ult",
          "ant",
          "prox"
        ],
        correct: 0
      },
      {
        text: "O que caracteriza uma lista duplamente encadeada circular?",
        options: [
          "O último nó aponta para o primeiro e o primeiro para o último",
          "Possui apenas um ponteiro",
          "Usa vetor fixo",
          "Não possui nós"
        ],
        correct: 0
      },
      {
        text: "Em uma lista duplamente encadeada circular, o ponteiro prox do último nó aponta para:",
        options: [
          "O primeiro nó",
          "None",
          "Ele mesmo",
          "O penúltimo nó"
        ],
        correct: 0
      },
      {
        text: "Em uma lista duplamente encadeada circular, o ponteiro ant do primeiro nó aponta para:",
        options: [
          "O último nó",
          "None",
          "Ele mesmo",
          "O segundo nó"
        ],
        correct: 0
      },
      {
        text: "Qual a principal vantagem da lista circular?",
        options: [
          "Permite percurso contínuo",
          "Usa menos memória",
          "Não usa ponteiros",
          "É estática"
        ],
        correct: 0
      },
      {
        text: "Uma lista circular está vazia quando:",
        options: [
          "O ponteiro head é None",
          "Head aponta para ele mesmo",
          "Existe apenas um nó",
          "O último é None"
        ],
        correct: 0
      },
      {
        text: "Ao inserir em uma lista circular vazia:",
        options: [
          "O nó aponta para ele mesmo em ant e prox",
          "O nó aponta para None",
          "A lista continua vazia",
          "O nó aponta para o último"
        ],
        correct: 0
      },
      {
        text: "Em uma lista circular, quantos ponteiros cada nó possui?",
        options: [
          "Dois",
          "Um",
          "Três",
          "Nenhum"
        ],
        correct: 0
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
    }
  }
};

export default PHASES;