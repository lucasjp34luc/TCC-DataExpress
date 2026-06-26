# MetrôQuiz — O Trem do Conhecimento

Jogo 2D de combate por turnos baseado em perguntas de estruturas de dados e algoritmos.

## Estrutura do Projeto

```
game/
├── index.html                  ← Ponto de entrada
├── css/
│   └── style.css               ← Estilos globais
├── src/
│   ├── core/
│   │   ├── Game.js             ← Loop principal + inicialização
│   │   ├── Renderer.js         ← Renderizador canvas próprio (1280×720 virtual)
│   │   ├── SceneManager.js     ← Gerenciador de cenas
│   │   ├── InputManager.js     ← Mouse + toque → coordenadas virtuais
│   │   └── AssetLoader.js      ← Carregamento de imagens com progresso
│   ├── data/
│   │   ├── questions.js        ← 60+ perguntas em 5 temas
│   │   ├── characters.js       ← Estudioso e Assassino (stats + passivas)
│   │   └── items.js            ← 5 itens da loja
│   └── scenes/
│       ├── StoryScene.js       ← Introdução narrativa (slides)
│       ├── PhaseSelectScene.js ← Seleção de tema/linha
│       ├── CharSelectScene.js  ← Seleção de personagem
│       ├── MapScene.js         ← Progressão dos 5 vagões
│       ├── BattleScene.js      ← Combate por turnos com perguntas
│       ├── MimicScene.js       ← Evento dos 3 baús + hack
│       ├── ShopScene.js        ← Loja de itens
│       ├── GameOverScene.js    ← Tela de derrota
│       └── VictoryScene.js     ← Tela de vitória
└── assets/
    └── image/                  ← Sprites e cenários (já fornecidos)
```

## Como Executar

Precisa de um servidor HTTP local (devido ao ES Modules):

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# Live Server (VS Code)
# Instale a extensão e clique "Go Live"


```
Instalar e iniciar o servidor

cd game
npm install
node server.js
```

```

Acesse: `http://localhost:8080`

## Arquitetura

### Game Loop (Game.js)
```
requestAnimationFrame → update(dt) → render(renderer)
```

### Sistema de Cenas
Cada cena implementa: `enter(params?)`, `exit()`, `update(dt)`, `render(renderer)`

### Renderizador Virtual
- Coordenadas virtuais: **1280 × 720**
- Escala automática para qualquer resolução
- Proporção 16:9 mantida com letterbox

### Fluxo do Jogo
```
Story → PhaseSelect → CharSelect → Map ─┐
                                        ▼
                                   [Vagão 1-3] → Battle / Mimic / Shop
                                        ↓
                                   [Vagão 5] → Battle (Boss) → Victory
```

### Mecânica de Batalha
- **Acerto**: 100% do ATK
- **Erro**: 30% do ATK
- **Assassino (Passiva)**: Crítico 30% chance (1.8×) em acertos; erros = 20% ATK
- **Estudioso (Passiva)**: Vê recompensas sem desfoque; +5 ouro por vitória

### Tipos de Vagão
| Vagão | Tipo |
|-------|------|
| 1 | Sempre Inimigo |
| 2-4 | 50% Inimigo / 25% Mímico / 25% Loja |
| 5 | Sempre Boss |



## Assets Necessários
Coloque suas imagens em `assets/image/` seguindo os caminhos em `Game.js → ASSET_PATHS`.
Se uma imagem não for encontrada, um placeholder cinza é exibido automaticamente.
