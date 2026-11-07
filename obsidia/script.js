/* =========================================================
   OBSIDIA · script.js
   Come funziona, in breve:
   1. Passi sopra una nicchia  → la sua luce si accende (classe "lit" sul body).
   2. Clicchi                  → il muro si ingrandisce verso la nicchia, mentre il primo
                                 piano (che è lo STESSO pezzo di muro, più grande) parte
                                 piccolo sopra la nicchia e cresce fino a riempire lo schermo.
   3. Arriva la scheda prodotto, con le frecce per passare agli altri anelli.
   ========================================================= */
(() => {

  /* ---------- 1. I PRODOTTI: per cambiare testi e prezzi basta modificare qui ---------- */
  const ANELLI = [
    { nome: 'Al<em>ba</em>', semplice: 'Alba', accento: '#e8e1d4', prezzo: 1850,
      frase: 'Un solo diamante, come la prima luce del giorno. Sei griffe in platino lo tengono sospeso nel buio.',
      specs: [['Pietra', 'Diamante taglio brillante, 1,5 ct'], ['Metallo', 'Platino 950'], ['Montatura', 'Solitario a sei griffe']] },
    { nome: 'Sel<em>va</em>', semplice: 'Selva', accento: '#5fbf8f', prezzo: 2400,
      frase: 'Il verde profondo di un bosco dopo la pioggia, chiuso in un taglio smeraldo.',
      specs: [['Pietra', 'Smeraldo colombiano, 2 ct'], ['Metallo', 'Oro giallo 18 kt'], ['Montatura', 'Quattro griffe, gambo liscio']] },
    { nome: 'Bra<em>ce</em>', semplice: 'Brace', accento: '#e0606f', prezzo: 2900,
      frase: 'Il rosso di una brace che non si spegne. Un rubino ovale abbracciato dall\'oro rosa.',
      specs: [['Pietra', 'Rubino ovale, 2,2 ct'], ['Metallo', 'Oro rosa 18 kt'], ['Montatura', 'Quattro griffe']] },
    { nome: 'Abis<em>so</em>', semplice: 'Abisso', accento: '#7f9cf0', prezzo: 2600,
      frase: 'Il blu dell\'acqua profonda di notte. Uno zaffiro limpido posato sull\'oro bianco.',
      specs: [['Pietra', 'Zaffiro ovale, 2 ct'], ['Metallo', 'Oro bianco 18 kt'], ['Montatura', 'Quattro griffe']] },
    { nome: 'Sole <em>Nero</em>', semplice: 'Sole Nero', accento: '#d9a45e', prezzo: 1600,
      frase: 'Un sigillo d\'oro con il cuore di onice. Il sole, visto dall\'altra parte della notte.',
      specs: [['Pietra', 'Onice nero'], ['Metallo', 'Oro giallo 18 kt'], ['Forma', 'Chevalier, incisione su richiesta']] },
  ];

  /* ---------- 2. LE MISURE, in frazioni dell'immagine (0 = bordo sinistro/alto, 1 = destro/basso) ----------
     nicchia: [x, y, larghezza, altezza] dell'apertura di ogni nicchia sul muro
     ritaglio: [x, y, larghezza, altezza] del pezzo di muro che ogni primo piano rappresenta
     anello: dove si trova l'anello DENTRO il primo piano [x, y]
     riflesso: fin dove arriva la luce verso il basso (il riflesso nell'acqua) */
  const MURO = { src: 'media/wall.jpg', iw: 5016, ih: 2823 };
  const PRIMO_PIANO = { iw: 3840, ih: 2160 };
  const NICCHIE = [
    [0.0347, 0.1892, 0.1669, 0.4453], [0.2285, 0.1892, 0.1645, 0.4453], [0.4205, 0.1892, 0.1639, 0.4453],
    [0.6112, 0.1892, 0.1645, 0.4453], [0.8014, 0.1892, 0.1675, 0.4453],
  ];
  const RITAGLI = [
    [-0.14274, 0.1966, 0.44976, 0.44952], [0.04984, 0.1966, 0.44976, 0.44952], [0.24153, 0.1966, 0.44976, 0.44952],
    [0.43262, 0.1966, 0.44976, 0.44952], [0.55024, 0.1966, 0.44976, 0.44952],
  ];
  const ANELLO_IN_PRIMO_PIANO = [[0.58, 0.579], [0.58, 0.579], [0.58, 0.579], [0.58, 0.579], [0.745, 0.579]];
  const RIFLESSO = 0.97;

  /* ---------- 3. Elementi della pagina ---------- */
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement, body = document.body;
  const wallLayer = $('wall-layer'), wallPlate = $('wall-plate'), wallImg = $('wall');
  const detailLayer = $('detail-layer'), detailPlate = $('detail-plate'), detailImg = $('detail');
  const zones = $('zones'), shade = $('shade'), sheet = $('sheet');
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const euro = (n) => '€' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // 2900 → €2.900
  const srcPrimoPiano = (i) => `media/detail-${i + 1}.avif`;
  const thumb = (i) => `media/thumb-${i + 1}.avif`;
  const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

  let acceso = -1;      // nicchia illuminata
  let aperto = -1;      // anello in primo piano (-1 = siamo sul muro)
  let occupato = false; // true mentre un'animazione è in corso
  const isMobile = () => innerWidth <= 760 || (innerHeight > innerWidth && innerWidth <= 1024);

  /* ---------- 4. DOVE SI METTE IL MURO SULLO SCHERMO ---------- */
  function misuraMuro() {
    const vw = innerWidth, vh = innerHeight, { iw, ih } = MURO;
    let s, x, y, fadeTop = 0, fadeBot = 0;
    if (isMobile()) {
      s = vw / iw;                                 // telefono: il muro intero, in larghezza
      y = Math.max(90, vh * 0.22);
      fadeTop = 8; fadeBot = 10;
    } else {
      s = Math.max(vw / iw, vh / ih);              // computer: copre tutto lo schermo ("cover")
      if (iw * s > vw * 1.06) s = (vw * 1.06) / iw; // ...ma senza tagliare le nicchie laterali
      const h = ih * s;
      if (h < vh) y = 0;   // schermo più "quadrato" del muro: muro in alto, sotto continua l'acqua riflessa (#wall-mirror)
      else y = (vh - h) * 0.35;
    }
    const w = iw * s, h = ih * s;
    x = (vw - w) / 2;
    return { x, y, w, h, fadeTop, fadeBot };
  }

  /* ---------- 5. DOVE SI METTE IL PRIMO PIANO ---------- */
  function misuraPrimoPiano(i) {
    /* l'anello va SEMPRE al centro dello schermo (non dove si trova nel muro).
       Per riuscirci senza lasciare bordi vuoti, la foto si ingrandisce quanto basta. */
    const vw = innerWidth, vh = innerHeight, { iw, ih } = PRIMO_PIANO;
    const [ax, ay] = ANELLO_IN_PRIMO_PIANO[i];
    if (isMobile()) {
      const perCentrareX = (vw / 2) / Math.min(ax, 1 - ax) / iw;
      const s = Math.max((vh * 0.62) / ih, vw / iw, perCentrareX);
      const w = iw * s, h = ih * s;
      return { x: vw / 2 - ax * w, y: vh * 0.32 - ay * h, w, h };   // in alto, sopra la scheda
    }
    // computer: al centro dello spazio libero a destra della scheda (così il testo non copre mai l'anello)
    const scheda = sheet.getBoundingClientRect();
    const libero = scheda.width ? scheda.right : vw * 0.36;
    const cx = (libero + vw) / 2, cy = vh / 2;
    const s = Math.max(vw / iw, vh / ih, cx / ax / iw, (vw - cx) / (1 - ax) / iw, cy / ay / ih, (vh - cy) / (1 - ay) / ih);
    const w = iw * s, h = ih * s;
    return { x: cx - ax * w, y: cy - ay * h, w, h };
  }

  /* ---------- 5b. SCHERMI PICCOLI: LA GRIGLIA DI NICCHIE ----------
     Ogni tessera mostra un pezzo del muro (la sua nicchia con un po' di pietra attorno).
     Si sceglie la disposizione che rende le nicchie più grandi: 5 in fila, 2+3 oppure 2+2+1. */
  const tilesEl = $('tiles');
  const griglia = () => isMobile();
  const PEZZO = (i) => { const [x, , w] = NICCHIE[i]; return [x - 0.012, RITAGLI[i][1], w + 0.024, RITAGLI[i][3]]; };
  let tessere = [];   // dove sta ogni tessera sullo schermo
  function misuraGriglia() {
    const vw = innerWidth, vh = innerHeight, pad = 16, gap = 10, top = 92;
    const intro = document.querySelector('.intro');
    const bottom = Math.max(top + 220, (intro ? intro.offsetTop : vh * 0.7) - 58);
    const H = bottom - top, L = vw - pad * 2;
    const p = PEZZO(0), aspetto = (p[2] * MURO.iw) / (p[3] * MURO.ih);
    let meglio = null;
    for (const righe of [[5], [2, 3], [2, 2, 1]]) {
      const n = Math.max(...righe), r = righe.length;
      const w = Math.min((L - (n - 1) * gap) / n, ((H - (r - 1) * gap) / r) * aspetto);
      if (!meglio || w > meglio.w) meglio = { righe, w };
    }
    const w = meglio.w, h = w / aspetto, r = meglio.righe.length;
    const alt = r * h + (r - 1) * gap;
    let y = top + (H - alt) / 2, k = 0;
    const rects = [];
    for (const n of meglio.righe) {
      let x = (vw - (n * w + (n - 1) * gap)) / 2;
      for (let j = 0; j < n; j++) { rects[k++] = { x, y, w, h }; x += w + gap; }
      y += h + gap;
    }
    return { rects, fondo: y - gap };
  }
  function creaTessere() {
    NICCHIE.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      b.dataset.n = i;
      b.setAttribute('aria-label', `${ANELLI[i].semplice}, N°0${i + 1}, ${euro(ANELLI[i].prezzo)}. Avvicinati`);
      b.innerHTML = `<img src="${MURO.src}" alt="" draggable="false">`;
      b.addEventListener('click', () => entra(i));
      tilesEl.appendChild(b);
    });
  }
  function impaginaGriglia() {
    const G = misuraGriglia();
    tessere = G.rects;
    tilesEl.querySelectorAll('.tile').forEach((b) => {
      const i = +b.dataset.n, r = tessere[i], p = PEZZO(i);
      const bw = r.w / p[2], bh = r.h / p[3];          // misura del muro intero, in pixel
      Object.assign(b.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      Object.assign(b.firstChild.style, { width: bw + 'px', height: bh + 'px', left: -p[0] * bw + 'px', top: -p[1] * bh + 'px' });
    });
    return G;
  }
  /* il primo piano parte ESATTAMENTE sopra la tessera (stessi pixel), ritagliato su di lei */
  function daTessera(i) {
    const D = misuraPrimoPiano(i), T = tessere[i], c = RITAGLI[i], p = PEZZO(i);
    const fx = (p[0] - c[0]) / c[2], fy = (p[1] - c[1]) / c[3], fw = p[2] / c[2], fh = p[3] / c[3];
    const s = T.w / (fw * D.w);
    return {
      transform: `translate(${T.x - D.x - s * fx * D.w}px, ${T.y - D.y - s * fy * D.h}px) scale(${s})`,
      clipPath: `inset(${fy * 100}% ${(1 - fx - fw) * 100}% ${(1 - fy - fh) * 100}% ${fx * 100}%)`,
    };
  }

  const posiziona = (el, r) => Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });

  /* ---------- 6. LE 5 ZONE CLICCABILI ---------- */
  function creaZone() {
    NICCHIE.forEach((r, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'zone';
      b.dataset.n = i;
      b.setAttribute('aria-label', `${ANELLI[i].semplice}, N°0${i + 1}. Avvicinati`);
      Object.assign(b.style, { left: r[0] * 100 + '%', top: r[1] * 100 + '%', width: r[2] * 100 + '%', height: r[3] * 100 + '%' });
      b.innerHTML = `<span class="tag"><b>${ANELLI[i].semplice}</b><i>N°0${i + 1} · ${euro(ANELLI[i].prezzo)}</i></span>`;
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') accendi(i); });
      b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') spegni(); }); // fuori dall'anello: tutti di nuovo illuminati
      b.addEventListener('focus', () => accendi(i));
      b.addEventListener('click', () => entra(i));
      zones.appendChild(b);
    });
  }

  /* ---------- 7. LA LUCE: sposta l'ellisse sulla nicchia i ---------- */
  function puntaLuce(i) {
    const [x, y, w] = NICCHIE[i];
    const s = wallPlate.style;
    s.setProperty('--cx', (x + w / 2) * 100 + '%');
    s.setProperty('--cy', ((y + RIFLESSO) / 2) * 100 + '%');
    s.setProperty('--rx', w * 100 * 0.78 + '%');
    s.setProperty('--ry', (RIFLESSO - y) * 100 * 0.62 + '%');
  }
  const coloreAccento = (i) => root.style.setProperty('--accent', ANELLI[i].accento);

  function accendi(i) {
    if (occupato || aperto >= 0) return;
    acceso = i;
    puntaLuce(i);
    coloreAccento(i);
    body.classList.add('lit');
    zones.querySelectorAll('.zone').forEach((z) => z.classList.toggle('on', +z.dataset.n === i));
    $('hint-text').textContent = `${ANELLI[i].semplice} · clicca per avvicinarti`;
  }
  function spegni() {
    if (occupato || aperto >= 0) return;
    acceso = -1;
    body.classList.remove('lit');
    zones.querySelectorAll('.zone').forEach((z) => z.classList.remove('on'));
    $('hint-text').textContent = 'Scegli un anello';
  }

  /* precarica i primi piani così lo zoom parte subito */
  const caricati = new Map();
  function precarica(i) {
    const src = srcPrimoPiano(i);
    if (!caricati.has(src)) { const im = new Image(); im.src = src; caricati.set(src, im.decode().catch(() => {})); }
    return caricati.get(src);
  }

  /* ---------- 8. LA SCHEDA PRODOTTO ---------- */
  function riempiScheda(i) {
    const a = ANELLI[i];
    $('s-num').textContent = `N°0${i + 1} · Collezione Nuit`;
    $('s-name').innerHTML = a.nome;
    $('s-line').textContent = a.frase;
    $('s-specs').innerHTML = a.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('s-price').textContent = euro(a.prezzo);
    $('s-pos').textContent = `0${i + 1} / 05`;
    $('s-add').dataset.add = i;
    detailImg.alt = `L'anello ${a.semplice} da vicino, nella sua nicchia di ossidiana`;
  }

  /* ---------- 9. IL CUORE: i due movimenti della "telecamera" ----------
     k = quanto va ingrandito il muro perché il ritaglio riempia il primo piano.
     Il muro cresce di k; il primo piano parte rimpicciolito di 1/k esattamente sopra il ritaglio. */
  function movimenti(i) {
    const W = misuraMuro(), D = misuraPrimoPiano(i), c = RITAGLI[i];
    const k = D.w / (c[2] * W.w);
    const cx = W.x + c[0] * W.w, cy = W.y + c[1] * W.h;      // angolo del ritaglio sullo schermo
    const tx = D.x - W.x - k * (cx - W.x);
    const ty = D.y - W.y - k * (cy - W.y);
    return {
      k,
      // le stesse due posizioni del muro, ma per il muro "grande" (vedi muroGrande)
      muroGrandeInizio: `scale(${1 / k})`,
      muroGrandeFine: `translate(${tx}px, ${ty}px)`,
      primoPianoInizio: `translate(${cx - D.x}px, ${cy - D.y}px) scale(${1 / k})`,
    };
  }

  /* NITIDEZZA DEL MURO
     Il browser disegna il muro una volta, alla sua misura, e poi durante lo zoom lo stira:
     ingrandito k volte diventava sgranato. Così, prima dello zoom, il muro viene impaginato
     già k volte più grande e rimpicciolito di 1/k (a schermo non cambia nulla): durante lo zoom
     si ingrandisce solo fino alla sua misura vera, quindi resta sempre nitido. */
  function muroGrande(k) {
    const W = misuraMuro();
    posiziona(wallPlate, { x: W.x, y: W.y, w: W.w * k, h: W.h * k });
    wallPlate.style.setProperty('--k', k);          // le etichette crescono insieme al muro
    wallPlate.style.transform = `scale(${1 / k})`;
  }
  function muroNormale() {
    posiziona(wallPlate, misuraMuro());
    wallPlate.style.removeProperty('--k');
    wallPlate.style.transform = '';
  }

  /* ---------- L'ANELLO IN 3D (vedi ring3d.js) ---------- */
  const carica3d = () => (window.caricaAnello3D ? window.caricaAnello3D() : Promise.resolve(null));
  function scatola3d(i) {   // dove sta l'anello nella foto: lì compare quello in 3D
    const D = misuraPrimoPiano(i), [ax, ay] = ANELLO_IN_PRIMO_PIANO[i];
    const cx = D.x + ax * D.w, cy = D.y + ay * D.h;
    const size = D.w * 0.62;   // proporzionale alla foto: il 3D combacia con l'anello fotografato
    return { cx, cy, size };
  }
  async function apri3d(i) {
    const m = await carica3d();
    if (m && aperto === i && !occupato) m.mostra(i, scatola3d(i));
  }
  async function chiudi3d(dritto = true) {   // dritto: se è stato girato, prima torna com'era nella foto
    if (!window.caricaAnello3D) return;
    const m = await carica3d();
    if (m) await m.nascondi(dritto);
  }

  const DURATA = ridotto ? 1 : 1500;
  const CURVA = 'cubic-bezier(.62, 0, .22, 1)';   // parte lenta, accelera, frena dolce
  const DURATA_USCITA = ridotto ? 1 : 900;         // tornando al muro: più svelto
  const CURVA_USCITA = 'cubic-bezier(.4, 0, .2, 1)'; // parte subito e frena morbida, senza strappi
  const fermaTutto = () => [wallPlate, detailPlate, detailLayer, shade].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));

  async function tornaSu() {
    if (scrollY < 2) return;
    scrollTo({ top: 0, behavior: ridotto ? 'auto' : 'smooth' });
    const t0 = performance.now();
    while (scrollY > 2 && performance.now() - t0 < 1400) await attendi(30);
  }

  /* entra nel primo piano */
  async function entra(i, subito = false) {
    if (occupato || aperto === i) return;
    chiudiBorsa();
    await tornaSu();
    const G = griglia();
    if (acceso !== i) { accendi(i); if (!subito && !G) await attendi(380); } // prima si vede la luce
    occupato = true;
    coloreAccento(i);
    riempiScheda(i);
    const D = misuraPrimoPiano(i);
    posiziona(detailPlate, D);
    const m = movimenti(i);
    if (!subito && !ridotto && !G) muroGrande(m.k);   // il browser lo ridisegna grande mentre carica il primo piano
    detailImg.src = srcPrimoPiano(i);
    await Promise.race([precarica(i), attendi(2500)]);
    try { await detailImg.decode(); } catch (e) {}
    aperto = i;
    body.classList.add('in-detail');
    detailLayer.setAttribute('aria-hidden', 'false');
    history.replaceState(null, '', `#0${i + 1}`);

    if (subito || ridotto) {
      wallLayer.style.opacity = 0;
    } else if (G) {
      // griglia: il primo piano cresce dalla tessera fino a riempire lo schermo, le altre tessere sfumano
      const opz = { duration: DURATA, easing: CURVA, fill: 'forwards' };
      const t = daTessera(i);
      detailLayer.style.opacity = 1;
      const zoom = detailPlate.animate([{ transform: t.transform, clipPath: t.clipPath }, { transform: 'none', clipPath: 'inset(0% 0% 0% 0%)' }], opz);
      tilesEl.animate([{ opacity: 1 }, { opacity: 0, offset: .55 }, { opacity: 0 }], { duration: DURATA, easing: 'ease-out', fill: 'forwards' });
      shade.animate([{ opacity: 0 }, { opacity: 0, offset: .45 }, { opacity: 1 }], { duration: DURATA, easing: 'ease-out', fill: 'forwards' });
      await zoom.finished;
      wallLayer.style.opacity = 0;
      tilesEl.getAnimations().forEach((a) => a.cancel());
    } else {
      const opz = { duration: DURATA, easing: CURVA, fill: 'forwards' };
      const zoom = wallPlate.animate([{ transform: m.muroGrandeInizio }, { transform: m.muroGrandeFine }], opz);
      detailPlate.animate([{ transform: m.primoPianoInizio }, { transform: 'none' }], opz);
      // il primo piano compare tra il 10% e il 62% del movimento
      detailLayer.animate([{ opacity: 0 }, { opacity: 0, offset: .1 }, { opacity: 1, offset: .62 }, { opacity: 1 }], { duration: DURATA, easing: 'ease-in-out', fill: 'forwards' });
      // l'ombra per la scheda arriva dopo metà strada
      shade.animate([{ opacity: 0 }, { opacity: 0, offset: .45 }, { opacity: 1 }], { duration: DURATA, easing: 'ease-out', fill: 'forwards' });
      await zoom.finished;
      wallLayer.style.opacity = 0;
    }
    // a zoom finito il primo piano è fermo: si toglie l'animazione e il "will-change",
    // così il browser ridisegna l'immagine a piena risoluzione invece di tenerla sgranata
    detailPlate.getAnimations().forEach((a) => a.cancel());
    detailPlate.style.willChange = 'auto';
    detailLayer.style.opacity = 1;
    shade.style.opacity = 1;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('show'));
    occupato = false;
    apri3d(i);
  }

  /* torna al muro: lo stesso movimento al contrario */
  async function esci() {
    if (occupato || aperto < 0) return;
    occupato = true;
    const i = aperto;
    sheet.classList.remove('show');
    await Promise.all([attendi(ridotto ? 0 : 120), chiudi3d()]);
    wallLayer.style.opacity = 1;
    detailPlate.style.willChange = '';
    if (!ridotto && griglia()) {
      // griglia: lo stesso movimento al contrario, il primo piano rientra nella sua tessera
      fermaTutto();
      const t = daTessera(i), opz = { duration: DURATA_USCITA, easing: CURVA_USCITA, fill: 'forwards' };
      const zoom = detailPlate.animate([{ transform: 'none', clipPath: 'inset(0% 0% 0% 0%)' }, { transform: t.transform, clipPath: t.clipPath }], opz);
      tilesEl.animate([{ opacity: 0 }, { opacity: 0, offset: .4 }, { opacity: 1 }], { duration: DURATA_USCITA, easing: 'ease-in', fill: 'forwards' });
      shade.animate([{ opacity: 1 }, { opacity: 0, offset: .45 }, { opacity: 0 }], { duration: DURATA_USCITA, fill: 'forwards' });
      await zoom.finished;
      tilesEl.getAnimations().forEach((a) => a.cancel());
    } else if (!ridotto) {
      const m = movimenti(i);
      fermaTutto();
      muroGrande(m.k);
      const opz = { duration: DURATA_USCITA, easing: CURVA_USCITA, fill: 'forwards' };
      const zoom = wallPlate.animate([{ transform: m.muroGrandeFine }, { transform: m.muroGrandeInizio }], opz);
      detailPlate.animate([{ transform: 'none' }, { transform: m.primoPianoInizio }], opz);
      detailLayer.animate([{ opacity: 1 }, { opacity: 1, offset: .35 }, { opacity: 0, offset: .88 }, { opacity: 0 }], { duration: DURATA_USCITA, easing: 'ease-in-out', fill: 'forwards' });
      shade.animate([{ opacity: 1 }, { opacity: 0, offset: .45 }, { opacity: 0 }], { duration: DURATA_USCITA, fill: 'forwards' });
      await zoom.finished;
    }
    fermaTutto();
    muroNormale();
    detailLayer.style.opacity = 0;
    shade.style.opacity = 0;
    sheet.hidden = true;
    aperto = -1;
    body.classList.remove('in-detail');
    detailLayer.setAttribute('aria-hidden', 'true');
    history.replaceState(null, '', location.pathname);
    occupato = false;
    if (isMobile() || !zones.matches(':hover')) { await attendi(500); spegni(); }
    else accendi(i);
  }

  /* frecce ‹ ›: dissolvenza veloce tra un primo piano e l'altro */
  async function passa(direzione) {
    if (occupato || aperto < 0) return;
    occupato = true;
    const i = (aperto + direzione + 5) % 5;
    sheet.classList.remove('show');
    const pronto = precarica(i);
    chiudi3d(false);   // con le frecce si passa subito all'anello successivo
    await detailLayer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ridotto ? 1 : 360, easing: 'ease-in', fill: 'forwards' }).finished;
    await Promise.race([pronto, attendi(2500)]);
    detailImg.src = srcPrimoPiano(i);
    posiziona(detailPlate, misuraPrimoPiano(i));
    try { await detailImg.decode(); } catch (e) {}
    coloreAccento(i);
    riempiScheda(i);
    acceso = aperto = i;
    puntaLuce(i);
    zones.querySelectorAll('.zone').forEach((z) => z.classList.toggle('on', +z.dataset.n === i));
    history.replaceState(null, '', `#0${i + 1}`);
    detailLayer.getAnimations().forEach((a) => a.cancel());
    detailLayer.style.opacity = 1;
    detailLayer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ridotto ? 1 : 560, easing: 'ease-out' });
    requestAnimationFrame(() => sheet.classList.add('show'));
    occupato = false;
    apri3d(i);
  }

  /* ---------- 10. IL CARRELLO ---------- */
  const borsa = []; // { n, qta }
  function disegnaBorsa() {
    $('bag-list').innerHTML = borsa.map((b) => {
      const a = ANELLI[b.n];
      return `<li><img src="${thumb(b.n)}" alt=""><div><p class="bl-name">${a.semplice}</p><p class="bl-size">Collezione Nuit</p>
        <p class="bl-qty"><button type="button" data-q="${b.n}" data-d="-1" aria-label="Uno in meno">−</button><span>${b.qta}</span><button type="button" data-q="${b.n}" data-d="1" aria-label="Uno in più">+</button></p></div>
        <span class="bl-price">${euro(a.prezzo * b.qta)}</span></li>`;
    }).join('');
    const tot = borsa.reduce((s, b) => s + b.qta, 0);
    $('bag-count').textContent = tot;
    $('bag-total').textContent = euro(borsa.reduce((s, b) => s + ANELLI[b.n].prezzo * b.qta, 0));
    $('bag-empty').hidden = tot > 0;
    $('bag').classList.toggle('has', tot > 0);
  }
  $('bag-list').addEventListener('click', (e) => {
    const t = e.target.closest('[data-q]');
    if (!t) return;
    const b = borsa.find((x) => x.n === +t.dataset.q);
    b.qta += +t.dataset.d;
    if (b.qta <= 0) borsa.splice(borsa.indexOf(b), 1);
    disegnaBorsa();
  });
  function apriBorsa() { $('bag').classList.add('open'); $('bag').setAttribute('aria-hidden', 'false'); $('scrim').classList.add('on'); }
  function chiudiBorsa() { $('bag').classList.remove('open'); $('bag').setAttribute('aria-hidden', 'true'); $('scrim').classList.remove('on'); }

  let toastTimer;
  function avviso(html) {
    const t = $('toast');
    t.innerHTML = html;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
  }

  /* l'anello vola verso il carrello lungo un arco */
  function vola(daEl, src) {
    const arrivo = $('bag-btn').getBoundingClientRect();
    const partenza = daEl.getBoundingClientRect();
    const im = document.createElement('img');
    im.src = src;
    im.className = 'flyer';
    const w = 64, h = 84;
    const x0 = partenza.left + partenza.width / 2 - w / 2, y0 = partenza.top + partenza.height / 2 - h / 2;
    const x1 = arrivo.left + arrivo.width / 2 - w / 2, y1 = arrivo.top + arrivo.height / 2 - h / 2;
    Object.assign(im.style, { left: x0 + 'px', top: y0 + 'px', width: w + 'px', height: h + 'px' });
    body.appendChild(im);
    const dx = x1 - x0, dy = y1 - y0, alza = Math.min(160, Math.abs(dy) * .5 + 60);
    const frames = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, e = t * t * (3 - 2 * t);
      frames.push({ transform: `translate(${dx * e}px, ${dy * e - Math.sin(Math.PI * t) * alza}px) scale(${1 - .78 * e})`, opacity: t > .9 ? 1 - (t - .9) * 10 : 1 });
    }
    return im.animate(frames, { duration: ridotto ? 1 : 900, easing: 'cubic-bezier(.45, 0, .25, 1)' }).finished.then(() => im.remove());
  }

  async function aggiungi(n, btn) {
    const esiste = borsa.find((b) => b.n === n);
    if (esiste) esiste.qta += 1; else borsa.push({ n, qta: 1 });
    const testo = btn.innerHTML;
    btn.classList.add('added');
    btn.innerHTML = 'Aggiunto <span aria-hidden="true">✓</span>';
    setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = testo; }, 1800);
    await vola(btn, thumb(n));
    disegnaBorsa();
    const c = $('bag-btn');
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    avviso(`<img src="${thumb(n)}" alt=""><span><b>${ANELLI[n].semplice}</b> è nel tuo carrello</span><button type="button" id="toast-view">Vedi</button>`);
    $('toast-view').addEventListener('click', apriBorsa);
  }

  /* ---------- 11. IMPAGINAZIONE (anche quando si ridimensiona la finestra) ---------- */
  function impagina() {
    const W = misuraMuro();
    const G = griglia();
    root.classList.toggle('griglia', G);
    const fondoGriglia = G ? impaginaGriglia().fondo : 0;
    if (!G) $('world').style.transform = '';
    if (aperto < 0 && !occupato) muroNormale();
    wallPlate.style.setProperty('--fade-top', W.fadeTop + '%');
    wallPlate.style.setProperty('--fade-bot', W.fadeBot + '%');
    root.style.setProperty('--wall-bottom', (G ? fondoGriglia - 40 : W.y + W.h) + 'px');
    if (aperto >= 0) {
      posiziona(detailPlate, misuraPrimoPiano(aperto));
      carica3d().then((m) => { if (m && aperto >= 0) m.sposta(scatola3d(aperto)); });
    }
    if (acceso >= 0) puntaLuce(acceso);
  }

  /* ---------- 12. EVENTI ---------- */
  wallPlate.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') spegni(); });
  $('s-back').addEventListener('click', esci);
  $('s-prev').addEventListener('click', () => passa(-1));
  $('s-next').addEventListener('click', () => passa(1));
  $('bag-btn').addEventListener('click', apriBorsa);
  $('bag-close').addEventListener('click', chiudiBorsa);
  $('scrim').addEventListener('click', chiudiBorsa);
  $('bag-checkout').addEventListener('click', () => { $('bag-note').textContent = 'Questo è un negozio concept: l\'acquisto è disattivato.'; });
  $('news').addEventListener('submit', (e) => { e.preventDefault(); $('news-ok').textContent = 'Grazie. La prossima lettera è tua.'; e.target.reset(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) aggiungi(+b.dataset.add, b); });
  document.querySelectorAll('.capsule a, .foot a').forEach((a) => a.addEventListener('click', (e) => {
    if (aperto >= 0) { e.preventDefault(); const h = a.getAttribute('href'); esci().then(() => document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' })); }
  }));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if ($('bag').classList.contains('open')) chiudiBorsa(); else esci(); }
    if (aperto >= 0 && e.key === 'ArrowRight') passa(1);
    if (aperto >= 0 && e.key === 'ArrowLeft') passa(-1);
  });

  /* scorrendo, il titolo sfuma e sale il footer di vetro */
  const allo_scroll = () => {
    const k = Math.max(0, 1 - scrollY / Math.max(1, ($('foot').offsetHeight || 300) * .55));
    root.style.setProperty('--hero-k', k.toFixed(3));
    // telefono: le nicchie salgono insieme alla pagina, così la card in fondo arriva DOPO gli anelli invece di coprirli
    $('world').style.transform = griglia() && aperto < 0 ? `translate3d(0, ${-scrollY}px, 0)` : '';
    $('masthead').classList.toggle('solid', scrollY > innerHeight * .6);
  };
  addEventListener('scroll', allo_scroll, { passive: true });
  let rt;
  addEventListener('resize', () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(impagina); });

  /* ---------- 13. AVVIO ---------- */
  creaZone();
  creaTessere();
  impagina();
  disegnaBorsa();
  allo_scroll();
  wallImg.decode().catch(() => {}).then(() => {
    body.classList.add('ready');
    setTimeout(carica3d, 1200);   // intanto prepara il 3D, così il primo anello si apre subito
    const link = /^#0([1-5])$/.exec(location.hash);        // es. index.html#03 apre direttamente Brace
    if (link) entra(+link[1] - 1, true);
    const vai = () => [0, 1, 2, 3, 4].forEach(precarica);
    'requestIdleCallback' in window ? requestIdleCallback(vai, { timeout: 2500 }) : setTimeout(vai, 1200);
  });
})();
