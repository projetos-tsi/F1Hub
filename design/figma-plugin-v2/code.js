/*
 * F1Hub v2 Builder — plugin de desenvolvimento do Figma.
 *
 * Constrói, no arquivo "F1Hub — v2 Editorial Rework (Hi-Fi Wireframe)", as seções que o
 * limite de chamadas do Figma MCP (plano Starter) impediu de criar remotamente:
 *   05 UI Components · 06 Layout Patterns · 07 Desktop Screens · 08 Mobile Screens · 09 Design Documentation
 *
 * Pré-requisito: o arquivo já contém as seções 01–04, as variáveis (WF · Color/Primitives/Dimension),
 * os estilos de texto e de grid e as imagens do repositório (criados pelo MCP).
 * Cada etapa é idempotente: se a seção já existir, ela é pulada.
 */

// ------------------------------------------------------------------ dados
const hex = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const H = {
  pm: 'fae24aee387dbd58c24aa32265d576478dde071c', bf: '2d20a6f98c3e7e7987fc1a2d72cd47c81dbc1d48', bm: 'f8a1e55993b009e6e859cf0db9d5920c7a3f7475',
  br: '074a2619c85492d9cd184d7e20133dfc007a6dcf', pmc: '7a652e56a83fc6d3608ec25683a19b7a3a67024f', jw: '1b7ac19a4667b9c34450c1f4b9afba95ca996148',
  dw: '07bb306e6d138b52778e39c2c4c8941871a9820c', pf: '2a3a921bd3c744e85e21f134526f372aa9a55e71', prb: '867f127023df3ab0d22a84cf38fde5b14626dd5c',
  pf2: '244950208950ee76122dbbaa387ff8f6527c5be8', bfe: '7733dcf6b78ea2e1de8a4014562a27c940521b8e', pmc2: '4ae544701389083c9a7b9e080d17ac6e523464bd',
  promo: '11bc0e4ffc0d3152defd11c57592dfd5e9cb8533', pf3: '9d95e7a44996bdf4b4dc83e42fb58b54ea21dd1d', bf2: 'b7bcac7c10e5c5a06149a350aba0c6e16fd51478',
  cf: 'c758cb9715f627682bd882dad5e8fe4c1c0751bc', cf2: '7775df016cfaec3ffd7b9154f6a290a252360e7e', cf3: '3be778db703f4444594fa42cb2a9295c7cb3a8bf',
  pm2: '5f6cc7cc2ecf2595018416defc5043ce5466d160',
  logo_ferrari: '807ccfdfda06d7050137d3abf452c44db6faab91', logo_mercedes: '687d2bba56c18e61d493e4827cef7625e791f441',
  logo_rbr: 'a8101f37b760880d9347f31e32b48926c18b85f6', logo_mclaren: '2c3b46d233fc42949ab5c988f389591f59616ea1', logo_williams: 'c38e41d8f340f1675805b263b79770a33085f2ba'
};
// Produtos reais (frontend/home.html, produto.html, pages/ferrari.html)
const PROD = {
  pm: ['Camisa Polo Mercedes 2025 Preta', 'R$ 159,90', 'Mercedes'],
  bf: ['Jaqueta Scuderia Ferrari Replica Driver Autêntica Racing', 'R$ 369,90', 'Ferrari'],
  bm: ['Boné Trucker Mechanics Adidas Mercedes', 'R$ 119,90', 'Mercedes'],
  br: ['Boné 9FIFTY Original Fit Red Bull Racing', 'R$ 109,90', 'Red Bull'],
  pmc: ['Camisa Polo McLaren F1 Team 2026', 'R$ 179,90', 'McLaren'],
  pmc2: ['Camisa Polo Fanwear McLaren Senna', 'R$ 199,90', 'McLaren'],
  jw: ['Jaqueta Williams Racing RP Hybrid Azul Marinho', 'R$ 180,00', 'Williams'],
  dw: ['Camiseta Dryfit Williams Carlos Sainz Azul Marinho 2025', 'R$ 129,90', 'Williams'],
  pf: ['Camisa Scuderia Ferrari HP Unissex', 'R$ 209,90', 'Ferrari'],
  prb: ['Camiseta Polo Red Bull Equipe Azul Marinho 2025', 'R$ 149,90', 'Red Bull'],
  pf2: ['Camisa Polo Ferrari Hypercar Replica 2026', 'R$ 139,90', 'Ferrari'],
  bfe: ['Boné Scuderia Ferrari LeClerc Juvenil', 'R$ 119,90', 'Ferrari'],
  pf3: ['Camisa Polo Scuderia Ferrari Replica 2026', 'R$ 159,90', 'Ferrari'],
  bf2: ['Jaqueta Ferrari Hypercar Replica 2026', 'R$ 279,90', 'Ferrari'],
  cf: ['Camiseta Scuderia Ferrari Replica Drivers Auth', 'R$ 109,90', 'Ferrari'],
  cf2: ['Camiseta Ferrari Hypercar Replica 2026', 'R$ 109,90', 'Ferrari'],
  cf3: ['Camiseta Scuderia Ferrari Replica', 'R$ 109,90', 'Ferrari'],
  pm2: ['Camisa Polo Mercedes 2026 Preta', 'R$ 169,90', 'Mercedes']
};
const TEAMS = [
  ['Ferrari', 'team/ferrari', 'logo_ferrari', '109,90', '369,90', 109.9, 369.9],
  ['Mercedes', 'team/mercedes', 'logo_mercedes', '119,90', '249,90', 119.9, 249.9],
  ['Red Bull', 'team/red-bull', 'logo_rbr', '109,90', '209,90', 109.9, 209.9],
  ['McLaren', 'team/mclaren', 'logo_mclaren', '109,90', '209,90', 109.9, 209.9],
  ['Williams', 'team/williams', 'logo_williams', '109,90', '209,90', 109.9, 209.9]
];
const teamVar = name => (TEAMS.find(t => t[0] === name) || TEAMS[0])[1];
const BEST = ['pm', 'bf', 'bm', 'br', 'pmc'];
const PROMO = ['bf', 'pf', 'pf2', 'prb'];
const FERRARI = ['pf', 'pf2', 'bf', 'bfe', 'pf3', 'bf2', 'cf', 'cf2', 'cf3'];
const SIMILAR = ['pm2', 'bf', 'bm', 'br'];

// ------------------------------------------------------------------ infraestrutura
let V = {}, TS = {}, GS = {};
const COMP = {};
let PA, PB, PC;
async function init() {
  V = {}; for (const v of await figma.variables.getLocalVariablesAsync()) V[v.name] = v;
  TS = {}; for (const s of await figma.getLocalTextStylesAsync()) TS[s.name] = s;
  for (const s of Object.values(TS)) await figma.loadFontAsync(s.fontName);
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  GS = {}; for (const g of await figma.getLocalGridStylesAsync()) GS[g.name] = g;
  PA = figma.root.children[0];
  PB = figma.root.children.find(p => p.name.startsWith('B —')) || figma.root.children[1];
  PC = figma.root.children.find(p => p.name.startsWith('C —')) || figma.root.children[2];
  if (!PB || !PC) throw new Error('Páginas B e C não encontradas. Rode o plugin no arquivo v2.');
  for (const p of [PA, PB, PC]) await p.loadAsync();
  if (!V['surface/paper']) throw new Error('Variáveis WF não encontradas. Rode o plugin no arquivo v2.');
  if (!TS['Display/Monument']) throw new Error('Estilos de texto não encontrados. Rode o plugin no arquivo v2.');
}
async function loadComps() {
  await PB.loadAsync();
  for (const n of PB.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })) {
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
    COMP[n.name] = n;
  }
}
const paint = n => { const v = V[n]; if (!v) throw new Error('Variável ausente: ' + n); return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v); };
const fill = (n, c) => { n.fills = c ? [paint(c)] : []; return n; };
function AL(dir, o = {}) {
  const f = figma.createFrame();
  f.layoutMode = dir; f.name = o.name || 'Stack'; f.fills = []; f.clipsContent = false;
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (o.gap != null) f.itemSpacing = o.gap;
  if (o.p != null) { const a = [].concat(o.p); const t = a[0], r = a[1] != null ? a[1] : t, b = a[2] != null ? a[2] : t, l = a[3] != null ? a[3] : r; f.paddingTop = t; f.paddingRight = r; f.paddingBottom = b; f.paddingLeft = l; }
  if (o.fill) fill(f, o.fill);
  if (o.align) f.counterAxisAlignItems = o.align;
  if (o.justify) f.primaryAxisAlignItems = o.justify;
  if (o.w || o.h) {
    f.resize(o.w || Math.max(f.width, 1), o.h || Math.max(f.height, 1));
    const wAxis = dir === 'HORIZONTAL' ? 'primaryAxisSizingMode' : 'counterAxisSizingMode';
    const hAxis = dir === 'HORIZONTAL' ? 'counterAxisSizingMode' : 'primaryAxisSizingMode';
    f[wAxis] = o.w ? 'FIXED' : 'AUTO'; f[hAxis] = o.h ? 'FIXED' : 'AUTO';
  }
  if (o.wrap) { f.layoutWrap = 'WRAP'; f.counterAxisSpacing = o.wrap; }
  return f;
}
async function T(chars, style, color = 'text/ink', o = {}) {
  const t = figma.createText();
  if (!TS[style]) throw new Error('Estilo ausente: ' + style);
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = chars;
  fill(t, color);
  t.name = o.name || chars.slice(0, 32);
  if (o.size) { t.fontSize = o.size; if (o.lh) t.lineHeight = { unit: 'PIXELS', value: o.lh }; }
  if (o.w) { t.resize(o.w, t.height); t.textAutoResize = 'HEIGHT'; }
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.deco) t.textDecoration = o.deco;
  return t;
}
const add = (p, ...k) => { for (const c of k.flat()) if (c) p.appendChild(c); return p; };
const FW = (...n) => n.forEach(x => { x.layoutSizingHorizontal = 'FILL'; if (x.type === 'TEXT') x.textAutoResize = 'HEIGHT'; });
const grow = (...n) => n.forEach(x => { x.layoutGrow = 1; });
function ruled(f, side = 'Bottom', color = 'rule/ink', w = 1) {
  f.strokes = [paint(color)]; f.strokeAlign = 'INSIDE';
  const sides = [].concat(side);
  for (const s of ['Top', 'Right', 'Bottom', 'Left']) f['stroke' + s + 'Weight'] = sides.includes(s) ? w : 0;
}
function rect(w, h, color, name = 'Rect') { const r = figma.createRectangle(); r.resize(w, h); r.name = name; if (color) fill(r, color); else r.fills = []; return r; }
function imgRect(hash, w, h, mode = 'FIT', name = 'Image') { const r = figma.createRectangle(); r.resize(w, h); r.name = name; r.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: mode }]; return r; }
function spacer() { const s = figma.createFrame(); s.name = 'Spacer'; s.fills = []; s.resize(1, 1); return s; }
function comp(name, dir = 'HORIZONTAL') { const c = figma.createComponent(); c.name = name; c.fills = []; c.clipsContent = false; c.layoutMode = dir; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; return c; }
function fixW(c, w) { c.resize(w, Math.max(c.height, 1)); if (c.layoutMode === 'HORIZONTAL') c.primaryAxisSizingMode = 'FIXED'; else c.counterAxisSizingMode = 'FIXED'; }
function fixWH(c, w, h) { c.resize(w, h); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; }
function mkSet(comps, name, cols, parent, desc) {
  const set = figma.combineAsVariants(comps, parent);
  set.name = name;
  const P = 24, G = 24; const cw = Math.max(...comps.map(c => c.width)); let y = P;
  for (let i = 0; i < comps.length; i += cols) { const row = comps.slice(i, i + cols); const rh = Math.max(...row.map(c => c.height)); row.forEach((c, j) => { c.x = P + j * (cw + G); c.y = y; }); y += rh + G; }
  set.resizeWithoutConstraints(P * 2 + Math.min(cols, comps.length) * (cw + G) - G, y - G + P);
  set.fills = []; set.strokes = [{ type: 'SOLID', color: hex('#9747FF') }]; set.dashPattern = [6, 4]; set.strokeWeight = 1;
  if (desc) set.description = desc;
  COMP[name] = set; return set;
}
function prop(set, name, type, def, nodeName, field = 'characters') {
  const k = set.addComponentProperty(name, type, def);
  for (const c of set.children) { const n = c.findOne(x => x.name === nodeName); if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { [field]: k }); }
  return k;
}
function single(c, parent, desc) { if (desc) c.description = desc; if (parent) parent.appendChild(c); COMP[c.name] = c; return c; }
function I(name, props = {}) {
  const s = COMP[name]; if (!s) throw new Error('Componente ausente: ' + name);
  const i = (s.type === 'COMPONENT_SET' ? s.defaultVariant : s).createInstance();
  const defs = i.componentProperties; const out = {};
  for (const [k, v] of Object.entries(props)) { const key = Object.keys(defs).find(d => d === k || d.split('#')[0] === k); if (key) out[key] = v; }
  if (Object.keys(out).length) i.setProperties(out);
  return i;
}
function setText(node, name, value) { const t = node.findOne(n => n.type === 'TEXT' && n.name === name); if (t) t.characters = value; return t; }
function setImage(node, hash, name = 'Product image') { const r = node.findOne(n => n.name === name); if (r) r.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: 'FIT' }]; }
function setTeamMarker(node, team) { const m = node.findOne(n => n.name === 'Team marker'); if (m) m.fills = [paint(teamVar(team))]; }
function cropMarks(f, w, h) {
  for (const [x, y, rw, rh] of [[0, 0, 16, 1], [0, 0, 1, 16], [w - 16, 0, 16, 1], [w - 1, 0, 1, 16], [0, h - 1, 16, 1], [0, h - 16, 1, 16], [w - 16, h - 1, 16, 1], [w - 1, h - 16, 1, 16]]) {
    const r = rect(rw, rh, 'rule/ink', 'Crop mark'); f.appendChild(r); r.x = x; r.y = y;
  }
}
async function placeholderX(w, h, label, tone = 'paper') {
  const f = figma.createFrame(); f.name = 'Placeholder'; f.resize(w, h); fill(f, tone === 'ink' ? 'surface/ink-alt' : 'surface/paper-alt'); f.clipsContent = true;
  const v = figma.createVector(); v.vectorPaths = [{ windingRule: 'NONE', data: `M 0 0 L ${w} ${h} M ${w} 0 L 0 ${h}` }];
  v.strokes = [paint(tone === 'ink' ? 'rule/paper' : 'rule/ink-soft')]; v.strokeWeight = 1; f.appendChild(v);
  const t = await T('[ PLACEHOLDER ]  ' + label, 'Mono/Label', tone === 'ink' ? 'text/paper-muted' : 'text/ink-muted'); f.appendChild(t); t.x = 16; t.y = h - 30;
  return f;
}
// Board editorial padrão (papel, 1920 px) dentro de uma Section
function board(name) { return AL('VERTICAL', { name, w: 1920, fill: 'surface/paper', p: [80, 96, 128, 96], gap: 0 }); }
async function masthead(B, idx, title, big, lead) {
  const m = AL('HORIZONTAL', { name: 'Masthead', justify: 'SPACE_BETWEEN', p: [0, 0, 16, 0] }); add(B, m); FW(m); ruled(m);
  add(m, await T('F1HUB — V2 EDITORIAL REWORK', 'Mono/Label'), await T(`[${idx}] ${title}`, 'Mono/Label', 'accent/signal'), await T('HI-FI WIREFRAME', 'Mono/Label'));
  const h = AL('HORIZONTAL', { name: 'Title', justify: 'SPACE_BETWEEN', align: 'MAX', p: [56, 0, 40, 0] }); add(B, h); FW(h); ruled(h);
  add(h, await T(big, 'Display/XL'), await T(lead, 'Editorial/Quote', 'text/ink', { w: 560 }));
}
async function group(B, idx, title, desc) {
  const r = AL('HORIZONTAL', { name: 'Group ' + title, gap: 48, p: [48, 0, 48, 0] }); add(B, r); FW(r); ruled(r, 'Bottom', 'rule/ink-soft');
  const l = AL('VERTICAL', { name: 'Label', gap: 8, w: 340 }); add(r, l);
  add(l, await T(`[${idx}]`, 'Mono/Label', 'accent/signal'), await T(title, 'Headline/H2', 'text/ink', { w: 340 }), await T(desc, 'Body/S', 'text/ink-muted', { w: 320 }));
  const body = AL('VERTICAL', { name: 'Showcase', gap: 24 }); add(r, body); grow(body); return body;
}
function makeSection(page, name, x, y, content) {
  const s = figma.createSection(); s.name = name; page.appendChild(s); s.x = x; s.y = y;
  s.fills = [{ type: 'SOLID', color: hex('#C9C5BC') }];
  s.appendChild(content); content.x = 80; content.y = 80;
  s.resizeWithoutConstraints(content.width + 160, content.height + 160);
  return s;
}
function sectionExists(page, prefix) { return page.children.some(n => n.type === 'SECTION' && n.name.startsWith(prefix)); }
function bottomOf(page) { let y = 0; for (const n of page.children) if (n.type === 'SECTION') y = Math.max(y, n.y + n.height); return y; }

// ================================================================== 05 — UI COMPONENTS
async function stepComponents() {
  if (sectionExists(PB, '05')) { await loadComps(); return 'pulado (já existe)'; }
  await figma.setCurrentPageAsync(PB);
  const B = board('Board / 05 UI Components');
  // board fica temporariamente na página para que os componentes existam dentro dela
  PB.appendChild(B);
  await masthead(B, '05', 'UI COMPONENTS', 'COMPONENTES', 'Componentes nativos com Auto Layout, variantes e propriedades. Cada um existe para um tipo de informação; nenhum é um "card genérico".');

  // 01 Wordmark
  let g = await group(B, '01', 'Wordmark', 'Marca tipográfica em Anton. O "1" em sinal é o único ponto de cor fixo da marca.');
  const wms = [];
  for (const tone of ['Ink', 'Paper']) {
    const c = comp('Tone=' + tone); c.counterAxisAlignItems = 'CENTER'; c.paddingTop = 8; c.paddingBottom = 8; c.paddingLeft = 12; c.paddingRight = 12;
    if (tone === 'Paper') fill(c, 'surface/ink');
    const t = await T('F1HUB', 'Display/M', tone === 'Ink' ? 'text/ink' : 'text/paper', { name: 'Wordmark', size: 32, lh: 32 });
    t.setRangeFills(1, 2, [paint('accent/signal')]); add(c, t); wms.push(c);
  }
  mkSet(wms, 'Wordmark', 2, g, 'Logotipo tipográfico F1HUB.');

  // 02 Technical Label
  g = await group(B, '02', 'Technical Label', 'Rótulo técnico [índice] TEXTO. Organiza a leitura como numeração de ficha técnica. Propriedades: Index, Text.');
  const tls = [];
  for (const tone of ['Ink', 'Paper', 'Signal']) {
    const c = comp('Tone=' + tone); c.itemSpacing = 8; c.paddingTop = 6; c.paddingBottom = 6; c.paddingLeft = 8; c.paddingRight = 8;
    if (tone === 'Paper') fill(c, 'surface/ink');
    add(c, await T('[01]', 'Mono/Label', tone === 'Paper' ? 'text/paper-muted' : 'accent/signal', { name: 'Index' }), await T('MAIS VENDIDOS', 'Mono/Label', tone === 'Paper' ? 'text/paper' : tone === 'Signal' ? 'accent/signal' : 'text/ink', { name: 'Text' }));
    tls.push(c);
  }
  const tlSet = mkSet(tls, 'Technical Label', 3, g, 'Rótulo técnico.');
  prop(tlSet, 'Index', 'TEXT', '[01]', 'Index'); prop(tlSet, 'Text', 'TEXT', 'MAIS VENDIDOS', 'Text');

  // 03 Section Divider
  g = await group(B, '03', 'Section Divider', 'Abre cada seção como página de revista: índice, título em Anton, régua contínua, contagem e link. Tone Paper/Ink · Size Desktop/Mobile.');
  const sds = [];
  for (const size of ['Desktop', 'Mobile']) for (const tone of ['Paper', 'Ink']) {
    const ink = tone === 'Ink', D = size === 'Desktop';
    const c = comp(`Size=${size}, Tone=${tone}`); fixW(c, D ? 1344 : 358); c.counterAxisAlignItems = 'MAX'; c.itemSpacing = D ? 24 : 12; c.paddingTop = 16; c.paddingBottom = 16;
    if (ink) fill(c, 'surface/ink'); ruled(c, 'Top', ink ? 'rule/paper' : 'rule/ink');
    const sp = spacer();
    add(c, await T('01', 'Mono/Label', 'accent/signal', { name: 'Index' }), await T('Mais vendidos', D ? 'Display/M' : 'Headline/H2', ink ? 'text/paper' : 'text/ink', { name: 'Title' }), sp,
      await T(D ? '05 / 45 PRODUTOS' : '05', 'Mono/Label', ink ? 'text/paper-muted' : 'text/ink-muted', { name: 'Meta' }), await T(D ? 'VER TODOS →' : '→', 'UI/Button', ink ? 'text/paper' : 'text/ink', { name: 'Link' }));
    grow(sp); sds.push(c);
  }
  const sdSet = mkSet(sds, 'Section Divider', 1, g, 'Cabeçalho de seção editorial.');
  prop(sdSet, 'Index', 'TEXT', '01', 'Index'); prop(sdSet, 'Title', 'TEXT', 'Mais vendidos', 'Title'); prop(sdSet, 'Show link', 'BOOLEAN', true, 'Link', 'visible');

  // 04 Oversized Number + Racing Data Block
  g = await group(B, '04', 'Oversized Number · Racing Data Block', 'Número como elemento gráfico. O Data Block combina rótulo, valor monumental e unidade para dados reais da loja (equipes, produtos, desconto, tamanhos).');
  const ons = [];
  for (const size of ['XL', 'L', 'M']) for (const tone of ['Ink', 'Signal', 'Ghost']) {
    const c = comp(`Size=${size}, Tone=${tone}`);
    add(c, await T('01', size === 'XL' ? 'Display/Monument' : size === 'L' ? 'Display/XL' : 'Display/L', tone === 'Ink' ? 'text/ink' : tone === 'Signal' ? 'accent/signal' : 'rule/ink-soft', { name: 'Value' }));
    ons.push(c);
  }
  const onSet = mkSet(ons, 'Oversized Number', 3, g, 'Número monumental (posição, contagem, índice).'); prop(onSet, 'Value', 'TEXT', '01', 'Value');
  const dbs = [];
  for (const tone of ['Paper', 'Ink']) for (const size of ['L', 'M']) {
    const ink = tone === 'Ink'; const c = comp(`Tone=${tone}, Size=${size}`, 'VERTICAL'); c.itemSpacing = 8; c.paddingTop = 16; c.paddingBottom = 16; c.paddingLeft = 16; c.paddingRight = 32;
    if (ink) fill(c, 'surface/ink'); ruled(c, 'Left', ink ? 'rule/paper' : 'rule/ink');
    add(c, await T('[ EQUIPES ]', 'Mono/Label', ink ? 'text/paper-muted' : 'text/ink-muted', { name: 'Label' }));
    const v = AL('HORIZONTAL', { name: 'Value row', gap: 8, align: 'MAX' }); add(c, v);
    add(v, await T('05', size === 'L' ? 'Display/XL' : 'Display/L', ink ? 'text/paper' : 'text/ink', { name: 'Value' }), await T('do grid', 'Body/S', ink ? 'text/paper-muted' : 'text/ink-muted', { name: 'Unit' }));
    dbs.push(c);
  }
  const dbSet = mkSet(dbs, 'Racing Data Block', 4, g, 'Bloco de dado: rótulo, valor monumental e unidade.');
  prop(dbSet, 'Label', 'TEXT', '[ EQUIPES ]', 'Label'); prop(dbSet, 'Value', 'TEXT', '05', 'Value'); prop(dbSet, 'Unit', 'TEXT', 'do grid', 'Unit');

  // 05 Button
  g = await group(B, '05', 'Button', 'Retangular, sem raio e sem sombra, com seta tipográfica. Primary = tinta; Signal = única ação principal da tela (comprar, entrar); Outline = secundária; Text = link de ação.');
  const KIND = { Primary: ['surface/ink', 'text/paper', null], Signal: ['accent/signal', 'text/paper', null], Outline: [null, 'text/ink', 'rule/ink'], Text: [null, 'text/ink', null] };
  const bts = [];
  for (const kind of Object.keys(KIND)) for (const size of ['M', 'L']) for (const st of ['Default', 'Hover', 'Disabled']) {
    const [bg, fg, sk] = KIND[kind]; const c = comp(`Kind=${kind}, Size=${size}, State=${st}`); c.counterAxisAlignItems = 'CENTER'; c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.itemSpacing = 32;
    if (kind !== 'Text') { c.resize(size === 'M' ? 220 : 320, size === 'M' ? 48 : 64); c.counterAxisSizingMode = 'FIXED'; c.primaryAxisSizingMode = 'FIXED'; c.paddingLeft = 20; c.paddingRight = 20; }
    let bgc = bg, fgc = fg;
    if (st === 'Hover') { if (kind === 'Primary') bgc = 'accent/signal'; else if (kind === 'Signal') bgc = 'surface/ink'; else if (kind === 'Outline') { bgc = 'surface/ink'; fgc = 'text/paper'; } }
    if (st === 'Disabled') { bgc = kind === 'Text' ? null : 'surface/paper-alt'; fgc = 'text/ink-muted'; }
    fill(c, bgc); if (sk && st !== 'Disabled') { c.strokes = [paint(sk)]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE'; }
    add(c, await T('Comprar', 'UI/Button', fgc, { name: 'Label', deco: kind === 'Text' && st === 'Hover' ? 'UNDERLINE' : 'NONE' }), await T('→', 'UI/Button', kind === 'Text' && st === 'Hover' ? 'accent/signal' : fgc, { name: 'Arrow' }));
    bts.push(c);
  }
  const btSet = mkSet(bts, 'Button', 6, g, 'Botão editorial. Hover inverte superfícies; nunca usa sombra. Para ocupar a largura do pai, defina a instância como Fill.');
  prop(btSet, 'Label', 'TEXT', 'Comprar', 'Label'); prop(btSet, 'Show arrow', 'BOOLEAN', true, 'Arrow', 'visible');

  // 06 Navigation
  g = await group(B, '06', 'Nav Link · Editorial Header · Ticker · Breadcrumb', 'Navegação textual e indexada (01 Equipes, 02 Categorias…), sem ícones decorativos. O carrinho mostra a contagem em mono. O Ticker comunica o benefício real da loja (5% no PIX).');
  const nls = [];
  for (const tone of ['Paper', 'Ink']) for (const st of ['Default', 'Hover', 'Active']) {
    const ink = tone === 'Ink'; const c = comp(`Tone=${tone}, State=${st}`); c.itemSpacing = 6; c.paddingTop = 4; c.paddingBottom = 6;
    if (st === 'Active') ruled(c, 'Bottom', 'accent/signal', 2); if (st === 'Hover') ruled(c, 'Bottom', ink ? 'rule/paper' : 'rule/ink', 1);
    add(c, await T('01', 'Mono/Label', st === 'Active' ? 'accent/signal' : ink ? 'text/paper-muted' : 'text/ink-muted', { name: 'Index' }), await T('Equipes', 'UI/Nav', ink ? 'text/paper' : 'text/ink', { name: 'Label' }));
    nls.push(c);
  }
  const nlSet = mkSet(nls, 'Nav Link', 3, g, 'Link de navegação com índice.');
  prop(nlSet, 'Index', 'TEXT', '01', 'Index'); prop(nlSet, 'Label', 'TEXT', 'Equipes', 'Label');
  const hds = [];
  for (const vp of ['Desktop', 'Mobile']) for (const tone of ['Paper', 'Ink']) {
    const ink = tone === 'Ink', D = vp === 'Desktop';
    const c = comp(`Viewport=${vp}, Tone=${tone}`); fixWH(c, D ? 1440 : 390, D ? 72 : 60); c.counterAxisAlignItems = 'CENTER'; c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.paddingLeft = D ? 48 : 16; c.paddingRight = D ? 48 : 16;
    fill(c, ink ? 'surface/ink' : 'surface/paper'); ruled(c, 'Bottom', ink ? 'rule/paper' : 'rule/ink');
    add(c, I('Wordmark', { Tone: ink ? 'Paper' : 'Ink' }));
    if (D) {
      const nav = AL('HORIZONTAL', { name: 'Nav', gap: 32 }); add(c, nav);
      for (const [i, l] of [['01', 'Equipes ↓'], ['02', 'Categorias ↓'], ['03', 'Lançamentos'], ['04', 'Promoções']]) { const n = I('Nav Link', { Tone: tone, State: 'Default', Index: i, Label: l }); n.name = 'Nav ' + i; add(nav, n); }
      const act = AL('HORIZONTAL', { name: 'Actions', gap: 24, align: 'CENTER' }); add(c, act);
      add(act, await T('Buscar', 'UI/Nav', ink ? 'text/paper' : 'text/ink'), await T('Entrar', 'UI/Nav', ink ? 'text/paper' : 'text/ink'));
      const cart = AL('HORIZONTAL', { name: 'Cart', gap: 6, align: 'CENTER', p: [6, 10, 6, 10], fill: ink ? 'surface/paper' : 'surface/ink' });
      add(cart, await T('Carrinho', 'UI/Nav', ink ? 'text/ink' : 'text/paper'), await T('[0]', 'Mono/Label', 'accent/signal', { name: 'Cart count' })); add(act, cart);
    } else {
      const act = AL('HORIZONTAL', { name: 'Actions', gap: 16, align: 'CENTER' }); add(c, act);
      add(act, await T('Buscar', 'UI/Nav', ink ? 'text/paper' : 'text/ink'), await T('[0]', 'Mono/Label', 'accent/signal', { name: 'Cart count' }), await T('MENU', 'UI/Button', ink ? 'text/paper' : 'text/ink'));
    }
    hds.push(c);
  }
  mkSet(hds, 'Editorial Header', 1, g, 'Header editorial. Desktop: wordmark, navegação indexada e ações textuais. Mobile: wordmark, busca, contagem do carrinho e MENU. Para marcar a página atual, mude a instância "Nav 0X" para State=Active.');
  const tks = [];
  for (const tone of ['Ink', 'Signal']) {
    const c = comp('Tone=' + tone); fixWH(c, 1440, 36); c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 32; c.paddingLeft = 48; c.clipsContent = true;
    fill(c, tone === 'Ink' ? 'surface/ink' : 'accent/signal');
    for (const t of ['5% DE DESCONTO NO PIX', '◆', '05 EQUIPES DO GRID', '◆', 'COLEÇÕES 2025 / 2026', '◆', 'TAMANHOS P · M · G · GG', '◆', '5% DE DESCONTO NO PIX', '◆', '05 EQUIPES DO GRID']) add(c, await T(t, 'Mono/Label', 'text/paper'));
    tks.push(c);
  }
  mkSet(tks, 'Ticker', 1, g, 'Faixa corrida: animação horizontal contínua (40 s por ciclo), pausa no hover, respeita prefers-reduced-motion.');
  const bc = comp('Breadcrumb'); bc.itemSpacing = 8;
  add(bc, await T('INÍCIO', 'Mono/Label', 'text/ink-muted'), await T('/', 'Mono/Label', 'text/ink-muted'), await T('EQUIPES', 'Mono/Label', 'text/ink-muted', { name: 'Level 2' }), await T('/', 'Mono/Label', 'text/ink-muted', { name: 'Sep 2' }), await T('FERRARI', 'Mono/Label', 'text/ink', { name: 'Current' }));
  single(bc, g, 'Trilha em mono; último item é a página atual.');

  // 07 Forms
  g = await group(B, '07', 'Size Selector · Input · Checkbox · Filter Group · Driver Filter', 'Campos de linha (underline), rótulos técnicos e quadrados de tamanho. Erro = régua e mensagem em vermelho escuro, como as regras de cadastro.js. Filtros reais da página da equipe: Tamanho, Produto e Piloto.');
  const szs = [];
  for (const st of ['Default', 'Hover', 'Selected', 'Unavailable']) {
    const c = comp('State=' + st); fixWH(c, 64, 64); c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
    fill(c, st === 'Selected' ? 'surface/ink' : st === 'Hover' ? 'surface/paper-alt' : null); c.strokes = [paint(st === 'Unavailable' ? 'rule/ink-soft' : 'rule/ink')]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
    add(c, await T('M', 'Mono/Data', st === 'Selected' ? 'text/paper' : st === 'Unavailable' ? 'text/ink-muted' : 'text/ink', { name: 'Size', deco: st === 'Unavailable' ? 'STRIKETHROUGH' : 'NONE' }));
    if (st === 'Selected') { const b = rect(64, 4, 'accent/signal', 'Signal bar'); c.appendChild(b); b.layoutPositioning = 'ABSOLUTE'; b.x = 0; b.y = 60; }
    szs.push(c);
  }
  const szSet = mkSet(szs, 'Size Selector', 4, g, 'Seletor de tamanho P/M/G/GG.'); prop(szSet, 'Size', 'TEXT', 'M', 'Size');
  const ins = [];
  for (const type of ['Text', 'Password']) for (const st of ['Default', 'Focus', 'Filled', 'Error', 'Disabled']) {
    const c = comp(`Type=${type}, State=${st}`, 'VERTICAL'); fixW(c, 420); c.itemSpacing = 8;
    const lab = AL('HORIZONTAL', { name: 'Label row', gap: 8 }); add(c, lab);
    add(lab, await T('[01]', 'Mono/Label', st === 'Error' ? 'status/error' : 'accent/signal', { name: 'Index' }), await T(type === 'Password' ? 'SENHA' : 'E-MAIL', 'Mono/Label', 'text/ink', { name: 'Label' }));
    const fld = AL('HORIZONTAL', { name: 'Field', gap: 8, p: [10, 0, 10, 0], align: 'CENTER' }); add(c, fld); FW(fld);
    ruled(fld, 'Bottom', st === 'Error' ? 'status/error' : st === 'Focus' ? 'accent/signal' : st === 'Disabled' ? 'rule/ink-soft' : 'rule/ink', st === 'Focus' || st === 'Error' ? 2 : 1);
    const filled = ['Focus', 'Filled', 'Error'].includes(st);
    const val = await T(type === 'Password' ? (filled ? '••••••••••' : 'Digite sua senha') : (filled ? (st === 'Error' ? 'felipe@exemplo' : 'felipe@exemplo.com') : 'seuemail@exemplo.com'), 'Body/L', filled ? 'text/ink' : 'text/ink-muted', { name: 'Value' });
    add(fld, val); FW(val);
    if (type === 'Password') add(fld, await T('MOSTRAR', 'Mono/Label', 'text/ink-muted', { name: 'Toggle' }));
    add(c, await T(st === 'Error' ? (type === 'Password' ? '↳ A SENHA PRECISA TER 8 OU MAIS CARACTERES, COM LETRAS E NÚMEROS.' : '↳ DIGITE UM E-MAIL VÁLIDO, COMO NOME@EXEMPLO.COM.') : (type === 'Password' ? 'USE 8 OU MAIS CARACTERES, COM LETRAS E NÚMEROS.' : 'USAREMOS ESTE E-MAIL PARA ENTRAR NA CONTA.'), 'Mono/Label', st === 'Error' ? 'status/error' : 'text/ink-muted', { name: 'Message' }));
    if (st === 'Disabled') c.opacity = 0.45;
    ins.push(c);
  }
  const inSet = mkSet(ins, 'Input', 5, g, 'Campo de linha com rótulo técnico e mensagem (aria-describedby). Edite os textos Label, Value e Message direto na instância.');
  prop(inSet, 'Index', 'TEXT', '[01]', 'Index'); prop(inSet, 'Show message', 'BOOLEAN', true, 'Message', 'visible');
  const cbs = [];
  for (const st of ['Off', 'On', 'Error']) {
    const c = comp('State=' + st); c.itemSpacing = 12; c.counterAxisAlignItems = 'CENTER';
    const box = figma.createFrame(); box.name = 'Box'; box.resize(18, 18); box.clipsContent = false; fill(box, st === 'On' ? 'surface/ink' : null);
    box.strokes = [paint(st === 'Error' ? 'status/error' : 'rule/ink')]; box.strokeWeight = st === 'Error' ? 2 : 1; box.strokeAlign = 'INSIDE';
    if (st === 'On') { const v = figma.createVector(); v.vectorPaths = [{ windingRule: 'NONE', data: 'M 4 9 L 8 13 L 14 5' }]; v.strokes = [paint('text/paper')]; v.strokeWeight = 2; box.appendChild(v); }
    add(c, box, await T('Lembrar de mim', 'Body/M', st === 'Error' ? 'status/error' : 'text/ink', { name: 'Label' }));
    cbs.push(c);
  }
  const cbSet = mkSet(cbs, 'Checkbox', 3, g, 'Checkbox quadrado.'); prop(cbSet, 'Label', 'TEXT', 'Lembrar de mim', 'Label');
  // Driver filter (Driver Information Module)
  const dfs = [];
  for (const st of ['Default', 'Selected']) {
    const c = comp('State=' + st); c.itemSpacing = 10; c.counterAxisAlignItems = 'CENTER'; c.paddingTop = 10; c.paddingBottom = 10; c.paddingLeft = 12; c.paddingRight = 12;
    c.strokes = [paint('rule/ink')]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE'; if (st === 'Selected') fill(c, 'surface/ink');
    add(c, rect(4, 16, 'team/ferrari', 'Team marker'), await T('Leclerc', 'Headline/H4', st === 'Selected' ? 'text/paper' : 'text/ink', { name: 'Driver' }), await T('(1)', 'Mono/Label', st === 'Selected' ? 'text/paper-muted' : 'text/ink-muted', { name: 'Count' }));
    dfs.push(c);
  }
  const dfSet = mkSet(dfs, 'Driver Filter', 2, g, 'Driver Information Module aplicado ao filtro "Piloto": nome do piloto citado no produto, marcador da equipe e quantidade de peças.');
  prop(dfSet, 'Driver', 'TEXT', 'Leclerc', 'Driver'); prop(dfSet, 'Count', 'TEXT', '(1)', 'Count');
  // Filter group
  const fgs = [];
  for (const kind of ['Tamanho', 'Produto', 'Piloto']) for (const st of ['Collapsed', 'Expanded']) {
    const c = comp(`Kind=${kind}, State=${st}`, 'VERTICAL'); fixW(c, 300); c.itemSpacing = 0;
    const hd = AL('HORIZONTAL', { name: 'Header', justify: 'SPACE_BETWEEN', align: 'CENTER', p: [16, 0, 16, 0] }); add(c, hd); FW(hd); ruled(hd, 'Top', 'rule/ink');
    const hl = AL('HORIZONTAL', { name: 'Title', gap: 8 }); add(hd, hl);
    add(hl, await T(kind.toUpperCase(), 'Mono/Label', 'text/ink', { name: 'Title text' }), await T(kind === 'Tamanho' ? '4' : kind === 'Produto' ? '4' : '1', 'Mono/Label', 'text/ink-muted', { name: 'Count' }));
    add(hd, await T(st === 'Expanded' ? '−' : '+', 'Headline/H3', 'text/ink', { name: 'Toggle' }));
    if (st === 'Expanded') {
      const ct = AL(kind === 'Produto' ? 'VERTICAL' : 'HORIZONTAL', { name: 'Content', gap: 8, p: [0, 0, 20, 0] }); add(c, ct); FW(ct);
      if (kind === 'Tamanho') for (const [s, ss] of [['P', 'Default'], ['M', 'Selected'], ['G', 'Default'], ['GG', 'Default']]) add(ct, I('Size Selector', { State: ss, Size: s }));
      if (kind === 'Produto') for (const [o, n, on] of [['Camisas e polos', '3', true], ['Jaquetas', '2', false], ['Camisetas', '3', false], ['Bonés', '1', false]]) { const r = AL('HORIZONTAL', { name: o, justify: 'SPACE_BETWEEN', align: 'CENTER' }); add(ct, r); FW(r); add(r, I('Checkbox', { State: on ? 'On' : 'Off', Label: o }), await T(n, 'Mono/Label', 'text/ink-muted')); }
      if (kind === 'Piloto') add(ct, I('Driver Filter', { State: 'Default' }));
    }
    fgs.push(c);
  }
  const fgSet = mkSet(fgs, 'Filter Group', 2, g, 'Grupo de filtro da página da equipe (.filter-box). Contagens de exemplo = coleção Ferrari real.');

  // 08 Commerce modules
  g = await group(B, '08', 'Product Item · Ranking Item · Product Feature', 'Três composições diferentes para produto: grade (catálogo), item ranqueado (Mais vendidos P2–P5) e destaque (P1, com número monumental sobreposto à foto). Nenhuma usa borda arredondada ou sombra.');
  const pis = [];
  for (const size of ['Desktop', 'Mobile']) for (const tone of ['Paper', 'Ink']) for (const st of ['Default', 'Hover']) {
    const D = size === 'Desktop', ink = tone === 'Ink'; const W = D ? 432 : 171, MH = Math.round(W * 1.18);
    const c = comp(`Size=${size}, Tone=${tone}, State=${st}`, 'VERTICAL'); fixW(c, W); c.itemSpacing = D ? 14 : 10;
    if (ink) { fill(c, 'surface/ink'); }
    const m = figma.createFrame(); m.name = 'Media'; m.resize(W, MH); fill(m, 'surface/media'); m.clipsContent = true; c.appendChild(m);
    const k = st === 'Hover' ? 0.84 : 0.74; const iw = Math.round(W * k), ih = Math.round(MH * k);
    const im = imgRect(H.pm, iw, ih, 'FIT', 'Product image'); m.appendChild(im); im.x = Math.round((W - iw) / 2); im.y = Math.round((MH - ih) / 2); im.constraints = { horizontal: 'CENTER', vertical: 'CENTER' };
    const idx = await T('01/09', 'Mono/Label', 'text/ink-muted', { name: 'Index' }); m.appendChild(idx); idx.x = 12; idx.y = 12;
    if (st === 'Hover') { const bh = D ? 48 : 36; const bar = AL('HORIZONTAL', { name: 'Hover bar', w: W, h: bh, fill: 'surface/ink', justify: 'SPACE_BETWEEN', align: 'CENTER', p: [0, 16, 0, 16] }); add(bar, await T(D ? 'VER PRODUTO' : 'VER', 'UI/Button', 'text/paper'), await T('→', 'UI/Button', 'accent/signal')); m.appendChild(bar); bar.x = 0; bar.y = MH - bh; bar.constraints = { horizontal: 'STRETCH', vertical: 'MAX' }; }
    m.layoutSizingHorizontal = 'FILL';
    const meta = AL('HORIZONTAL', { name: 'Meta', gap: 8, align: 'CENTER' }); add(c, meta); FW(meta);
    add(meta, rect(4, 12, 'team/mercedes', 'Team marker'), await T('MERCEDES', 'Mono/Label', ink ? 'text/paper-muted' : 'text/ink-muted', { name: 'Team' }));
    const nm = await T('Camisa Polo Mercedes 2025 Preta', D ? 'Headline/H4' : 'Body/S', ink ? 'text/paper' : 'text/ink', { name: 'Name', deco: st === 'Hover' ? 'UNDERLINE' : 'NONE' }); add(c, nm); FW(nm);
    const pr = AL(D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Price row', gap: D ? 12 : 2, align: D ? 'CENTER' : 'MIN' }); add(c, pr); FW(pr);
    add(pr, await T('R$ 159,90', 'Mono/Price-M', ink ? 'text/paper' : 'text/ink', { name: 'Price' }), await T('−5% NO PIX', 'Mono/Label', ink ? 'text/paper-muted' : 'status/success', { name: 'Pix' }));
    pis.push(c);
  }
  const piSet = mkSet(pis, 'Product Item', 4, g, 'Item de catálogo. Troque a foto em "Product image" e a cor em "Team marker". Hover revela a barra "VER PRODUTO" (o tamanho é escolhido na página do produto).');
  prop(piSet, 'Name', 'TEXT', 'Camisa Polo Mercedes 2025 Preta', 'Name'); prop(piSet, 'Team', 'TEXT', 'MERCEDES', 'Team'); prop(piSet, 'Price', 'TEXT', 'R$ 159,90', 'Price'); prop(piSet, 'Index', 'TEXT', '01/09', 'Index');
  const ris = [];
  for (const size of ['Desktop', 'Mobile']) for (const pos of ['Leader', 'Default']) for (const st of ['Default', 'Hover']) {
    const D = size === 'Desktop', hov = st === 'Hover';
    const c = comp(`Size=${size}, Position=${pos}, State=${st}`); fixW(c, D ? 820 : 358); c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = D ? 24 : 12; c.paddingTop = D ? 20 : 12; c.paddingBottom = D ? 20 : 12; c.paddingLeft = hov ? 16 : 0; c.paddingRight = hov ? 16 : 0;
    if (hov) fill(c, 'surface/ink'); ruled(c, 'Bottom', 'rule/ink');
    add(c, await T('02', D ? 'Display/L' : 'Display/M', pos === 'Leader' ? 'accent/signal' : hov ? 'text/paper' : 'text/ink', { name: 'Position', w: D ? 120 : 64 }));
    const th = figma.createFrame(); th.name = 'Thumb'; const tw = D ? 112 : 64; th.resize(tw, tw); fill(th, 'surface/media'); th.clipsContent = true;
    const ti = imgRect(H.bf, Math.round(tw * 0.8), Math.round(tw * 0.8), 'FIT', 'Product image'); th.appendChild(ti); ti.x = Math.round(tw * 0.1); ti.y = Math.round(tw * 0.1); add(c, th);
    const info = AL('VERTICAL', { name: 'Info', gap: 6 }); add(c, info); grow(info);
    const tm = AL('HORIZONTAL', { name: 'Team row', gap: 8, align: 'CENTER' }); add(info, tm); add(tm, rect(4, 12, 'team/ferrari', 'Team marker'), await T('FERRARI', 'Mono/Label', hov ? 'text/paper-muted' : 'text/ink-muted', { name: 'Team' }));
    const nm = await T('Jaqueta Scuderia Ferrari Replica Driver Autêntica Racing', D ? 'Headline/H3' : 'Body/S', hov ? 'text/paper' : 'text/ink', { name: 'Name' }); add(info, nm); FW(nm);
    const rt = AL('VERTICAL', { name: 'Right', gap: 4, align: 'MAX' }); add(c, rt);
    add(rt, await T('R$ 369,90', D ? 'Mono/Price-M' : 'Mono/Label', hov ? 'text/paper' : 'text/ink', { name: 'Price' }));
    if (D) add(rt, await T('→', 'UI/Button', hov ? 'accent/signal' : 'text/ink', { name: 'Arrow' }));
    ris.push(c);
  }
  const riSet = mkSet(ris, 'Ranking Item', 4, g, 'Item de ranking (Mais vendidos). Position=Leader pinta o número em sinal.');
  prop(riSet, 'Number', 'TEXT', '02', 'Position'); prop(riSet, 'Name', 'TEXT', 'Jaqueta Scuderia Ferrari Replica Driver Autêntica Racing', 'Name'); prop(riSet, 'Team', 'TEXT', 'FERRARI', 'Team'); prop(riSet, 'Price', 'TEXT', 'R$ 369,90', 'Price');
  {
    const c = comp('Product Feature', 'VERTICAL'); fixW(c, 560); c.itemSpacing = 16;
    const m = figma.createFrame(); m.name = 'Media'; m.resize(560, 660); fill(m, 'surface/media'); m.clipsContent = true; c.appendChild(m);
    const im = imgRect(H.pm, 420, 520, 'FIT', 'Product image'); m.appendChild(im); im.x = 110; im.y = 40;
    const n = await T('01', 'Display/Monument', 'accent/signal', { name: 'Position' }); m.appendChild(n); n.x = 20; n.y = 660 - 196;
    cropMarks(m, 560, 660);
    add(c, I('Technical Label', { Tone: 'Signal', Index: '[P1]', Text: 'MAIS VENDIDO' }));
    const tm = AL('HORIZONTAL', { name: 'Team row', gap: 8, align: 'CENTER' }); add(c, tm); add(tm, rect(4, 14, 'team/mercedes', 'Team marker'), await T('MERCEDES', 'Mono/Label', 'text/ink-muted', { name: 'Team' }));
    const nm = await T('Camisa Polo Mercedes 2025 Preta', 'Headline/H1', 'text/ink', { name: 'Name' }); add(c, nm); FW(nm);
    const pr = AL('HORIZONTAL', { name: 'Price row', gap: 16, align: 'CENTER', justify: 'SPACE_BETWEEN' }); add(c, pr); FW(pr);
    const pl = AL('HORIZONTAL', { name: 'Price', gap: 12, align: 'CENTER' }); add(pr, pl);
    add(pl, await T('R$ 159,90', 'Mono/Price-L', 'text/ink', { name: 'Price' }), await T('−5% NO PIX', 'Mono/Label', 'status/success'));
    add(pr, I('Button', { Kind: 'Text', Size: 'M', State: 'Default', Label: 'Ver produto' }));
    single(c, g, 'Destaque do P1 em Mais vendidos: foto grande, número monumental sobreposto e preço em escala.');
  }

  // 09 Team modules
  g = await group(B, '09', 'Team Row · Team Hero', 'Equipes como índice tipográfico: número, marcador de cor, nome em Anton e dados reais (9 produtos por equipe, faixa de preço). O Team Hero abre a página de cada equipe preservando a cor e o escudo do código (.main-title).');
  const trs = [];
  for (const size of ['Desktop', 'Mobile']) for (const [i, [team, tv, lg, mn, mx]] of TEAMS.entries()) for (const st of ['Default', 'Hover']) {
    const D = size === 'Desktop', hov = st === 'Hover';
    const c = comp(`Size=${size}, Team=${team}, State=${st}`); fixWH(c, D ? 1344 : 358, D ? 132 : 84); c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = D ? 32 : 12; c.paddingLeft = hov ? (D ? 24 : 12) : 0; c.paddingRight = hov ? (D ? 24 : 12) : 0;
    if (hov) fill(c, 'surface/ink'); ruled(c, 'Bottom', 'rule/ink');
    add(c, await T(String(i + 1).padStart(2, '0'), 'Mono/Label', hov ? 'accent/signal' : 'text/ink-muted', { name: 'Index', w: D ? 32 : 22 }));
    const strip = rect(hov ? (D ? 16 : 8) : (D ? 6 : 4), D ? 84 : 52, tv, 'Team marker'); if (team === 'Red Bull' && hov) { strip.strokes = [paint('rule/paper')]; strip.strokeWeight = 1; } add(c, strip);
    add(c, await T(team.toUpperCase(), D ? 'Display/L' : 'Display/M', hov ? 'text/paper' : 'text/ink', { name: 'Team name' }));
    const sp = spacer(); add(c, sp); grow(sp);
    if (D && hov) { const lb = figma.createFrame(); lb.name = 'Logo'; lb.resize(88, 88); fill(lb, tv); if (team === 'Red Bull') { lb.strokes = [paint('rule/paper')]; lb.strokeWeight = 1; } const li = imgRect(H[lg], 64, 64, 'FIT', 'Team logo'); lb.appendChild(li); li.x = 12; li.y = 12; add(c, lb); }
    if (D) add(c, await T(`R$ ${mn} — ${mx}`, 'Mono/Label', hov ? 'text/paper-muted' : 'text/ink-muted', { name: 'Price range' }));
    add(c, await T(D ? '09 PRODUTOS' : '09', 'Mono/Label', hov ? 'text/paper' : 'text/ink', { name: 'Count' }));
    add(c, await T('→', D ? 'Headline/H2' : 'UI/Button', hov ? 'accent/signal' : 'text/ink', { name: 'Arrow' }));
    trs.push(c);
  }
  mkSet(trs, 'Team Row', 2, g, 'Linha do índice de equipes (home e equipes.html). Hover inverte para tinta e revela o escudo.');
  const ths = [];
  for (const [i, [team, tv, lg, mn, mx]] of TEAMS.entries()) {
    const c = comp('Team=' + team); fixW(c, 1440); c.itemSpacing = 24; c.paddingTop = 32; c.paddingBottom = 48; c.paddingLeft = 48; c.paddingRight = 48; c.counterAxisAlignItems = 'MAX'; fill(c, 'surface/paper'); ruled(c, 'Bottom', 'rule/ink');
    const l = AL('VERTICAL', { name: 'Left', gap: 16 }); add(c, l); grow(l);
    const bcI = I('Breadcrumb'); setText(bcI, 'Current', team.toUpperCase()); add(l, bcI);
    add(l, await T(`[ EQUIPE ${String(i + 1).padStart(2, '0')} / 05 ]`, 'Mono/Label', 'accent/signal'));
    add(l, await T(team.toUpperCase(), 'Display/XL', 'text/ink', { name: 'Team name' }));
    const bar = rect(786, 8, tv, 'Team color bar'); add(l, bar);
    const data = AL('HORIZONTAL', { name: 'Data', gap: 0 }); add(l, data);
    for (const [lbl, val, unit] of [['[ PRODUTOS ]', '09', 'peças'], ['[ A PARTIR DE ]', mn, 'R$'], ['[ ATÉ ]', mx, 'R$'], ['[ TAMANHOS ]', 'P–GG', '']]) add(data, I('Racing Data Block', { Tone: 'Paper', Size: 'M', Label: lbl, Value: val, Unit: unit }));
    const lb = figma.createFrame(); lb.name = 'Team identity'; lb.resize(534, 480); fill(lb, tv); lb.clipsContent = true;
    const li = imgRect(H[lg], 260, 260, 'FIT', 'Team logo'); lb.appendChild(li); li.x = 137; li.y = 110;
    const cap = await T(`FIG. — ESCUDO ${team.toUpperCase()} (ASSET DO REPOSITÓRIO)`, 'Mono/Label', team === 'Mercedes' || team === 'McLaren' ? 'text/ink' : 'text/paper'); lb.appendChild(cap); cap.x = 20; cap.y = 448;
    add(c, lb);
    ths.push(c);
  }
  mkSet(ths, 'Team Hero', 1, g, 'Abertura da página de equipe: nome monumental, barra de cor, dados reais e bloco de identidade com o escudo.');

  // 10 Data & feedback
  g = await group(B, '10', 'Composition Bar · Spec Row · Price Block · Telemetry Chart · Status Message · Image Composition · Section Label', 'Dados reais apresentados com linguagem de telemetria: composição do tecido (50/50), ficha técnica, preço com benefício PIX e faixa de preço por equipe. Circuit Module não foi criado: o F1Hub não tem dados de circuitos.');
  {
    const c = comp('Composition Bar', 'VERTICAL'); fixW(c, 520); c.itemSpacing = 10;
    add(c, await T('[ COMPOSIÇÃO ] MALHA PIQUET PA', 'Mono/Label', 'text/ink-muted', { name: 'Label' }));
    const bar = AL('HORIZONTAL', { name: 'Bar', h: 14 }); add(c, bar); FW(bar);
    const a = rect(260, 14, 'surface/ink', 'Segment A'); const b = rect(260, 14, 'rule/ink-soft', 'Segment B'); add(bar, a, b); a.layoutGrow = 1; b.layoutGrow = 1;
    const lg = AL('HORIZONTAL', { name: 'Legend', justify: 'SPACE_BETWEEN' }); add(c, lg); FW(lg);
    add(lg, await T('ALGODÃO  50%', 'Mono/Data', 'text/ink', { name: 'A' }), await T('POLIÉSTER  50%', 'Mono/Data', 'text/ink-muted', { name: 'B' }));
    single(c, g, 'Performance Indicator aplicado à composição do tecido (dado real de produto.html). Ajuste o grow dos segmentos para outras proporções.');
  }
  {
    const c = comp('Spec Row'); fixW(c, 520); c.itemSpacing = 24; c.paddingTop = 12; c.paddingBottom = 12; ruled(c, 'Bottom', 'rule/ink-soft');
    const k = await T('COMPOSIÇÃO', 'Mono/Label', 'text/ink-muted', { name: 'Key', w: 140 }); const v = await T('Malha Piquet PA (50% algodão / 50% poliéster)', 'Body/M', 'text/ink', { name: 'Value' }); add(c, k, v); FW(v);
    const kk = c.addComponentProperty('Key', 'TEXT', 'COMPOSIÇÃO'); const kv = c.addComponentProperty('Value', 'TEXT', 'Malha Piquet PA (50% algodão / 50% poliéster)');
    k.componentPropertyReferences = { characters: kk }; v.componentPropertyReferences = { characters: kv };
    single(c, g, 'Linha de ficha técnica (chave mono / valor).');
  }
  {
    const c = comp('Price Block', 'VERTICAL'); c.itemSpacing = 8;
    add(c, await T('[ PREÇO ]', 'Mono/Label', 'text/ink-muted'), await T('R$ 159,90', 'Mono/Price-L', 'text/ink', { name: 'Price' }));
    const r = AL('HORIZONTAL', { name: 'Pix row', gap: 12, align: 'CENTER' }); add(c, r);
    const tag = AL('HORIZONTAL', { name: 'Pix tag', p: [4, 8, 4, 8], fill: 'status/success' }); add(tag, await T('−5%', 'Mono/Label', 'text/paper')); add(r, tag, await T('DE DESCONTO PAGANDO NO PIX', 'Mono/Label', 'status/success'));
    const k = c.addComponentProperty('Price', 'TEXT', 'R$ 159,90'); c.findOne(n => n.name === 'Price').componentPropertyReferences = { characters: k };
    single(c, g, 'Preço da página de produto com o benefício PIX do código.');
  }
  {
    const c = comp('Telemetry Chart — Faixa de preço por equipe', 'VERTICAL'); fixW(c, 820); c.itemSpacing = 0; c.paddingTop = 24; c.paddingBottom = 24; c.paddingLeft = 24; c.paddingRight = 24; fill(c, 'surface/ink');
    const hd = AL('HORIZONTAL', { name: 'Head', justify: 'SPACE_BETWEEN', p: [0, 0, 16, 0] }); add(c, hd); FW(hd); ruled(hd, 'Bottom', 'rule/paper');
    add(hd, await T('[ TELEMETRIA ] FAIXA DE PREÇO POR EQUIPE', 'Mono/Label', 'text/paper'), await T('R$ 100 ——— R$ 400', 'Mono/Label', 'text/paper-muted'));
    const TW = 480, x0 = 100, x1 = 400; const sx = v => Math.round((v - x0) / (x1 - x0) * TW);
    for (const [team, tv, , mn, mx, vmin, vmax] of TEAMS) {
      const r = AL('HORIZONTAL', { name: 'Row ' + team, gap: 24, align: 'CENTER', p: [14, 0, 14, 0] }); add(c, r); FW(r); ruled(r, 'Bottom', 'rule/paper');
      add(r, await T(team.toUpperCase(), 'Mono/Label', 'text/paper', { w: 100 }));
      const tr = figma.createFrame(); tr.name = 'Track'; tr.resize(TW, 16); tr.fills = []; tr.clipsContent = false; add(r, tr);
      const base = rect(TW, 1, 'rule/paper', 'Axis'); tr.appendChild(base); base.y = 8;
      for (const q of [0, 0.333, 0.667, 1]) { const tk = rect(1, 16, 'rule/paper', 'Tick'); tr.appendChild(tk); tk.x = Math.round(q * (TW - 1)); }
      const rg = rect(Math.max(sx(vmax) - sx(vmin), 4), 6, team === 'Ferrari' ? 'accent/signal' : 'text/paper', 'Range'); tr.appendChild(rg); rg.x = sx(vmin); rg.y = 5;
      const v = AL('HORIZONTAL', { name: 'Values', gap: 8 }); add(r, v); add(v, await T(mn, 'Mono/Label', 'text/paper-muted'), await T('—', 'Mono/Label', 'text/paper-muted'), await T(mx, 'Mono/Label', 'text/paper'));
    }
    add(c, await T('FONTE: PREÇOS DAS PÁGINAS DE EQUIPE NO REPOSITÓRIO (9 PRODUTOS CADA).', 'Mono/Label', 'text/paper-muted'));
    single(c, g, 'Telemetry Chart Container com dado real: menor e maior preço de cada equipe. Use apenas com dados existentes no catálogo.');
  }
  const sms = [];
  for (const [ty, col, txt] of [['Success', 'status/success', 'Conta criada! Levando você para o login…'], ['Error', 'status/error', 'Revise os campos destacados para continuar.'], ['Info', 'surface/ink', 'Pagando com PIX você ganha 5% de desconto.']]) {
    const c = comp('Type=' + ty); fixW(c, 520); c.itemSpacing = 16; c.counterAxisAlignItems = 'CENTER'; c.paddingTop = 16; c.paddingBottom = 16; c.paddingLeft = 20; c.paddingRight = 20; fill(c, 'surface/paper-alt'); ruled(c, 'Left', col, 4);
    add(c, await T(ty === 'Success' ? 'OK' : ty === 'Error' ? 'ERRO' : 'INFO', 'Mono/Label', col === 'surface/ink' ? 'text/ink' : col, { w: 48 }));
    const t = await T(txt, 'Body/M', 'text/ink', { name: 'Message' }); add(c, t); FW(t); sms.push(c);
  }
  const smSet = mkSet(sms, 'Status Message', 1, g, 'Mensagem de status (role="status"), herdeira do .form-status do cadastro.'); prop(smSet, 'Message', 'TEXT', 'Mensagem', 'Message');
  const ics = [];
  for (const kind of ['Product', 'Editorial placeholder']) {
    const c = comp('Kind=' + kind, 'VERTICAL'); c.itemSpacing = 10;
    const m = figma.createFrame(); m.name = 'Media'; m.resize(400, 480); fill(m, kind === 'Product' ? 'surface/media' : 'surface/paper-alt'); m.clipsContent = true; c.appendChild(m);
    if (kind === 'Product') { const r = imgRect(H.pm, 300, 380, 'FIT', 'Product image'); m.appendChild(r); r.x = 50; r.y = 50; }
    else { const v = figma.createVector(); v.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 0 L 400 480 M 400 0 L 0 480' }]; v.strokes = [paint('rule/ink-soft')]; v.strokeWeight = 1; m.appendChild(v); const t = await T('[ PLACEHOLDER ] FOTO EDITORIAL', 'Mono/Label', 'text/ink-muted'); m.appendChild(t); t.x = 16; t.y = 448; }
    cropMarks(m, 400, 480);
    const cap = AL('HORIZONTAL', { name: 'Caption', gap: 12, justify: 'SPACE_BETWEEN' }); add(c, cap); FW(cap);
    add(cap, await T('FIG. 01', 'Mono/Label', 'accent/signal', { name: 'Fig' }), await T(kind === 'Product' ? 'Camisa Polo Mercedes 2025 Preta' : 'Pit lane — direção de foto a produzir', 'Body/S', 'text/ink-muted', { name: 'Caption text' }));
    ics.push(c);
  }
  const icSet = mkSet(ics, 'Image Composition', 2, g, 'Imagem com marcas de corte e legenda FIG. Troque a foto no fill de "Product image" e redimensione "Media" na instância.');
  prop(icSet, 'Fig', 'TEXT', 'FIG. 01', 'Fig'); prop(icSet, 'Caption', 'TEXT', 'Legenda', 'Caption text');

  // 11 Footer
  g = await group(B, '11', 'Footer', 'Footer em tinta com o wordmark monumental e os links reais do código (Equipes, Categorias, Lançamentos, Promoções, redes sociais e termos).');
  const fts = [];
  for (const vp of ['Desktop', 'Mobile']) {
    const D = vp === 'Desktop'; const c = comp('Viewport=' + vp, 'VERTICAL'); fixW(c, D ? 1440 : 390); c.itemSpacing = D ? 48 : 32; c.paddingTop = D ? 64 : 40; c.paddingBottom = 32; c.paddingLeft = D ? 48 : 16; c.paddingRight = D ? 48 : 16; fill(c, 'surface/ink'); c.clipsContent = true;
    const cols = AL(D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Columns', gap: D ? 24 : 32 }); add(c, cols); FW(cols);
    const q = AL('VERTICAL', { name: 'Manifesto', gap: 12 }); add(cols, q); if (D) q.layoutGrow = 2; else FW(q);
    add(q, await T('[ F1HUB ]', 'Mono/Label', 'accent/signal')); const qt = await T('Sua paixão pela velocidade, em um só lugar.', 'Editorial/Lead', 'text/paper'); add(q, qt); FW(qt);
    for (const [h, items] of [['NAVEGAÇÃO', ['Equipes', 'Categorias', 'Lançamentos', 'Promoções']], ['EQUIPES', ['Ferrari', 'Mercedes', 'Red Bull', 'McLaren', 'Williams']], ['SOCIAL', ['Instagram ↗', 'Facebook ↗', 'X ↗']]]) {
      const cc = AL('VERTICAL', { name: h, gap: 10 }); add(cols, cc); if (D) cc.layoutGrow = 1; add(cc, await T(h, 'Mono/Label', 'text/paper-muted')); for (const it of items) add(cc, await T(it, 'UI/Nav', 'text/paper'));
    }
    const wm = await T('F1HUB', 'Display/Monument', 'text/paper', { name: 'Monument wordmark', size: D ? 500 : 140, lh: D ? 400 : 116 }); wm.setRangeFills(1, 2, [paint('accent/signal')]); add(c, wm);
    const lg = AL(D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Legal', gap: D ? 24 : 8, justify: 'SPACE_BETWEEN', p: [16, 0, 0, 0] }); add(c, lg); FW(lg); ruled(lg, 'Top', 'rule/paper');
    add(lg, await T('© 2026 F1 HUB. TODOS OS DIREITOS RESERVADOS.', 'Mono/Label', 'text/paper-muted'));
    const lk = AL('HORIZONTAL', { name: 'Links', gap: 24 }); add(lg, lk); for (const l of ['PRIVACIDADE', 'TERMOS', 'COOKIES']) add(lk, await T(l, 'Mono/Label', 'text/paper-muted'));
    fts.push(c);
  }
  mkSet(fts, 'Footer', 1, g, 'Rodapé editorial com wordmark monumental.');

  const s = makeSection(PB, '05 — UI Components', 0, 0, B);
  return 'ok · ' + Object.keys(COMP).length + ' componentes';
}

// ================================================================== BUILDERS (usados em Patterns e Screens)
async function screen(name, w) {
  const f = AL('VERTICAL', { name, w, fill: 'surface/paper' }); f.clipsContent = true;
  const gs = GS[w >= 1440 ? 'Grid/Desktop 1440 — 12 col' : w >= 768 ? 'Grid/Tablet 768 — 8 col' : 'Grid/Mobile 390 — 4 col'];
  if (gs) await f.setGridStyleIdAsync(gs.id);
  return f;
}
function block(parent, dir, o = {}) { const b = AL(dir, o); add(parent, b); FW(b); return b; }
function pItem(key, size = 'Desktop', o = {}) {
  const [name, price, team] = PROD[key];
  const i = I('Product Item', { Size: size, Tone: o.tone || 'Paper', State: o.hover ? 'Hover' : 'Default', Name: name, Team: team.toUpperCase(), Price: price, Index: o.index || '01/09' });
  setImage(i, H[key]); setTeamMarker(i, team); return i;
}
function rItem(key, num, size = 'Desktop', o = {}) {
  const [name, price, team] = PROD[key];
  const i = I('Ranking Item', { Size: size, Position: num === '01' ? 'Leader' : 'Default', State: o.hover ? 'Hover' : 'Default', Number: num, Name: name, Team: team.toUpperCase(), Price: price });
  setImage(i, H[key]); setTeamMarker(i, team); return i;
}
function divider(D, idx, title, meta, tone = 'Paper', link = true) {
  const i = I('Section Divider', { Size: D ? 'Desktop' : 'Mobile', Tone: tone, Index: idx, Title: title, 'Show link': link });
  setText(i, 'Meta', meta); return i;
}
function header(D, tone = 'Paper', active) {
  const h = I('Editorial Header', { Viewport: D ? 'Desktop' : 'Mobile', Tone: tone });
  if (D && active) { const n = h.findOne(x => x.name === 'Nav ' + active); if (n) n.setProperties({ State: 'Active' }); }
  return h;
}
function btn(kind, size, label, fillW = false) { const b = I('Button', { Kind: kind, Size: size, State: 'Default', Label: label }); b._fill = fillW; return b; }
function placeFill(parent, ...nodes) { for (const n of nodes) { add(parent, n); n.layoutSizingHorizontal = 'FILL'; if (n.type === 'TEXT') n.textAutoResize = 'HEIGHT'; } }
function imgComp(key, w, h, fig, caption, mode = 'FIT') {
  const i = I('Image Composition', { Kind: 'Product', Fig: fig, Caption: caption });
  const m = i.findOne(n => n.name === 'Media'); m.resize(w, h);
  const r = i.findOne(n => n.name === 'Product image');
  if (mode === 'FILL') { r.resize(w, h); r.x = 0; r.y = 0; } else { const k = 0.78; const iw = Math.round(w * k), ih = Math.round(h * k); r.resize(iw, ih); r.x = Math.round((w - iw) / 2); r.y = Math.round((h - ih) / 2); }
  r.fills = [{ type: 'IMAGE', imageHash: H[key], scaleMode: mode }];
  const marks = i.findAll(n => n.name === 'Crop mark');
  const pos = [[0, 0], [0, 0], [w - 16, 0], [w - 1, 0], [0, h - 1], [0, h - 16], [w - 16, h - 1], [w - 1, h - 16]];
  marks.forEach((mk, j) => { if (pos[j]) { mk.x = pos[j][0]; mk.y = pos[j][1]; } });
  return i;
}
function dataBlock(tone, size, label, value, unit) { return I('Racing Data Block', { Tone: tone, Size: size, Label: label, Value: value, Unit: unit }); }

async function bHero(D) {
  const f = AL(D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Pattern / Editorial Hero', w: D ? 1440 : 390, p: D ? [48, 48, 64, 48] : [24, 16, 32, 16], gap: D ? 24 : 20, align: D ? 'MAX' : 'MIN', fill: 'surface/paper' });
  const l = AL('VERTICAL', { name: 'Title column', gap: D ? 24 : 16 }); add(f, l); if (D) { l.resize(786, 10); l.counterAxisSizingMode = 'FIXED'; } else FW(l);
  add(l, I('Technical Label', { Tone: 'Ink', Index: '[01]', Text: 'COLEÇÕES 2025 / 2026' }));
  const t = AL('VERTICAL', { name: 'Monument', gap: 0 }); add(l, t);
  add(t, await T('VISTA', D ? 'Display/Monument' : 'Display/L', 'text/ink'));
  const t2 = await T('O GRID.', D ? 'Display/Monument' : 'Display/L', 'text/ink'); t2.setRangeFills(6, 7, [paint('accent/signal')]); add(t, t2);
  const lead = await T('Camisas, polos, bonés, jaquetas e moletons de cinco equipes da Fórmula 1 — com 5% de desconto no PIX.', D ? 'Editorial/Lead' : 'Editorial/Quote', 'text/ink'); add(l, lead); if (D) { lead.resize(640, lead.height); lead.textAutoResize = 'HEIGHT'; } else FW(lead);
  const bt = AL(D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Actions', gap: 12 }); add(l, bt); if (!D) FW(bt);
  const b1 = btn('Signal', 'L', 'Ver promoções'), b2 = btn('Outline', 'L', 'Escolher equipe'); add(bt, b1, b2); if (!D) { b1.layoutSizingHorizontal = 'FILL'; b2.layoutSizingHorizontal = 'FILL'; }
  const ic = imgComp('bf', D ? 534 : 358, D ? 640 : 400, 'FIG. 01', 'Jaqueta Scuderia Ferrari Replica · R$ 369,90'); add(f, ic);
  return f;
}
async function bData(D) {
  const f = AL('HORIZONTAL', { name: 'Pattern / Racing Data Strip', w: D ? 1440 : 390, p: D ? [0, 48, 64, 48] : [0, 16, 32, 16], gap: D ? 24 : 16, fill: 'surface/paper' }); if (!D) { f.layoutWrap = 'WRAP'; f.counterAxisSpacing = 16; }
  for (const [lb, v, u] of [['[ EQUIPES ]', '05', 'do grid'], ['[ PRODUTOS ]', '45', 'no catálogo'], ['[ PIX ]', '−5%', 'de desconto'], ['[ TAMANHOS ]', 'P–GG', 'nas peças de roupa']]) {
    const b = dataBlock('Paper', D ? 'L' : 'M', lb, v, u); add(f, b); if (D) b.layoutGrow = 1; else b.resize(171, b.height);
  }
  return f;
}
async function bPromoBanner(D) {
  const f = AL('VERTICAL', { name: 'Pattern / Promo Banner', w: D ? 1440 : 390, p: D ? [0, 48, 64, 48] : [0, 16, 32, 16], gap: 12, fill: 'surface/paper' });
  const r = imgRect(H.promo, D ? 1344 : 358, D ? 424 : 113, 'FILL', 'Promo banner'); add(f, r);
  const c = AL('HORIZONTAL', { name: 'Caption', justify: 'SPACE_BETWEEN', align: 'CENTER' }); add(f, c); FW(c);
  add(c, await T('FIG. 02 — PRODUTOS ATÉ 50% OFF · FERRARI', 'Mono/Label', 'text/ink-muted'), btn('Text', 'M', D ? 'Ver Ferrari' : 'Ver'));
  return f;
}
async function bRanking(D) {
  const f = AL('VERTICAL', { name: 'Pattern / Ranking — Mais vendidos', w: D ? 1440 : 390, p: D ? [32, 48, 96, 48] : [16, 16, 48, 16], gap: D ? 40 : 16, fill: 'surface/paper' });
  placeFill(f, divider(D, '01', 'Mais vendidos', D ? '05 / 45 PRODUTOS' : '05'));
  if (D) {
    const row = block(f, 'HORIZONTAL', { name: 'Ranking', gap: 24, align: 'MIN' });
    const ft = I('Product Feature'); add(row, ft);
    const list = AL('VERTICAL', { name: 'P2 — P5', gap: 0 }); add(row, list); list.layoutGrow = 1;
    add(list, I('Technical Label', { Tone: 'Ink', Index: '[P2—P5]', Text: 'NA SEQUÊNCIA' }));
    BEST.slice(1).forEach((k, j) => placeFill(list, rItem(k, String(j + 2).padStart(2, '0'), 'Desktop', { hover: j === 0 })));
  } else {
    BEST.forEach((k, j) => placeFill(f, rItem(k, String(j + 1).padStart(2, '0'), 'Mobile')));
  }
  return f;
}
async function bPromoInk(D) {
  const f = AL('VERTICAL', { name: 'Pattern / Promoções (faixa invertida)', w: D ? 1440 : 390, p: D ? [64, 48, 80, 48] : [40, 16, 48, 16], gap: D ? 32 : 20, fill: 'surface/ink' });
  placeFill(f, divider(D, '02', 'Promoções', D ? '04 OFERTAS' : '04', 'Ink'));
  const row = block(f, 'HORIZONTAL', { name: D ? 'Contact sheet' : 'Scroll horizontal', gap: D ? 0 : 12 }); if (!D) row.clipsContent = true;
  PROMO.forEach((k, j) => {
    const it = pItem(k, D ? 'Desktop' : 'Mobile', { tone: 'Ink', badge: true, index: `0${j + 1}/04` });
    if (D) { const cell = AL('VERTICAL', { name: 'Cell', p: [0, j === 3 ? 0 : 24, 0, j === 0 ? 0 : 24] }); if (j < 3) ruled(cell, 'Right', 'rule/paper'); add(row, cell); cell.layoutGrow = 1; placeFill(cell, it); }
    else add(row, it);
  });
  if (!D) add(f, await T('ARRASTE →', 'Mono/Label', 'text/paper-muted'));
  return f;
}
async function bTeamIndex(D, hoverTeam = 'Ferrari') {
  const f = AL('VERTICAL', { name: 'Pattern / Team Index', w: D ? 1440 : 390, p: D ? [64, 48, 96, 48] : [40, 16, 48, 16], gap: 0, fill: 'surface/paper' });
  const d = divider(D, '03', 'Equipes', D ? '05 EQUIPES · 45 PRODUTOS' : '05'); placeFill(f, d);
  for (const [team] of TEAMS) placeFill(f, I('Team Row', { Size: D ? 'Desktop' : 'Mobile', Team: team, State: D && team === hoverTeam ? 'Hover' : 'Default' }));
  return f;
}
async function bCatalog(D) {
  const f = AL('VERTICAL', { name: 'Pattern / Catálogo da equipe', w: D ? 1440 : 390, gap: 0, fill: 'surface/paper' });
  const tb = block(f, 'HORIZONTAL', { name: 'Toolbar (sticky)', justify: 'SPACE_BETWEEN', align: 'CENTER', p: D ? [16, 48, 16, 48] : [12, 16, 12, 16], gap: 12 }); ruled(tb, ['Top', 'Bottom'], 'rule/ink');
  if (D) {
    const l = AL('HORIZONTAL', { name: 'Left', gap: 24, align: 'CENTER' }); add(tb, l); add(l, await T('09 PRODUTOS', 'Mono/Data', 'text/ink'), I('Technical Label', { Tone: 'Signal', Index: '×', Text: 'TAMANHO: M' }), I('Technical Label', { Tone: 'Signal', Index: '×', Text: 'CAMISAS E POLOS' }));
    add(tb, await T('ORDENAR: MAIS VENDIDOS ↓', 'Mono/Label', 'text/ink'));
    const body = block(f, 'HORIZONTAL', { name: 'Body', gap: 24, p: [32, 48, 96, 48], align: 'MIN' });
    const side = AL('VERTICAL', { name: 'Filters (3 col)', gap: 0, w: 300 }); add(body, side);
    for (const k of ['Tamanho', 'Produto', 'Piloto']) placeFill(side, I('Filter Group', { Kind: k, State: 'Expanded' }));
    add(side, btn('Text', 'M', 'Limpar filtros'));
    const grid = AL('VERTICAL', { name: 'Grid (9 col)', gap: 48 }); add(body, grid); grid.layoutGrow = 1;
    const r1 = block(grid, 'HORIZONTAL', { name: 'Row 1 — destaque', gap: 24, align: 'MIN' });
    const feat = AL('VERTICAL', { name: 'Feature', gap: 12 }); add(r1, feat); feat.layoutGrow = 2;
    add(feat, imgComp('bf', 672, 600, 'FIG. 03 / 09', 'Destaque da coleção'));
    const fn = await T(PROD.bf[0], 'Headline/H2'); placeFill(feat, fn);
    const fp = AL('HORIZONTAL', { name: 'Price', gap: 12, align: 'CENTER' }); add(feat, fp); add(fp, await T(PROD.bf[1], 'Mono/Price-M'), await T('−5% NO PIX', 'Mono/Label', 'status/success'));
    const one = pItem('pf', 'Desktop', { index: '01/09' }); add(r1, one); one.layoutGrow = 1;
    const rows = [['pf2', 'bfe', 'pf3'], ['bf2', 'cf', 'cf2']];
    for (const rk of rows) { const r = block(grid, 'HORIZONTAL', { name: 'Row', gap: 24, align: 'MIN', p: [24, 0, 0, 0] }); ruled(r, 'Top', 'rule/ink-soft'); for (const k of rk) { const it = pItem(k, 'Desktop', { index: String(FERRARI.indexOf(k) + 1).padStart(2, '0') + '/09' }); add(r, it); it.layoutGrow = 1; } }
    const r4 = block(grid, 'HORIZONTAL', { name: 'Row — fim', gap: 24, align: 'MIN', p: [24, 0, 0, 0] }); ruled(r4, 'Top', 'rule/ink-soft');
    const last = pItem('cf3', 'Desktop', { index: '09/09' }); add(r4, last); last.layoutGrow = 1;
    const end = AL('VERTICAL', { name: 'Fim da coleção', gap: 16, p: 32, fill: 'surface/ink' }); add(r4, end); end.layoutGrow = 2; end.layoutSizingVertical = 'FILL';
    add(end, await T('09/09', 'Display/XL', 'text/paper'), await T('Fim da coleção Ferrari.', 'Editorial/Lead', 'text/paper'), btn('Signal', 'M', 'Ver outras equipes'));
  } else {
    const fb = btn('Outline', 'M', 'Filtrar (2)'), sb = btn('Outline', 'M', 'Ordenar'); add(tb, fb, sb); fb.layoutGrow = 1; sb.layoutGrow = 1;
    const grid = block(f, 'HORIZONTAL', { name: 'Grid 2 col', gap: 16, p: [24, 16, 24, 16], wrap: 32 });
    ['pf', 'pf2', 'bf', 'bfe', 'pf3', 'bf2'].forEach((k, j) => add(grid, pItem(k, 'Mobile', { index: String(j + 1).padStart(2, '0') + '/09' })));
    const more = block(f, 'VERTICAL', { name: 'Ver mais', p: [0, 16, 48, 16] }); placeFill(more, btn('Outline', 'L', 'Ver mais (3)'));
  }
  return f;
}
async function bPurchase(D) {
  const f = AL(D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Pattern / Ficha de compra', w: D ? 1440 : 390, p: D ? [24, 48, 96, 48] : [16, 16, 120, 16], gap: D ? 24 : 24, align: 'MIN', fill: 'surface/paper' });
  add(f, imgComp('pm', D ? 786 : 358, D ? 940 : 430, 'FIG. 01', 'Camisa Polo Mercedes AMG 2025 Preta — frente'));
  const s = AL('VERTICAL', { name: 'Sheet (5 col)', gap: 28 }); add(f, s); if (D) { s.resize(534, 10); s.counterAxisSizingMode = 'FIXED'; } else FW(s);
  add(s, I('Technical Label', { Tone: 'Ink', Index: '[ MERCEDES ]', Text: 'CAMISA POLO' }));
  placeFill(s, await T('Camisa Polo Mercedes AMG 2025 Preta', D ? 'Headline/H1' : 'Headline/H2'));
  add(s, I('Price Block'));
  const sh = block(s, 'HORIZONTAL', { name: 'Size head', justify: 'SPACE_BETWEEN', align: 'CENTER', p: [16, 0, 0, 0] }); ruled(sh, 'Top', 'rule/ink');
  add(sh, I('Technical Label', { Tone: 'Ink', Index: '[01]', Text: 'TAMANHO' }), btn('Text', 'M', 'Tabela de medidas'));
  const sz = AL('HORIZONTAL', { name: 'Sizes', gap: 8 }); add(s, sz); for (const [z, st] of [['P', 'Default'], ['M', 'Selected'], ['G', 'Default'], ['GG', 'Unavailable']]) add(sz, I('Size Selector', { State: st, Size: z }));
  if (D) placeFill(s, btn('Signal', 'L', 'Adicionar ao carrinho'));
  placeFill(s, I('Status Message', { Type: 'Info', Message: 'Pagando com PIX você ganha 5% de desconto.' }));
  const ds = AL('VERTICAL', { name: 'Descrição', gap: 12, p: [16, 0, 0, 0] }); placeFill(s, ds); ruled(ds, 'Top', 'rule/ink');
  add(ds, I('Technical Label', { Tone: 'Ink', Index: '[02]', Text: 'DESCRIÇÃO' }));
  placeFill(ds, await T('Elegância das pistas para seu estilo pessoal.', 'Editorial/Lead'));
  placeFill(ds, await T('Com malha Piquet PA, une o frescor do algodão à durabilidade do poliéster. A peça estruturada perfeita para transitar do trabalho ao autódromo em Interlagos com sofisticação.', 'Body/M', 'text/ink-muted'));
  const sp = AL('VERTICAL', { name: 'Ficha técnica', gap: 0, p: [16, 0, 0, 0] }); placeFill(s, sp); ruled(sp, 'Top', 'rule/ink');
  add(sp, I('Technical Label', { Tone: 'Ink', Index: '[03]', Text: 'FICHA TÉCNICA' }));
  placeFill(sp, I('Composition Bar'));
  for (const [k, v] of [['COMPOSIÇÃO', 'Malha Piquet PA (50% algodão / 50% poliéster).'], ['DETALHES', 'Gola e punhos com retilínea estruturada (não deforma).'], ['CONSTRUÇÃO', 'Costura reforçada de ombro a ombro.'], ['DURABILIDADE', 'Alta resistência a esgarçamento e encolhimento.'], ['ESTAMPA', 'Aplicação discreta e durável em DTF.']]) placeFill(sp, I('Spec Row', { Key: k, Value: v }));
  if (!D) {
    const bar = AL('HORIZONTAL', { name: 'Sticky buy bar', w: 390, gap: 16, align: 'CENTER', p: [12, 16, 12, 16], fill: 'surface/paper' }); ruled(bar, 'Top', 'rule/ink');
    const pc = AL('VERTICAL', { name: 'Price', gap: 2 }); add(pc, await T('R$ 159,90', 'Mono/Price-M'), await T('−5% NO PIX', 'Mono/Label', 'status/success')); add(bar, pc);
    const b = btn('Signal', 'M', 'Adicionar'); add(bar, b); b.layoutGrow = 1;
    add(f, bar); bar.layoutPositioning = 'ABSOLUTE'; bar.x = 0; bar.y = 844 - 72 - 60;
  }
  return f;
}
async function bSimilar(D) {
  const f = AL('VERTICAL', { name: 'Pattern / Produtos similares', w: D ? 1440 : 390, p: D ? [0, 48, 96, 48] : [0, 16, 48, 16], gap: 24, fill: 'surface/paper' });
  placeFill(f, divider(D, '04', 'Produtos similares', D ? '04 PEÇAS' : '04'));
  if (D) { const row = block(f, 'HORIZONTAL', { name: 'Strip', gap: 0 }); SIMILAR.forEach((k, j) => { const cell = AL('VERTICAL', { name: 'Cell', p: [0, j === 3 ? 0 : 24, 0, j === 0 ? 0 : 24] }); if (j < 3) ruled(cell, 'Right', 'rule/ink-soft'); add(row, cell); cell.layoutGrow = 1; placeFill(cell, pItem(k, 'Desktop', { index: `0${j + 1}/04` })); }); }
  else SIMILAR.forEach((k, j) => placeFill(f, rItem(k, String(j + 1).padStart(2, '0'), 'Mobile')));
  return f;
}
async function bAuth(D, mode) {
  const signup = mode === 'signup';
  const f = AL(D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Pattern / Autenticação — ' + (signup ? 'Cadastro' : 'Login'), w: D ? 1440 : 390, h: D ? (signup ? 1120 : 960) : undefined, fill: 'surface/paper' });
  const L = AL('VERTICAL', { name: 'Manifesto (tinta)', fill: 'surface/ink', p: D ? [40, 48, 48, 48] : [20, 16, 32, 16], gap: D ? 0 : 20, justify: 'SPACE_BETWEEN' }); add(f, L);
  if (D) { L.layoutGrow = 1; L.layoutSizingVertical = 'FILL'; } else FW(L);
  const top = AL('HORIZONTAL', { name: 'Top', justify: 'SPACE_BETWEEN', align: 'CENTER' }); add(L, top); FW(top);
  add(top, I('Wordmark', { Tone: 'Paper' }), await T('← VOLTAR PARA A LOJA', 'Mono/Label', 'text/paper-muted'));
  const mid = AL('VERTICAL', { name: 'Copy', gap: D ? 20 : 12 }); add(L, mid); FW(mid);
  if (D) add(mid, I('Oversized Number', { Size: 'L', Tone: 'Signal', Value: signup ? 'GRID' : 'P1' }));
  add(mid, I('Technical Label', { Tone: 'Paper', Index: '[ F1HUB ]', Text: signup ? 'CRIAR CONTA' : 'ENTRAR' }));
  placeFill(mid, await T(signup ? 'Sua vaga no grid começa aqui.' : 'Sua paixão pela velocidade, em um só lugar.', D ? 'Display/L' : 'Display/M', 'text/paper'));
  placeFill(mid, await T(signup ? 'Crie sua conta para acompanhar lançamentos e guardar os produtos das equipes que você ama.' : 'Entre para acompanhar lançamentos e deixar seus produtos favoritos na pole position.', D ? 'Editorial/Quote' : 'Body/M', 'text/paper-muted'));
  if (D) add(L, await T('05 EQUIPES  ·  45 PRODUTOS  ·  5% NO PIX', 'Mono/Label', 'text/paper-muted'));
  const R = AL('VERTICAL', { name: 'Formulário (papel)', p: D ? [40, 48, 48, 48] : [32, 16, 48, 16], align: D ? 'CENTER' : 'MIN', justify: D ? 'CENTER' : 'MIN' }); add(f, R);
  if (D) { R.layoutGrow = 1; R.layoutSizingVertical = 'FILL'; } else FW(R);
  const form = AL('VERTICAL', { name: 'Form', gap: 28 }); add(R, form); if (D) { form.resize(420, 10); form.counterAxisSizingMode = 'FIXED'; } else FW(form);
  const hd = AL('VERTICAL', { name: 'Heading', gap: 8 }); placeFill(form, hd);
  placeFill(hd, await T(signup ? 'Crie sua conta' : 'Bem-vindo de volta', 'Headline/H1'));
  placeFill(hd, await T(signup ? 'Preencha seus dados para começar.' : 'Entre na sua conta para continuar.', 'Body/M', 'text/ink-muted'));
  const field = (type, st, idx, label, value, msg) => { const i = I('Input', { Type: type, State: st, Index: idx, 'Show message': !!msg }); setText(i, 'Label', label); if (value) setText(i, 'Value', value); if (msg) setText(i, 'Message', msg); placeFill(form, i); return i; };
  if (!signup) {
    field('Text', 'Default', '[01]', 'E-MAIL', null, null);
    field('Password', 'Default', '[02]', 'SENHA', null, 'ESQUECI MINHA SENHA →');
    add(form, I('Checkbox', { State: 'Off', Label: 'Lembrar de mim' }));
    placeFill(form, btn('Signal', 'L', 'Entrar'));
  } else {
    field('Text', 'Error', '[01]', 'NOME COMPLETO', 'Felipe', '↳ INFORME NOME E SOBRENOME.');
    field('Text', 'Filled', '[02]', 'E-MAIL', 'felipe@exemplo.com', null);
    field('Password', 'Filled', '[03]', 'SENHA', null, 'USE 8 OU MAIS CARACTERES, COM LETRAS E NÚMEROS.');
    field('Password', 'Error', '[04]', 'CONFIRMAR SENHA', null, '↳ AS SENHAS NÃO COINCIDEM.');
    add(form, I('Checkbox', { State: 'Error', Label: 'Li e aceito os Termos de uso e a Política de privacidade.' }));
    placeFill(form, btn('Signal', 'L', 'Criar conta'));
    placeFill(form, I('Status Message', { Type: 'Error', Message: 'Revise os campos destacados para continuar.' }));
  }
  const or = AL('HORIZONTAL', { name: 'Ou', gap: 16, align: 'CENTER' }); placeFill(form, or);
  const r1 = rect(10, 1, 'rule/ink-soft', 'Line'), r2 = rect(10, 1, 'rule/ink-soft', 'Line'); add(or, r1, await T('OU', 'Mono/Label', 'text/ink-muted'), r2); r1.layoutGrow = 1; r2.layoutGrow = 1;
  placeFill(form, btn('Outline', 'L', 'Continuar com Google'));
  const ft = AL('HORIZONTAL', { name: 'Switch', gap: 8, align: 'CENTER' }); add(form, ft);
  add(ft, await T(signup ? 'Já possui conta?' : 'Ainda não possui conta?', 'Body/M', 'text/ink-muted'), btn('Text', 'M', signup ? 'Entrar' : 'Criar conta'));
  return f;
}
async function bEmpty() {
  const f = AL('VERTICAL', { name: 'Pattern / Busca sem resultados', w: 1440, p: [48, 48, 96, 48], gap: 40, fill: 'surface/paper' });
  const s = I('Input', { Type: 'Text', State: 'Focus', Index: '[ ]', 'Show message': false }); setText(s, 'Label', 'BUSCA'); setText(s, 'Value', 'jaqueta azul turquesa'); placeFill(f, s);
  const r = block(f, 'HORIZONTAL', { name: 'Result', gap: 48, align: 'MIN' });
  add(r, I('Oversized Number', { Size: 'XL', Tone: 'Signal', Value: '0' }));
  const c = AL('VERTICAL', { name: 'Copy', gap: 16 }); add(r, c); c.layoutGrow = 1;
  placeFill(c, await T('Nenhum produto encontrado para "jaqueta azul turquesa".', 'Headline/H1'));
  placeFill(c, await T('Tente outro termo ou navegue por equipe:', 'Body/L', 'text/ink-muted'));
  const tl = AL('HORIZONTAL', { name: 'Teams', gap: 24 }); add(c, tl); for (const [t] of TEAMS) add(tl, btn('Text', 'M', t));
  return f;
}

// ================================================================== 06 — LAYOUT PATTERNS
async function stepPatterns() {
  if (sectionExists(PB, '06')) return 'pulado (já existe)';
  await figma.setCurrentPageAsync(PB);
  const B = board('Board / 06 Layout Patterns'); PB.appendChild(B);
  await masthead(B, '06', 'LAYOUT PATTERNS', 'PADRÕES', 'Composições reutilizáveis montadas só com instâncias. Cada padrão resolve um tipo de informação com uma estrutura diferente.');
  const P = [
    ['01', 'Editorial Hero', 'Grid 7 + 5. Título monumental à esquerda, imagem real com legenda FIG. à direita. A cor aparece só no ponto final e no CTA.', () => bHero(true)],
    ['02', 'Racing Data Strip', 'Quatro dados verdadeiros da loja em escala de cartaz, separados por réguas — substitui a faixa de benefícios genérica.', () => bData(true)],
    ['03', 'Ranking — Mais vendidos', 'Grid 5 + 7. O P1 ganha foto grande e número sobreposto; P2–P5 viram lista ranqueada com numeração oversized.', () => bRanking(true)],
    ['04', 'Faixa invertida — Promoções', 'Seção em tinta com "contact sheet": itens separados por réguas verticais, sem cards.', () => bPromoInk(true)],
    ['05', 'Team Index', 'Equipes como sumário de revista: índice, marcador de cor, nome em Anton e dados. O hover revela o escudo.', () => bTeamIndex(true)],
    ['06', 'Catálogo com destaque + filtros', 'Grid 3 + 9. Filtros reais (Tamanho, Produto, Piloto) e grade com ritmo variado: destaque 2 colunas, linhas de 3 e um bloco de fim de coleção.', () => bCatalog(true)],
    ['07', 'Ficha de compra', 'Grid 7 + 5. Galeria com marcas de corte e uma ficha técnica: preço em mono, tamanhos, CTA único em sinal, composição e especificações.', () => bPurchase(true)],
    ['08', 'Autenticação dividida', 'Grid 6 + 6. Manifesto em tinta com a copy real do código e formulário de linha em papel.', () => bAuth(true, 'login')],
    ['09', 'Busca sem resultados', 'Recomendado para quando a busca do header for implementada: o "0" monumental explica o estado e oferece saídas por equipe.', () => bEmpty()]
  ];
  for (const [idx, name, why, fn] of P) {
    const g = AL('VERTICAL', { name: 'Pattern ' + idx, gap: 24, p: [48, 0, 48, 0] }); add(B, g); FW(g); ruled(g, 'Top', 'rule/ink');
    const h = AL('HORIZONTAL', { name: 'Head', gap: 48, align: 'MAX' }); add(g, h); FW(h);
    add(h, await T(idx, 'Display/L', 'accent/signal', { w: 120 }), await T(name, 'Headline/H2', 'text/ink', { w: 520 }));
    const w = await T(why, 'Body/M', 'text/ink-muted'); add(h, w); w.layoutGrow = 1; w.textAutoResize = 'HEIGHT';
    const frame = await fn(); add(g, frame); frame.strokes = [paint('rule/ink-soft')]; frame.strokeWeight = 1;
  }
  makeSection(PB, '06 — Layout Patterns', 2240, 0, B);
  return 'ok';
}

// ================================================================== 07/08 — SCREENS
async function screenColumn(row, title, source, fr) {
  const col = AL('VERTICAL', { name: title, gap: 16 }); add(row, col);
  const h = AL('VERTICAL', { name: 'Label', gap: 4 }); add(col, h);
  add(h, await T(title, 'Headline/H2'), await T(source, 'Mono/Label', 'text/ink-muted'));
  add(col, fr); return col;
}
async function homeScreen(D, w) {
  const s = await screen(`Home — ${D ? 'Desktop 1440' : w === 768 ? 'Tablet 768' : 'Mobile 390'}`, w);
  const tk = I('Ticker', { Tone: 'Ink' }); placeFill(s, tk);
  const hd = header(D, 'Paper'); placeFill(s, hd);
  for (const fn of [bHero, bData, bPromoBanner, bRanking, bPromoInk, bTeamIndex]) { const b = await fn(D); placeFill(s, b); }
  placeFill(s, I('Footer', { Viewport: D ? 'Desktop' : 'Mobile' }));
  return s;
}
async function equipesScreen(D) {
  const s = await screen(`Equipes — ${D ? 'Desktop 1440' : 'Mobile 390'}`, D ? 1440 : 390);
  placeFill(s, header(D, 'Paper', '01'));
  const t = block(s, D ? 'HORIZONTAL' : 'VERTICAL', { name: 'Title', gap: 24, p: D ? [40, 48, 48, 48] : [24, 16, 32, 16], align: D ? 'MAX' : 'MIN' }); ruled(t, 'Bottom', 'rule/ink');
  const l = AL('VERTICAL', { name: 'Left', gap: 12 }); add(t, l); if (D) l.layoutGrow = 1; else FW(l);
  const bc = I('Breadcrumb'); setText(bc, 'Current', 'EQUIPES'); const lv = bc.findOne(n => n.name === 'Level 2'); const sp2 = bc.findOne(n => n.name === 'Sep 2'); if (lv) lv.visible = false; if (sp2) sp2.visible = false; add(l, bc);
  add(l, await T('EQUIPES', D ? 'Display/Monument' : 'Display/L'));
  const r = AL('VERTICAL', { name: 'Right', gap: 16 }); add(t, r); if (D) { r.resize(534, 10); r.counterAxisSizingMode = 'FIXED'; } else FW(r);
  placeFill(r, await T('Escolha sua equipe.', 'Editorial/Lead'));
  placeFill(r, await T('Cinco equipes, 45 produtos: camisas, polos, bonés, jaquetas e moletons — nove peças por equipe.', 'Body/M', 'text/ink-muted'));
  const idx = AL('VERTICAL', { name: 'Index', p: D ? [0, 48, 64, 48] : [0, 16, 40, 16] }); placeFill(s, idx);
  for (const [team] of TEAMS) placeFill(idx, I('Team Row', { Size: D ? 'Desktop' : 'Mobile', Team: team, State: D && team === 'McLaren' ? 'Hover' : 'Default' }));
  if (D) {
    const c = block(s, 'HORIZONTAL', { name: 'Comparativo', gap: 24, p: [64, 48, 96, 48], align: 'MIN' }); ruled(c, 'Top', 'rule/ink');
    const tx = AL('VERTICAL', { name: 'Texto', gap: 16 }); add(c, tx); tx.layoutGrow = 1;
    add(tx, I('Technical Label', { Tone: 'Ink', Index: '[02]', Text: 'COMPARE' }));
    placeFill(tx, await T('Faixa de preço por equipe', 'Headline/H1'));
    placeFill(tx, await T('Do boné à jaqueta: a Ferrari tem a maior amplitude (R$ 109,90 a R$ 369,90). Red Bull, McLaren e Williams ficam entre R$ 109,90 e R$ 209,90.', 'Body/L', 'text/ink-muted'));
    add(c, I('Telemetry Chart — Faixa de preço por equipe'));
  }
  placeFill(s, I('Footer', { Viewport: D ? 'Desktop' : 'Mobile' }));
  return s;
}
async function teamScreen(D) {
  const s = await screen(`Equipe · Ferrari — ${D ? 'Desktop 1440' : 'Mobile 390'}`, D ? 1440 : 390);
  placeFill(s, header(D, 'Paper', '01'));
  if (D) placeFill(s, I('Team Hero', { Team: 'Ferrari' }));
  else {
    const h = block(s, 'VERTICAL', { name: 'Team hero (mobile)', gap: 12, p: [24, 16, 24, 16] });
    add(h, I('Breadcrumb'), await T('[ EQUIPE 01 / 05 ]', 'Mono/Label', 'accent/signal'), await T('FERRARI', 'Display/L'));
    placeFill(h, rect(358, 6, 'team/ferrari', 'Team color bar'));
    const d = AL('HORIZONTAL', { name: 'Data', gap: 16 }); add(h, d); add(d, dataBlock('Paper', 'M', '[ PRODUTOS ]', '09', 'peças'), dataBlock('Paper', 'M', '[ A PARTIR DE ]', '109', 'R$'));
    const lb = figma.createFrame(); lb.name = 'Team identity'; lb.resize(358, 180); fill(lb, 'team/ferrari'); const li = imgRect(H.logo_ferrari, 120, 120, 'FIT', 'Team logo'); lb.appendChild(li); li.x = 119; li.y = 30; placeFill(h, lb);
  }
  placeFill(s, await bCatalog(D));
  placeFill(s, I('Footer', { Viewport: D ? 'Desktop' : 'Mobile' }));
  return s;
}
async function productScreen(D) {
  const s = await screen(`Produto — ${D ? 'Desktop 1440' : 'Mobile 390'}`, D ? 1440 : 390);
  placeFill(s, header(D, 'Paper'));
  const bc = block(s, 'HORIZONTAL', { name: 'Breadcrumb row', p: D ? [16, 48, 16, 48] : [12, 16, 12, 16] });
  const b = I('Breadcrumb'); setText(b, 'Level 2', 'MERCEDES'); setText(b, 'Current', 'CAMISA POLO'); add(bc, b);
  placeFill(s, await bPurchase(D));
  placeFill(s, await bSimilar(D));
  placeFill(s, I('Footer', { Viewport: D ? 'Desktop' : 'Mobile' }));
  return s;
}
async function authScreen(D, mode) {
  const s = await screen(`${mode === 'signup' ? 'Cadastro' : 'Login'} — ${D ? 'Desktop 1440' : 'Mobile 390'}`, D ? 1440 : 390);
  placeFill(s, await bAuth(D, mode));
  return s;
}
async function stepDesktop() {
  if (sectionExists(PC, '07')) return 'pulado (já existe)';
  await figma.setCurrentPageAsync(PC);
  const row = AL('HORIZONTAL', { name: '07 — Desktop Screens', gap: 160, p: 80, align: 'MIN' }); PC.appendChild(row);
  const list = [
    ['Home', 'frontend/home.html', () => homeScreen(true, 1440)],
    ['Equipes', 'frontend/src/pages/equipes.html', () => equipesScreen(true)],
    ['Equipe — Ferrari', 'frontend/src/pages/ferrari.html (modelo das 5 páginas de equipe)', () => teamScreen(true)],
    ['Produto', 'frontend/src/pages/produto.html', () => productScreen(true)],
    ['Login', 'frontend/src/pages/login.html', () => authScreen(true, 'login')],
    ['Cadastro (validação com erros)', 'frontend/src/pages/cadastro.html + js/cadastro.js', () => authScreen(true, 'signup')]
  ];
  for (const [t, src, fn] of list) await screenColumn(row, t, src, await fn());
  const sec = figma.createSection(); sec.name = '07 — Desktop Screens'; PC.appendChild(sec); sec.x = 0; sec.y = 0; sec.fills = [{ type: 'SOLID', color: hex('#C9C5BC') }];
  sec.appendChild(row); row.x = 0; row.y = 0; sec.resizeWithoutConstraints(row.width, row.height);
  return 'ok';
}
async function stepMobile() {
  if (sectionExists(PC, '08')) return 'pulado (já existe)';
  await figma.setCurrentPageAsync(PC);
  const row = AL('HORIZONTAL', { name: '08 — Mobile Screens', gap: 120, p: 80, align: 'MIN' }); PC.appendChild(row);
  const list = [
    ['Home', 'Mobile 390', () => homeScreen(false, 390)],
    ['Equipes', 'Mobile 390', () => equipesScreen(false)],
    ['Equipe — Ferrari', 'Mobile 390 · filtros em botão + grade 2 col', () => teamScreen(false)],
    ['Produto', 'Mobile 390 · barra de compra fixa', () => productScreen(false)],
    ['Login', 'Mobile 390', () => authScreen(false, 'login')],
    ['Cadastro', 'Mobile 390 · erros de validação', () => authScreen(false, 'signup')]
  ];
  for (const [t, src, fn] of list) await screenColumn(row, t, src, await fn());
  // Tablet 768 — prova de responsividade da Home
  const tab = await screen('Home — Tablet 768', 768);
  const tk = I('Ticker', { Tone: 'Ink' }); placeFill(tab, tk);
  const hd = header(false, 'Paper'); placeFill(tab, hd);
  const hero = await bHero(false); placeFill(tab, hero);
  const data = await bData(true); placeFill(tab, data);
  const rk = await bRanking(false); placeFill(tab, rk);
  const ti = await bTeamIndex(false); placeFill(tab, ti);
  placeFill(tab, I('Footer', { Viewport: 'Mobile' }));
  await screenColumn(row, 'Home — Tablet 768', 'Grid 8 col · hero empilhado · dados em linha · ranking em lista', tab);
  const sec = figma.createSection(); sec.name = '08 — Mobile Screens (+ Tablet)'; PC.appendChild(sec); const top = bottomOf(PC); sec.x = 0; sec.y = top + 400; sec.fills = [{ type: 'SOLID', color: hex('#C9C5BC') }];
  sec.appendChild(row); row.x = 0; row.y = 0; sec.resizeWithoutConstraints(row.width, row.height);
  return 'ok';
}

// ================================================================== 09 — DESIGN DOCUMENTATION
async function stepDocs() {
  if (sectionExists(PA, '09')) return 'pulado (já existe)';
  await figma.setCurrentPageAsync(PA);
  const B = board('Board / 09 Design Documentation'); PA.appendChild(B);
  await masthead(B, '09', 'DESIGN DOCUMENTATION', 'DOCUMENTAÇÃO', 'Mapa do arquivo, inventário, handoff para o código e a revisão de qualidade (Fase 6) feita como diretor de criação.');
  const table = async (title, idx, head, rows, widths) => {
    const g = AL('VERTICAL', { name: title, gap: 0, p: [48, 0, 48, 0] }); add(B, g); FW(g);
    const h = AL('HORIZONTAL', { name: 'Head', gap: 24, align: 'MAX', p: [0, 0, 24, 0] }); add(g, h); FW(h);
    add(h, await T(idx, 'Display/L', 'accent/signal', { w: 120 }), await T(title, 'Headline/H1'));
    const th = AL('HORIZONTAL', { name: 'TH', gap: 24, p: [12, 0, 12, 0] }); add(g, th); FW(th); ruled(th, ['Top', 'Bottom'], 'rule/ink');
    for (const [i, c] of head.entries()) { const t = await T(c, 'Mono/Label', 'text/ink-muted', widths[i] ? { w: widths[i] } : {}); add(th, t); if (!widths[i]) FW(t); }
    for (const r of rows) { const tr = AL('HORIZONTAL', { name: r[0], gap: 24, p: [14, 0, 14, 0] }); add(g, tr); FW(tr); ruled(tr, 'Bottom', 'rule/ink-soft');
      for (const [i, c] of r.entries()) { const t = await T(c, i === 0 ? 'Headline/H4' : 'Body/S', i === 0 ? 'text/ink' : 'text/ink-muted', widths[i] ? { w: widths[i] } : {}); add(tr, t); if (!widths[i]) FW(t); } }
  };
  await table('Mapa do arquivo', '01', ['SEÇÃO', 'PÁGINA DO FIGMA', 'CONTEÚDO'], [
    ['01 Creative Direction', 'A — Direction', 'Conceito Pit Wall Editorial, princípios, moodboard, paleta 60/30/10, as 4 vozes tipográficas.'],
    ['02 Visual References', 'A — Direction', '12 referências com link, padrão observado e o que aproveitar. Inclui a limitação de acesso.'],
    ['03 Wireframe Foundations', 'A — Direction', 'Cor, espaço, raio, régua, sombra (nenhuma), imagem, movimento, ícones, estados.'],
    ['04 Typography & Grid', 'A — Direction', '19 estilos de texto e 3 estilos de grid (12/8/4 colunas) com as 5 composições assimétricas.'],
    ['05 UI Components', 'B — Components', 'Componentes nativos com variantes e propriedades (lista abaixo).'],
    ['06 Layout Patterns', 'B — Components', '9 padrões montados só com instâncias.'],
    ['07 Desktop Screens', 'C — Screens', 'Home, Equipes, Equipe (Ferrari), Produto, Login, Cadastro — 1440 px.'],
    ['08 Mobile Screens', 'C — Screens', 'As mesmas 6 telas em 390 px + Home em tablet 768 px.'],
    ['09 Design Documentation', 'A — Direction', 'Este quadro.']
  ], [360, 260, 0]);
  await table('Inventário de componentes', '02', ['COMPONENTE', 'VARIANTES', 'PROPRIEDADES', 'ONDE É USADO'], [
    ['Wordmark', 'Tone: Ink / Paper', '—', 'Header, footer, login'],
    ['Technical Label', 'Tone: Ink / Paper / Signal', 'Index, Text', 'Abertura de blocos, filtros ativos'],
    ['Section Divider', 'Size × Tone', 'Index, Title, Show link', 'Toda seção da home, produto'],
    ['Oversized Number', 'Size XL/L/M × Tone', 'Value', 'P1, "0" da busca, GRID/P1 no login'],
    ['Racing Data Block', 'Tone × Size', 'Label, Value, Unit', 'Faixa de dados, Team Hero'],
    ['Button', 'Kind × Size × State (24)', 'Label, Show arrow', 'Todas as telas'],
    ['Nav Link / Editorial Header / Ticker / Breadcrumb', 'Tone × State · Viewport × Tone', 'Index, Label', 'Navegação global'],
    ['Size Selector / Input / Checkbox', 'State · Type × State', 'Size · Index, Show message · Label', 'Produto, login, cadastro'],
    ['Filter Group / Driver Filter', 'Kind × State · State', 'Driver, Count', 'Página da equipe'],
    ['Product Item / Ranking Item / Product Feature', 'Size × Tone × State · Size × Position × State', 'Name, Team, Price, Index · Number', 'Catálogo, Mais vendidos, Promoções, Similares'],
    ['Team Row / Team Hero', 'Size × Team × State · Team', '—', 'Home, Equipes, página da equipe'],
    ['Composition Bar / Spec Row / Price Block', '—', 'Key, Value · Price', 'Produto'],
    ['Telemetry Chart', '—', '—', 'Equipes (faixa de preço real)'],
    ['Status Message / Image Composition / Footer', 'Type · Kind · Viewport', 'Message · Fig, Caption', 'Formulários, imagens, rodapé']
  ], [420, 340, 300, 0]);
  await table('Handoff para o código', '03', ['TEMA', 'DECISÃO', 'IMPLEMENTAÇÃO'], [
    ['Tokens', 'Variáveis WF · Color / Primitives / Dimension com sintaxe CSS', 'Ex.: surface/paper → var(--surface-paper); accent/signal → var(--accent-signal).'],
    ['Fontes', 'Anton, Archivo, Instrument Serif, Inter, JetBrains Mono', 'Google Fonts; font-display: swap; números de preço com font-variant-numeric: tabular-nums.'],
    ['Grid', '12 col / 90 px / gutter 24 / margem 48 · 8 col · 4 col', 'CSS Grid com grid-template-columns: repeat(12, 1fr) e column-gap: 24px.'],
    ['Breakpoints', '≥1200 desktop · 768–1199 tablet · <768 mobile', 'Header vira MENU < 1024; filtros viram botão "Filtrar" < 1024.'],
    ['Ticker', 'Animação contínua de 40 s', '@keyframes translateX; pausa em :hover; desliga com prefers-reduced-motion.'],
    ['Sticky', 'Toolbar do catálogo e barra de compra no mobile', 'position: sticky; top: 0 / bottom: 0; fundo papel e régua de 1 px.'],
    ['Estados', 'Hover inverte superfícies; foco = contorno de 2 px em sinal', ':focus-visible { outline: 2px solid var(--accent-signal); outline-offset: 2px }.'],
    ['Imagens', 'Produto sobre surface/media; editorial com placeholder rotulado', 'object-fit: contain para produto; nenhuma foto inventada.']
  ], [260, 520, 0]);
  await table('Revisão de qualidade (Fase 6)', '04', ['PERGUNTA', 'RESPOSTA'], [
    ['1. Identidade reconhecível?', 'Sim: papel + tinta + um sinal vermelho, Anton monumental e rótulos [01] em mono formam uma assinatura que não depende de logo.'],
    ['2. Produto profissional ou template?', 'Sem cards arredondados, sombras ou grades repetidas de 4; cada seção tem estrutura própria (hero 7+5, ranking 5+7, contact sheet, índice de equipes, ficha técnica).'],
    ['3. Personalidade na composição?', 'Assimetria intencional, números sobrepostos à foto e faixa invertida em tinta dão ritmo editorial.'],
    ['4. Tipografia protagonista?', 'Sim. Quatro vozes com papéis fixos; o título monumental é o primeiro elemento de cada tela.'],
    ['5. Grids bem utilizados?', 'Sim. Grid de 12 colunas aplicado como estilo em todas as telas; as composições são combinações de colunas.'],
    ['6. Variedade entre seções?', 'Home tem 7 estruturas diferentes; catálogo quebra o ritmo com destaque de 2 colunas e bloco de fim de coleção.'],
    ['7. Dados interessantes?', 'Só dados reais: 5 equipes, 45 produtos, 5% no PIX, faixa de preço por equipe, composição 50/50 do tecido.'],
    ['8. Experiência funcional?', 'Todas as funções do código continuam: menus, filtros, tamanhos, carrinho, login, cadastro com validação. Nada foi inventado.'],
    ['9. Wireframe hi-fi?', 'Tipografia real, imagens reais, grids, estados e componentes nativos. Placeholders só onde não há asset.'],
    ['10. Pontos a evoluir', 'Validar as referências abrindo cada link; produzir as fotos editoriais (pit lane, detalhes); testar contraste do sinal sobre papel em textos < 14 px.']
  ], [420, 0]);
  await table('Limitações e decisões', '05', ['ITEM', 'EXPLICAÇÃO'], [
    ['Páginas', 'O plano Starter permite 3 páginas por arquivo: as 9 páginas pedidas viraram 9 seções em 3 páginas (A, B, C).'],
    ['Modos de variável', 'O plano Starter permite 1 modo; a v2 tem um único tema (Editorial).'],
    ['Figma MCP', 'O limite de chamadas do plano Starter interrompeu a construção remota após as seções 01–04; o restante foi gerado por este plugin, com o mesmo Plugin API.'],
    ['Referências', 'godly.design e dribbble.com estão bloqueados na rede da sessão; as referências vieram de busca e precisam de validação visual.'],
    ['Fora do escopo', 'Circuit Module, calendário, rankings de pilotos e estatísticas de corrida não existem no F1Hub (uma loja). Os conceitos foram aplicados a dados reais da loja.']
  ], [420, 0]);
  makeSection(PA, '09 — Design Documentation', 0, bottomOf(PA) + 160, B);
  return 'ok';
}

// ================================================================== MAIN
async function runStep(page, fn) {
  const before = new Set(page.children.map(n => n.id));
  try { return await fn(); }
  catch (e) { for (const n of [...page.children]) if (!before.has(n.id)) n.remove(); throw e; }
}
async function main() {
  await init();
  const res = {};
  for (const [name, page, fn] of [['05 Components', () => PB, stepComponents], ['06 Patterns', () => PB, stepPatterns], ['07 Desktop', () => PC, stepDesktop], ['08 Mobile', () => PC, stepMobile], ['09 Docs', () => PA, stepDocs]]) {
    figma.notify('F1Hub v2 — construindo ' + name + '…', { timeout: 2000 });
    res[name] = await runStep(page(), fn);
  }
  return res;
}
main()
  .then(res => figma.closePlugin('F1Hub v2 pronto · ' + Object.entries(res).map(([k, v]) => k + ': ' + v).join(' · ')))
  .catch(e => { console.error(e); figma.closePlugin('F1Hub v2 — erro: ' + (e && e.message ? e.message : String(e))); });
