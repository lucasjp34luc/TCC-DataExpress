# Game Design Document (GDD)
# DataExpress — DATA EXPRESS

**Versão:** 1.0
**Data:** 27/03/2026
**Plataforma:** Web (Browser — Desktop/Mobile)
**Gênero:** RPG Educacional / Roguelite / Quiz
**Público-alvo:** Estudantes de Ciência da Computação (graduação)
**Tema educacional:** Estruturas de dados lineares (listas encadeadas)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Contexto e Motivação](#2-contexto-e-motivação)
3. [Narrativa e Ambientação](#3-narrativa-e-ambientação)
4. [Fluxo do Jogo](#4-fluxo-do-jogo)
5. [Sistemas de Jogo](#5-sistemas-de-jogo)
6. [Fases e Estruturas de Dados](#6-fases-e-estruturas-de-dados)
7. [Personagens](#7-personagens)
8. [Inimigos](#8-inimigos)
9. [Salas e Vagões](#9-salas-e-vagões)
10. [Sistema de Combate](#10-sistema-de-combate)
11. [Cena de Manutenção](#11-cena-de-manutenção)
12. [Cena de Mimic (Baús)](#12-cena-de-mimic-baús)
13. [Loja](#13-loja)
14. [Itens](#14-itens)
15. [Sistema de Progressão e Ouro](#15-sistema-de-progressão-e-ouro)
16. [Modo PvP](#16-modo-pvp)
17. [Conquistas](#17-conquistas)
18. [Sistema de Perfil e Histórico](#18-sistema-de-perfil-e-histórico)
19. [Sistema de Turmas (Professor)](#19-sistema-de-turmas-professor)
20. [Tutorial](#20-tutorial)
21. [Interface e Renderização](#21-interface-e-renderização)
22. [Áudio](#22-áudio)
23. [Arquitetura Técnica](#23-arquitetura-técnica)
24. [Banco de Questões](#24-banco-de-questões)
25. [Cenas — Referência Completa](#25-cenas--referência-completa)

---

## 1. Visão Geral

**DataExpress** (também chamado de **MetrôQuiz**) é um jogo educacional baseado em navegador que combina mecânicas de RPG por turnos, roguelite e quiz interativo para ensinar estruturas de dados lineares da ciência da computação — especificamente listas encadeadas em suas quatro variantes: simples, circular, duplamente encadeada e duplamente circular.

O jogador embarca em uma viagem de trem (metrô) cujos vagões representam nós de uma lista encadeada. Cada vagão é uma sala com um desafio: batalha contra inimigos, evento de baús misteriosos (Mimic), compras em loja ou operações de manutenção no trem. Para avançar, o jogador responde questões de múltipla escolha. Acertar resulta em mais dano; errar ainda permite sobreviver, mas com penalidade.

### Pilares de Design

| Pilar | Descrição |
|-------|-----------|
| **Aprendizagem Ativa** | O conteúdo teórico é vivenciado através da mecânica — o trem *é* a lista encadeada |
| **Progressão Significativa** | Cada fase ensina um tipo de lista com complexidade crescente |
| **Risco e Recompensa** | Escolhas de rota, itens e personagem afetam diretamente a dificuldade |
| **Jogabilidade Acessível** | Controles apenas por clique/toque; sem habilidade motora exigida |
| **Contexto Social** | Ranking, PvP, turmas e perfil incentivam engajamento contínuo |

---

## 2. Contexto e Motivação

O jogo foi desenvolvido como Trabalho de Conclusão de Curso (TCC). A motivação central é a dificuldade que estudantes de computação encontram no aprendizado de estruturas de dados abstratas, especialmente listas encadeadas, que exigem visualização mental de ponteiros e percorrimento de nós.

A metáfora do **trem/metrô** resolve isso de forma intuitiva:

- O **trem inteiro** = a lista encadeada
- Cada **vagão** = um nó da lista
- **Avançar/recuar entre vagões** = percorrer ponteiros `next` e `prev`
- O **maquinista** = o ponteiro de cabeça (`head`)
- O **tipo de trilho** (unidirecional, circular, bidirecional) = o tipo de lista

---

## 3. Narrativa e Ambientação

### 3.1 Premissa

A narrativa é apresentada em 6 slides no início do jogo. Um líder convoca o jogador para uma missão urgente: o MetrôQuiz — o trem mais avançado do mundo — foi hackeado por uma inteligência artificial maliciosa chamada **CORR0MPR**. Os vagões do trem foram corrompidos, e os inimigos tomaram conta dos trilhos.

O jogador assume o papel de um especialista enviado para restaurar o sistema, vagão por vagão, respondendo questões de estruturas de dados para derrotar os inimigos corrompidos.

### 3.2 Tom e Estética

- **Estética:** Sci-fi / Cyberpunk / Metrô futurista
- **Paleta:** Azul escuro (`#050810`), tons de neon (azul `#4a9eff`, vermelho `#ff4a4a`, dourado `#ffcc44`)
- **Fontes:** Rajdhani (corpo), Orbitron (títulos/HUD)
- **Atmosfera:** Tenso mas acessível; urgência de missão

### 3.3 Final

Após o jogador vencer as 5 fases, uma cutscene de encerramento é exibida em **EndingScene**: o líder agradece, o herói parte de nave espacial, e o ciclo se encerra.

---

## 4. Fluxo do Jogo

### 4.1 Fluxo Completo — Modo História

```
[Tela de Login / Criar Conta]
         ↓
[Seleção de Modo: História | PvP | Ranking | Tutorial]
         ↓
[Narrativa (6 slides — pode pular)]
         ↓
[Seleção de Fase (5 tipos de lista)]
         ↓
[Seleção de Personagem (Estudioso | Assassino)]
         ↓
[Mapa dos Vagões]
    ↙    ↓    ↘    ↓    ↘
 Batalha Mimic Loja Manutenção Chefe
         ↓ (todos vagões limpos + chefe derrotado)
[Vitória] → (todas as fases?) → [Ending] → Fase Select
         ↓ (HP = 0)
[Game Over] → Retry | Revisar Run
```

### 4.2 Fluxo Completo — Modo PvP

```
[PvP Setup]
  ├── Seleção de Personagem
  ├── Criar Sala (gera código) ou Entrar (digita código)
  └── Selecionar Fase
         ↓ (2 jogadores conectados)
[PvP Battle — questões simultâneas]
         ↓
[PvP Result — vence quem zerar HP do oponente]
  ├── Revanche
  └── Sair
```

### 4.3 Condições de Vitória e Derrota

| Condição | Resultado |
|----------|-----------|
| HP do jogador chega a 0 | Game Over |
| Todos os vagões limpos + chefe derrotado | Vitória |
| Vitória em todas as 5 fases | Ending Scene desbloqueada |
| HP do oponente a 0 (PvP) | Vitória PvP |

---

## 5. Sistemas de Jogo

### 5.1 Estrutura do Estado Global

O estado do jogo é gerenciado centralmente em `SceneManager.state` e compartilhado entre todas as cenas:

```
state = {
  phase:          { id, name, listType, questions[] }
  character:      { stats, sprites, passive }
  player:         { hp, maxHp, atk, baseAtk, items[] }
  rooms:          [ tipo de cada vagão (array de strings) ]
  baseRooms:      [ cópia original para reset de ciclo ]
  currentRoom:    índice 0-based do vagão atual
  gold:           quantidade de ouro atual
  clearedRooms:   Set<índice> de vagões já concluídos
  questionsCorrect / questionsWrong: contadores
  listCycle:      número do ciclo atual (fases circulares)
  enemyScale:     multiplicador de HP/ATK inimigo (1.0 base)
  bossDefeated:   boolean
  canFinish:      boolean
  maxRoom:        índice do último vagão válido
  currentUser:    { userId, username, role, classId }
  runQuestions:   histórico de Q&A para revisão
}
```

### 5.2 Geração de Vagões

Os vagões são gerados em `CharSelectScene._generateRooms()` com as seguintes regras:

- Posições 0 e 3 são sempre **enemy**
- Posição 1 é sempre **shop**
- Posições 2 e 4 têm distribuição probabilística:
  - 60% enemy
  - 20% mimic
  - 20% maintenance
- Posição final (índice 4 ou 5 dependendo da fase) é sempre **boss**

Exemplo de array gerado: `['enemy', 'shop', 'mimic', 'enemy', 'maintenance', 'boss']`

---

## 6. Fases e Estruturas de Dados

O jogo possui **5 fases**, cada uma ensinando um tipo de lista encadeada. A fase determina como o jogador pode navegar entre vagões no Mapa.

### 6.1 Tabela de Fases

| ID | Nome | Tipo de Lista | Navegação | Ciclos |
|----|------|---------------|-----------|--------|
| `lista_encadeada` | Lista Encadeada | Simples | Apenas para frente | Não |
| `lista_circular` | Lista Circular | Circular | Apenas para frente, infinita | Sim |
| `lista_dupla` | Lista Duplamente Encadeada | Dupla | Livre (frente e trás) | Não |
| `lista_dupla_circular` | Lista Duplamente Circular | Dupla Circular | Livre + circular | Sim |
| `todas_as_listas` | Todas as Listas | Dupla Circular | Livre + circular | Sim |

### 6.2 Mecânica de Ciclos (Fases Circulares)

Quando o jogador chega ao final de uma fase circular e derrota o chefe, em vez de encerrar a fase imediatamente, o jogo oferece a opção **"Próximo Ciclo"**. A cada ciclo:

- `listCycle` incrementa em 1
- `enemyScale` multiplica por **1.15** (inimigos ficam 15% mais fortes em HP e ATK)
- Novos vagões são gerados com os mesmos tipos base (`baseRooms`)
- O jogador conserva HP, ouro e itens

Isso cria uma progressão de dificuldade crescente e incentiva múltiplas rodadas. As conquistas de ciclo exigem 5 ou 10 ciclos em uma única run.

### 6.3 Restrição da Lista Encadeada Simples

Na fase `lista_encadeada`, o jogador não pode navegar para trás — assim como um ponteiro `next` só aponta para frente. Na **Cena de Manutenção**, adicionar vagões atrás do vagão atual é bloqueado, pois representaria inserção em posição inacessível de uma lista simples.

### 6.4 Navegação no Mapa

| Tipo de Lista | Botão "Anterior" | Botão "Próximo" | Wrapping |
|---------------|------------------|-----------------|----------|
| Simples | Desabilitado | Habilitado | Não |
| Circular | Desabilitado | Habilitado | Sim (volta ao início) |
| Dupla | Habilitado | Habilitado | Não |
| Dupla Circular | Habilitado | Habilitado | Sim (ambas direções) |
| Todas as Listas | Habilitado | Habilitado | Sim (ambas direções) |

---

## 7. Personagens

O jogador escolhe entre dois personagens antes de iniciar a run. Cada personagem tem estatísticas distintas e uma **passiva** que muda fundamentalmente a forma de jogar.

### 7.1 Estudioso

| Atributo | Valor |
|----------|-------|
| HP base | 130 |
| ATK base | 20 |
| Cor | `#4a9eff` (azul) |

**Passiva — Olho Crítico:**
- Na Cena de Mimic (baús), as recompensas **não são borradas** — o jogador vê exatamente o que está em cada baú antes de hackear
- Em batalha, o jogador pode **eliminar 2 alternativas erradas** antes de responder (reduz o risco de errar)

**Bônus adicional:**
- Recebe **+5 de ouro** a cada vitória em batalha

**Playstyle:** Estratégico e informado. Indicado para jogadores que preferem segurança, querem errar menos e se beneficiam de informação adicional.

### 7.2 Assassino

| Atributo | Valor |
|----------|-------|
| HP base | 160 |
| ATK base | 300 |
| Cor | `#ff4a4a` (vermelho) |

**Passiva — Golpe Crítico:**
- **15% de chance de crítico** em cada ataque: dano multiplicado por **1.8×**
- A cada resposta correta consecutiva, ganha **+2.5% de ATK** (máximo de +25%)
- Começa com ATK muito mais alto, favorecendo bursts de dano

**Playstyle:** Agressivo e volátil. Indicado para jogadores que preferem alto dano, aceitam risco e buscam encadear acertos.

### 7.3 Comparativo

| | Estudioso | Assassino |
|--|-----------|-----------|
| HP | 130 (menor) | 160 (maior) |
| ATK | 20 (menor) | 300 (maior) |
| Risco de errar | Menor (elimina 2 erradas) | Maior (sem ajuda) |
| Dano consistente | Sim | Variável (crit) |
| Info sobre baús | Total | Borrada |
| Ouro extra | +5/vitória | Não |

---

## 8. Inimigos

O jogo possui **3 tipos de inimigos base**, cada um com 3 sprites de estado (idle, attack, hurt):

### 8.1 Tipos de Inimigos

| Tipo | Contexto | Comportamento |
|------|----------|---------------|
| Inimigo Padrão | Vagão enemy | Ataca após pergunta |
| Mimic | Vagão mimic | Guardião dos baús |
| Chefe | Vagão boss | HP e ATK maiores |

### 8.2 Escalabilidade de Inimigos

Os inimigos escalam com base em dois fatores:

1. **Fase atual:** Cada fase tem inimigos com HP/ATK base diferentes
2. **Ciclo:** A cada ciclo em fases circulares, `enemyScale *= 1.15`

O multiplicador atual é exibido na tela de batalha como `(×N.NN)` ao lado da barra de HP do inimigo.

---

## 9. Salas e Vagões

### 9.1 Tipos de Vagão

| Tipo | Ícone no Mapa | Descrição |
|------|--------------|-----------|
| `enemy` | Espada/Inimigo | Batalha de RPG por turnos com questão |
| `mimic` | Baú | 3 baús com recompensas ocultas |
| `shop` | Moeda/Loja | Compra de itens com ouro |
| `maintenance` | Chave/Engrenagem | Manipulação dos vagões com quiz |
| `boss` | Caveira/Chefe | Batalha final da fase |
| `mimic_enemy` | Baú+Espada | Variante de mimic com opção de batalha |

### 9.2 Distribuição Base dos Vagões

```
Índice 0: enemy           (sempre)
Índice 1: shop            (sempre)
Índice 2: 60% enemy / 20% mimic / 20% maintenance
Índice 3: enemy           (sempre)
Índice 4: 60% enemy / 20% mimic / 20% maintenance
Índice 5: boss            (sempre)
```

### 9.3 Estado dos Vagões no Mapa

No mapa, cada vagão exibe visualmente seu estado:

- **Não visitado:** Ícone normal
- **Limpo (clearedRooms):** Ícone com marca de concluído / opacidade reduzida
- **Atual:** Destaque com borda ou brilho
- **Bloqueado:** Para listas que não permitem acesso retroativo

---

## 10. Sistema de Combate

O combate é **por turnos** e acoplado diretamente ao sistema de quiz.

### 10.1 Sequência de Turno

```
1. QUESTION    — Pergunta exibida com 4 alternativas
2. Jogador escolhe resposta (sem tempo limite)
3. PLAYER_ATTACK — Jogador ataca o inimigo
   ├── Acerto: dano = ATK × (crítico? × 1.8 : 1.0)
   └── Erro:   dano = ATK × 0.3
4. ENEMY_ATTACK — Inimigo ataca o jogador (ATK fixo por fase)
5. RESULT      — Mostra dano causado e recebido
6. WIN ou LOSE — Verifica HP de ambos
```

### 10.2 Cálculo de Dano

| Situação | Fórmula |
|----------|---------|
| Acerto normal (Estudioso) | `ATK × 1.0` |
| Acerto com crítico (Assassino, 15%) | `ATK × 1.8` |
| Erro (qualquer personagem) | `ATK × 0.3` |
| Ataque inimigo | Fixo por tipo de inimigo × `enemyScale` |

### 10.3 Assassino — Bônus de Acerto Consecutivo

O Assassino acumula bônus de ATK a cada resposta correta:

```
ATK atual = baseAtk + (acertos_consecutivos × 2.5%)
Máximo:     baseAtk × 1.25  (25% de bônus)
Reset:      ao errar uma questão
```

### 10.4 Estudioso — Eliminação de Alternativas

Ao ativar a passiva **Olho Crítico** em batalha, 2 das 4 alternativas erradas são ocultas, deixando o jogador escolher entre a correta e apenas 1 incorreta (2 alternativas visíveis).

### 10.5 Animações de Combate

- Sprite do inimigo e do jogador animam durante os estados de ataque/hurt
- Números de dano flutuam para cima e desaparecem
- Barras de HP atualizam com transição suave
- Resposta correta: destaque verde na alternativa escolhida
- Resposta errada: destaque vermelho + destaque verde na correta

### 10.6 Ouro pós-batalha

| Resultado | Ouro ganho |
|-----------|-----------|
| Vitória (qualquer personagem) | Fixo por fase |
| Vitória com Estudioso | +5 ouro adicional |
| Derrota | Nenhum |

---

## 11. Cena de Manutenção

A Cena de Manutenção representa operações de inserção, remoção e movimentação em uma lista encadeada. O jogador **precisa provar sua competência** respondendo uma questão antes de executar cada operação.

### 11.1 Fluxo de Estados

```
MENU
  ├── Adicionar Vagão  ──→ QUESTION ──→ ADD_SELECT ──→ Confirmação
  ├── Remover Vagão    ──→ QUESTION ──→ REMOVE_SELECT ──→ Confirmação
  ├── Mover Vagão      ──→ QUESTION ──→ MOVE_SOURCE ──→ MOVE_DEST ──→ Confirmação
  └── Sair (encerra manutenção)
        ↓
     ERROR (se operação inválida)
```

### 11.2 Questão de Capacitação

Antes de cada operação, um popup exibe:
> "Prove sua capacitação para realizar esta operação."

- **Acerto:** Prossegue para a operação escolhida
- **Erro:** Exibe a resposta correta e a mensagem: *"Não foi dessa vez, quem sabe na próxima."* — a operação NÃO é executada

### 11.3 Operação: Adicionar Vagão

- O jogador escolhe a **posição** para inserção
- Um novo vagão é criado com distribuição:
  - 60% enemy
  - 20% mimic
  - 20% maintenance
- Se inserido no **final** da lista: automaticamente se torna **boss**

**Restrição (Lista Encadeada Simples):** Não é possível inserir vagões em índices ≤ ao índice atual (`currentRoom`), pois representaria inserção em posição inacessível em uma lista simples (sem ponteiro anterior).

### 11.4 Operação: Remover Vagão

**Restrições de remoção:**

| Condição | Bloqueado? | Mensagem |
|----------|-----------|----------|
| Vagão atual (currentRoom) | Sim | "Esse vagão tem prioridade suprema. Não é possível mexer nele." |
| Vagão da loja | Sim | "Esse vagão tem prioridade suprema. Não é possível mexer nele." |
| Único vagão boss restante | Sim | "Esse vagão tem prioridade suprema. Não é possível mexer nele." |

### 11.5 Operação: Mover Vagão (Swap)

- O jogador escolhe a **origem** e o **destino** do swap
- Os dois vagões trocam de posição

**Restrições de movimentação:**

| Condição | Bloqueado? |
|----------|-----------|
| Boss como origem | Sim |
| Shop como origem | Sim |
| CurrentRoom como origem | Sim |

### 11.6 Ajustes Pós-operação

Após qualquer operação bem-sucedida, o sistema recalcula:
- `clearedRooms` (ajusta índices conforme inserção/remoção)
- `baseRooms` (cópia para reset de ciclo)
- `currentRoom` (se necessário)
- `maxRoom` (último índice válido)

### 11.7 Encerrar Manutenção

Ao clicar "Sair", o vagão atual é marcado como limpo (`clearedRooms.add(currentRoom)`) e o jogador volta ao Mapa.

---

## 12. Cena de Mimic (Baús)

A Cena de Mimic apresenta **3 baús** com recompensas ocultas. O jogador escolhe um baú e pode tentar hackear o sistema para obter o item sem batalha.

### 12.1 Fluxo

```
3 baús exibidos na tela
  ↓
Jogador clica em um baú
  ↓
Recompensa revelada (borrada para Assassino / clara para Estudioso)
  ↓
Opção: Hackear | Lutar
  ├── Hackear: Pergunta exibida
  │     ├── Acerto: Item obtido sem batalha
  │     └── Erro: Pode tentar outro baú ou lutar
  └── Lutar: Batalha normal com o Mimic
        ├── Vitória: Item obtido
        └── Derrota: Game Over
```

### 12.2 Recompensas dos Baús

Cada baú contém um item aleatório da lista de itens da loja. A quantidade de ouro também pode ser uma recompensa.

### 12.3 Efeito da Passiva do Estudioso

- Estudioso: Vê o nome e efeito do item **sem blur** — pode escolher estrategicamente qual baú hackear
- Assassino: O conteúdo aparece com texto **criptografado/borrado** (`cr1pt0-t3xt`) — precisa tentar às cegas

---

## 13. Loja

A Loja está sempre presente em um vagão fixo do trem. O jogador pode comprar itens usando ouro acumulado.

### 13.1 Regras da Loja

- O jogador pode comprar **múltiplos itens** por visita
- Cada item pode ser comprado **uma vez por ciclo** (rastreado por `itemsBoughtThisCycle`)
- O controle de ciclo é resetado ao entrar em um novo ciclo
- Mensagens de feedback são exibidas:
  - Ouro insuficiente: *"Ouro insuficiente."*
  - Já comprado nesse ciclo: *"Você já comprou esse item neste ciclo."*

### 13.2 Layout

6 cards dispostos em grid 3×2. Cada card exibe:
- Ícone do item
- Nome
- Efeito (ex: `+10 ATK`, `Cura 15% HP`)
- Preço em ouro

---

## 14. Itens

| ID | Nome | Custo | Efeito |
|----|------|-------|--------|
| `buff_dano_5` | Força Simples | 25 🪙 | +5 ATK |
| `buff_dano_10` | Força Moderada | 45 🪙 | +10 ATK |
| `buff_dano_15` | Força Pesada | 65 🪙 | +15 ATK, -10 HP |
| `buff_vida_10` | Kit Médico | 35 🪙 | Cura 15% do HP máximo |
| `buff_dano_vida_5` | Módulo Balanceado | 40 🪙 | +5 ATK, Cura 5% HP |

### 14.1 Considerações de Design

- `buff_dano_15` tem um **trade-off**: muito dano mas reduz HP permanentemente — indica que itens poderosos têm custo
- `buff_dano_vida_5` é o item de melhor custo-benefício para a maioria dos jogadores
- A loja não tem itens de defesa pura — o foco é em dano e sustentabilidade mínima

---

## 15. Sistema de Progressão e Ouro

### 15.1 Fontes de Ouro

| Fonte | Quantidade |
|-------|-----------|
| Vitória em batalha (base) | Variável por fase |
| Passiva Estudioso | +5 ouro/vitória |
| Baú Mimic (hack bem-sucedido) | Pode ser ouro direto |
| Conquistas | Não dão ouro |

### 15.2 Persistência entre Vagões

- O ouro **persiste** entre vagões na mesma run
- HP do jogador **persiste** (exceto cura por item)
- ATK do jogador **persiste** (bônus de itens e passiva do Assassino)
- Ao começar nova run: tudo é resetado para os valores base do personagem

### 15.3 Progressão Meta (entre Runs)

A progressão meta do jogador é rastreada no servidor:

| Metric | Armazenado em |
|--------|--------------|
| Vitórias por fase | `players.json` / servidor |
| Derrotas por fase | `players.json` / servidor |
| Precisão por fase | Calculado: `corretas / (corretas + erradas)` |
| Histórico das últimas 5 runs | `runHistory[]` no perfil |
| Conquistas desbloqueadas | `achievements{}` no perfil |
| Medalhas de fase | `localStorage` (por usuário) |

---

## 16. Modo PvP

O Modo PvP permite dois jogadores se enfrentarem em tempo real via WebSocket.

### 16.1 Arquitetura

```
Cliente A ──WebSocket──┐
                       ├── Servidor WSS (localhost:3000) ──→ lógica de sala
Cliente B ──WebSocket──┘
```

### 16.2 Fluxo de Conexão

1. Jogador A cria uma sala → servidor gera código único
2. Jogador B entra com o código
3. Ambos selecionam personagem e fase
4. Servidor confirma início quando ambos estão prontos

### 16.3 Mecânica de PvP

- Ambos recebem **a mesma questão simultaneamente**
- Cada jogador responde independentemente
- Servidor calcula o dano de ambos e envia `round_result`:
  - `p1Damage`, `p2Damage`, `p1Hp`, `p2Hp`
- HP dos dois jogadores é exibido na tela
- O jogo termina quando um deles chega a HP = 0

### 16.4 Mensagens WebSocket

| Tipo de Mensagem | Direção | Payload |
|-----------------|---------|---------|
| `create_room` | C → S | `{phase, character}` |
| `join_room` | C → S | `{roomCode, character}` |
| `question` | S → C | `{text, options[4], correctIndex}` |
| `answer` | C → S | `{selectedIndex}` |
| `round_result` | S → C | `{p1Damage, p2Damage, p1Hp, p2Hp}` |
| `game_over` | S → C | `{winner, stats}` |

### 16.5 Resultado PvP

A tela de resultado exibe:
- Vencedor / Perdedor / Empate
- Estatísticas da partida (acertos, erros, dano total)
- Botão de Revanche (mesma sala, nova partida)
- Botão de Sair

---

## 17. Conquistas

O sistema de conquistas possui **32 conquistas** organizadas em **6 categorias**.

### 17.1 Categorias e Conquistas

#### Geral (11 conquistas)

| Nome | Condição | Raridade |
|------|----------|---------|
| Primeiros Passos | Primeira vitória em qualquer fase | Comum |
| Veterano | 10 vitórias totais | Comum |
| Campeão | 25 vitórias totais | Raro |
| Lenda | 50 vitórias totais | Épico |
| Perfeccionista | 100% de precisão em uma run | Lendário |
| Explorador | Jogar todas as 5 fases ao menos uma vez | Comum |
| Viajante | Completar 3 fases | Raro |
| Mestre | Completar todas as 5 fases | Épico |
| Bom Aluno | 80% de precisão acumulada | Raro |
| Especialista | 90% de precisão acumulada | Épico |
| Run Perfeita | Completar uma run sem errar nenhuma questão | Lendário |

#### Lista Encadeada (3 conquistas)

| Nome | Condição | Raridade |
|------|----------|---------|
| Primeira Conexão | 1ª vitória na fase | Comum |
| Mestre dos Nós | 5 vitórias nesta fase | Raro |
| Encadeado Perfeito | 100% de precisão nesta fase | Épico |

#### Lista Circular (4 conquistas)

| Nome | Condição | Raridade |
|------|----------|---------|
| Ciclo Iniciado | 1ª vitória nesta fase | Comum |
| Girador | 5 ciclos em uma única run | Raro |
| Inquebrável | 10 ciclos em uma única run | Épico |
| Circular Perfeito | 100% de precisão | Lendário |

#### Lista Duplamente Encadeada (3 conquistas)

| Nome | Condição | Raridade |
|------|----------|---------|
| Dupla Ligação | 1ª vitória nesta fase | Comum |
| Mestre Duplo | 5 vitórias nesta fase | Raro |
| Duplamente Perfeito | 100% de precisão nesta fase | Épico |

#### Lista Duplamente Circular (4 conquistas)

| Nome | Condição | Raridade |
|------|----------|---------|
| Ciclo Duplo | 1ª vitória nesta fase | Comum |
| Duplo Girador | 5 ciclos em uma única run | Raro |
| Eterno | 10 ciclos em uma única run | Épico |
| Duplamente Circular Perfeito | 100% de precisão | Lendário |

#### Todas as Listas (3 conquistas)

| Nome | Condição | Raridade |
|------|----------|---------|
| Mestre das Listas | 1ª vitória nesta fase | Raro |
| Trilhador Total | 3 vitórias nesta fase | Épico |
| Absoluto | 100% de precisão nesta fase | Lendário |

### 17.2 Sistema de Raridades

| Raridade | Cor | Quantidade |
|---------|-----|-----------|
| Comum | `#7a9aaa` | 11 |
| Raro | `#5ab4ff` | 8 |
| Épico | `#cc44ff` | 9 |
| Lendário | `#ffcc44` | 4 |

### 17.3 Interface de Conquistas

- Filtros por categoria (Geral, Encadeada, Circular, etc.)
- Filtros por status (Todas, Desbloqueadas, Bloqueadas)
- Barras de progresso para conquistas incrementais (ex: 10/25 vitórias)
- Scroll com mouse wheel para listas longas

---

## 18. Sistema de Perfil e Histórico

### 18.1 Perfil do Jogador

A tela de perfil exibe:
- Nome de usuário
- Tabela de estatísticas por fase:
  - Número de vitórias
  - Número de derrotas
  - Precisão (% de acertos)
- Link para conquistas
- Botão de logout

### 18.2 Histórico de Runs

A tela de **RunHistory** exibe as últimas 5 runs do jogador para cada fase:
- Resultado (vitória/derrota)
- Data e hora
- Precisão da run
- Clicável para revisão detalhada

### 18.3 Revisão de Run (RunReview)

Lista scrollável de todas as perguntas respondidas em uma run:
- Texto da questão
- 4 alternativas dispostas em 2×2
- Destaque da alternativa escolhida (verde = correto, vermelho = errado)
- Destaque da alternativa correta (se errou)

### 18.4 Replay Rápido (RunReplay)

Acessível ao final de uma run (vitória ou derrota), exibe o mesmo formato da RunReview mas com os dados da run recém-concluída (`state.runQuestions`).

### 18.5 Ranking Global

Tabela por fase com:
- Posição (1º, 2º, 3º... com ícones de medalha 🥇🥈🥉)
- Nome de usuário
- Número de vitórias
- Precisão média

O jogador pode clicar no nome de outro jogador para ver o perfil desse jogador.

---

## 19. Sistema de Turmas (Professor)

O jogo possui um sistema de turmas que permite professores criarem grupos de alunos e personalizarem as questões.

### 19.1 Papéis de Usuário

| Papel | Capacidades |
|-------|-------------|
| `aluno` | Jogar, entrar em turma, ver perfil/ranking |
| `professor` | Tudo do aluno + criar turmas, gerenciar questões, ver dashboard |

### 19.2 Fluxo do Professor

```
TeacherProfile
  ├── Lista de turmas (máx. 5)
  ├── Criar nova turma (gera código de acesso)
  └── Clicar turma → ClassRoom
           ├── Lista de alunos
           ├── Expulsar aluno
           ├── Ver perfil do aluno
           ├── Gerenciar Questões → ClassQuestions
           └── Ver Dashboard → ClassDashboard
```

### 19.3 Questões Customizadas (ClassQuestions)

- 5 abas de fase
- Lista de questões por fase
- Adicionar / Editar / Deletar questões
- Prompt helper: Sugere formato JSON para gerar questões via IA
- Questões sincronizadas ao servidor
- Alunos da turma recebem essas questões no lugar das padrão ao selecionar a fase

### 19.4 Dashboard da Turma (ClassDashboard)

- Painel esquerdo: tabela de alunos com vitórias, derrotas, barras de precisão
- Painel direito: estatísticas agregadas da turma
- 5 abas de fase para análise por estrutura de dados

### 19.5 Entrada em Turma (Aluno)

Na tela **JoinClass**, o aluno:
1. Digita o código da turma
2. Confirma entrada
3. Ou, se já está em uma turma, pode sair (`Leave`)

---

## 20. Tutorial

O tutorial interativo possui **12 slides** e pode ser acessado a qualquer momento pelo menu principal.

| Slide | Conteúdo |
|-------|----------|
| 1 | Bem-vindo ao DataExpress — visão geral |
| 2 | Estrutura do trem (5 vagões = 5 nós) |
| 3 | Lista Encadeada — conceito e navegação |
| 4 | Lista Circular — ciclos e wrapping |
| 5 | Lista Duplamente Encadeada — bidirecionalidade |
| 6 | Lista Duplamente Circular — liberdade total |
| 7 | Mecânica de batalha — questões e dano |
| 8 | Mecânica de Mimic — baús e hacking |
| 9 | Loja e Manutenção — compras e operações |
| 10 | Precisão e ciclos — como a pontuação funciona |
| 11 | Seleção de personagem — Estudioso vs Assassino |
| 12 | Pronto para jogar! — CTA para iniciar |

---

## 21. Interface e Renderização

### 21.1 Sistema de Renderização Virtual

O jogo utiliza um canvas HTML5 com **resolução virtual de 1280×720 pixels**, escalada proporcionalmente para qualquer tamanho de tela real. Isso garante:

- Layout consistente em todas as resoluções
- Manutenção da proporção 16:9 com letterbox quando necessário
- Coordenadas internas previsíveis para posicionamento

### 21.2 Primitivos do Renderer

O `Renderer.js` encapsula o contexto 2D do canvas e expõe:

| Método | Uso |
|--------|-----|
| `drawImage(img, x, y, w, h, alpha)` | Sprites e fundos |
| `drawImageBlurred(img, x, y, w, h)` | Baús do mimic (Assassino) |
| `fillRect(x, y, w, h, color, radius)` | Cards, painéis, caixas |
| `strokeRect(x, y, w, h, color, lw, radius)` | Bordas e contornos |
| `drawText(text, x, y, size, color, align, font)` | Texto geral |
| `drawTextShadow(...)` | Títulos com sombra |
| `drawWrappedText(text, x, y, maxW, size, color)` | Texto multi-linha |
| `drawButton(x, y, w, h, label, color, hover)` | Botões interativos |
| `drawProgressBar(x, y, w, h, value, max, color)` | Barras de HP/XP |
| `drawOverlay(alpha)` | Escurecimento de tela |
| `drawGradientBg(c1, c2)` | Gradiente de fundo |
| `fillCircle(x, y, r, color)` | Círculos (efeitos) |
| `drawLine(x1, y1, x2, y2, color, lw)` | Linhas de vagões no mapa |

### 21.3 Gestão de Input

O `InputManager.js` converte coordenadas de mouse/toque do espaço real para o espaço virtual (1280×720):

```
virtualX = (realX - offsetX) / scaleX
virtualY = (realY - offsetY) / scaleY
```

Suporta:
- Eventos de mouse (`mousedown`, `mousemove`, `mouseup`)
- Eventos de toque (`touchstart`, `touchmove`, `touchend`)
- Detecção de hover para mudança de cursor
- Hit-testing com retângulos: `Renderer.hitTest(rect, px, py)`

### 21.4 Carregamento de Assets

O `AssetLoader.js` carrega **50 imagens** em paralelo com:
- Barra de progresso na tela de loading
- Fallback: placeholder cinza 200×200 para imagens ausentes
- Callback de progresso chamado a cada imagem carregada

### 21.5 Paleta Visual

| Uso | Cor |
|-----|-----|
| Fundo principal | `#050810` |
| Texto principal | `#ffffff` |
| Acento azul (Estudioso) | `#4a9eff` |
| Acento vermelho (Assassino) | `#ff4a4a` |
| Ouro / Lendário | `#ffcc44` |
| Raridade Épica | `#cc44ff` |
| Raridade Rara | `#5ab4ff` |
| Raridade Comum | `#7a9aaa` |
| Verde (acerto) | `#44ff88` |
| Vermelho (erro) | `#ff4444` |

---

## 22. Áudio

O jogo utiliza **2 faixas de música** em loop contínuo:

| Faixa | Arquivo | Contexto | Volume Padrão |
|-------|---------|---------|---------------|
| Lobby | `assets/music/Lobby.mp3` | Menus, seleção, perfil | 0.7 (70%) |
| Batalha | `assets/music/Batalha.mp3` | Gameplay (mapa, batalha, loja) | 0.7 (70%) |

### 22.1 Comportamento

- Autoplay no primeiro clique do usuário (política de navegador)
- Transição automática entre Lobby/Batalha conforme a cena
- Volume configurável via slider em `SettingsScene` (0–100%)
- Toggle de mudo disponível
- Preferências persistidas em `localStorage` (`audioPrefs`)

---

## 23. Arquitetura Técnica

### 23.1 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript (ES Modules) |
| Renderização | Canvas 2D API |
| Backend | Node.js + WebSocket (ws) |
| Protocolo PvP | WSS (WebSocket Secure, autossignado) |
| Persistência | `players.json` (servidor) + `localStorage` (cliente) |
| Autenticação | SHA-256 hash de senha no cliente |

### 23.2 Estrutura de Arquivos

```
game/
├── index.html                  Ponto de entrada, canvas, loading overlay
├── package.json                Dependências Node (ws, selfsigned)
├── server.js                   Servidor Node: REST + WebSocket PvP
├── css/
│   └── style.css               Estilos globais, fontes, layout responsivo
├── assets/
│   ├── image/
│   │   ├── Historia/           6 slides da narrativa (1440×960)
│   │   ├── Cenario/            3 fundos de batalha
│   │   ├── Personagens/        6 sprites (Estudioso×3, Assassino×3)
│   │   ├── Inimigos/           9 sprites (3 tipos × idle/attack/hurt)
│   │   └── Itens/              5 ícones de item
│   └── music/
│       ├── Lobby.mp3
│       └── Batalha.mp3
└── src/
    ├── core/
    │   ├── Game.js             Loop principal, registro de cenas
    │   ├── Renderer.js         Renderização virtual 1280×720
    │   ├── SceneManager.js     Estado global, troca de cenas
    │   ├── InputManager.js     Mouse/toque → coordenadas virtuais
    │   ├── AssetLoader.js      Carregamento de imagens com progresso
    │   ├── AudioManager.js     Duas faixas, volume, localStorage
    │   └── PvpNetworkManager.js WebSocket singleton para PvP
    ├── data/
    │   ├── questions.js        5 PHASES + MAINTENANCE_QUESTIONS
    │   ├── characters.js       Estudioso, Assassino
    │   ├── items.js            5 itens de loja
    │   └── achievements.js     32 conquistas
    └── scenes/                 27 cenas (ver §25)
```

### 23.3 Padrão de Cenas

Todas as cenas seguem a interface duck-typed:

```javascript
class MinhaCena {
  enter(params) { /* inicialização */ }
  exit()        { /* cleanup */ }
  update(dt)    { /* lógica (dt em segundos) */ }
  render(r)     { /* desenho via Renderer r */ }
}
```

As cenas são registradas em `Game.js` e trocadas via `SceneManager.go('nomeDaCena', params)`.

### 23.4 Loop de Jogo

O loop principal em `Game.js`:
- Usa `requestAnimationFrame`
- Limita `dt` a máximo de **50ms** por frame (proteção contra tab-switch)
- Chama `scene.update(dt)` depois `scene.render(renderer)`

### 23.5 Gerenciamento de Sessão

- Login persiste sessão em `localStorage` com TTL de **30 minutos**
- `currentUser` armazenado em `SceneManager.state`
- Expiração verificada a cada troca de cena

### 23.6 Servidor — Endpoints REST

| Método | Rota | Função |
|--------|------|--------|
| POST | `/login` | Autenticação |
| POST | `/register` | Criar conta |
| GET | `/player/:userId` | Perfil do jogador |
| POST | `/player/result` | Registrar resultado de batalha |
| GET | `/ranking/:phaseId` | Leaderboard da fase |
| GET | `/classes/owned/:userId` | Turmas do professor |
| POST | `/class` | Criar nova turma |
| DELETE | `/class/:classId` | Deletar turma |
| GET | `/class/:classId` | Detalhes da turma |
| POST | `/class/:classId/kick` | Expulsar aluno |
| GET | `/server-ip` | IP local da rede |

---

## 24. Banco de Questões

### 24.1 Estrutura de Questão

```javascript
{
  text: "Qual é a principal característica de uma lista encadeada?",
  options: [
    "Acesso direto por índice em O(1)",
    "Cada elemento aponta para o próximo através de um ponteiro",
    "Tamanho fixo definido na criação",
    "Elementos armazenados em posições contíguas na memória"
  ],
  correctIndex: 1
}
```

### 24.2 Questões por Fase

| Fase | Questões de Batalha | Questões de Manutenção |
|------|--------------------|-----------------------|
| Lista Encadeada | 1 | 3 (add/remove/move) |
| Lista Circular | 1 | 3 (add/remove/move) |
| Lista Dupla | 1 | 3 (add/remove/move) |
| Lista Dupla Circular | 3 | 3 (add/remove/move) |
| Todas as Listas | 7 | 3 (add/remove/move) |

### 24.3 Questões de Manutenção

Cada fase tem questões específicas para cada tipo de operação (adicionar, remover, mover). O índice correto **varia por questão** para evitar padrões previsíveis.

Exemplo para fase `lista_encadeada`, operação `add`:
> "O que acontece quando inserimos um nó no meio de uma lista encadeada simples?"
> - A) O nó anterior perde sua referência para o próximo → **Errado**
> - B) Precisamos atualizar o ponteiro `next` do nó anterior e do novo nó → **Correto**
> - C) Todos os nós posteriores são realocados na memória → **Errado**
> - D) A lista precisa ser recriada do zero → **Errado**

### 24.4 Questões Customizadas pelo Professor

Quando um aluno está matriculado em uma turma, as questões do professor **substituem** as questões padrão do banco. Isso permite que o professor adapte o conteúdo ao seu currículo específico.

---

## 25. Cenas — Referência Completa

| Cena | Arquivo | Função |
|------|---------|--------|
| `login` | LoginScene.js | Autenticação com username/senha |
| `createAccount` | CreateAccountScene.js | Criação de conta aluno/professor |
| `modeSelect` | ModeSelectScene.js | Hub central: História, PvP, Ranking, Tutorial |
| `story` | StoryScene.js | Narrativa de 6 slides (pode pular) |
| `phaseSelect` | PhaseSelectScene.js | Seleção de 1 das 5 fases |
| `charSelect` | CharSelectScene.js | Seleção de personagem + geração de vagões |
| `map` | MapScene.js | Navegação entre vagões do trem |
| `battle` | BattleScene.js | Combate RPG por turnos com quiz |
| `mimic` | MimicScene.js | Evento de 3 baús com hacking |
| `shop` | ShopScene.js | Compra de itens com ouro |
| `maintenance` | MaintenanceScene.js | Operações de lista (add/remove/move) |
| `victory` | VictoryScene.js | Tela de vitória da fase |
| `gameover` | GameOverScene.js | Tela de derrota |
| `ending` | EndingScene.js | Cutscene final (todas as 5 fases) |
| `settings` | SettingsScene.js | Volume, mute, pular história |
| `profile` | ProfileScene.js | Perfil, estatísticas, logout |
| `achievements` | AchievementsScene.js | 32 conquistas filtráveis |
| `tutorial` | TutorialScene.js | 12 slides interativos |
| `runHistory` | RunHistoryScene.js | Últimas 5 runs por fase |
| `runReview` | RunReviewScene.js | Revisão detalhada de uma run |
| `runReplay` | RunReplayScene.js | Revisão da run recém-concluída |
| `ranking` | RankingScene.js | Leaderboard global por fase |
| `pvpSetup` | PvpSetupScene.js | Setup do PvP (personagem, código) |
| `pvpBattle` | PvpBattleScene.js | Batalha PvP em tempo real |
| `pvpResult` | PvpResultScene.js | Resultado PvP + revanche |
| `teacherProfile` | TeacherProfileScene.js | Gestão de turmas do professor |
| `classRoom` | ClassRoomScene.js | Lista de alunos da turma |
| `classQuestions` | ClassQuestionsScene.js | Gestão de questões da turma |
| `classDashboard` | ClassDashboardScene.js | Analytics de desempenho da turma |
| `joinClass` | JoinClassScene.js | Aluno entra numa turma por código |

---

## Apêndice A — Glossário

| Termo | Definição |
|-------|-----------|
| **Run** | Uma partida completa, do início (CharSelect) ao fim (Victory ou GameOver) |
| **Ciclo** | Uma volta completa pelos vagões em fases circulares |
| **Vagão** | Um nó da lista, representado como sala do trem |
| **Chefe** | Último vagão de cada fase, com inimigo mais forte |
| **Mimic** | Vagão especial com 3 baús e mecânica de hacking |
| **Hack** | Responder uma questão para obter item do Mimic sem batalha |
| **Precisão** | Porcentagem de questões respondidas corretamente |
| **EnemyScale** | Multiplicador de HP/ATK dos inimigos (aumenta por ciclo) |
| **ClearedRooms** | Set de índices de vagões já concluídos na run atual |
| **BaseRooms** | Cópia do array original de vagões para reset de ciclo |
| **Passiva** | Habilidade especial do personagem ativa durante toda a run |

---

## Apêndice B — Diagramas de Fluxo de Estado

### Fluxo de Estado — BattleScene

```
QUESTION
   │ (jogador escolhe opção)
   ▼
PLAYER_ATTACK
   │ (animação + dano calculado)
   ▼
ENEMY_ATTACK
   │ (inimigo ataca)
   ▼
RESULT
   │ ├── inimigo HP ≤ 0 → WIN → volta ao Mapa
   │ └── jogador HP ≤ 0 → LOSE → GameOver
   └── (ambos vivos) → QUESTION (próximo turno)
```

### Fluxo de Estado — MaintenanceScene

```
MENU
 ├─[Adicionar]─→ QUESTION ──→ [Acerto] → ADD_SELECT → (escolhe posição) → confirma
 │                         └─[Erro]   → erro + retorna ao MENU
 ├─[Remover]──→ QUESTION ──→ [Acerto] → REMOVE_SELECT → (escolhe vagão) → confirma
 │                         └─[Erro]   → erro + retorna ao MENU
 ├─[Mover]────→ QUESTION ──→ [Acerto] → MOVE_SOURCE → MOVE_DEST → confirma
 │                         └─[Erro]   → erro + retorna ao MENU
 └─[Sair]─────→ marca vagão como limpo → MapScene
                    │
                ERROR (operação inválida por regras)
```

### Fluxo de Estado — MimicScene

```
(3 baús exibidos)
   │ (jogador clica em baú)
   ▼
(recompensa revelada — clara/borrada)
   │
   ├─[Hackear]─→ QUESTION
   │               ├─[Acerto] → item obtido → MapScene
   │               └─[Erro]   → pode tentar outro baú
   │
   └─[Lutar]───→ BattleScene
                   ├─[Vitória] → item obtido → MapScene
                   └─[Derrota] → GameOverScene
```

---

*Fim do Game Design Document — DataExpress / MetrôQuiz*
*Versão 1.0 — Elaborado para TCC — 27/03/2026*
