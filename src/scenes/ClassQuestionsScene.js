/**
 * @file ClassQuestionsScene.js
 * @description Gerenciamento de questões por fase para uma turma.
 * Professor importa questões via JSON colado no prompt(), edita e remove individualmente.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

const PHASE_TABS = [
  { id: 'lista_encadeada',       name: 'Lista Encadeada',                    color: '#4a9eff' },
  { id: 'lista_circular',        name: 'Lista Circular',                     color: '#ff6b4a' },
  { id: 'lista_dupla',           name: 'Lista Duplamente Encadeada',         color: '#4aff8c' },
  { id: 'lista_dupla_circular',  name: 'Lista Duplamente Encadeada Circular',color: '#c44aff' },
  { id: 'todas_as_listas',       name: 'Todas as Listas',                    color: '#ffcc44' },
];

function _buildPrompt(phaseName) {
  return `Gere "N" questões sobre ${phaseName} para
estudantes de Estruturas de Dados.

Retorne APENAS o array JSON, sem nenhum
texto extra. Use o formato abaixo:

[
  {
    "text": "Texto da pergunta?",
    "options": [
      "Opção A",
      "Opção B",
      "Opção C",
      "Opção D"
    ],
    "correct": 0
  }
]

Regras:
- Exatamente 4 opções por questão
- "correct": indice (0-3) da opcao correta. 
-- evite sequencias de respostas corretas (ex: 3 questões seguidas com "correct": 0)
- Perguntas em portugues brasileiro
- Retorne somente o JSON, sem explicacoes`;
}

export class ClassQuestionsScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim         = 0;
    this._loading      = false;
    this._classId      = null;
    this._className    = '';
    this._selectedTab  = 0;
    this._questions    = {};   // phaseId → [{ text, options, correct }]
    this._errorMsg     = '';
    this._successMsg   = '';
    this._showFormat   = false;
    this._scrollOffset = 0;
    this._copiedAt     = -99;

    this._tabBtns      = [];
    this._questionRows = [];
    this._btnCopy      = null;
    this._wheelHandler = null;
  }

  enter(params = {}) {
    this._anim        = 0;
    this._loading     = true;
    this._classId     = params.classId   || null;
    this._className   = params.className || 'Turma';
    this._selectedTab = 0;
    this._questions   = {};
    this._errorMsg    = '';
    this._successMsg  = '';
    this._showFormat  = false;
    this._scrollOffset = 0;

    this._loadQuestions();
    this._setupWheelHandler();
  }

  exit() {
    this.input.clearButtons();
    if (this._wheelHandler) {
      window.removeEventListener('wheel', this._wheelHandler);
      this._wheelHandler = null;
    }
  }

  _setupWheelHandler() {
    if (this._wheelHandler) window.removeEventListener('wheel', this._wheelHandler);
    this._wheelHandler = (e) => {
      if (this._showFormat) return;
      e.preventDefault();
      const phaseId   = PHASE_TABS[this._selectedTab].id;
      const questions = this._questions[phaseId] || [];
      const totalH    = questions.length * 66;
      const listH     = VIRTUAL_H - 192 - 70;
      const maxScroll = Math.max(0, totalH - listH);
      this._scrollOffset = Math.max(0, Math.min(maxScroll, this._scrollOffset + e.deltaY * 0.5));
      this._setupButtons();
    };
    window.addEventListener('wheel', this._wheelHandler, { passive: false });
  }

  async _loadQuestions() {
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/class/${this._classId}`);
      const data = await res.json();
      this._questions = data.success ? (data.class.questions || {}) : {};
    } catch {
      this._questions = {};
    }
    this._loading = false;
    this._setupButtons();
  }

  _setupButtons() {
    this.input.clearButtons();
    this._tabBtns      = [];
    this._questionRows = [];
    this._btnDeleteAll = null;

    // Voltar
    this._btnBack = { x: 50, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnBack, () => {
      this.manager.goto('classRoom', { classId: this._classId, className: this._className });
    });

    // Importar / Ver Formato
    this._btnImport = { x: VIRTUAL_W - 370, y: 30, w: 160, h: 46 };
    this._btnFormat = { x: VIRTUAL_W - 200, y: 30, w: 150, h: 46 };
    this.input.addButton(this._btnImport, () => this._doImport());
    this.input.addButton(this._btnFormat, () => {
      this._showFormat = !this._showFormat;
      this._setupButtons();
    });

    // Fechar modal de formato + botão copiar
    if (this._showFormat) {
      const closeBtn = { x: VIRTUAL_W / 2 + 269, y: VIRTUAL_H / 2 - 274, w: 36, h: 36 };
      this.input.addButton(closeBtn, () => {
        this._showFormat = false;
        this._setupButtons();
      });

      this._btnCopy = { x: VIRTUAL_W / 2 - 100, y: VIRTUAL_H / 2 + 204, w: 200, h: 36 };
      this.input.addButton(this._btnCopy, () => {
        navigator.clipboard.writeText(_buildPrompt(PHASE_TABS[this._selectedTab].name)).catch(() => {});
        this._copiedAt = this._anim;
      });
    } else {
      this._btnCopy = null;
    }

    // Tabs de fase
    const tabGap = 8, tabH = 34;
    const tabStartX = 50;
    const tabTotalW = VIRTUAL_W - 100;
    const tabW = Math.floor((tabTotalW - (PHASE_TABS.length - 1) * tabGap) / PHASE_TABS.length);
    const tabsY = 104;
    for (let i = 0; i < PHASE_TABS.length; i++) {
      const tx = tabStartX + i * (tabW + tabGap);
      const rect = { x: tx, y: tabsY, w: tabW, h: tabH };
      this._tabBtns.push({ rect, index: i });
      const idx = i;
      this.input.addButton(rect, () => {
        this._selectedTab  = idx;
        this._scrollOffset = 0;
        this._setupButtons();
      });
    }

    // Botão remover todas
    const phaseId   = PHASE_TABS[this._selectedTab].id;
    const questions = (this._questions[phaseId] || []);
    if (questions.length > 0) {
      this._btnDeleteAll = { x: VIRTUAL_W / 2 - 90, y: 148, w: 180, h: 28 };
      this.input.addButton(this._btnDeleteAll, () => this._doDeleteAll());
    }

    // Linhas de questões
    const rowW = 1100, rowH = 60;
    const rowX    = (VIRTUAL_W - rowW) / 2;
    const LIST_TOP = 192, LIST_BOT = VIRTUAL_H - 70;

    for (let i = 0; i < questions.length; i++) {
      const actualY = LIST_TOP + i * (rowH + 6) - this._scrollOffset;
      const rect    = { x: rowX,              y: actualY,                    w: rowW,     h: rowH };
      const editBtn = { x: rowX + rowW - 180, y: actualY + (rowH - 32) / 2, w: 80, h: 32 };
      const delBtn  = { x: rowX + rowW - 90,  y: actualY + (rowH - 32) / 2, w: 80, h: 32 };
      this._questionRows.push({ rect, editBtn, delBtn, index: i });

      if (actualY + rowH > LIST_TOP && actualY < LIST_BOT) {
        const idx = i;
        this.input.addButton(editBtn, () => this._openEditModal(idx));
        this.input.addButton(delBtn,  () => this._doDelete(idx));
      }
    }
  }

  _doImport() {
    const phaseId = PHASE_TABS[this._selectedTab].id;

    const fileInput = document.createElement('input');
    fileInput.type   = 'file';
    fileInput.accept = '.json,.doc,.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.onchange = async (e) => {
      document.body.removeChild(fileInput);
      const file = e.target.files[0];
      if (!file) return;

      let raw;
      try {
        raw = await file.text();
      } catch {
        this._errorMsg   = 'Não foi possível ler o arquivo.';
        this._successMsg = '';
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        this._errorMsg   = 'Conteúdo inválido. O arquivo deve conter JSON válido.';
        this._successMsg = '';
        return;
      }

      if (!Array.isArray(parsed)) {
        this._errorMsg   = 'O JSON deve ser um array [...].';
        this._successMsg = '';
        return;
      }

      this._loading = true;
      try {
        const res  = await fetch(`https://${window.location.hostname}:3000/class/${this._classId}/questions`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ phaseId, questions: parsed })
        });
        const data = await res.json();
        if (data.success) {
          // Se não for "Todas", também adiciona em todas_as_listas
          if (phaseId !== 'todas_as_listas') {
            const todasAtual = this._questions['todas_as_listas'] || [];
            const todasMerge = [...todasAtual, ...parsed];
            await fetch(`https://${window.location.hostname}:3000/class/${this._classId}/questions`, {
              method:  'PUT',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ phaseId: 'todas_as_listas', questions: todasMerge })
            });
          }
          this._successMsg = `${data.count} questão(ões) importada(s) com sucesso!`;
          this._errorMsg   = '';
          this._loadQuestions();
        } else {
          this._errorMsg   = data.message || 'Erro ao importar.';
          this._successMsg = '';
          this._loading    = false;
        }
      } catch {
        this._errorMsg   = 'Servidor indisponível.';
        this._successMsg = '';
        this._loading    = false;
      }
    };

    fileInput.click();
  }

  async _doDeleteAll() {
    const phaseId = PHASE_TABS[this._selectedTab].id;
    this._loading = true;
    try {
      const res = await fetch(`https://${window.location.hostname}:3000/class/${this._classId}/questions`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phaseId, questions: [] })
      });
      const data = await res.json();
      if (data.success) {
        this._successMsg = 'Todas as questões foram removidas.';
        this._errorMsg   = '';
        this._loadQuestions();
      } else {
        this._errorMsg = data.message || 'Erro ao remover.';
        this._loading  = false;
      }
    } catch {
      this._errorMsg = 'Servidor indisponível.';
      this._loading  = false;
    }
  }

  _openEditModal(index) {
    const phaseId = PHASE_TABS[this._selectedTab].id;
    const q = { ...(this._questions[phaseId] || [])[index] };
    if (!q) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:9999;';

    const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const form = document.createElement('div');
    form.style.cssText = 'background:#060d1f;border:2px solid #4a9eff;border-radius:15px;padding:36px 36px 25px;width:773px;max-height:90vh;overflow-y:auto;color:#d0e8ff;font-family:Rajdhani,sans-serif;';

    const optRows = [0,1,2,3].map(i => `
      <label style="display:block;margin:13px 0 4px;color:${i === q.correct ? '#44dd88' : '#7aaccc'};font-size:16px;">
        Opção ${String.fromCharCode(65+i)}${i === q.correct ? ' ✔ (correta)' : ''}
      </label>
      <input id="eq-opt${i}" type="text" value="${esc(q.options?.[i] ?? '')}"
        style="width:100%;box-sizing:border-box;background:#0a1830;border:1px solid #2a4a6a;border-radius:8px;color:#d0e8ff;padding:10px 13px;font-size:17px;font-family:Rajdhani,sans-serif;">
    `).join('');

    form.innerHTML = `
      <h2 style="color:#4a9eff;font-size:25px;margin:0 0 21px;font-family:Rajdhani,sans-serif;">Editar Questão ${index + 1}</h2>
      <label style="display:block;margin-bottom:8px;color:#7aaccc;font-size:16px;">Pergunta</label>
      <textarea id="eq-text" rows="3"
        style="width:100%;box-sizing:border-box;background:#0a1830;border:1px solid #2a4a6a;border-radius:8px;color:#d0e8ff;padding:10px 13px;font-size:17px;resize:vertical;font-family:Rajdhani,sans-serif;">${esc(q.text)}</textarea>
      ${optRows}
      <label style="display:block;margin:17px 0 4px;color:#7aaccc;font-size:16px;">Resposta correta &nbsp;<span style="color:#5a7a8a;">(0 = A, 1 = B, 2 = C, 3 = D)</span></label>
      <input id="eq-correct" type="number" min="0" max="3" value="${q.correct}"
        style="width:99px;background:#0a1830;border:1px solid #2a4a6a;border-radius:8px;color:#d0e8ff;padding:10px 13px;font-size:17px;font-family:Rajdhani,sans-serif;">
      <div id="eq-error" style="color:#ff8888;font-size:16px;margin-top:13px;min-height:23px;"></div>
      <div style="display:flex;gap:15px;margin-top:21px;justify-content:flex-end;">
        <button id="eq-cancel"
          style="background:#1a2a3a;border:1px solid #2a4a6a;color:#7aaccc;padding:10px 27px;border-radius:8px;cursor:pointer;font-size:17px;font-family:Rajdhani,sans-serif;">Cancelar</button>
        <button id="eq-save"
          style="background:#0a3050;border:1px solid #4a9eff;color:#4a9eff;padding:10px 27px;border-radius:8px;cursor:pointer;font-size:17px;font-family:Rajdhani,sans-serif;">Salvar</button>
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const close = () => { if (overlay.parentNode) document.body.removeChild(overlay); };

    document.getElementById('eq-cancel').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    document.getElementById('eq-save').onclick = async () => {
      const text    = document.getElementById('eq-text').value.trim();
      const options = [0,1,2,3].map(i => document.getElementById(`eq-opt${i}`).value.trim());
      const correct = parseInt(document.getElementById('eq-correct').value, 10);
      const errEl   = document.getElementById('eq-error');

      if (!text)                              { errEl.textContent = 'A pergunta não pode estar vazia.'; return; }
      if (options.some(o => !o))              { errEl.textContent = 'Todas as opções devem ser preenchidas.'; return; }
      if (isNaN(correct) || correct < 0 || correct > 3) { errEl.textContent = 'Resposta correta deve ser 0, 1, 2 ou 3.'; return; }

      close();
      await this._doEdit(index, { text, options, correct });
    };
  }

  async _doEdit(index, updated) {
    const phaseId   = PHASE_TABS[this._selectedTab].id;
    const questions = [...(this._questions[phaseId] || [])];
    questions[index] = updated;

    this._loading = true;
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/class/${this._classId}/questions`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phaseId, questions })
      });
      const data = await res.json();
      if (data.success) {
        this._successMsg = 'Questão atualizada.';
        this._errorMsg   = '';
        this._loadQuestions();
      } else {
        this._errorMsg = data.message || 'Erro ao salvar.';
        this._loading  = false;
      }
    } catch {
      this._errorMsg = 'Servidor indisponível.';
      this._loading  = false;
    }
  }

  async _doDelete(index) {
    const phaseId   = PHASE_TABS[this._selectedTab].id;
    const questions = [...(this._questions[phaseId] || [])];
    questions.splice(index, 1);

    this._loading = true;
    try {
      const res = await fetch(`https://${window.location.hostname}:3000/class/${this._classId}/questions`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phaseId, questions })
      });
      const data = await res.json();
      if (data.success) {
        this._successMsg = 'Questão removida.';
        this._errorMsg   = '';
        this._loadQuestions();
      } else {
        this._errorMsg = data.message || 'Erro ao remover.';
        this._loading  = false;
      }
    } catch {
      this._errorMsg = 'Servidor indisponível.';
      this._loading  = false;
    }
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    r.drawTextShadow('QUESTÕES — ' + this._className.toUpperCase(),
      VIRTUAL_W / 2, 48, '#4a9eff', 26, 'center', 'Rajdhani');
    r.drawLine(50, 90, VIRTUAL_W - 50, 90, '#1a3a5c', 1);

    // Botões topo
    if (this._btnBack) {
      r.drawButton(this._btnBack.x, this._btnBack.y, this._btnBack.w, this._btnBack.h,
        '◀ Voltar', this.input.isHover(this._btnBack), false, '#1a2a3a');
    }
    if (this._btnImport) {
      r.drawButton(this._btnImport.x, this._btnImport.y, this._btnImport.w, this._btnImport.h,
        'Importar JSON', this.input.isHover(this._btnImport), false, '#1a3a2a');
    }
    if (this._btnFormat) {
      r.drawButton(this._btnFormat.x, this._btnFormat.y, this._btnFormat.w, this._btnFormat.h,
        'Ver Formato', this.input.isHover(this._btnFormat), false, '#1a2a4a');
    }

    // Tabs
    for (const tab of this._tabBtns) {
      const phase   = PHASE_TABS[tab.index];
      const active  = tab.index === this._selectedTab;
      const hover   = this.input.isHover(tab.rect);
      const { x, y, w, h } = tab.rect;
      const bgAlpha = active ? 0.50 : (hover ? 0.40 : 0.28);
      r.fillRoundRect(x, y, w, h, 7, `rgba(${_hexToRgb(phase.color)},${bgAlpha})`);
      r.strokeRoundRect(x, y, w, h, 7,
        active ? phase.color : (hover ? phase.color + 'cc' : '#3a5888'),
        active ? 2.5 : 1.5);
      r.drawText(phase.name, x + w / 2, y + h / 2 + 5,
        active ? '#ffffff' : (hover ? '#ffffff' : '#dce8f0'),
        11, 'center', 'Rajdhani');
    }

    // Botão remover todas
    if (this._btnDeleteAll) {
      const { x, y, w, h } = this._btnDeleteAll;
      const hov = this.input.isHover(this._btnDeleteAll);
      r.fillRoundRect(x, y, w, h, 6, hov ? 'rgba(80,15,15,0.95)' : 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(x, y, w, h, 6, hov ? '#ff6666' : '#8c1a1a', hov ? 2 : 1);
      r.drawText('Remover Todas', x + w / 2, y + h / 2 + 6, hov ? '#ffb3b3' : '#e68080', 12, 'center', 'Rajdhani');
    }

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2, '#4a9eff', 22, 'center', 'Rajdhani');
      return;
    }

    // Lista de questões
    const phaseId   = PHASE_TABS[this._selectedTab].id;
    const questions = this._questions[phaseId] || [];

    if (questions.length === 0 && !this._showFormat) {
      r.drawText('Nenhuma questão para esta fase.', VIRTUAL_W / 2, VIRTUAL_H / 2 - 20, '#7c9eb5', 18, 'center', 'Rajdhani');
      r.drawText('Use "Importar JSON" para adicionar questões.', VIRTUAL_W / 2, VIRTUAL_H / 2 + 20, '#5a7a8a', 14, 'center', 'Rajdhani');
    }

    const LIST_TOP = 192, LIST_BOT = VIRTUAL_H - 70;

    r.ctx.save();
    r.ctx.beginPath();
    r.ctx.rect(0, r.vy(LIST_TOP), r.canvas.width, r.vy(LIST_BOT - LIST_TOP));
    r.ctx.clip();

    for (const row of this._questionRows) {
      const { rect, editBtn, delBtn, index } = row;
      if (rect.y + rect.h <= LIST_TOP || rect.y >= LIST_BOT) continue;
      const q       = questions[index];
      if (!q) continue;
      const hover   = this.input.isHover(rect);
      const editHov = this.input.isHover(editBtn);
      const delHov  = this.input.isHover(delBtn);

      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 8,
        hover ? 'rgba(10,25,60,0.95)' : 'rgba(5,12,40,0.90)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 8, '#1a3a6a', 1);

      // Número
      r.drawText(`${index + 1}.`, rect.x + 12, rect.y + rect.h / 2 + 7, '#4a9eff', 14, 'left', 'Rajdhani');

      // Texto truncado
      const maxLen = 80;
      const txt    = q.text.length > maxLen ? q.text.slice(0, maxLen) + '…' : q.text;
      r.drawText(txt, rect.x + 40, rect.y + rect.h / 2 + 7, '#d0e8ff', 14, 'left', 'Rajdhani');

      // Resposta correta
      const correct = q.options && q.options[q.correct] ? q.options[q.correct] : '';
      const corTxt  = correct.length > 30 ? correct.slice(0, 30) + '…' : correct;
      r.drawText(`✔ ${corTxt}`, rect.x + rect.w - 400, rect.y + rect.h / 2 + 7, '#44dd88', 12, 'left', 'Rajdhani');

      // Botão editar
      r.fillRoundRect(editBtn.x, editBtn.y, editBtn.w, editBtn.h, 6,
        editHov ? 'rgba(10,40,80,0.95)' : 'rgba(5,20,50,0.80)');
      r.strokeRoundRect(editBtn.x, editBtn.y, editBtn.w, editBtn.h, 6,
        editHov ? '#5ab4ff' : '#1a5a9a', editHov ? 2 : 1);
      r.drawText('Editar', editBtn.x + editBtn.w / 2, editBtn.y + editBtn.h / 2 + 6,
        editHov ? '#a0d8ff' : '#4a9eff', 12, 'center', 'Rajdhani');

      // Botão remover
      r.fillRoundRect(delBtn.x, delBtn.y, delBtn.w, delBtn.h, 6,
        delHov ? 'rgba(80,15,15,0.95)' : 'rgba(40,8,8,0.80)');
      r.strokeRoundRect(delBtn.x, delBtn.y, delBtn.w, delBtn.h, 6,
        delHov ? '#ff6666' : '#8c1a1a', delHov ? 2 : 1);
      r.drawText('Remover', delBtn.x + delBtn.w / 2, delBtn.y + delBtn.h / 2 + 6,
        delHov ? '#ffb3b3' : '#e68080', 12, 'center', 'Rajdhani');
    }

    r.ctx.restore();

    // Scrollbar
    const totalH = questions.length * 66;
    const listH  = LIST_BOT - LIST_TOP;
    if (totalH > listH) {
      const sbX = VIRTUAL_W - 38, sbY = LIST_TOP, sbW = 6, sbH = listH;
      r.fillRoundRect(sbX, sbY, sbW, sbH, 3, 'rgba(255,255,255,0.08)');
      const thumbH = Math.max(30, sbH * (listH / totalH));
      const thumbY = sbY + (this._scrollOffset / (totalH - listH)) * (sbH - thumbH);
      r.fillRoundRect(sbX, thumbY, sbW, thumbH, 3, 'rgba(74,158,255,0.55)');
    }

    // Mensagens de feedback
    if (this._successMsg) {
      r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(0,60,20,0.85)');
      r.drawText(this._successMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#44dd88', 14, 'center', 'Rajdhani');
    } else if (this._errorMsg) {
      r.fillRoundRect(VIRTUAL_W / 2 - 350, VIRTUAL_H - 58, 700, 34, 6, 'rgba(80,0,0,0.85)');
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H - 36, '#ff8888', 14, 'center', 'Rajdhani');
    }

    // Modal de formato
    if (this._showFormat) {
      const mW = 630, mH = 568;
      const mX = VIRTUAL_W / 2 - mW / 2;
      const mY = VIRTUAL_H / 2 - mH / 2;
      r.fillRoundRect(mX, mY, mW, mH, 14, 'rgba(5,10,25,0.97)');
      r.strokeRoundRect(mX, mY, mW, mH, 14, '#4a9eff', 2);

      r.drawText('PROMPT PARA IA', mX + mW / 2, mY + 28, '#4a9eff', 18, 'center', 'Rajdhani');

      // Botão fechar
      const cx = mX + mW - 46, cy = mY + 10;
      const closeHov = this.input.isHover({ x: cx, y: cy, w: 36, h: 36 });
      r.fillRoundRect(cx, cy, 36, 36, 6, closeHov ? 'rgba(80,15,15,0.9)' : 'rgba(40,8,8,0.7)');
      r.drawText('✕', cx + 18, cy + 24, closeHov ? '#ff8888' : '#cc4444', 16, 'center', 'Rajdhani');

      const phaseName = PHASE_TABS[this._selectedTab].name;
      const lines = _buildPrompt(phaseName).split('\n');
      let ly = mY + 52;
      for (const line of lines) {
        r.drawText(line, mX + 16, ly, '#aaccee', 12, 'left', 'Courier New');
        ly += 17;
      }

      // Botão copiar prompt
      if (this._btnCopy) {
        const { x: bx, y: by, w: bw, h: bh } = this._btnCopy;
        const copied  = this._anim - this._copiedAt < 1.5;
        const copyHov = this.input.isHover(this._btnCopy);
        r.fillRoundRect(bx, by, bw, bh, 8, copied ? 'rgba(0,60,20,0.90)' : (copyHov ? 'rgba(10,40,70,0.95)' : 'rgba(5,20,50,0.85)'));
        r.strokeRoundRect(bx, by, bw, bh, 8, copied ? '#44dd88' : (copyHov ? '#5ab4ff' : '#2a6aaa'), copyHov || copied ? 2 : 1);
        r.drawText(copied ? 'Copiado!' : 'Copiar prompt para IA', bx + bw / 2, by + bh / 2 + 6, copied ? '#44dd88' : (copyHov ? '#5ab4ff' : '#4a9eff'), 13, 'center', 'Rajdhani');
      }

      r.drawText('Cole o prompt em qualquer IA (ChatGPT, Gemini, Claude…) e importe o JSON gerado.',
        mX + mW / 2, mY + mH - 16, '#7aaccc', 11, 'center', 'Rajdhani');
    }
  }
}

function _hexToRgb(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export default ClassQuestionsScene;
