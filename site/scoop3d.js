/* ============================================================
   The Scoop Story - scroll-driven 3D for Scoopy (kawaii, light).
   Architecture inherited from Aterio's "The Build" (proven):
   one GSAP master timeline scrubbed by native scroll, camera rig
   applied per frame, per-item reveal helpers, full/static modes.
   ASCII only in this file.
   ============================================================ */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(function () {
  'use strict';
  if ((window.__scoopMode || 'none') === 'none') return;
  gsap.registerPlugin(ScrollTrigger);
  if (ScrollTrigger.clearScrollMemory) ScrollTrigger.clearScrollMemory('manual');

  /* ---------- constants ---------- */
  var PHASES = ['the little world', 'pick a vibe', 'we scoop it', 'wrapped like a gift', 'to your door', 'unbox the joy'];
  var BOUNDS = [0.14, 0.30, 0.48, 0.64, 0.84];
  var IO = [[1.5, 11], [15.5, 27.5], [31.5, 45.5], [49.5, 61.5], [66, 81], [88, 999]];
  var CAM0 = { pos: { x: 0, y: 2.6, z: 9.5 }, tgt: { x: 0, y: 1.0, z: 0 }, fov: 38 };
  var HOP_X = [5.72, 11.44, 17.16, 22.88, 28.6];

  /* ---------- module state ---------- */
  var renderer = null, scene = null, camera = null;
  var tl = null, built = false, mode = 'static', curPhase = 0, lastRo = '';
  var glWrap = document.querySelector('.gl-wrap');
  var canvasEl = document.getElementById('gl');
  var track = document.getElementById('scoop-story');
  if (!glWrap || !canvasEl || !track) return;

  var camPos = { x: 0, y: 0, z: 0 }, camTarget = { x: 0, y: 0, z: 0 }, lens = { fov: 38 };
  var spiralP = { v: 1 };
  var spiralCache = -1;

  var W = {};   /* world refs */
  var M = {};   /* shared materials */

  /* ---------- helpers ---------- */
  function rbox(w, h, d, r, mat, bottomOrigin) {
    var g = new RoundedBoxGeometry(w, h, d, 4, r);
    if (bottomOrigin) g.translate(0, h / 2, 0);
    var m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    return m;
  }
  function sphere(r, mat, wseg, hseg) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, wseg || 24, hseg || 18), mat);
    m.castShadow = true;
    return m;
  }
  function radialGlowTexture(r, g2, b) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(' + r + ',' + g2 + ',' + b + ',1)');
    grad.addColorStop(0.35, 'rgba(' + r + ',' + g2 + ',' + b + ',0.55)');
    grad.addColorStop(1, 'rgba(' + r + ',' + g2 + ',' + b + ',0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    var tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }
  function heartTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = '#F7BDC7';
    g.beginPath();
    g.moveTo(32, 54);
    g.bezierCurveTo(10, 38, 8, 20, 20, 15);
    g.bezierCurveTo(27, 12, 32, 18, 32, 22);
    g.bezierCurveTo(32, 18, 37, 12, 44, 15);
    g.bezierCurveTo(56, 20, 54, 38, 32, 54);
    g.closePath(); g.fill();
    var tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }
  function stickerSheetTexture() {
    var c = document.createElement('canvas'); c.width = 256; c.height = 320;
    var g = c.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 256, 320);
    g.strokeStyle = '#E6D6C8'; g.lineWidth = 8; g.strokeRect(6, 6, 244, 308);
    var cols = ['#F7BDC7', '#7FC0B5', '#E7A7B6'];
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 3; col++) {
        var cx = 52 + col * 76, cy = 56 + row * 72;
        var kind = (row + col) % 3;
        g.fillStyle = cols[(row * 3 + col) % 3];
        if (kind === 0) {            /* heart */
          g.beginPath();
          g.moveTo(cx, cy + 14);
          g.bezierCurveTo(cx - 16, cy + 2, cx - 17, cy - 11, cx - 8, cy - 14);
          g.bezierCurveTo(cx - 3, cy - 16, cx, cy - 11, cx, cy - 8);
          g.bezierCurveTo(cx, cy - 11, cx + 3, cy - 16, cx + 8, cy - 14);
          g.bezierCurveTo(cx + 17, cy - 11, cx + 16, cy + 2, cx, cy + 14);
          g.fill();
        } else if (kind === 1) {     /* four-point spark */
          g.beginPath();
          g.moveTo(cx, cy - 16); g.lineTo(cx + 4, cy - 4); g.lineTo(cx + 16, cy);
          g.lineTo(cx + 4, cy + 4); g.lineTo(cx, cy + 16); g.lineTo(cx - 4, cy + 4);
          g.lineTo(cx - 16, cy); g.lineTo(cx - 4, cy - 4);
          g.closePath(); g.fill();
        } else {                     /* strawberry */
          g.beginPath(); g.ellipse(cx, cy + 2, 11, 13, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#7FC0B5';
          g.beginPath(); g.ellipse(cx, cy - 11, 8, 4, 0, 0, Math.PI * 2); g.fill();
        }
      }
    }
    var tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }

  /* ---------- scene ---------- */
  function initScene() {
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF6EFEA);
    scene.fog = new THREE.Fog(0xF6EFEA, 14, 42);

    camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 200);

    /* lights: warm cream world, constant */
    var key = new THREE.DirectionalLight(0xFFF4E8, 2.8);
    key.position.set(14, 18, 10);
    key.target.position.set(14, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -10; key.shadow.camera.right = 40;
    key.shadow.camera.top = 16; key.shadow.camera.bottom = -12;
    key.shadow.camera.near = 2; key.shadow.camera.far = 60;
    key.shadow.bias = -0.0003; key.shadow.normalBias = 0.05;
    scene.add(key, key.target);
    scene.add(new THREE.HemisphereLight(0xFFF7F0, 0xF2D7DC, 0.9));
    var fill = new THREE.DirectionalLight(0xFFE1E8, 0.7);
    fill.position.set(-10, 6, -8);
    scene.add(fill);

    /* shared clay materials */
    M.ground = new THREE.MeshStandardMaterial({ color: 0xF1E7DE, roughness: 1, metalness: 0 });
    M.kraft = new THREE.MeshStandardMaterial({ color: 0xDBC6B6, roughness: 0.85, metalness: 0 });
    M.kraftDark = new THREE.MeshStandardMaterial({ color: 0xCBB49F, roughness: 0.85, metalness: 0 });
    M.blush = new THREE.MeshStandardMaterial({ color: 0xF7BDC7, roughness: 0.8, metalness: 0 });
    M.peach = new THREE.MeshStandardMaterial({ color: 0xE7A7B6, roughness: 0.8, metalness: 0 });
    M.matcha = new THREE.MeshStandardMaterial({ color: 0x7FC0B5, roughness: 0.75, metalness: 0 });
    M.cocoa = new THREE.MeshStandardMaterial({ color: 0x3E2F23, roughness: 0.6, metalness: 0 });
    M.paper = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9, metalness: 0 });
    M.bubble = new THREE.MeshStandardMaterial({ color: 0xF2D7DC, roughness: 0.9, metalness: 0, flatShading: true });
    M.sealBase = new THREE.MeshStandardMaterial({ color: 0xE7A7B6, roughness: 0.7, metalness: 0 });
    M.sealRing = new THREE.MeshStandardMaterial({ color: 0xD897A6, roughness: 0.7, metalness: 0 });
    M.sealC = new THREE.MeshStandardMaterial({ color: 0xB4707E, roughness: 0.65, metalness: 0 });

    buildWorld();
    buildBox();
    buildChar();
    buildTotems();
    buildItems();
    buildGift();
    buildVan();
    buildFx();
  }

  function buildWorld() {
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    /* dashed peach circle under the box */
    var pts = [];
    for (var i = 0; i <= 64; i++) {
      var a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 3.2, 0.02, Math.sin(a) * 3.2));
    }
    var mat = new THREE.LineDashedMaterial({ color: 0xE7A7B6, dashSize: 0.35, gapSize: 0.25, transparent: true, opacity: 0.8 });
    var circle = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    circle.computeLineDistances();
    scene.add(circle);
    W.circleMat = mat;
  }

  function buildBox() {
    var g = new THREE.Group();

    var base = rbox(3.4, 0.24, 2.4, 0.06, M.kraft, false);
    base.position.y = 0.12;
    base.receiveShadow = true;
    g.add(base);
    W.boxBase = base;

    var walls = [];
    var wallSpecs = [
      { w: 3.4, d: 0.24, x: 0, z: 1.08 },   /* front */
      { w: 3.4, d: 0.24, x: 0, z: -1.08 },  /* back */
      { w: 0.24, d: 2.4, x: 1.58, z: 0 },   /* right */
      { w: 0.24, d: 2.4, x: -1.58, z: 0 }   /* left */
    ];
    wallSpecs.forEach(function (s) {
      var wall = rbox(s.w, 1.76, s.d, 0.05, M.kraft, true);
      wall.position.set(s.x, 0.24, s.z);
      wall.receiveShadow = true;
      g.add(wall); walls.push(wall);
    });
    W.walls = walls;

    /* flaps: pivot groups at the wall top edges; blades extend +y in local space */
    var flaps = [];
    function flap(px, pz, bw, bd, axis, flat, open, closed) {
      var pivot = new THREE.Group();
      pivot.position.set(px, 2.0, pz);
      var blade = rbox(bw, 1.26, bd, 0.04, M.kraftDark, true);
      blade.receiveShadow = true;
      pivot.add(blade);
      pivot.userData.axis = axis;
      pivot.userData.flat = flat;
      pivot.userData.open = open;
      pivot.userData.closed = closed;
      pivot.rotation[axis] = open;                 /* built at FINAL (P5 reopened) */
      g.add(pivot); flaps.push(pivot);
      return pivot;
    }
    flap(0, 1.08, 3.4, 0.12, 'x', 1.45, 0.12, -Math.PI / 2);    /* front */
    flap(0, -1.08, 3.4, 0.12, 'x', -1.45, -0.12, Math.PI / 2);  /* back */
    flap(1.58, 0, 0.12, 2.4, 'z', -1.45, -0.12, Math.PI / 2);   /* right */
    flap(-1.58, 0, 0.12, 2.4, 'z', 1.45, 0.12, -Math.PI / 2);   /* left */
    W.flaps = flaps;
    W.flapSides = [flaps[2], flaps[3]];
    W.flapFB = [flaps[0], flaps[1]];

    g.position.set(HOP_X[4], 0, 0);                /* built at FINAL: delivered at the door */
    scene.add(g);
    W.gBox = g;
  }

  function buildChar() {
    var ch = new THREE.Group();
    var body = sphere(0.9, M.blush);
    body.scale.set(1, 0.92, 0.95);
    ch.add(body);
    var eyeL = sphere(0.085, M.cocoa, 10, 8); eyeL.position.set(-0.32, 0.12, 0.82); eyeL.castShadow = false;
    var eyeR = sphere(0.085, M.cocoa, 10, 8); eyeR.position.set(0.32, 0.12, 0.82); eyeR.castShadow = false;
    var chL = sphere(0.16, M.peach, 12, 10); chL.position.set(-0.55, -0.08, 0.72); chL.scale.z = 0.35; chL.castShadow = false;
    var chR = sphere(0.16, M.peach, 12, 10); chR.position.set(0.55, -0.08, 0.72); chR.scale.z = 0.35; chR.castShadow = false;
    var smile = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 8, 12, Math.PI * 0.8), M.cocoa);
    smile.position.set(0, -0.06, 0.85);
    smile.rotation.z = Math.PI + Math.PI * 0.1;
    smile.castShadow = false;
    ch.add(eyeL, eyeR, chL, chR, smile);
    ch.position.set(-2.3, 0.78, 0.9);              /* FINAL: celebrating beside the box */
    W.gBox.add(ch);
    W.gChar = ch;
  }

  function buildTotems() {
    var g = new THREE.Group();
    g.position.set(0, 3.1, 0);

    function slot(angleDeg) {
      var a = angleDeg * Math.PI / 180;
      return { x: Math.cos(a) * 3.6, z: Math.sin(a) * 3.6 };
    }

    /* generic ribbon bow, faceless */
    var bowMat = M.blush.clone(); bowMat.transparent = true;
    var bowKnotMat = M.peach.clone(); bowKnotMat.transparent = true;
    var bow = new THREE.Group();
    var loopL = sphere(0.28, bowMat); loopL.scale.set(1, 0.7, 0.5); loopL.rotation.z = 0.6; loopL.position.x = -0.26;
    var loopR = sphere(0.28, bowMat); loopR.scale.set(1, 0.7, 0.5); loopR.rotation.z = -0.6; loopR.position.x = 0.26;
    var knot = sphere(0.14, bowKnotMat);
    bow.add(loopL, loopR, knot);
    var s1 = slot(90); bow.position.set(s1.x, 0, s1.z);
    g.add(bow);

    /* capybara (the chosen one), faceless */
    var capyMat = new THREE.MeshStandardMaterial({ color: 0xC9A98C, roughness: 0.85, metalness: 0, transparent: true });
    var capy = new THREE.Group();
    var capyBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.35, 6, 12), capyMat);
    capyBody.rotation.z = Math.PI / 2;
    capyBody.castShadow = true;
    var snout = rbox(0.22, 0.16, 0.14, 0.05, capyMat, false); snout.position.set(0.42, 0.02, 0);
    var earL = sphere(0.06, capyMat, 8, 6); earL.position.set(0.22, 0.3, -0.12);
    var earR = sphere(0.06, capyMat, 8, 6); earR.position.set(0.22, 0.3, 0.12);
    capy.add(capyBody, snout, earL, earR);
    var s2 = slot(210); capy.position.set(s2.x, 0, s2.z);
    g.add(capy);

    /* tiny food: onigiri + strawberry, faceless */
    var foodPaper = M.paper.clone(); foodPaper.transparent = true;
    var foodCocoa = M.cocoa.clone(); foodCocoa.transparent = true;
    var foodBlush = M.blush.clone(); foodBlush.transparent = true;
    var foodMatcha = M.matcha.clone(); foodMatcha.transparent = true;
    var food = new THREE.Group();
    var oni = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.32, 0.45, 3), foodPaper);
    oni.castShadow = true;
    var nori = rbox(0.2, 0.18, 0.2, 0.03, foodCocoa, false); nori.position.y = -0.16;
    var berry = sphere(0.16, foodBlush); berry.scale.y = 1.2; berry.position.set(0.42, -0.1, 0.1);
    var leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10), foodMatcha);
    leaf.position.set(0.42, 0.12, 0.1);
    food.add(oni, nori, berry, leaf);
    var s3 = slot(330); food.position.set(s3.x, 0, s3.z);
    g.add(food);

    /* chosen glow */
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialGlowTexture(247, 189, 199), color: 0xF7BDC7, transparent: true, opacity: 0, depthWrite: false }));
    glow.scale.set(2.2, 2.2, 1);
    glow.position.set(s2.x, 0, s2.z - 0.2);
    g.add(glow);

    scene.add(g);
    W.gTotems = g; W.totBow = bow; W.totCapy = capy; W.totFood = food; W.totGlow = glow;
    W.totemFadeMats = [bowMat, bowKnotMat, foodPaper, foodCocoa, foodBlush, foodMatcha];
  }

  function buildItems() {
    var items = [];

    function reg(group, rx, ry, rz, rotY) {
      group.position.set(rx, ry, rz);
      group.rotation.y = rotY || 0;
      group.userData.rest = { x: rx, y: ry, z: rz, ry: rotY || 0, ang0: Math.atan2(rz, rx) };
      W.gBox.add(group);
      items.push(group);
      return group;
    }

    /* notebook */
    var notebook = new THREE.Group();
    var pages = rbox(0.9, 0.14, 0.7, 0.03, M.paper, false);
    var cover = rbox(0.92, 0.05, 0.72, 0.02, M.matcha, false); cover.position.y = 0.09;
    notebook.add(pages, cover);
    reg(notebook, -0.8, 0.55, -0.5, 0.3);

    /* pen */
    var pen = new THREE.Group();
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 12), M.blush);
    barrel.rotation.z = Math.PI / 2; barrel.castShadow = true;
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 12), M.cocoa);
    tip.rotation.z = -Math.PI / 2; tip.position.x = 0.49; tip.castShadow = true;
    pen.add(barrel, tip);
    reg(pen, 0.4, 0.5, -0.7, -0.25);

    /* washi tape */
    var washi = new THREE.Group();
    var roll = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.11, 10, 22), M.bubble);
    roll.rotation.x = Math.PI / 2; roll.castShadow = true;
    var tail = rbox(0.24, 0.02, 0.3, 0.008, M.paper, false); tail.position.set(0.26, 0.06, 0);
    washi.add(roll, tail);
    reg(washi, -0.1, 0.55, 0.3, 0.6);

    /* strawberry eraser */
    var eraser = new THREE.Group();
    var body2 = sphere(0.2, M.blush); body2.scale.y = 1.2;
    var leaf2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 10), M.matcha);
    leaf2.position.y = 0.24;
    eraser.add(body2, leaf2);
    reg(eraser, 0.9, 0.5, 0.2, 0);

    /* sticker sheet */
    var stickers = new THREE.Group();
    var sheetTop = new THREE.MeshStandardMaterial({ map: stickerSheetTexture(), roughness: 0.9, metalness: 0 });
    var sheetGeo = new THREE.BoxGeometry(0.7, 0.02, 0.9);
    var sheet = new THREE.Mesh(sheetGeo, [M.paper, M.paper, sheetTop, M.paper, M.paper, M.paper]);
    sheet.castShadow = true;
    stickers.add(sheet);
    reg(stickers, -0.35, 0.62, 0.75, -0.4);

    /* capybara charm */
    var charm = new THREE.Group();
    var capyMat2 = new THREE.MeshStandardMaterial({ color: 0xC9A98C, roughness: 0.85, metalness: 0 });
    var cBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.16, 6, 10), capyMat2);
    cBody.rotation.z = Math.PI / 2; cBody.castShadow = true;
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 14), M.peach);
    ring.position.set(-0.2, 0.08, 0); ring.castShadow = true;
    charm.add(cBody, ring);
    reg(charm, 0.75, 0.6, -0.35, 0.9);

    W.spiralItems = items;

    /* tissue cones */
    var tissue = [];
    [[-0.7, -0.3], [0.75, 0.25], [-0.1, 0.5]].forEach(function (p) {
      var t = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 5), M.bubble);
      t.position.set(p[0], 1.55, p[1]);
      t.castShadow = true;
      W.gBox.add(t); tissue.push(t);
    });
    W.tissue = tissue;
  }

  function buildGift() {
    /* ribbon bands (classic wrap trick: slightly larger than the box) */
    var bandA = rbox(0.42, 2.26, 2.54, 0.04, M.blush, false);
    bandA.position.set(0, 1.13, 0);
    var bandB = rbox(3.54, 2.26, 0.42, 0.04, M.blush, false);
    bandB.position.set(0, 1.13, 0);
    W.gBox.add(bandA, bandB);

    /* bow on the lid */
    var bow = new THREE.Group();
    var bl = sphere(0.3, M.blush); bl.scale.set(1, 0.62, 0.45); bl.rotation.z = 0.6; bl.position.x = -0.28;
    var br = sphere(0.3, M.blush); br.scale.set(1, 0.62, 0.45); br.rotation.z = -0.6; br.position.x = 0.28;
    var knot = sphere(0.13, M.peach);
    var tailL = rbox(0.12, 0.34, 0.05, 0.02, M.blush, false); tailL.position.set(-0.16, -0.3, 0.05); tailL.rotation.z = 0.35;
    var tailR = rbox(0.12, 0.34, 0.05, 0.02, M.blush, false); tailR.position.set(0.16, -0.3, 0.05); tailR.rotation.z = -0.35;
    bow.add(bl, br, knot, tailL, tailR);
    bow.position.set(0, 2.3, 0);
    W.gBox.add(bow);

    /* the pink wax seal (echoes #seal-cmark; faceless in 3D) */
    var seal = new THREE.Group();
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.1, 26), M.sealBase);
    disc.castShadow = true;
    var ringIn = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 26), M.sealRing);
    ringIn.rotation.x = Math.PI / 2; ringIn.position.y = 0.055;
    var cMark = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 24, 4.9), M.sealC);
    cMark.rotation.x = Math.PI / 2; cMark.rotation.z = 2.4; cMark.position.y = 0.06;
    seal.add(disc, ringIn, cMark);
    seal.position.set(0.95, 2.17, 0.75);
    W.gBox.add(seal);

    /* pop heart above the seal */
    var heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTexture(), transparent: true, opacity: 0, depthWrite: false }));
    heart.scale.set(0.7, 0.7, 1);
    heart.position.set(0.95, 2.9, 0.75);
    W.gBox.add(heart);

    W.bandA = bandA; W.bandB = bandB; W.bow = bow; W.seal = seal; W.heart = heart;
  }

  function buildVan() {
    var g = new THREE.Group();

    /* soft mountains + snow caps */
    var mtMat = new THREE.MeshStandardMaterial({ color: 0xEFE0D5, roughness: 1, metalness: 0, flatShading: true });
    var snowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, metalness: 0, flatShading: true });
    [[16, -8, 4.6, 5.2], [22, -11, 5.4, 6.2], [27, -8.5, 3.8, 4.4]].forEach(function (m, i) {
      var mt = new THREE.Mesh(new THREE.ConeGeometry(m[2], m[3], 6), mtMat);
      mt.position.set(m[0], m[3] / 2 - 0.05, m[1]);
      mt.castShadow = true;
      g.add(mt);
      if (i < 2) {
        var cap = new THREE.Mesh(new THREE.ConeGeometry(m[2] * 0.34, m[3] * 0.3, 6), snowMat);
        cap.position.set(m[0], m[3] - m[3] * 0.15 - 0.05, m[1]);
        g.add(cap);
      }
    });

    /* water strip */
    var water = new THREE.Mesh(new THREE.PlaneGeometry(24, 3.5), new THREE.MeshStandardMaterial({ color: 0x8FC9BD, roughness: 0.6, metalness: 0 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(21, 0.02, -4.5);
    g.add(water);

    /* pastel houses */
    var houseCols = [0xF2D7DC, 0x7FC0B5, 0xFFFFFF, 0xF7BDC7];
    [15, 19, 23, 27].forEach(function (x, i) {
      var h = new THREE.Group();
      var bodyH = rbox(1.2, 1.0, 1.0, 0.06, new THREE.MeshStandardMaterial({ color: houseCols[i], roughness: 0.9, metalness: 0 }), true);
      var roof = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.7, 4), i % 2 ? M.kraftDark : M.kraft);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.35;
      roof.castShadow = true;
      h.add(bodyH, roof);
      h.position.set(x, 0, 2.2);
      g.add(h);
    });

    /* the door */
    var door = new THREE.Group();
    var frame = rbox(0.18, 1.75, 1.05, 0.04, M.paper, true);
    var slab = rbox(0.12, 1.6, 0.85, 0.03, M.peach, true);
    slab.position.set(-0.04, 0.06, 0);
    var knob = sphere(0.05, M.cocoa, 10, 8); knob.position.set(-0.12, 0.9, 0.28);
    var mat2 = rbox(0.5, 0.03, 0.9, 0.01, M.kraft, true);
    mat2.position.set(-0.5, 0, 0);
    door.add(frame, slab, knob, mat2);
    door.position.set(30, 0, 0);
    g.add(door);
    W.door = door;

    /* trail dots */
    var trail = [];
    for (var i = 0; i < 12; i++) {
      var d = sphere(0.07, M.peach, 10, 8);
      d.position.set(3.5 + i * 2.1, 0.06, ((i % 3) - 1) * 0.3);
      d.castShadow = false;
      g.add(d); trail.push(d);
    }
    W.trail = trail;

    scene.add(g);
    W.gVan = g;
  }

  function buildFx() {
    /* sparkle pop rings (peach + matcha) */
    var rings = [];
    var spots = [
      [0, 2.1, 0, 0xE7A7B6],        /* 0 box rim (P0 done) */
      [-0.8, 0.8, -0.5, 0xE7A7B6],  /* 1 notebook */
      [0.4, 0.8, -0.7, 0x7FC0B5],   /* 2 pen */
      [-0.1, 0.8, 0.3, 0xE7A7B6],   /* 3 washi */
      [0.9, 0.8, 0.2, 0xE7A7B6],    /* 4 eraser */
      [-0.35, 0.8, 0.75, 0x7FC0B5], /* 5 stickers */
      [0.75, 0.8, -0.35, 0xE7A7B6], /* 6 charm */
      [0.95, 2.3, 0.75, 0xE7A7B6],  /* 7 seal */
      [0, 2.4, 0, 0xE7A7B6],        /* 8 finale a */
      [0, 2.8, 0, 0x7FC0B5]         /* 9 finale b */
    ];
    spots.forEach(function (s) {
      var mat = new THREE.MeshBasicMaterial({ color: s[3], transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      var r = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 32), mat);
      r.rotation.x = -Math.PI / 2;
      r.position.set(s[0], s[1], s[2]);
      W.gBox.add(r); rings.push(r);
    });
    W.rings = rings;

    /* door ring (world space) */
    var dmat = new THREE.MeshBasicMaterial({ color: 0xE7A7B6, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    var dring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.54, 32), dmat);
    dring.rotation.x = -Math.PI / 2;
    dring.position.set(29.4, 0.06, 0);
    scene.add(dring);
    W.doorRing = dring;

    /* finale sparkles + hearts (ride the spiral, box-local) */
    var sparkles = [];
    var pinkTex = radialGlowTexture(247, 189, 199);
    var tealTex = radialGlowTexture(127, 192, 181);
    var heartTex = heartTexture();
    for (var i = 0; i < 10; i++) {
      var tex = (i % 3 === 2) ? tealTex : (i > 7 ? heartTex : pinkTex);
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
      var sc = i > 7 ? 0.5 : 0.55 + (i % 3) * 0.15;
      sp.scale.set(sc, sc, 1);
      W.gBox.add(sp); sparkles.push(sp);
    }
    W.sparkles = sparkles;
  }

  /* ---------- per-frame engine: the finale spiral ---------- */
  function updateSpiral(force) {
    var p = spiralP.v;
    if (!force && p === spiralCache) return;
    spiralCache = p;
    for (var i = 0; i < W.spiralItems.length; i++) {
      var it = W.spiralItems[i];
      var r0 = it.userData.rest;
      if (p <= 0) {
        it.position.set(r0.x, r0.y, r0.z);
        it.rotation.y = r0.ry;
        continue;
      }
      var ang = r0.ang0 + p * Math.PI * 1.2 + i * 0.35;
      var rad = 0.4 + p * 1.2;
      it.position.set(Math.cos(ang) * rad, r0.y + p * (2.6 + i * 0.35), Math.sin(ang) * rad);
      it.rotation.y = r0.ry + p * 1.5;
    }
    for (var k = 0; k < W.sparkles.length; k++) {
      var sp = W.sparkles[k];
      var a2 = k * 1.1 + p * 4.2;
      var rr = 0.9 + (k % 3) * 0.5;
      sp.position.set(Math.cos(a2) * rr, 1.2 + p * (2.2 + (k % 4) * 0.5), Math.sin(a2) * rr);
      sp.material.opacity = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI) * 0.85;
    }
  }

  /* ---------- DOM refs ---------- */
  var PH = Array.prototype.slice.call(document.querySelectorAll('.story-phase'));
  var railBtns = Array.prototype.slice.call(document.querySelectorAll('#scoop-story .rail button'));
  var roPct = document.getElementById('ro-pct');
  var roPhase = document.getElementById('ro-phase');

  /* ---------- reveal bookkeeping ---------- */
  function collectRevealItems() {
    W.revealItems = [].concat(
      [W.boxBase], W.walls, W.flaps,
      W.spiralItems, W.tissue,
      [W.bandA, W.bandB, W.bow, W.seal],
      [W.totBow, W.totCapy, W.totFood],
      W.trail
    );
    W.revealItems.forEach(function (m) { m.userData.fy = m.position.y; });
  }

  /* ---------- timeline helpers (donor pattern: per-item visible gate) ---------- */
  function growIn(items, at, each, dur, ease) {
    items.forEach(function (m, i) {
      var t = at + i * each;
      tl.set(m, { visible: true }, t);
      tl.fromTo(m.scale, { y: 0.001 }, { y: 1, duration: dur, ease: ease || 'back.out(1.4)' }, t);
    });
  }
  function popIn(items, at, each, dur, ease) {
    items.forEach(function (m, i) {
      var t = at + i * each;
      tl.set(m, { visible: true }, t);
      tl.fromTo(m.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: dur, ease: ease || 'back.out(1.7)' }, t);
    });
  }
  function dropIn(items, yFrom, at, each, dur, ease) {
    items.forEach(function (m, i) {
      var t = at + i * each;
      tl.set(m, { visible: true }, t);
      tl.fromTo(m.position, { y: m.userData.fy + yFrom }, { y: m.userData.fy, duration: dur, ease: ease || 'back.out(1.4)' }, t);
    });
  }
  function sparklePop(i, at) {
    var r = W.rings[i];
    tl.fromTo(r.scale, { x: 0.4, y: 0.4 }, { x: 2.2, y: 2.2, duration: 1.2, ease: 'power2.out', immediateRender: false }, at);
    tl.fromTo(r.material, { opacity: 0.75 }, { opacity: 0, duration: 1.2, ease: 'power1.out', immediateRender: false }, at);
  }
  function boxSquash(at) {
    tl.to(W.gBox.scale, { y: 0.94, duration: 0.25, ease: 'power1.out' }, at);
    tl.to(W.gBox.scale, { y: 1, duration: 0.35, ease: 'back.out(2)' }, at + 0.28);
  }

  /* ---------- the master timeline: 100 units == 800vh ---------- */
  function buildTimeline() {
    tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.story-track', start: 'top top', end: 'bottom bottom',
        scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: function (self) { setPhase(self.progress); }
      }
    });

    /* camera (ease none; the scrub is the steadicam) */
    tl.to(camPos, { x: 2.0, y: 2.9, z: 8.0, duration: 13 }, 0);
    tl.to(camTarget, { y: 1.35, duration: 13 }, 0);
    tl.to(camPos, { x: 6.8, y: 3.6, z: 5.6, duration: 14 }, 14);
    tl.to(camTarget, { y: 1.6, duration: 14 }, 14);
    tl.to(camPos, { x: 2.2, y: 6.2, z: 4.4, duration: 8 }, 30);
    tl.to(camTarget, { y: 0.9, duration: 8 }, 30);
    tl.to(camPos, { x: -3.4, y: 2.8, z: 6.6, duration: 7 }, 40);
    tl.to(camTarget, { y: 1.3, duration: 7 }, 40);
    tl.to(camPos, { x: 2.6, y: 2.3, z: 5.4, duration: 10 }, 48);
    tl.to(camTarget, { y: 1.4, duration: 10 }, 48);
    tl.to(camPos, { x: 1.5, y: 2.0, z: 4.1, duration: 2 }, 59);
    tl.to(lens, { fov: 34, duration: 2 }, 59);
    tl.to(camPos, { x: 2.4, y: 2.5, z: 6.4, duration: 3 }, 61);
    tl.to(lens, { fov: 37, duration: 3 }, 61);
    tl.to(camPos, { x: 31.5, y: 2.6, z: 7.6, duration: 18 }, 64);
    tl.to(camTarget, { x: 28.6, y: 1.4, duration: 16 }, 64.5);
    tl.to(lens, { fov: 38, duration: 4 }, 64);
    tl.to(camPos, { x: 24.8, y: 3.9, z: 5.6, duration: 12 }, 84);
    tl.to(camTarget, { x: 28.6, y: 2.3, z: 0, duration: 12 }, 84);
    tl.to(lens, { fov: 36, duration: 6 }, 84);
    tl.to(camPos, { x: 25.6, y: 4.3, z: 6.2, duration: 4 }, 96);

    /* P0 - the little world (0-14) */
    tl.fromTo('.gl-wrap', { opacity: 0 }, { opacity: 1, duration: 3 }, 0);
    tl.fromTo(W.circleMat, { opacity: 0 }, { opacity: 0.8, duration: 2 }, 1);
    tl.fromTo(W.gBox.position, { x: 0 }, { x: 0, duration: 0.01 }, 0);   /* anchor the box at origin for the build */
    tl.set(W.boxBase, { visible: true }, 2);
    tl.fromTo(W.boxBase.scale, { x: 0.9, y: 0.02, z: 0.9 }, { x: 1, y: 1, z: 1, duration: 2, ease: 'power2.out' }, 2);
    growIn(W.walls, 4, 0.7, 1.2);
    W.flaps.forEach(function (f, i) {
      var axis = f.userData.axis;
      var from = {}; from[axis] = f.userData.flat;
      var to = { duration: 1.4, ease: 'back.out(1.3)' }; to[axis] = f.userData.open;
      tl.set(f, { visible: true }, 4 + i * 0.7);
      tl.fromTo(f.rotation, from, to, 8 + i * 0.6);
    });
    tl.set(W.gChar, { visible: true }, 11.5);
    tl.fromTo(W.gChar.position, { x: -0.4, y: 0.4, z: -1.85 }, { y: 1.9, duration: 2, ease: 'power2.out' }, 11.5);
    sparklePop(0, 13.5);

    /* P1 - pick a vibe (14-30) */
    popIn([W.totBow], 15, 0, 1.1);
    popIn([W.totCapy], 16.2, 0, 1.1);
    popIn([W.totFood], 17.4, 0, 1.1);
    tl.fromTo(W.gTotems.rotation, { y: 0 }, { y: 1.15, duration: 13 }, 15);
    tl.fromTo(W.totGlow.material, { opacity: 0 }, { opacity: 0.85, duration: 1.2 }, 24);
    tl.to(W.totCapy.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.8, ease: 'back.out(1.6)' }, 24);
    tl.to(W.totCapy.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.6 }, 24.9);
    W.totemFadeMats.forEach(function (m2) {
      tl.to(m2, { opacity: 0.45, duration: 1 }, 24.5);
      tl.to(m2, { opacity: 0, duration: 1.2 }, 27.5);
    });
    tl.to(W.totBow.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.2, ease: 'back.in(1.4)' }, 27.5);
    tl.to(W.totFood.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.2, ease: 'back.in(1.4)' }, 27.7);
    tl.to(W.totGlow.material, { opacity: 0, duration: 1.2 }, 28);
    tl.to(W.totCapy.position, { x: 0, y: 0.2, z: 0, duration: 1.5, ease: 'power1.inOut' }, 28);
    tl.to(W.totCapy.scale, { x: 0.35, y: 0.35, z: 0.35, duration: 1.5 }, 28);
    tl.to(W.totCapy.children[0].material, { opacity: 0, duration: 1.2 }, 28.3);

    /* P2 - we scoop it (30-48) */
    var dropAt = [30.5, 32.5, 34.5, 36.5, 38.5, 40.5];
    W.spiralItems.forEach(function (item, i) {
      dropIn([item], 6, dropAt[i], 0, 1.6);
      sparklePop(1 + i, dropAt[i] + 1.3);
    });
    boxSquash(31.9);
    boxSquash(37.9);
    growIn(W.tissue, 43, 0.8, 1.4);

    /* P3 - wrapped like a gift (48-64) */
    W.tissue.forEach(function (t2) { tl.to(t2.scale, { y: 0.45, duration: 1 }, 48.5); });
    W.flapSides.forEach(function (f, i) {
      var to = { duration: 1.6, ease: 'power2.inOut' }; to[f.userData.axis] = f.userData.closed;
      tl.to(f.rotation, to, 49 + i * 0.8);
    });
    W.flapFB.forEach(function (f, i) {
      var to = { duration: 1.6, ease: 'power2.inOut' }; to[f.userData.axis] = f.userData.closed;
      tl.to(f.rotation, to, 51.5 + i * 0.8);
    });
    tl.set(W.bandA, { visible: true }, 54);
    tl.fromTo(W.bandA.scale, { y: 0.001 }, { y: 1, duration: 2, ease: 'power2.out' }, 54);
    tl.set(W.bandB, { visible: true }, 55.5);
    tl.fromTo(W.bandB.scale, { y: 0.001 }, { y: 1, duration: 2, ease: 'power2.out' }, 55.5);
    popIn([W.bow], 58, 0, 1, 'back.out(2)');
    tl.set(W.seal, { visible: true }, 59.5);
    tl.fromTo(W.seal.position, { y: 4.67 }, { y: 2.17, duration: 0.8, ease: 'power2.in' }, 59.5);
    tl.fromTo(W.seal.scale, { x: 1.25, y: 0.45, z: 1.25 }, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'back.out(1.8)', immediateRender: false }, 60.3);
    sparklePop(7, 60.3);
    boxSquash(60.3);
    tl.fromTo(W.heart.material, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 60.6);
    tl.fromTo(W.heart.scale, { x: 0.1, y: 0.1 }, { x: 0.7, y: 0.7, duration: 0.8, ease: 'back.out(1.8)', immediateRender: false }, 60.6);
    tl.to(W.heart.position, { y: 3.8, duration: 1.6 }, 60.6);
    tl.to(W.heart.material, { opacity: 0, duration: 1 }, 61.8);
    tl.to(W.gChar.position, { x: -0.85, z: -0.15, duration: 1.6 }, 61.8);
    tl.to(W.gChar.position, { y: 3.1, duration: 0.8, ease: 'power1.out' }, 61.8);
    tl.to(W.gChar.position, { y: 2.85, duration: 0.8, ease: 'power1.in' }, 62.6);

    /* P4 - to your door (64-84) */
    tl.to(scene.fog, { near: 28, far: 95, duration: 4 }, 64);
    HOP_X.forEach(function (x, i) {
      var t0 = 65.5 + i * 3;
      tl.to(W.gBox.position, { x: x, duration: 3 }, t0);
      tl.to(W.gBox.position, { y: 1.5, duration: 1.5, ease: 'power1.out' }, t0);
      tl.to(W.gBox.position, { y: 0, duration: 1.5, ease: 'power1.in' }, t0 + 1.5);
      tl.to(W.gBox.scale, { y: 1.08, duration: 0.6, ease: 'power1.out' }, t0);
      tl.to(W.gBox.scale, { y: 0.9, duration: 0.5, ease: 'power1.in' }, t0 + 2.4);
    });
    tl.to(W.gBox.scale, { y: 1, duration: 0.6, ease: 'back.out(2)' }, 80.6);
    W.trail.forEach(function (d, i) {
      var t = 66.5 + i * 1.1;
      tl.set(d, { visible: true }, t);
      tl.fromTo(d.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.6)' }, t);
    });
    tl.to(W.door.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.5, ease: 'power1.out' }, 80.8);
    tl.to(W.door.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(2)' }, 81.4);
    tl.fromTo(W.doorRing.scale, { x: 0.4, y: 0.4 }, { x: 2.2, y: 2.2, duration: 1.2, ease: 'power2.out', immediateRender: false }, 80.8);
    tl.fromTo(W.doorRing.material, { opacity: 0.75 }, { opacity: 0, duration: 1.2, immediateRender: false }, 80.8);
    tl.to(scene.fog, { far: 60, duration: 4 }, 82);

    /* P5 - unbox the joy (84-100) */
    tl.to(W.seal.position, { y: 3.4, duration: 0.8, ease: 'power2.in' }, 84);
    tl.to(W.seal.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.8, ease: 'power2.in' }, 84);
    tl.to(W.bandA.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.6, ease: 'back.in(1.4)' }, 84.8);
    tl.to(W.bandB.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.6, ease: 'back.in(1.4)' }, 85);
    tl.to(W.bow.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.7, ease: 'back.in(1.6)' }, 85.2);
    tl.to(W.gChar.position, { x: -2.3, z: 0.9, duration: 1.2 }, 85.8);
    tl.to(W.gChar.position, { y: 3.4, duration: 0.6, ease: 'power1.out' }, 85.8);
    tl.to(W.gChar.position, { y: 0.78, duration: 0.6, ease: 'power1.in' }, 86.4);
    W.tissue.forEach(function (t2) { tl.to(t2.scale, { y: 1, duration: 1, ease: 'back.out(1.6)' }, 86.5); });
    W.flapSides.forEach(function (f, i) {
      var to = { duration: 1.4, ease: 'back.out(1.3)' }; to[f.userData.axis] = f.userData.open;
      tl.to(f.rotation, to, 86.5 + i * 0.6);
    });
    W.flapFB.forEach(function (f, i) {
      var to = { duration: 1.4, ease: 'back.out(1.3)' }; to[f.userData.axis] = f.userData.open;
      tl.to(f.rotation, to, 87.3 + i * 0.6);
    });
    sparklePop(8, 87.5);
    sparklePop(9, 87.9);
    tl.to(spiralP, { v: 1, duration: 9 }, 88);
    tl.to(W.gChar.rotation, { z: 0.12, duration: 1, ease: 'power1.inOut' }, 90);
    tl.to(W.gChar.rotation, { z: -0.12, duration: 1.4, ease: 'power1.inOut' }, 91);
    tl.to(W.gChar.rotation, { z: 0, duration: 1, ease: 'power1.inOut' }, 92.4);
    tl.to(W.gChar.position, { y: 1.35, duration: 0.5, ease: 'power1.out' }, 90.2);
    tl.to(W.gChar.position, { y: 0.78, duration: 0.5, ease: 'power1.in' }, 90.7);
    tl.to(W.gChar.position, { y: 1.35, duration: 0.5, ease: 'power1.out' }, 92);
    tl.to(W.gChar.position, { y: 0.78, duration: 0.5, ease: 'power1.in' }, 92.5);
    tl.set(PH[5], { pointerEvents: 'auto' }, 88);

    /* overlays ride the same timeline */
    PH.forEach(function (el, i) {
      tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.5, ease: 'power1.out' }, IO[i][0]);
      if (IO[i][1] < 200) tl.to(el, { opacity: 0, y: -10, duration: 1.5, ease: 'power1.in' }, IO[i][1]);
    });
  }

  /* ---------- rail + readout ---------- */
  function setPhase(p) {
    var i = PHASES.length - 1;
    for (var k = 0; k < BOUNDS.length; k++) { if (p < BOUNDS[k]) { i = k; break; } }
    curPhase = i;
    var pct = ('00' + Math.round(p * 100)).slice(-3);
    var key = pct + '|' + i;
    if (key === lastRo) return;
    lastRo = key;
    if (roPct) roPct.textContent = pct + '%';
    if (roPhase) roPhase.textContent = '0' + i + ' · ' + PHASES[i];
    railBtns.forEach(function (b, k2) { b.classList.toggle('on', k2 === i); });
  }

  railBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (mode !== 'full' || !tl || !tl.scrollTrigger) return;
      var p = parseFloat(btn.getAttribute('data-p'));
      var st = tl.scrollTrigger;
      window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: 'smooth' });
    });
  });

  /* ---------- render loop ---------- */
  function render() {
    camera.position.set(camPos.x, camPos.y, camPos.z);
    camera.lookAt(camTarget.x, camTarget.y, camTarget.z);
    if (camera.fov !== lens.fov) { camera.fov = lens.fov; camera.updateProjectionMatrix(); }
    updateSpiral(false);
    renderer.render(scene, camera);
  }

  /* ---------- modes / lifecycle ---------- */
  function decideMode() {
    if (/[?&]static=1/.test(location.search)) return 'static';
    var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm || window.innerWidth < 900) return 'static';
    return 'full';
  }

  function sizeRenderer() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function prepFull() {
    camPos.x = CAM0.pos.x; camPos.y = CAM0.pos.y; camPos.z = CAM0.pos.z;
    camTarget.x = CAM0.tgt.x; camTarget.y = CAM0.tgt.y; camTarget.z = CAM0.tgt.z;
    lens.fov = CAM0.fov;
    camera.fov = CAM0.fov; camera.updateProjectionMatrix();
    scene.fog.near = 14; scene.fog.far = 42;
    W.gBox.position.set(0, 0, 0);
    W.gBox.scale.set(1, 1, 1);
    W.gChar.position.set(-0.4, 0.4, -1.85);
    W.gChar.rotation.set(0, 0, 0);
    W.gChar.visible = false;
    W.gTotems.rotation.y = 0;
    [W.totBow, W.totCapy, W.totFood].forEach(function (t) {
      t.scale.set(1, 1, 1); t.visible = false;
    });
    var s2 = { x: Math.cos(210 * Math.PI / 180) * 3.6, z: Math.sin(210 * Math.PI / 180) * 3.6 };
    W.totCapy.position.set(s2.x, 0, s2.z);
    W.totemFadeMats.forEach(function (m2) { m2.opacity = 1; });
    W.totCapy.children[0].material.opacity = 1;
    W.totGlow.material.opacity = 0;
    W.heart.material.opacity = 0;
    W.doorRing.material.opacity = 0;
    W.door.scale.set(1, 1, 1);
    W.revealItems.forEach(function (m) { m.visible = false; });
    spiralP.v = 0;
    updateSpiral(true);
    gsap.set(PH[5], { pointerEvents: 'none' });
  }

  function teardown() {
    if (tl) {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill(); tl = null;
    }
    gsap.ticker.remove(render);
    gsap.set(PH, { clearProps: 'opacity,transform,pointerEvents' });
    gsap.set('.gl-wrap', { clearProps: 'opacity' });
    lastRo = '';
  }

  function boot() {
    mode = decideMode();
    document.body.classList.remove('story-on');
    if (mode === 'static') {
      document.documentElement.classList.remove('boot-pending');
      window.__scoopBooted = true;
      return;
    }
    if (!built) {
      initScene();
      collectRevealItems();
      built = true;
      window.__scoopW = W;
    }
    document.body.classList.add('story-on');
    sizeRenderer();
    prepFull();
    buildTimeline();
    ScrollTrigger.refresh();
    setPhase(tl.scrollTrigger ? tl.scrollTrigger.progress : 0);
    gsap.ticker.add(render);
    window.__scoopBooted = true;
    document.documentElement.classList.remove('boot-pending');
    /* late safety refresh: re-measure after scroll restoration / late layout */
    setTimeout(function () {
      if (mode === 'full' && tl && tl.scrollTrigger) {
        ScrollTrigger.refresh();
        setPhase(tl.scrollTrigger.progress);
      }
    }, 350);
  }

  /* returning from a hidden tab: snap, no long scrub catch-up */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden || mode !== 'full' || !tl || !tl.scrollTrigger) return;
    var st = tl.scrollTrigger;
    st.scroll(window.pageYOffset);
    var p = Math.min(1, Math.max(0, (window.pageYOffset - st.start) / Math.max(1, st.end - st.start)));
    tl.progress(p);
    setPhase(p);
    render();
  });

  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      var next = decideMode();
      if (next !== mode) { teardown(); boot(); }
      else if (mode === 'full') { sizeRenderer(); ScrollTrigger.refresh(); }
    }, 150);
  });
  var rmq = matchMedia('(prefers-reduced-motion: reduce)');
  var onRm = function () { teardown(); boot(); };
  if (rmq.addEventListener) rmq.addEventListener('change', onRm);
  else if (rmq.addListener) rmq.addListener(onRm);

  /* ---------- deterministic test hook ---------- */
  window.__scoop = {
    jump: function (p) {
      if (mode !== 'full' || !tl || !tl.scrollTrigger) return;
      p = Math.min(1, Math.max(0, p));
      var st = tl.scrollTrigger;
      var y = st.start + (st.end - st.start) * p;
      try { window.scrollTo({ top: y, behavior: 'instant' }); }
      catch (e) { window.scrollTo(0, y); }
      st.scroll(y);
      tl.progress(p);
      setPhase(p);
      render();
    },
    progress: function () { return tl ? tl.progress() : 0; },
    phase: function () { return curPhase; },
    on: function () { return mode; },
    probe: function (ms) {
      ms = ms || 1200;
      return new Promise(function (res) {
        var t0 = performance.now(), last = t0, n = 0, worst = 0;
        function step(t) {
          var d = t - last; last = t;
          if (n > 0 && d > worst) worst = d;
          n++;
          if (t - t0 < ms) requestAnimationFrame(step);
          else res({ frames: n, avgMs: Math.round(((t - t0) / n) * 100) / 100, worstMs: Math.round(worst * 100) / 100 });
        }
        requestAnimationFrame(step);
      });
    }
  };

  boot();
})();
