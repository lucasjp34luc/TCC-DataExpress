/**
 * @file ClassDashboardScene.js
 * @description Dashboard de desempenho da turma por fase.
 * Exibe tabela de alunos e estatísticas agregadas, com filtro por fase.
 */

import { VIRTUAL_W, VIRTUAL_H } from '../core/Renderer.js';

const PHASE_TABS = [
  { id: 'lista_encadeada',       name: 'Encadeada',   color: '#4a9eff' },
  { id: 'lista_circular',        name: 'Circular',    color: '#ff6b4a' },
  { id: 'lista_dupla',           name: 'Duplamente',  color: '#4aff8c' },
  { id: 'lista_dupla_circular',  name: 'Dupla Circ.', color: '#c44aff' },
  { id: 'todas_as_listas',       name: 'Todas',       color: '#ffcc44' },
];

export class ClassDashboardScene {
  constructor({ assets, input }) {
    this.assets  = assets;
    this.input   = input;
    this.manager = null;

    this._anim        = 0;
    this._loading     = false;
    this._classId     = null;
    this._className   = '';
    this._dashboard   = {};
    this._selectedTab = 0;
    this._errorMsg    = '';

    this._tabBtns       = [];
    this._studentScroll = 0;
    this._btnScrollUp   = null;
    this._btnScrollDown = null;
  }

  // ── Layout (proporcional à resolução virtual) ────────────────────────────
  _getLayout() {
    const PAD    = Math.round(VIRTUAL_W * 0.047);  // 60 @ 1280
    const topY   = Math.round(VIRTUAL_H * 0.219);  // 158 @ 720
    const panH   = VIRTUAL_H - topY - Math.round(VIRTUAL_H * 0.056); // 40 @ 720
    const leftX  = PAD;
    const leftW  = Math.round(VIRTUAL_W * 0.547);  // 700 @ 1280
    const GAP    = Math.round(VIRTUAL_W * 0.016);  // 20 @ 1280
    const rightX = leftX + leftW + GAP;
    const rightW = VIRTUAL_W - rightX - PAD;

    const tabW   = Math.round(VIRTUAL_W * 0.122);  // 156 @ 1280
    const tabH   = Math.round(VIRTUAL_H * 0.056);  // 40 @ 720
    const tabGap = Math.round(VIRTUAL_W * 0.006);  // 8 @ 1280
    const tabsTotal = PHASE_TABS.length * tabW + (PHASE_TABS.length - 1) * tabGap;
    const tabsX  = Math.round((VIRTUAL_W - tabsTotal) / 2);
    const tabsY  = Math.round(VIRTUAL_H * 0.136);  // 98 @ 720

    const rowH   = Math.round(VIRTUAL_H * 0.061);  // 44 @ 720
    const barW   = Math.round(leftW * 0.2);         // 140 @ leftW=700
    const barX   = leftX + Math.round(leftW * 0.714); // leftW - 200 offset @ 700

    // Colunas da tabela proporcionais ao painel esquerdo
    const colVic = leftX + Math.round(leftW * 0.286); // 260 @ leftW=700
    const colDef = leftX + Math.round(leftW * 0.429); // 360 @ leftW=700

    return {
      PAD, topY, panH,
      leftX, leftW,
      rightX, rightW,
      tabW, tabH, tabGap, tabsX, tabsY,
      rowH, barW, barX,
      colVic, colDef,
    };
  }

  enter(params = {}) {
    this._anim          = 0;
    this._loading       = true;
    this._classId       = params.classId   || null;
    this._className     = params.className || 'Turma';
    this._dashboard     = {};
    this._selectedTab   = 0;
    this._errorMsg      = '';
    this._studentScroll = 0;

    this._loadDashboard();
  }

  exit() {
    this.input.clearButtons();
  }

  _getSortedStudents(phaseId, students) {
    if (phaseId === 'lista_circular' || phaseId === 'lista_dupla_circular') {
      return [...students].sort((a, b) => {
        const cDiff = (b.cycles || 0) - (a.cycles || 0);
        if (cDiff !== 0) return cDiff;
        const aDiff = (b.accuracy || 0) - (a.accuracy || 0);
        if (aDiff !== 0) return aDiff;
        return (b.victories || 0) - (a.victories || 0);
      });
    }
    return students;
  }

  async _loadDashboard() {
    try {
      const res  = await fetch(`https://${window.location.hostname}:3000/class/${this._classId}/dashboard`);
      const data = await res.json();
      this._dashboard = data.success ? (data.dashboard || {}) : {};
    } catch {
      this._errorMsg = 'Servidor indisponível.';
      this._dashboard = {};
    }
    this._loading = false;
    this._setupButtons();
  }

  _setupButtons() {
    this.input.clearButtons();
    this._tabBtns = [];

    const { PAD, tabW, tabH, tabGap, tabsX, tabsY } = this._getLayout();

    // Voltar
    this._btnBack = {
      x: PAD,
      y: Math.round(VIRTUAL_H * 0.042),   // 30 @ 720
      w: Math.round(VIRTUAL_W * 0.117),   // 150 @ 1280
      h: Math.round(VIRTUAL_H * 0.064),   // 46 @ 720
    };
    this.input.addButton(this._btnBack, () => {
      this.manager.goto('classRoom', { classId: this._classId, className: this._className });
    });

    // Tabs
    for (let i = 0; i < PHASE_TABS.length; i++) {
      const tx   = tabsX + i * (tabW + tabGap);
      const rect = { x: tx, y: tabsY, w: tabW, h: tabH };
      this._tabBtns.push({ rect, index: i });
      const idx = i;
      this.input.addButton(rect, () => {
        this._selectedTab   = idx;
        this._studentScroll = 0;
        this._setupButtons();
      });
    }

    // Scroll buttons for the student list
    this._btnScrollUp   = null;
    this._btnScrollDown = null;

    const { topY, leftX, leftW, rowH } = this._getLayout();
    const firstRowY    = topY + 54 + 22;  // hY + header row gap
    const rowBreak     = VIRTUAL_H - Math.round(VIRTUAL_H * 0.063);
    const visibleCount = Math.floor((rowBreak - firstRowY) / rowH);
    this._visibleCount = visibleCount;

    const phaseId     = PHASE_TABS[this._selectedTab].id;
    const rawStudents = ((this._dashboard[phaseId] || {}).students) || [];
    const students    = this._getSortedStudents(phaseId, rawStudents);

    if (students.length > visibleCount) {
      const scrollX = leftX + leftW - 34;

      this._btnScrollUp = { x: scrollX, y: firstRowY, w: 26, h: 26 };
      this.input.addButton(this._btnScrollUp, () => {
        if (this._studentScroll > 0) this._studentScroll--;
      });

      const downY = firstRowY + visibleCount * rowH - 26;
      this._btnScrollDown = { x: scrollX, y: downY, w: 26, h: 26 };
      this.input.addButton(this._btnScrollDown, () => {
        const max = students.length - visibleCount;
        if (this._studentScroll < max) this._studentScroll++;
      });
    }
  }

  update(dt) {
    this._anim += dt;
  }

  render(r) {
    r.drawGradientBg('#04060f', '#080e1e');

    const {
      PAD, topY, panH,
      leftX, leftW,
      rightX, rightW,
      rowH, barW, barX,
      colVic, colDef,
    } = this._getLayout();

    const titleY = Math.round(VIRTUAL_H * 0.067);  // 48 @ 720
    const lineY  = Math.round(VIRTUAL_H * 0.125);  // 90 @ 720

    r.drawTextShadow('DASHBOARD — ' + this._className.toUpperCase(),
      VIRTUAL_W / 2, titleY, '#4a9eff', 26, 'center', 'Rajdhani');
    r.drawLine(PAD, lineY, VIRTUAL_W - PAD, lineY, '#1a3a5c', 1);

    // Botão voltar
    if (this._btnBack) {
      const b = this._btnBack;
      r.drawButton(b.x, b.y, b.w, b.h, '◀ Voltar', this.input.isHover(b), false, '#1a2a3a');
    }

    // Tabs
    for (const tab of this._tabBtns) {
      const phase  = PHASE_TABS[tab.index];
      const active = tab.index === this._selectedTab;
      const { x, y, w, h } = tab.rect;
      r.fillRoundRect(x, y, w, h, 8, active ? `${phase.color}33` : 'rgba(5,12,30,0.85)');
      r.strokeRoundRect(x, y, w, h, 8, active ? phase.color : '#2a4a6a', active ? 2.5 : 1);
      r.drawText(phase.name, x + w / 2, y + h / 2 + 7,
        active ? phase.color : '#7aaccc', 14, 'center', 'Rajdhani');
    }

    if (this._loading) {
      const dots = '.'.repeat((Math.floor(this._anim * 2) % 3) + 1);
      r.drawText(`Carregando${dots}`, VIRTUAL_W / 2, VIRTUAL_H / 2, '#4a9eff', 22, 'center', 'Rajdhani');
      return;
    }

    if (this._errorMsg) {
      r.drawText(this._errorMsg, VIRTUAL_W / 2, VIRTUAL_H / 2, '#ff8888', 20, 'center', 'Rajdhani');
      return;
    }

    const phaseId   = PHASE_TABS[this._selectedTab].id;
    const phColor   = PHASE_TABS[this._selectedTab].color;
    const phaseData = this._dashboard[phaseId] || { students: [], aggregate: { avgAccuracy: 0, totalRuns: 0, topStudent: null } };
    const students  = this._getSortedStudents(phaseId, phaseData.students || []);
    const agg       = phaseData.aggregate || {};

    if (students.length === 0) {
      r.drawText('Nenhum aluno com dados para esta fase.', VIRTUAL_W / 2, VIRTUAL_H / 2, '#7c9eb5', 18, 'center', 'Rajdhani');
      return;
    }

    // ── Painel esquerdo: tabela de alunos ──────────────────────────────────
    r.fillRoundRect(leftX, topY, leftW, panH, 12, 'rgba(5,12,30,0.80)');
    r.strokeRoundRect(leftX, topY, leftW, panH, 12, '#1a3a5c', 1);

    r.drawText('ALUNOS', leftX + leftW / 2, topY + 22, phColor, 15, 'center', 'Rajdhani');
    r.drawLine(leftX + 10, topY + 36, leftX + leftW - 10, topY + 36, '#1a3a5c', 1);

    const hY      = topY + 54;
    const barH    = Math.round(VIRTUAL_H * 0.022);  // 16 @ 720

    const isCircular = phaseId === 'lista_circular' || phaseId === 'lista_dupla_circular';
    const colCyc  = isCircular ? leftX + Math.round(leftW * 0.25) : null;
    const colVicR = isCircular ? leftX + Math.round(leftW * 0.39) : colVic;
    const colDefR = isCircular ? leftX + Math.round(leftW * 0.53) : colDef;
    const barXR   = isCircular ? leftX + Math.round(leftW * 0.65) : barX;
    const barWR   = isCircular ? Math.round(leftW * 0.16)         : barW;
    const accLblX = barXR + barWR / 2;

    r.drawText('Nome',     leftX + 16, hY, '#7aaccc', 12, 'left',   'Rajdhani');
    if (isCircular) r.drawText('Ciclos', colCyc, hY, '#c44aff', 12, 'center', 'Rajdhani');
    r.drawText('Vitórias', colVicR,    hY, '#7aaccc', 12, 'center', 'Rajdhani');
    r.drawText('Derrotas', colDefR,    hY, '#7aaccc', 12, 'center', 'Rajdhani');
    r.drawText('Acerto',   accLblX,    hY, '#7aaccc', 12, 'center', 'Rajdhani');
    r.drawLine(leftX + 10, hY + 10, leftX + leftW - 10, hY + 10, '#1a3060', 1);

    const rowBreak     = VIRTUAL_H - Math.round(VIRTUAL_H * 0.063);
    const visibleCount = this._visibleCount || Math.floor((rowBreak - (hY + 22)) / rowH);
    const scroll       = this._studentScroll || 0;
    const visible      = students.slice(scroll, scroll + visibleCount);

    let rowY = hY + 22;
    for (let i = 0; i < visible.length; i++) {
      const stu    = visible[i];
      const absIdx = scroll + i;
      const isTop  = absIdx === 0;
      const bg     = isTop ? 'rgba(48,38,4,0.60)' : (absIdx % 2 === 0 ? 'rgba(8,16,40,0.40)' : 'transparent');
      if (isTop) r.fillRoundRect(leftX + 4, rowY - 4, leftW - 8, rowH, 6, bg);

      const nameColor = isTop ? '#ffcc44' : '#d0e8ff';
      const rank      = absIdx < 3 ? ['🥇','🥈','🥉'][absIdx] : `${absIdx + 1}.`;
      const midY      = rowY + rowH / 2 + 5;

      r.drawText(rank,                  leftX + 12, midY, isTop ? '#ffcc44' : '#5a8aaa', 14, 'left',   'Rajdhani');
      r.drawText(stu.username,          leftX + 40, midY, nameColor, 15, 'left', 'Rajdhani');
      if (isCircular) {
        const cycleColor = isTop ? '#ffcc44' : '#c44aff';
        r.drawText(String(stu.cycles || 0), colCyc, midY, cycleColor, 14, 'center', 'Rajdhani');
      }
      r.drawText(String(stu.victories), colVicR,   midY, '#44dd88', 14, 'center', 'Rajdhani');
      r.drawText(String(stu.defeats),   colDefR,   midY, '#ff6666', 14, 'center', 'Rajdhani');

      const barC = stu.accuracy >= 70 ? '#44dd88' : stu.accuracy >= 40 ? '#ffcc44' : '#ff5555';
      r.drawProgressBar(barXR, rowY + (rowH - barH) / 2, barWR, barH, stu.accuracy, 100, barC);
      r.drawText(`${stu.accuracy}%`, barXR + barWR + 8, midY, '#d0e8ff', 13, 'left', 'Rajdhani');

      rowY += rowH;
    }

    // Scroll buttons + counter
    if (this._btnScrollUp) {
      const b      = this._btnScrollUp;
      const active = scroll > 0;
      r.drawButton(b.x, b.y, b.w, b.h, '▲', this.input.isHover(b), false, active ? '#1a3a5c' : '#0a1520');
    }
    if (this._btnScrollDown) {
      const b      = this._btnScrollDown;
      const active = scroll < students.length - visibleCount;
      r.drawButton(b.x, b.y, b.w, b.h, '▼', this.input.isHover(b), false, active ? '#1a3a5c' : '#0a1520');
    }
    if (students.length > visibleCount) {
      const end = Math.min(scroll + visibleCount, students.length);
      r.drawText(`${scroll + 1}–${end} / ${students.length}`,
        leftX + leftW / 2, rowBreak + 14, '#5a7a99', 11, 'center', 'Rajdhani');
    }

    // ── Painel direito: agregado ───────────────────────────────────────────
    r.fillRoundRect(rightX, topY, rightW, panH, 12, 'rgba(5,12,30,0.80)');
    r.strokeRoundRect(rightX, topY, rightW, panH, 12, '#1a3a5c', 1);

    r.drawText('RESUMO DA TURMA', rightX + rightW / 2, topY + 22, phColor, 15, 'center', 'Rajdhani');
    r.drawLine(rightX + 10, topY + 36, rightX + rightW - 10, topY + 36, '#1a3a5c', 1);

    const cx      = rightX + rightW / 2;
    const divPad  = Math.round(rightW * 0.1);      // padding interno das divisórias
    const secGap  = Math.round(VIRTUAL_H * 0.083); // 60 @ 720
    const statH   = Math.round(VIRTUAL_H * 0.089); // 64 @ 720
    let   ry      = topY + 70;

    // Média de acerto
    r.drawText('Média de acerto', cx, ry, '#7aaccc', 13, 'center', 'Rajdhani');
    ry += 8;
    const avgBarW = rightW - Math.round(rightW * 0.122);  // ~40px padding
    const avgC    = agg.avgAccuracy >= 70 ? '#44dd88' : agg.avgAccuracy >= 40 ? '#ffcc44' : '#ff5555';
    r.drawProgressBar(rightX + divPad, ry, avgBarW, 28, agg.avgAccuracy || 0, 100, avgC);
    r.drawText(`${agg.avgAccuracy || 0}%`, cx, ry + 47, '#d0e8ff', 22, 'center', 'Rajdhani');
    ry += 70;

    r.drawLine(rightX + divPad, ry, rightX + rightW - divPad, ry, '#1a3060', 1);
    ry += 20;

    // Total de partidas
    r.drawText('Total de partidas', cx, ry, '#7aaccc', 13, 'center', 'Rajdhani');
    r.drawText(String(agg.totalRuns || 0), cx, ry + 24, '#d0e8ff', 28, 'center', 'Rajdhani');
    ry += secGap;

    r.drawLine(rightX + divPad, ry, rightX + rightW - divPad, ry, '#1a3060', 1);
    ry += 20;

    // Melhor aluno
    r.drawText('Melhor desempenho', cx, ry, '#7aaccc', 13, 'center', 'Rajdhani');
    r.drawText(agg.topStudent || '—', cx, ry + 24, '#ffcc44', 22, 'center', 'Rajdhani');
    ry += statH;

    r.drawLine(rightX + divPad, ry, rightX + rightW - divPad, ry, '#1a3060', 1);
    ry += 20;

    // Alunos participantes
    r.drawText('Alunos participantes', cx, ry, '#7aaccc', 13, 'center', 'Rajdhani');
    r.drawText(String(students.length), cx, ry + 24, '#d0e8ff', 22, 'center', 'Rajdhani');

    if (isCircular) {
      ry += statH;
      r.drawLine(rightX + divPad, ry, rightX + rightW - divPad, ry, '#1a3060', 1);
      ry += 20;
      const totalCycles = agg.totalCycles != null
        ? agg.totalCycles
        : students.reduce((s, st) => s + (st.cycles || 0), 0);
      r.drawText('Total de ciclos', cx, ry, '#c44aff', 13, 'center', 'Rajdhani');
      r.drawText(String(totalCycles), cx, ry + 24, '#c44aff', 22, 'center', 'Rajdhani');
    }
  }
}

export default ClassDashboardScene;
