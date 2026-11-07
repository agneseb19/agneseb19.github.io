/* =========================================================
   OBSIDIA · ring3d.js — l'anello in 3D nella scheda prodotto
   I cinque anelli sono costruiti in codice (niente file 3D da scaricare):
   gambo, pietra sfaccettata, griffe e metallo, ognuno come nella sua foto.
   A riposo si vede la foto originale; appena il cliente trascina, al suo posto compare
   il modello 3D. "Rimetti dritto" lo riporta nella posizione della foto e rimette la foto.
   Si carica solo quando serve: script.js chiama window.caricaAnello3D().
   ========================================================= */
(() => {
  let promessa = null;
  window.caricaAnello3D = () => (promessa ||= avvia().catch((e) => { console.warn('3D non disponibile', e); promessa = null; return null; }));

  async function avvia() {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    const { ConvexGeometry } = await import('three/addons/geometries/ConvexGeometry.js');
    const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- I CINQUE ANELLI (misure in millimetri) ---------- */
    const R = 8.6; // raggio interno: misura 17 circa
    const MODELLI = [
      { metallo: 'platino',   gemma: 'tondo',    colore: 0xffffff, r: 3.9, griffe: 6, w0: 1.8, w1: 2.2, t0: 1.45, t1: 1.7 },        // Alba
      { metallo: 'oroGiallo', gemma: 'smeraldo', colore: 0x077036, W: 7.2, L: 9.4, w0: 1.9, w1: 2.4, t0: 1.5, t1: 1.75 },          // Selva
      { metallo: 'oroRosa',   gemma: 'ovale',    colore: 0x9a0a22, r: 3.7, sz: 1.3, griffe: 4, w0: 1.9, w1: 2.3, t0: 1.5, t1: 1.7 }, // Brace
      { metallo: 'oroBianco', gemma: 'ovale',    colore: 0x1026a8, r: 3.6, sz: 1.28, griffe: 4, w0: 1.9, w1: 2.3, t0: 1.5, t1: 1.7 }, // Abisso
      { metallo: 'oroGiallo', gemma: 'sigillo',  w0: 2.2, w1: 9.2, t0: 1.7, t1: 2.9 },                                              // Sole Nero
    ];
    const METALLI = {
      platino:   { color: 0xf3f2ef, roughness: 0.1 },
      oroBianco: { color: 0xf4f1ea, roughness: 0.1 },
      oroGiallo: { color: 0xf6d27e, roughness: 0.12 },
      oroRosa:   { color: 0xf6b9a0, roughness: 0.12 },
    };
    const materialeMetallo = (k) => new THREE.MeshPhysicalMaterial({ ...METALLI[k], metalness: 1, envMapIntensity: 1.3, clearcoat: 0.25, clearcoatRoughness: 0.1 });

    /* ---------- IL GAMBO: un anello con sezione arrotondata, più largo in alto ---------- */
    function gambo({ w0, w1, t0, t1, p = 3 }) {
      const N = 256, M = 40, pos = [], idx = [];
      const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const f = Math.pow((Math.cos(th) + 1) / 2, p);       // 1 in alto, 0 in basso
        const w = w0 + (w1 - w0) * f, t = t0 + (t1 - t0) * f;
        for (let j = 0; j < M; j++) {
          const ph = (j / M) * Math.PI * 2;
          const rr = R + t / 2 + (t / 2) * sp(Math.cos(ph), 0.55);
          const zz = (w / 2) * sp(Math.sin(ph), 0.55);
          pos.push(rr * Math.sin(th), rr * Math.cos(th), zz);
        }
      }
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
        const a = i * M + j, b = i * M + ((j + 1) % M), c = (i + 1) * M + j, d = (i + 1) * M + ((j + 1) % M);
        idx.push(a, b, c, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }

    /* ---------- LE PIETRE: sfaccettature vere, come involucro di punti ---------- */
    function anelloDiPunti(P, n, rx, rz, y, rot = 0) {
      for (let k = 0; k < n; k++) { const a = rot + (k / n) * Math.PI * 2; P.push(V(rx * Math.cos(a), y, rz * Math.sin(a))); }
    }
    function tondo(r, sz = 1) {           // taglio brillante (e ovale, se sz > 1)
      const P = [], hc = 0.32 * r, hp = 0.86 * r;
      anelloDiPunti(P, 8, 0.55 * r, 0.55 * r * sz, hc, 0);
      anelloDiPunti(P, 8, 0.8 * r, 0.8 * r * sz, 0.55 * hc, Math.PI / 8);
      anelloDiPunti(P, 32, r, r * sz, 0.03 * r);
      anelloDiPunti(P, 32, r, r * sz, -0.03 * r);
      anelloDiPunti(P, 8, 0.6 * r, 0.6 * r * sz, -0.45 * hp, Math.PI / 8);
      anelloDiPunti(P, 16, 0.85 * r, 0.85 * r * sz, -0.17 * hp, Math.PI / 16);
      P.push(V(0, -hp, 0));
      return { geo: new ConvexGeometry(P), hc, hp };
    }
    function smeraldo(W, L) {             // taglio smeraldo: rettangolo ad angoli smussati, a gradini
      const c = 0.16 * W, hc = 0.24 * W, hp = 0.58 * W, P = [];
      const ott = (sx, sz, y) => {
        const w = (W / 2) * sx, l = (L / 2) * sz, cc = c * Math.min(sx, sz);
        [[w, l - cc], [w - cc, l], [-(w - cc), l], [-w, l - cc], [-w, -(l - cc)], [-(w - cc), -l], [w - cc, -l], [w, -(l - cc)]]
          .forEach(([x, z]) => P.push(V(x, y, z)));
      };
      ott(1, 1, 0.025 * W); ott(1, 1, -0.025 * W);
      ott(0.9, 0.93, 0.5 * hc); ott(0.74, 0.8, hc);
      ott(0.82, 0.86, -0.3 * hp); ott(0.55, 0.65, -0.65 * hp); ott(0.08, 0.42, -hp);
      return { geo: new ConvexGeometry(P), hc, hp, c };
    }

    /* la pietra = un guscio esterno lucido e trasparente + un interno che riflette (dà profondità e "fuoco") */
    function pietra(geo, colore) {
      const g = new THREE.Group();
      const bianco = colore === 0xffffff;
      const interno = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: colore, metalness: 1, roughness: 0.03, side: THREE.BackSide,
        emissive: bianco ? 0x2a2c30 : colore, emissiveIntensity: bianco ? 1 : 0.45, envMapIntensity: bianco ? 4.5 : 1.4,
      }));
      interno.scale.setScalar(0.985);
      const esterno = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
        color: bianco ? 0xf4f8ff : colore,
        metalness: bianco ? 0.2 : 0.3, roughness: 0, transparent: true, opacity: bianco ? 0.18 : 0.72,
        clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 3, specularIntensity: 1,
        iridescence: bianco ? 0.7 : 0.2, iridescenceIOR: 1.6, depthWrite: false,
      }));
      g.add(interno, esterno);
      return g;
    }

    /* una griffa: sale dal gambo, abbraccia il bordo della pietra, finisce con una pallina */
    function griffa(mat, px, pz, Ys, hc, alto) {
      const lung = Math.hypot(px, pz) || 1, dx = px / lung, dz = pz / lung, o = 0.32;
      const punta = V(px + dx * 0.05, Ys + hc * 0.5, pz + dz * 0.05);
      const curva = new THREE.CatmullRomCurve3([
        V(px * 0.42, alto - 0.5, Math.max(-1, Math.min(1, pz * 0.3))),
        V(px + dx * o, Ys - 1.6, pz + dz * o),
        V(px + dx * o, Ys - 0.2, pz + dz * o),
        punta,
      ]);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.36, 12), mat));
      const pallina = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 16), mat);
      pallina.position.copy(punta);
      g.add(pallina);
      return g;
    }

    function costruisci(i) {
      const m = MODELLI[i], g = new THREE.Group();
      const met = materialeMetallo(m.metallo);
      g.add(new THREE.Mesh(gambo({ ...m, p: m.gemma === 'sigillo' ? 5 : 3 }), met));
      const alto = R + m.t1;                     // il punto più alto del gambo

      if (m.gemma === 'sigillo') {
        const testa = new THREE.Mesh(new RoundedBoxGeometry(11.6, 2.4, 10.4, 6, 1.0), met);
        testa.position.y = alto + 0.55;
        const onice = new THREE.Mesh(new RoundedBoxGeometry(9.7, 0.8, 8.5, 6, 0.38), new THREE.MeshPhysicalMaterial({
          color: 0x040404, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8,
        }));
        onice.position.y = alto + 1.55 + 0.05;
        g.add(testa, onice);
        return g;
      }

      const Ys = alto + 2.3;                     // altezza della cintura della pietra
      let s, rx, rz, punti;
      if (m.gemma === 'smeraldo') {
        s = smeraldo(m.W, m.L); rx = m.W / 2; rz = m.L / 2;
        const ox = m.W / 2 - s.c * 0.45, oz = m.L / 2 - s.c * 0.45;
        punti = [[ox, oz], [-ox, oz], [-ox, -oz], [ox, -oz]];
      } else {
        const sz = m.sz || 1;
        s = tondo(m.r, sz); rx = m.r; rz = m.r * sz;
        const n = m.griffe, rot = n === 6 ? Math.PI / 6 : Math.PI / 4;
        punti = Array.from({ length: n }, (_, k) => { const a = rot + (k / n) * Math.PI * 2; return [rx * Math.cos(a), rz * Math.sin(a)]; });
      }
      const gem = pietra(s.geo, m.colore);
      gem.position.y = Ys;
      g.add(gem);
      punti.forEach(([px, pz]) => g.add(griffa(met, px, pz, Ys, s.hc, alto)));
      // il cestello: un anellino sotto la pietra che tiene insieme le griffe (solo per le pietre tonde e ovali)
      if (m.gemma === 'smeraldo') return g;
      const cest = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 12, 72), met);
      cest.rotation.x = Math.PI / 2;
      cest.scale.set(rx * 0.92, rz * 0.92, 1);   // fuori dalla pietra, appena sotto la cintura
      cest.position.y = Ys - 0.28 * s.hp;
      g.add(cest);
      return g;
    }

    /* ---------- LO STUDIO FOTOGRAFICO ----------
       I gioielli brillano perché riflettono un ambiente buio con poche luci forti (i "softbox"):
       questo crea i contrasti netti sul metallo e i lampi nelle sfaccettature. */
    function studio() {
      const env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.MeshBasicMaterial({ color: 0x5a5550, side: THREE.BackSide })));
      const box = (w, h, x, y, z, forza, colore = 0xffffff) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(colore).multiplyScalar(forza), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
      };
      box(70, 24, 0, 70, 20, 9);              // grande luce dall'alto
      box(18, 60, -60, 20, 30, 6, 0xfff0dd);  // striscia calda a sinistra
      box(18, 60, 60, 15, 25, 5, 0xe6eeff); // striscia fredda a destra
      box(40, 14, 0, 10, 70, 4);            // luce frontale bassa
      box(20, 20, -30, 40, -60, 3);           // controluce
      box(8, 8, 45, 60, -20, 8);              // piccoli punti forti: i lampi nella pietra
      box(6, 6, -50, 55, 10, 8);
      box(6, 6, 20, 30, 65, 7);
      return env;
    }

    /* ---------- LA SCENA ---------- */
    const viewer = document.getElementById('viewer');
    const canvas = document.getElementById('v-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2.5));   // nitido sugli schermi retina
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(studio(), 0.01).texture;
    const luce = new THREE.DirectionalLight(0xfff1dc, 2.2); luce.position.set(20, 40, 30); scene.add(luce);
    const controluce = new THREE.DirectionalLight(0xc8d4ff, 1.2); controluce.position.set(-30, 10, -25); scene.add(controluce);
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));

    const camera = new THREE.PerspectiveCamera(30, 1, 1, 600);
    const controls = new OrbitControls(camera, viewer);
    Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 30, maxDistance: 150, rotateSpeed: 0.85, zoomSpeed: 0.9 });
    const BERSAGLIO = V(0, 2, 0);
    const ELEVAZIONE = THREE.MathUtils.degToRad(70), DISTANZA = 72;   // la stessa inquadratura della foto
    const POSA = V(0, BERSAGLIO.y + DISTANZA * Math.sin(ELEVAZIONE), DISTANZA * Math.cos(ELEVAZIONE));

    /* a riposo si vede la FOTO; il modello 3D compare appena il cliente lo muove */
    controls.addEventListener('start', () => { annullaRitorno(); viewer.classList.add('live'); });

    function posaIniziale() {
      camera.position.copy(POSA);
      controls.target.copy(BERSAGLIO);
      controls.update();
    }

    /* "Rimetti dritto": l'anello torna dolcemente nella posizione della foto, poi riappare la foto */
    let ritorno = 0;
    const annullaRitorno = () => { cancelAnimationFrame(ritorno); ritorno = 0; };
    /* toglie l'inerzia rimasta dal trascinamento (altrimenti, alla fine, darebbe uno scatto) */
    function fermaInerzia() {
      controls._sphericalDelta?.set(0, 0, 0);
      controls._panOffset?.set(0, 0, 0);
      if ('_scale' in controls) controls._scale = 1;
    }
    const DISSOLVENZA = 650;   // ms: deve coincidere con la transizione di .live in style.css
    let inCorso = null;
    function rimettiDritto(veloce = false) {   // veloce: quando si torna al muro
      if (inCorso) return inCorso;
      if (!viewer.classList.contains('live')) return Promise.resolve();
      annullaRitorno();
      fermaInerzia();
      controls.enabled = false;
      const daT = controls.target.clone();
      const sDa = new THREE.Spherical().setFromVector3(camera.position.clone().sub(daT));
      const sA = new THREE.Spherical().setFromVector3(POSA.clone().sub(BERSAGLIO));
      let dT = sA.theta - sDa.theta;                       // gira dalla parte più corta
      dT = ((dT + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const dP = sA.phi - sDa.phi, dR = sA.radius - sDa.radius;
      // più è girato, più tempo ci mette: sempre calmo, mai brusco
      const distanza = Math.hypot(dT, dP) + Math.abs(dR) / 60;
      const durata = ridotto ? 1 : veloce ? Math.min(650, 260 + distanza * 160) : Math.min(1500, 450 + distanza * 380);
      viewer.classList.toggle('rapido', veloce);
      const morbida = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);   // parte e arriva piano
      const t0 = performance.now();
      inCorso = new Promise((fine) => {
        const passo = (t) => {
          const k = Math.min(1, (t - t0) / durata), e = morbida(k);
          controls.target.lerpVectors(daT, BERSAGLIO, e);
          camera.position.setFromSpherical(new THREE.Spherical(sDa.radius + dR * e, sDa.phi + dP * e, sDa.theta + dT * e)).add(controls.target);
          camera.lookAt(controls.target);
          if (k < 1) { ritorno = requestAnimationFrame(passo); return; }
          ritorno = 0;
          posaIniziale();
          fermaInerzia();
          controls.enabled = true;
          viewer.classList.remove('live');                  // dissolvenza dolce verso la foto originale
          setTimeout(() => { inCorso = null; viewer.classList.remove('rapido'); fine(); }, ridotto ? 0 : veloce ? 280 : DISSOLVENZA);
        };
        ritorno = requestAnimationFrame(passo);
      });
      return inCorso;
    }
    const reset = document.getElementById('v-reset');
    reset.addEventListener('pointerdown', (e) => e.stopPropagation());   // il clic sul pulsante non deve far girare l'anello
    reset.addEventListener('click', () => rimettiDritto());

    const cache = new Map();
    let attuale = null, attivo = false, raf = 0, giro = 0;
    function ciclo() {
      if (!attivo) return;
      if (viewer.classList.contains('live') || inCorso) {   // disegna solo quando il 3D è visibile
        if (!ritorno) controls.update();
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(ciclo);
    }

    function sposta({ cx, cy, size }) {
      Object.assign(canvas.style, { left: cx - size / 2 + 'px', top: cy - size / 2 + size * 0.07 + 'px', // +7%: allineato all'anello della foto
        width: size + 'px', height: size + 'px' });
      viewer.style.setProperty('--vx', cx + 'px');
      viewer.style.setProperty('--vy', cy + 'px');
      viewer.style.setProperty('--vs', size + 'px');
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }

    function mostra(i, box) {
      giro++;
      annullaRitorno();
      controls.enabled = true;
      viewer.classList.remove('live');
      if (attuale) scene.remove(attuale);
      if (!cache.has(i)) cache.set(i, costruisci(i));
      attuale = cache.get(i);
      scene.add(attuale);
      sposta(box);
      posaIniziale();
      if (!attivo) { attivo = true; ciclo(); }
      renderer.render(scene, camera);
      viewer.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => viewer.classList.add('on'));
    }

    /* dritto = true: se l'anello è stato girato, prima torna dolcemente nella posizione della foto */
    async function nascondi(dritto = true) {
      const mio = ++giro;
      if (dritto) await rimettiDritto(true);
      else annullaRitorno();
      if (mio !== giro) return;
      viewer.classList.remove('on', 'live');
      viewer.setAttribute('aria-hidden', 'true');
      await new Promise((r) => setTimeout(r, ridotto ? 0 : 450));
      if (mio === giro) { attivo = false; cancelAnimationFrame(raf); }
    }

    return { mostra, nascondi, sposta };
  }
})();
