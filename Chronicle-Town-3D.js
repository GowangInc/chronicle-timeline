/*
 * Chronicle-Town-3D.js
 * Interactive three-dimensional reconstruction of the town from
 * "Chronicle of a Death Foretold" for the DP study site.
 *
 * Script order (classic scripts, no modules, works on file:// and GitHub Pages):
 *   <script src="Chronicle-3D-Vendor/three.min.js"></script>   (Three.js r128, UMD, window.THREE)
 *   <script src="Chronicle-Map-Data.js"></script>              (window.CHRONICLE_PLACES)
 *   <script src="Chronicle-Texture-Data.js"></script>          (window.CHRONICLE_TEXTURES, optional)
 *   <script src="Chronicle-Town-3D.js"></script>               (this file)
 *   <script src="Chronicle-Experience.js"></script>            (calls window.ChronicleTown3D.create)
 *
 * Texture source order per kind (wall, brick, roof, wood, ground, water):
 *   1. window.CHRONICLE_TEXTURES[kind]  — embedded SVG data: URL from
 *      Chronicle-Texture-Data.js; data: URLs are not origin-tainted, so this
 *      is the path that makes real artwork work on file:// in Chrome/Edge.
 *   2. Chronicle-Textures/<kind>.svg    — relative file, used when the page is
 *      served over http(s) (GitHub Pages) and the data bundle is absent.
 *   3. A procedural canvas pattern in the same palette, so the scene is always
 *      fully shaded even if both sources fail (missing file, WebGL taint).
 * All sources render into power-of-two canvases shared by every cloned
 * texture; there are zero external network requests.
 *
 * The reconstruction is interpretive: only the adjacencies stated in
 * Chronicle-Map-Data.js come from the text. Positions derive from the
 * shared 1400x850 map coordinates, nothing else.
 */
(function () {
  'use strict';

  var VERSION = '1.0.0';
  var MAP_W = 1400;
  var MAP_H = 850;
  var SCALE = 0.14; // map units -> world units
  var TEX_BASE = 'Chronicle-Textures/';
  var TEX_KINDS = ['wall', 'brick', 'roof', 'wood', 'ground', 'water'];

  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOutCubic(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function mapToWorld(x, y) { return { x: (x - MAP_W / 2) * SCALE, z: (y - MAP_H / 2) * SCALE }; }

  // Deterministic PRNG so the procedural fallback textures are stable between loads.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------ *
   * Procedural fallback textures (Caribbean palette). Used immediately
   * and kept permanently if the SVG file cannot be sampled by WebGL.
   * ------------------------------------------------------------------ */
  function makeCanvas(size) {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    return canvas;
  }

  function speckle(ctx, rng, size, count, colors, rMin, rMax) {
    for (var i = 0; i < count; i++) {
      ctx.fillStyle = colors[(rng() * colors.length) | 0];
      var r = rMin + rng() * (rMax - rMin);
      ctx.beginPath();
      ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  var FALLBACK_PAINTERS = {
    wall: function (ctx, rng, s) {
      ctx.fillStyle = '#e4d0a8'; ctx.fillRect(0, 0, s, s);
      speckle(ctx, rng, s, 90, ['rgba(217,196,156,0.5)', 'rgba(239,224,192,0.5)', 'rgba(206,182,138,0.35)'], 6, 26);
      ctx.strokeStyle = 'rgba(160,140,105,0.18)';
      for (var i = 0; i < 14; i++) {
        ctx.beginPath();
        var y = rng() * s;
        ctx.moveTo(0, y); ctx.bezierCurveTo(s * 0.3, y + 8, s * 0.7, y - 8, s, y);
        ctx.stroke();
      }
    },
    brick: function (ctx, rng, s) {
      ctx.fillStyle = '#d9c3ab'; ctx.fillRect(0, 0, s, s);
      var bh = 22, bw = 52;
      for (var row = 0; row * bh < s; row++) {
        var off = (row % 2) * (bw / 2);
        for (var x = -bw; x < s + bw; x += bw) {
          var tone = 165 + ((rng() * 40) | 0);
          ctx.fillStyle = 'rgb(' + tone + ',' + (tone - 55) + ',' + (tone - 85) + ')';
          ctx.fillRect(x + off + 2, row * bh + 2, bw - 4, bh - 4);
        }
      }
      speckle(ctx, rng, s, 60, ['rgba(90,60,45,0.18)'], 2, 7);
    },
    roof: function (ctx, rng, s) {
      ctx.fillStyle = '#9c4f36'; ctx.fillRect(0, 0, s, s);
      var rh = 24, rw = 26;
      for (var row = 0; row * rh < s + rh; row++) {
        for (var x = 0; x < s + rw; x += rw) {
          var tone = 150 + ((rng() * 45) | 0);
          ctx.fillStyle = 'rgb(' + tone + ',' + ((tone * 0.52) | 0) + ',' + ((tone * 0.36) | 0) + ')';
          ctx.beginPath();
          ctx.arc(x, row * rh, rw * 0.62, 0, Math.PI, false);
          ctx.fill();
          ctx.strokeStyle = 'rgba(80,35,22,0.55)';
          ctx.stroke();
        }
      }
    },
    wood: function (ctx, rng, s) {
      ctx.fillStyle = '#8a6844'; ctx.fillRect(0, 0, s, s);
      var pw = 32;
      for (var x = 0; x < s; x += pw) {
        var tone = 118 + ((rng() * 32) | 0);
        ctx.fillStyle = 'rgb(' + tone + ',' + ((tone * 0.74) | 0) + ',' + ((tone * 0.5) | 0) + ')';
        ctx.fillRect(x + 1, 0, pw - 2, s);
        ctx.strokeStyle = 'rgba(60,42,24,0.6)';
        ctx.strokeRect(x + 0.5, -1, pw, s + 2);
        for (var g = 0; g < 5; g++) {
          ctx.strokeStyle = 'rgba(70,50,30,0.35)';
          ctx.beginPath();
          var gx = x + 4 + rng() * (pw - 8);
          ctx.moveTo(gx, 0); ctx.bezierCurveTo(gx + 5, s * 0.3, gx - 5, s * 0.6, gx + 3, s);
          ctx.stroke();
        }
      }
    },
    ground: function (ctx, rng, s) {
      ctx.fillStyle = '#b59a6e'; ctx.fillRect(0, 0, s, s);
      speckle(ctx, rng, s, 240, ['rgba(140,115,80,0.5)', 'rgba(200,178,135,0.5)', 'rgba(120,98,66,0.4)'], 1.5, 6);
      speckle(ctx, rng, s, 40, ['rgba(105,120,70,0.25)'], 4, 12);
    },
    water: function (ctx, rng, s) {
      ctx.fillStyle = '#3f7d8c'; ctx.fillRect(0, 0, s, s);
      for (var i = 0; i < 46; i++) {
        ctx.strokeStyle = i % 2 ? 'rgba(95,154,168,0.5)' : 'rgba(50,101,111,0.55)';
        ctx.lineWidth = 2 + rng() * 3;
        ctx.beginPath();
        var y = rng() * s;
        ctx.moveTo(-10, y);
        for (var x = 0; x <= s + 10; x += 24) {
          ctx.lineTo(x, y + Math.sin((x / s) * Math.PI * 4 + i) * 4);
        }
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
  };

  function makeFallbackCanvas(kind, size) {
    var canvas = makeCanvas(size || 256);
    var ctx = canvas.getContext('2d');
    var rng = mulberry32(kind.length * 7919 + kind.charCodeAt(0) * 131);
    FALLBACK_PAINTERS[kind](ctx, rng, canvas.width);
    return canvas;
  }

  /* ------------------------------------------------------------------ *
   * Light moods. 'unknown' is a neutral overcast: the text gives no time.
   * ------------------------------------------------------------------ */
  var LIGHT_PRESETS = {
    night: {
      sky: 0x0b1526, fog: 0x0b1526, hemiSky: 0x24406e, hemiGround: 0x0a0d14, hemiInt: 0.5,
      dirColor: 0x8fb0e0, dirInt: 0.28, dirPos: [60, 90, -40], lamp: 1, water: 0x3c5a68,
      fogNear: 150, fogFar: 380
    },
    dawn: {
      sky: 0xe8a878, fog: 0xeab083, hemiSky: 0xf7c9a0, hemiGround: 0x5a4638, hemiInt: 0.62,
      dirColor: 0xffb066, dirInt: 0.85, dirPos: [130, 26, -30], lamp: 0.3, water: 0xe0b894,
      fogNear: 170, fogFar: 430
    },
    day: {
      sky: 0x8fc3e8, fog: 0x9fcbe8, hemiSky: 0xcfe6ff, hemiGround: 0x8a7a5c, hemiInt: 0.85,
      dirColor: 0xfff2dc, dirInt: 1.1, dirPos: [70, 110, 40], lamp: 0, water: 0xffffff,
      fogNear: 200, fogFar: 520
    },
    unknown: {
      sky: 0xa7b6ba, fog: 0xa7b6ba, hemiSky: 0xd8dee0, hemiGround: 0x6f6a5e, hemiInt: 0.72,
      dirColor: 0xf2f2ee, dirInt: 0.55, dirPos: [50, 100, 30], lamp: 0, water: 0xdfe8ea,
      fogNear: 190, fogFar: 480
    }
  };

  function resolveContainer(container) {
    if (typeof container === 'string') return document.getElementById(container);
    return container || null;
  }

  function setStatus(text) {
    var node = document.getElementById('town-3d-status');
    if (node) node.textContent = text;
  }

  function create(container, options) {
    container = resolveContainer(container);
    options = options || {};

    var dead = { focus: noop, setLight: noop, resize: noop, destroy: noop };
    function noop() {}

    function fail(message) {
      if (container) {
        container.textContent = '';
        var box = document.createElement('div');
        box.setAttribute('style',
          'box-sizing:border-box;min-height:220px;display:flex;align-items:center;justify-content:center;' +
          'padding:32px;text-align:center;color:#dfbe80;background:#0c1a1e;border:1px solid #466361;' +
          'font:14px/1.6 Arial,sans-serif;');
        box.textContent = message + ' Use the illustrated map and place list below.';
        container.appendChild(box);
      }
      setStatus('The interactive 3D town is not available in this browser.');
      window.__chronicleTown3DDebug = dead;
      return dead;
    }

    if (!container) return fail('The 3D town container is missing.');
    if (typeof THREE === 'undefined') return fail('The 3D library did not load.');
    var webglOk = false;
    try {
      var probe = document.createElement('canvas');
      webglOk = !!(window.WebGLRenderingContext &&
        (probe.getContext('webgl') || probe.getContext('experimental-webgl')));
    } catch (err) { webglOk = false; }
    if (!webglOk) return fail('This browser cannot create a WebGL context.');

    try {
      return init(container, options);
    } catch (err) {
      return fail('The 3D town could not start (' + (err && err.message ? err.message : 'unexpected error') + ').');
    }
  }

  function init(container, options) {
    var api = { focus: focus, setLight: setLight, resize: resize, destroy: destroy };
    var places = (options.places || window.CHRONICLE_PLACES || []).slice();
    var onPlace = typeof options.onPlace === 'function' ? options.onPlace : function () {};
    var byId = {};
    places.forEach(function (place) { byId[place.id] = place; });

    var reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener: null };
    var reduceMotion = !!reduceMotionQuery.matches;
    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener('change', function (event) { reduceMotion = !!event.matches; });
    }

    var disposables = [];
    function track(resource) { disposables.push(resource); return resource; }

    /* ---------------- renderer / scene / camera ---------------- */
    var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(clamp(window.devicePixelRatio || 1, 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    var canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    if (window.getComputedStyle(container).position === 'static') container.style.position = 'relative';
    if (container.clientHeight < 200) container.style.minHeight = '420px';
    container.appendChild(canvas);
    container.setAttribute('tabindex', '0');

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(LIGHT_PRESETS.day.sky);
    scene.fog = new THREE.Fog(LIGHT_PRESETS.day.fog, 200, 520);

    var camera = new THREE.PerspectiveCamera(50, 1, 0.5, 1200);

    /* ---------------- textures ---------------- */
    var textures = {};
    var embedded = window.CHRONICLE_TEXTURES || {};
    TEX_KINDS.forEach(function (kind) {
      // One shared 256x256 canvas per kind; every cloned texture references the
      // same canvas, so upgrading it to the real artwork refreshes all materials.
      var shared = makeFallbackCanvas(kind, 256);
      var texture = track(new THREE.CanvasTexture(shared));
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
      var entry = textures[kind] = { map: texture, canvas: shared, clones: [] };
      // Prefer the embedded data: URL (file://-safe); otherwise the relative
      // SVG file (fine over http/https). Rasterize onto a scratch canvas first
      // and force a read: on file:// some browsers taint file-sourced images,
      // and the read throws here instead of breaking the render loop later.
      var src = typeof embedded[kind] === 'string' ? embedded[kind] : TEX_BASE + kind + '.svg';
      var img = new Image();
      img.onload = function () {
        try {
          var scratch = makeCanvas(256);
          var sctx = scratch.getContext('2d');
          sctx.drawImage(img, 0, 0, 256, 256);
          sctx.getImageData(0, 0, 1, 1); // throws if the canvas became tainted
          var ctx = entry.canvas.getContext('2d');
          ctx.clearRect(0, 0, 256, 256);
          ctx.drawImage(scratch, 0, 0);
          entry.map.needsUpdate = true;
          entry.clones.forEach(function (clone) { clone.needsUpdate = true; });
        } catch (err) { /* keep procedural fallback */ }
      };
      img.onerror = function () { /* keep procedural fallback */ };
      img.src = src;
    });

    function repeatTex(kind, rx, ry) {
      var clone = track(textures[kind].map.clone());
      clone.needsUpdate = true;
      clone.repeat.set(rx, ry);
      textures[kind].clones.push(clone);
      return clone;
    }

    /* ---------------- materials ---------------- */
    function lambert(params) {
      var material = new THREE.MeshLambertMaterial(params);
      material.color.convertSRGBToLinear();
      return track(material);
    }
    var matGround = lambert({ map: repeatTex('ground', 14, 9) });
    var matWater = track(new THREE.MeshPhongMaterial({
      map: repeatTex('water', 10, 3), transparent: true, opacity: 0.94,
      shininess: 70, specular: 0x336677
    }));
    var matWall = lambert({ map: repeatTex('wood', 3, 4), color: 0xe0d6bb });
    var matWallWarm = lambert({ map: repeatTex('wall', 2, 1.4), color: 0xf2d9ae });
    var matWallCool = lambert({ map: repeatTex('wall', 2, 1.4), color: 0xd8e2d2 });
    var matWallYellow = lambert({ map: repeatTex('wall', 2, 1.4), color: 0xe8c95e });
    var matBrick = lambert({ map: repeatTex('brick', 2, 1.6) });
    var matRoof = lambert({ map: repeatTex('roof', 3, 2) });
    var matRoofPalm = lambert({ map: repeatTex('wood', 7, 3), color: 0xc6ac73 });
    var tinCanvas = makeCanvas(128), tinCtx = tinCanvas.getContext('2d');
    var tinGradient = tinCtx.createLinearGradient(0, 0, 16, 0);
    tinGradient.addColorStop(0, '#697a77'); tinGradient.addColorStop(0.45, '#c1c9b8'); tinGradient.addColorStop(1, '#697a77');
    for (var strip = 0; strip < 8; strip++) {
      tinCtx.save(); tinCtx.translate(strip * 16, 0); tinCtx.fillStyle = tinGradient; tinCtx.fillRect(0, 0, 16, 128); tinCtx.restore();
    }
    var tinMap = track(new THREE.CanvasTexture(tinCanvas));
    tinMap.wrapS = tinMap.wrapT = THREE.RepeatWrapping;
    tinMap.encoding = THREE.sRGBEncoding;
    tinMap.repeat.set(2, 2);
    var matTin = track(new THREE.MeshPhongMaterial({ map: tinMap, color: 0xc3cbc3, shininess: 24, specular: 0x727c75 }));
    var matTrim = lambert({ color: 0xe4d5b3 });
    var matWood = lambert({ map: repeatTex('wood', 2, 1) });
    var matWoodDark = lambert({ map: repeatTex('wood', 2, 1), color: 0x9a7a52 });
    var matStone = lambert({ color: 0xc9b896 });
    var matSand = lambert({ color: 0xd6c093 });
    var matStreet = lambert({ color: 0xa9906a });
    var matDoor = lambert({ map: repeatTex('wood', 1, 1), color: 0x6f4f33 });
    var matDoorTeal = lambert({ color: 0x2e6f6a });
    var matWindow = lambert({ color: 0x2b3a44 });
    var matCanopy = lambert({ color: 0x3d7350 });
    var matCanopyLight = lambert({ color: 0x6d9051 });
    var matFrond = lambert({ color: 0x4a8256, side: THREE.DoubleSide });
    var matTrunk = lambert({ color: 0x7a5c3c });
    var matCanvasCream = lambert({ color: 0xe8dcc0 });
    var matCanvasRed = lambert({ color: 0xa8503c });
    var matHill = lambert({ map: repeatTex('ground', 4, 4), color: 0x9aa06a });

    /* ---------------- geometry helpers ---------------- */
    var geoCache = {};
    function boxGeo(w, h, d) {
      var key = 'b' + w + ',' + h + ',' + d;
      if (!geoCache[key]) geoCache[key] = track(new THREE.BoxGeometry(w, h, d));
      return geoCache[key];
    }
    function cylGeo(rt, rb, h, seg) {
      var key = 'c' + rt + ',' + rb + ',' + h + ',' + seg;
      if (!geoCache[key]) geoCache[key] = track(new THREE.CylinderGeometry(rt, rb, h, seg));
      return geoCache[key];
    }
    function prismGeo(w, h, d) {
      var key = 'p' + w + ',' + h + ',' + d;
      if (!geoCache[key]) {
        var shape = new THREE.Shape();
        shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(0, h); shape.closePath();
        var geo = track(new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }));
        geo.translate(0, 0, -d / 2);
        geoCache[key] = geo;
      }
      return geoCache[key];
    }

    var town = new THREE.Group();
    scene.add(town);

    function addBox(parent, w, h, d, mat, x, y, z, ry) {
      var mesh = new THREE.Mesh(boxGeo(w, h, d), mat);
      mesh.position.set(x, y, z);
      if (ry) mesh.rotation.y = ry;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    function addCyl(parent, rt, rb, h, seg, mat, x, y, z) {
      var mesh = new THREE.Mesh(cylGeo(rt, rb, h, seg), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    }
    function addGable(parent, w, h, d, mat, x, y, z, ridgeAlongX) {
      var group = new THREE.Group();
      group.position.set(x, y, z);
      if (ridgeAlongX) group.rotation.y = Math.PI / 2;
      var mesh = new THREE.Mesh(prismGeo(w, h, d), mat);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
      addBox(group, 0.18, 0.2, d + 0.2, matWoodDark, -w / 2, 0, 0);
      addBox(group, 0.18, 0.2, d + 0.2, matWoodDark, w / 2, 0, 0);
      addBox(group, 0.18, 0.15, d + 0.2, mat, 0, h + 0.03, 0);
      if (mat === matTin) {
        var slope = Math.hypot(w / 2, h), angle = Math.atan2(h, w / 2), count = Math.ceil(d / 0.65);
        var ribs = new THREE.InstancedMesh(boxGeo(slope, 0.08, 0.09), matTin, count * 2);
        var dummy = new THREE.Object3D();
        for (var i = 0; i < count * 2; i++) {
          var side = i % 2 ? 1 : -1;
          dummy.position.set(side * w / 4, h / 2 + 0.05, -d / 2 + (Math.floor(i / 2) + 0.5) * d / count);
          dummy.rotation.z = -side * angle;
          dummy.updateMatrix(); ribs.setMatrixAt(i, dummy.matrix);
        }
        ribs.castShadow = true; group.add(ribs);
      } else if (mat === matRoofPalm) {
        var pitch = Math.atan2(h, w / 2), span = Math.hypot(w / 2, h);
        for (var row = 0; row < 7; row++) {
          var t = (row + 0.5) / 7;
          [-1, 1].forEach(function (side) {
            var layer = addBox(group, span / 7 + 0.12, 0.1, d + 0.12, matRoofPalm, side * w / 2 * (1 - t), h * t + 0.08, 0);
            layer.rotation.z = -side * pitch;
          });
        }
      }
      parent.add(group);
      return group;
    }
    function addDoor(parent, w, h, mat, x, y, z, ry) {
      var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0;
      var door = addBox(g, w, h, 0.22, mat, 0, 0, 0);
      addBox(g, 0.14, h + 0.2, 0.3, matTrim, -w / 2 - 0.05, 0, 0);
      addBox(g, 0.14, h + 0.2, 0.3, matTrim, w / 2 + 0.05, 0, 0);
      addBox(g, w + 0.4, 0.2, 0.35, matTrim, 0, h / 2 + 0.08, 0);
      addBox(g, 0.09, 0.15, 0.12, matStone, w * 0.3, -0.1, 0.19);
      parent.add(g); return door;
    }
    function addWindows(parent, count, mat, y, positions, ry) {
      for (var i = 0; i < count; i++) {
        var g = new THREE.Group(); g.position.set(positions[i][0], y, positions[i][1]); g.rotation.y = ry || 0;
        addBox(g, 1.1, 1.5, 0.12, mat, 0, 0, 0);
        addBox(g, 1.28, 0.13, 0.2, matTrim, 0, 0.77, 0.04);
        addBox(g, 1.4, 0.13, 0.35, matTrim, 0, -0.79, 0.1);
        addBox(g, 0.07, 1.5, 0.16, matTrim, 0, 0, 0.08);
        addBox(g, 1.1, 0.07, 0.16, matTrim, 0, 0, 0.08);
        addBox(g, 0.34, 1.5, 0.15, matDoorTeal, -0.77, 0, 0.05);
        addBox(g, 0.34, 1.5, 0.15, matDoorTeal, 0.77, 0, 0.05);
        parent.add(g);
      }
    }

    /* ---------------- terrain: ground, river, streets ---------------- */
    (function buildTerrain() {
      var ground = new THREE.Mesh(track(new THREE.PlaneGeometry(300, 190)), matGround);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, 0, 12);
      ground.receiveShadow = true;
      town.add(ground);

      var water = new THREE.Mesh(track(new THREE.PlaneGeometry(300, 42)), matWater);
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, 0.08, -46);
      town.add(water);

      var bank = new THREE.Mesh(track(new THREE.PlaneGeometry(300, 5)), matSand);
      bank.rotation.x = -Math.PI / 2;
      bank.position.set(0, 0.05, -24.5);
      bank.receiveShadow = true;
      town.add(bank);

      // Dock street behind the Nasar house (the street to the new docks, p. 8).
      var street1 = new THREE.Mesh(track(new THREE.PlaneGeometry(150, 5.5)), matStreet);
      street1.rotation.x = -Math.PI / 2;
      street1.position.set(-6, 0.04, -12);
      street1.receiveShadow = true;
      town.add(street1);
      // Street running south from the square past the Nasar front door.
      var street2 = new THREE.Mesh(track(new THREE.PlaneGeometry(5.5, 62)), matStreet);
      street2.rotation.x = -Math.PI / 2;
      street2.position.set(2.8, 0.04, 24);
      street2.receiveShadow = true;
      town.add(street2);
      // Street west toward the meat market and Maria Cervantes' house.
      var street3 = new THREE.Mesh(track(new THREE.PlaneGeometry(5.5, 42)), matStreet);
      street3.rotation.x = -Math.PI / 2;
      street3.position.set(-58, 0.04, 18);
      street3.receiveShadow = true;
      town.add(street3);
      // Street east toward Flora Miguel's and the Vicario house.
      var street4 = new THREE.Mesh(track(new THREE.PlaneGeometry(92, 5.5)), matStreet);
      street4.rotation.x = -Math.PI / 2;
      street4.position.set(20, 0.04, 30);
      street4.receiveShadow = true;
      town.add(street4);
    })();

    /* ---------------- foliage helpers ---------------- */
    var trunkGeo = cylGeo(0.16, 0.26, 2.4, 6);
    var canopyGeo = track(new THREE.IcosahedronGeometry(1.7, 1));
    function addTree(x, z, scale, mat) {
      var g = new THREE.Group();
      var trunk = new THREE.Mesh(trunkGeo, matTrunk);
      trunk.position.y = 1.2;
      trunk.castShadow = true;
      g.add(trunk);
      [[0, 3.8, 0, 1], [-1.1, 3, 0.25, 0.85], [1, 3.2, 0.4, 0.8], [0.1, 3.1, -1, 0.85]].forEach(function (part, index) {
        var crown = new THREE.Mesh(canopyGeo, index % 2 ? matCanopy : (mat || matCanopyLight));
        crown.position.set(part[0], part[1], part[2]);
        crown.scale.set(1.1 * part[3], 0.62 * part[3], part[3]);
        crown.castShadow = true; g.add(crown);
      });
      g.scale.setScalar(scale || 1);
      g.position.set(x, 0, z);
      town.add(g);
      return g;
    }
    var palmTrunkGeo = cylGeo(0.14, 0.24, 4.6, 6);
    var frondGeo = track(new THREE.BufferGeometry()), frondVertices = [], frondIndices = [];
    for (var segment = 0; segment <= 12; segment++) {
      var t = segment / 12, width = Math.sin(Math.PI * t) * 0.43;
      frondVertices.push(t * 3.4, Math.sin(t * Math.PI) * 0.6 - t * t * 0.9, -width, t * 3.4, Math.sin(t * Math.PI) * 0.6 - t * t * 0.9, width);
      if (segment < 12) { var v = segment * 2; frondIndices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
    }
    frondGeo.setAttribute('position', new THREE.Float32BufferAttribute(frondVertices, 3));
    frondGeo.setIndex(frondIndices); frondGeo.computeVertexNormals();
    function addPalm(x, z, ry) {
      var g = new THREE.Group();
      var trunk = new THREE.Mesh(palmTrunkGeo, matTrunk);
      trunk.position.y = 2.3;
      trunk.rotation.z = 0.12;
      trunk.castShadow = true;
      g.add(trunk);
      for (var i = 0; i < 8; i++) {
        var frond = new THREE.Mesh(frondGeo, matFrond);
        var a = (i / 8) * Math.PI * 2;
        frond.position.set(-0.25, 4.6, 0);
        frond.rotation.y = -a;
        frond.castShadow = true;
        g.add(frond);
      }
      g.position.set(x, 0, z);
      g.rotation.y = ry || 0;
      town.add(g);
      return g;
    }

    /* ---------------- buildings (positions from CHRONICLE_PLACES) ---------------- */
    function pos(id) {
      var place = byId[id];
      return place ? mapToWorld(place.x, place.y) : null;
    }

    // The Nasar house: a converted two-storey warehouse between its two doors.
    // Front door faces the square (p. 8); rear door opens toward the docks.
    (function buildNasar() {
      var front = pos('front'), rear = pos('rear');
      if (!front || !rear) return;
      var cx = (front.x + rear.x) / 2;
      var cz = (front.z + rear.z) / 2;
      var w = 12.6, d = Math.abs(front.z - rear.z), h = 7.6;
      var g = new THREE.Group();
      addBox(g, w, h, d, matWall, 0, h / 2, 0);
      addGable(g, w + 1.4, 3.1, d + 1.4, matTin, 0, h, 0, false);
      addBox(g, 7.8, 0.22, 1.8, matWoodDark, 0, 4.45, d / 2 + 0.8);
      addBox(g, 8, 0.12, 0.12, matWoodDark, 0, 5.55, d / 2 + 1.65);
      for (var rail = 0; rail < 11; rail++) addBox(g, 0.08, 1.05, 0.08, matTrim, -3.7 + rail * 0.74, 5, d / 2 + 1.65);
      // Front ("Fatal") door on the square side, at the front-door coordinate.
      addDoor(g, 2.4, 3.4, matDoor, front.x - cx, 1.7, d / 2 + 0.13);
      // Rear door, built a little higher so a horse could enter (p. 8).
      addDoor(g, 2.2, 3.0, matWoodDark, rear.x - cx, 2.0, -d / 2 - 0.13, Math.PI);
      addWindows(g, 3, matWindow, 5.4, [[-w / 2 - 0.06, -d / 4], [-w / 2 - 0.06, 0], [-w / 2 - 0.06, d / 4]], Math.PI / 2);
      addWindows(g, 3, matWindow, 5.4, [[w / 2 + 0.06, -d / 4], [w / 2 + 0.06, 0], [w / 2 + 0.06, d / 4]], Math.PI / 2);
      addWindows(g, 2, matWindow, 5.4, [[-2.6, d / 2 + 0.06], [2.6, d / 2 + 0.06]]);
      g.position.set(cx, 0, cz);
      town.add(g);
    })();

    // Church and parish house, with the bandstand by its front steps (p. 9).
    (function buildChurch() {
      var p = pos('church');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 11, 8, 16, matWallCool, 0, 4, 0);
      addGable(g, 12.2, 3.4, 17.2, matRoof, 0, 8, 0, false);
      addBox(g, 4.4, 15, 4.4, matWallCool, 0, 7.5, -6.5); // bell tower
      var spire = new THREE.Mesh(track(new THREE.ConeGeometry(3.4, 3.4, 4)), matRoof);
      spire.position.set(0, 16.7, -6.5);
      spire.rotation.y = Math.PI / 4;
      spire.castShadow = true;
      g.add(spire);
      addBox(g, 0.16, 1.6, 0.16, matWoodDark, 0, 19.2, -6.5);
      addBox(g, 1.0, 0.16, 0.16, matWoodDark, 0, 19.4, -6.5);
      addDoor(g, 2.6, 3.8, matDoor, 5.62, 1.9, 0, Math.PI / 2); // door faces the square
      addWindows(g, 2, matWindow, 5.6, [[5.56, -4.5], [5.56, 4.5]], Math.PI / 2);
      // Parish house beside the nave.
      addBox(g, 6, 4.5, 7, matWallWarm, -8.6, 2.25, 4);
      addGable(g, 7, 1.8, 8, matRoof, -8.6, 4.5, 4, false);
      g.position.set(p.x, 0, p.z);
      town.add(g);
      // Bandstand near the church steps.
      var b = new THREE.Group();
      addCyl(b, 3.2, 3.4, 0.9, 8, matStone, 0, 0.45, 0);
      for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2;
        addCyl(b, 0.14, 0.14, 2.8, 6, matWoodDark, Math.cos(a) * 2.5, 2.2, Math.sin(a) * 2.5);
      }
      var roofCone = new THREE.Mesh(track(new THREE.ConeGeometry(3.8, 2.2, 8)), matRoof);
      roofCone.position.y = 4.6;
      roofCone.castShadow = true;
      b.add(roofCone);
      b.position.set(p.x + 9.5, 0, p.z + 1);
      town.add(b);
    })();

    // The paved main square, covered with wedding debris that dawn (p. 9).
    (function buildSquare() {
      var p = pos('square');
      if (!p) return;
      var plaza = new THREE.Mesh(boxGeo(38, 0.3, 20), matStone);
      plaza.position.set(p.x, 0.15, p.z);
      plaza.receiveShadow = true;
      town.add(plaza);
      var pavers = new THREE.InstancedMesh(boxGeo(2.35, 0.035, 1.5), matStone, 180);
      var paverTransform = new THREE.Object3D(), paverColor = new THREE.Color();
      for (var paving = 0; paving < 180; paving++) {
        paverTransform.position.set(p.x - 17.5 + (paving % 15) * 2.45, 0.325, p.z - 8.8 + Math.floor(paving / 15) * 1.6);
        paverTransform.updateMatrix(); pavers.setMatrixAt(paving, paverTransform.matrix);
        paverColor.setHSL(0.105, 0.18, 0.59 + (paving % 7) * 0.018); pavers.setColorAt(paving, paverColor);
      }
      pavers.receiveShadow = true; town.add(pavers);
      // Almond trees along one side (p. 9).
      for (var i = 0; i < 6; i++) {
        addTree(p.x - 17 + i * 6.8, p.z + 11.5, 1 + (i % 2) * 0.15, i % 2 ? matCanopy : matCanopyLight);
      }
      // A few bottles left from the wedding, kept abstract and small.
      for (var j = 0; j < 5; j++) {
        addCyl(town, 0.09, 0.11, 0.4, 5, matWindow, p.x - 12 + j * 5.3, 0.5, p.z - 6 + (j % 3) * 2.4);
      }
    })();

    // Clotilde Armenta's milk shop, across from the Nasar house, beside the church (pp. 9, 23).
    (function buildShop() {
      var p = pos('shop');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 9, 5, 8, matBrick, 0, 2.5, 0);
      addGable(g, 10, 2, 9, matRoof, 0, 5, 0, false);
      addDoor(g, 1.8, 2.8, matDoorTeal, 4.62, 1.4, 0, Math.PI / 2); // faces the Nasar house
      var awning = addBox(g, 0.2, 0.14, 6.4, matCanvasCream, 5.6, 3.3, 0);
      awning.rotation.z = -0.28;
      addWindows(g, 2, matWindow, 3.1, [[4.56, -2.6], [4.56, 2.6]], Math.PI / 2);
      g.position.set(p.x, 0, p.z);
      town.add(g);
    })();

    // The Lanao house, next door to the Nasar house on the old-dock side (pp. 47-48).
    (function buildLanao() {
      var p = pos('lanao');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 9, 6, 10, matWallWarm, 0, 3, 0);
      addGable(g, 10, 2.4, 11, matRoof, 0, 6, 0, false);
      addDoor(g, 1.8, 2.8, matDoor, -4.62, 1.4, 0, Math.PI / 2);
      addWindows(g, 2, matWindow, 3.6, [[-1.8, 5.06], [1.8, 5.06]]);
      g.position.set(p.x, 0, p.z);
      town.add(g);
    })();

    // River dock: the loading pier where the bishop's boat passed (pp. 9-10).
    (function buildDock() {
      var p = pos('dock');
      if (!p) return;
      var g = new THREE.Group();
      var deck = addBox(g, 3.6, 0.35, 13, matWood, 0, 0.6, -5.5);
      deck.receiveShadow = true;
      for (var i = 0; i < 4; i++) {
        addCyl(g, 0.16, 0.16, 2.2, 6, matWoodDark, -1.5, -0.2, -1 - i * 3.2);
        addCyl(g, 0.16, 0.16, 2.2, 6, matWoodDark, 1.5, -0.2, -1 - i * 3.2);
      }
      // A smaller older jetty beside the new pier.
      addBox(g, 2.4, 0.3, 7, matWoodDark, -5.2, 0.45, -4);
      // Moored boat.
      var boat = new THREE.Group();
      var hull = new THREE.Mesh(cylGeo(1.15, 1.5, 6.5, 6), matWoodDark);
      hull.rotation.z = Math.PI / 2;
      hull.scale.y = 0.55;
      hull.castShadow = true;
      boat.add(hull);
      addBox(boat, 1.6, 0.9, 1.4, matWood, 0.6, 0.75, 0);
      addCyl(boat, 0.07, 0.07, 3.2, 5, matWoodDark, -0.9, 1.8, 0);
      boat.position.set(4.6, 0.35, -10.5);
      boat.rotation.y = 0.5;
      g.add(boat);
      // Crates and barrels waiting for the weekly boat.
      addBox(g, 1.1, 1.1, 1.1, matWood, 2.2, 0.55, 0.8, 0.4);
      addBox(g, 0.9, 0.9, 0.9, matWood, 2.4, 0.45, 2.1, 0.9);
      addCyl(g, 0.45, 0.45, 1.1, 8, matWoodDark, 3.4, 0.55, 1.6);
      g.position.set(p.x, 0, p.z);
      town.add(g);
      // Palms leaning toward the river.
      addPalm(p.x - 8, p.z + 3, 0.7);
      addPalm(p.x + 10, p.z + 4, 2.2);
    })();

    // Flora Miguel's house, locked until late (pp. 44-45).
    (function buildFlora() {
      var p = pos('flora');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 10, 6, 9, matWallCool, 0, 3, 0);
      addGable(g, 11, 2.4, 10, matRoof, 0, 6, 0, true);
      addDoor(g, 1.9, 2.9, matDoorTeal, 0, 1.45, 4.62);
      addWindows(g, 2, matWindow, 3.6, [[-3, 4.56], [3, 4.56]]);
      // Locked-house fence along the front.
      for (var i = 0; i < 6; i++) addCyl(g, 0.08, 0.08, 1.2, 5, matWoodDark, -5 + i * 2, 0.6, 6.4);
      addBox(g, 10.4, 0.12, 0.12, matWoodDark, 0, 1.1, 6.4);
      g.position.set(p.x, 0, p.z);
      town.add(g);
    })();

    // Meat market: grindstone, awnings, the lunch stands by the old harbor (pp. 22, 28).
    (function buildMarket() {
      var p = pos('market');
      if (!p) return;
      var g = new THREE.Group();
      for (var s = 0; s < 3; s++) {
        var sx = -7 + s * 7;
        for (var c = 0; c < 4; c++) {
          addCyl(g, 0.12, 0.12, 2.6, 5, matWoodDark, sx - 2.4 + (c % 2) * 4.8, 1.3, -2 + (c > 1 ? 4 : 0));
        }
        var roof = addBox(g, 5.6, 0.14, 5.2, s % 2 ? matCanvasRed : matCanvasCream, sx, 2.75, 0);
        roof.rotation.x = 0.1;
        addBox(g, 4.4, 0.9, 1.4, matWood, sx, 0.85, 1.2); // counter
      }
      // The grindstone the twins sharpened the knives on (p. 22).
      addBox(g, 1.6, 0.8, 1.0, matWoodDark, 9.4, 0.4, 2.6);
      var stone = new THREE.Mesh(cylGeo(0.85, 0.85, 0.3, 14), matStone);
      stone.rotation.x = Math.PI / 2;
      stone.position.set(9.4, 1.35, 2.6);
      stone.castShadow = true;
      g.add(stone);
      g.position.set(p.x, 0, p.z);
      town.add(g);
    })();

    // Vicario family house: brick walls, palm roof, terrace of flowerpots,
    // pigsty with its sacrificial stone at the rear (p. 18).
    (function buildVicario() {
      var p = pos('vicario');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 10, 5.5, 9, matWallYellow, 0, 2.75, 0);
      addBox(g, 10.4, 0.5, 9.4, matBrick, 0, 0.35, 0); // brick base course
      addGable(g, 11, 3, 10, matRoofPalm, 0, 5.5, 0, false);
      addDoor(g, 1.8, 2.7, matDoor, 0, 1.35, -4.62, Math.PI);
      // Terrace with flowerpots along the front.
      addBox(g, 10.4, 0.24, 2.6, matStone, 0, 0.12, -6.2);
      for (var i = 0; i < 5; i++) {
        addCyl(g, 0.32, 0.24, 0.5, 6, matBrick, -4 + i * 2, 0.5, -6.4);
        var bloom = new THREE.Mesh(canopyGeo, i % 2 ? matCanopyLight : matCanopy);
        bloom.scale.setScalar(0.28);
        bloom.position.set(-4 + i * 2, 0.95, -6.4);
        g.add(bloom);
      }
      // Pigsty with its sacrificial stone at the rear.
      addBox(g, 3.2, 1.6, 2.6, matWoodDark, 3.6, 0.8, 6.6);
      var slab = addBox(g, 1.2, 0.5, 0.9, matStone, 0.6, 0.25, 6.8);
      slab.rotation.y = 0.3;
      g.position.set(p.x, 0, p.z);
      town.add(g);
      // Fruit trees and hens' yard (p. 18).
      addTree(p.x - 7, p.z + 6, 0.9, matCanopyLight);
      addTree(p.x + 7.5, p.z + 4.5, 1.0, matCanopy);
    })();

    // Yamil Shaium's dry-goods store near the corner of the square (p. 41).
    (function buildYamil() {
      var p = pos('yamil');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 8, 5, 7, matWallWarm, 0, 2.5, 0);
      addGable(g, 9, 2, 8, matRoof, 0, 5, 0, false);
      addDoor(g, 1.8, 2.8, matDoor, 0, 1.4, -3.62, Math.PI); // door toward the square
      var awning = addBox(g, 5.4, 0.12, 1.8, matCanvasRed, 0, 3.2, -4.2);
      awning.rotation.x = 0.3;
      addBox(g, 3.2, 0.7, 0.14, matWoodDark, 0, 4.1, -3.56); // sign board
      g.position.set(p.x, 0, p.z);
      town.add(g);
    })();

    // The widower Xius's farmhouse on its windswept hill (p. 16).
    (function buildXius() {
      var p = pos('xius');
      if (!p) return;
      var hill = new THREE.Mesh(
        track(new THREE.SphereGeometry(17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
        matHill
      );
      hill.scale.y = 0.34;
      hill.position.set(p.x, 0, p.z);
      hill.receiveShadow = true;
      town.add(hill);
      var g = new THREE.Group();
      addBox(g, 8.5, 5, 7.5, matWallCool, 0, 2.5, 0);
      addGable(g, 9.5, 2.6, 8.5, matRoof, 0, 5, 0, true);
      addDoor(g, 1.7, 2.6, matDoor, 0, 1.3, 3.87);
      // Terrace overlooking the marshes and the Caribbean horizon (p. 16).
      addBox(g, 9, 0.2, 2.4, matStone, 0, 0.1, 5.2);
      g.position.set(p.x, 5.45, p.z);
      town.add(g);
    })();

    // The social club with its domino table (pp. 16-17, 43).
    (function buildClub() {
      var p = pos('club');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 12, 6.5, 9, matWallCool, 0, 3.25, 0);
      addGable(g, 13, 2.6, 10, matRoof, 0, 6.5, 0, false);
      addDoor(g, 2.0, 3.0, matDoorTeal, 0, 1.5, 4.62);
      addCyl(g, 0.22, 0.24, 4.4, 8, matStone, -2.2, 2.2, 5.3);
      addCyl(g, 0.22, 0.24, 4.4, 8, matStone, 2.2, 2.2, 5.3);
      addBox(g, 6.4, 0.5, 2.2, matRoof, 0, 4.7, 5.2); // portico slab
      addWindows(g, 2, matWindow, 4.2, [[-3.8, 4.56], [3.8, 4.56]]);
      g.position.set(p.x, 0, p.z);
      town.add(g);
    })();

    // Maria Alejandrina Cervantes' house: rooms for rent and a large
    // dancing courtyard (p. 27).
    (function buildMaria() {
      var p = pos('maria');
      if (!p) return;
      var g = new THREE.Group();
      addBox(g, 10, 5.5, 8, matWallWarm, 0, 2.75, -3);
      addGable(g, 11, 2.4, 9, matRoof, 0, 5.5, -3, false);
      addDoor(g, 1.9, 2.8, matDoor, 0, 1.4, 1.12);
      // Dancing courtyard: paving inside a low wall.
      addBox(g, 12, 0.2, 9, matStone, 0, 0.1, 6.5);
      addBox(g, 12, 0.9, 0.3, matWallWarm, 0, 0.45, 10.8);
      addBox(g, 0.3, 0.9, 9, matWallWarm, -6, 0.45, 6.5);
      addBox(g, 0.3, 0.9, 9, matWallWarm, 6, 0.45, 6.5);
      g.position.set(p.x, 0, p.z);
      town.add(g);
      addTree(p.x - 8, p.z - 6, 0.95, matCanopy);
    })();
    (function landscape() {
      var routes = [['market', 'shop'], ['square', 'yamil'], ['yamil', 'club'], ['club', 'flora'], ['flora', 'vicario'], ['rear', 'dock'], ['dock', 'xius'], ['lanao', 'dock'], ['church', 'maria']];
      routes.forEach(function (route) {
        var a = pos(route[0]), b = pos(route[1]); if (!a || !b) return;
        var dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
        var path = addBox(town, 2.6, 0.035, length, matStreet, (a.x + b.x) / 2, 0.055, (a.z + b.z) / 2);
        path.rotation.y = Math.atan2(dx, dz); path.castShadow = false;
      });
      var rng = mulberry32(7681), patchMat = track(new THREE.MeshLambertMaterial({ color: 0x859160, transparent: true, opacity: 0.32, depthWrite: false }));
      var patches = new THREE.InstancedMesh(track(new THREE.CircleGeometry(1, 18)), patchMat, 70);
      var transform = new THREE.Object3D();
      for (var i = 0; i < 70; i++) {
        var x = (rng() - 0.5) * 190, z = -18 + rng() * 90;
        transform.position.set(x, 0.025, z); transform.rotation.set(-Math.PI / 2, 0, 0); transform.scale.set(3 + rng() * 6, 1.5 + rng() * 3, 1);
        transform.updateMatrix(); patches.setMatrixAt(i, transform.matrix);
      }
      town.add(patches);
      [[-91,-15],[-87,8],[-88,35],[-77,51],[-54,62],[-28,64],[-2,63],[20,65],[71,45],[88,27],[78,2],[61,-15]].forEach(function (p, index) {
        addTree(p[0], p[1], 0.9 + index % 3 * 0.15, index % 2 ? matCanopy : matCanopyLight);
      });
      [[-85,-21],[-65,-21],[-35,-21],[8,-21],[74,-21]].forEach(function (p, index) { addPalm(p[0], p[1], index * 0.7); });
    })();

    /* ---------------- street lamps around the square ---------------- */
    var lampHeadMat = track(new THREE.MeshLambertMaterial({ color: 0x8a7a52, emissive: 0xffb765, emissiveIntensity: 0 }));
    var lampLights = [];
    (function buildLamps() {
      var p = pos('square') || { x: -22, z: 11 };
      var corners = [[-17, -8], [17, -8], [-17, 8], [17, 8]];
      corners.forEach(function (c) {
        var g = new THREE.Group();
        addCyl(g, 0.09, 0.13, 3.6, 6, matWoodDark, 0, 1.8, 0);
        var head = new THREE.Mesh(track(new THREE.SphereGeometry(0.3, 8, 6)), lampHeadMat);
        head.position.y = 3.75;
        g.add(head);
        var light = new THREE.PointLight(0xffb765, 0, 30, 2);
        light.position.y = 3.8;
        g.add(light);
        lampLights.push(light);
        g.position.set(p.x + c[0], 0, p.z + c[1]);
        town.add(g);
      });
    })();

    /* ---------------- lights & sky ---------------- */
    var hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a7a5c, 0.85);
    scene.add(hemi);
    var dir = new THREE.DirectionalLight(0xfff2dc, 1.1);
    dir.position.set(70, 110, 40);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.bias = -0.00015;
    dir.shadow.normalBias = 0.04;
    dir.shadow.camera.left = -110;
    dir.shadow.camera.right = 110;
    dir.shadow.camera.top = 110;
    dir.shadow.camera.bottom = -110;
    dir.shadow.camera.far = 400;
    scene.add(dir);

    var lightState = {
      sky: new THREE.Color(LIGHT_PRESETS.day.sky),
      fog: new THREE.Color(LIGHT_PRESETS.day.fog),
      hemiSky: new THREE.Color(LIGHT_PRESETS.day.hemiSky),
      hemiGround: new THREE.Color(LIGHT_PRESETS.day.hemiGround),
      dirColor: new THREE.Color(LIGHT_PRESETS.day.dirColor),
      water: new THREE.Color(0xffffff),
      hemiInt: 0.85, dirInt: 1.1, lamp: 0,
      dirPos: new THREE.Vector3(70, 110, 40),
      fogNear: 200, fogFar: 520
    };
    var lightGoal = {
      sky: lightState.sky.clone(), fog: lightState.fog.clone(),
      hemiSky: lightState.hemiSky.clone(), hemiGround: lightState.hemiGround.clone(),
      dirColor: lightState.dirColor.clone(), water: lightState.water.clone(),
      hemiInt: 0.85, dirInt: 1.1, lamp: 0,
      dirPos: lightState.dirPos.clone(), fogNear: 200, fogFar: 520
    };

    function applyLightGoal(name, instant) {
      var preset = LIGHT_PRESETS[name] || LIGHT_PRESETS.unknown;
      lightGoal.sky.setHex(preset.sky);
      lightGoal.fog.setHex(preset.fog);
      lightGoal.hemiSky.setHex(preset.hemiSky);
      lightGoal.hemiGround.setHex(preset.hemiGround);
      lightGoal.dirColor.setHex(preset.dirColor);
      lightGoal.water.setHex(preset.water);
      lightGoal.hemiInt = preset.hemiInt;
      lightGoal.dirInt = preset.dirInt;
      lightGoal.lamp = preset.lamp;
      lightGoal.dirPos.set(preset.dirPos[0], preset.dirPos[1], preset.dirPos[2]);
      lightGoal.fogNear = preset.fogNear;
      lightGoal.fogFar = preset.fogFar;
      if (instant) {
        lightState.sky.copy(lightGoal.sky);
        lightState.fog.copy(lightGoal.fog);
        lightState.hemiSky.copy(lightGoal.hemiSky);
        lightState.hemiGround.copy(lightGoal.hemiGround);
        lightState.dirColor.copy(lightGoal.dirColor);
        lightState.water.copy(lightGoal.water);
        lightState.hemiInt = lightGoal.hemiInt;
        lightState.dirInt = lightGoal.dirInt;
        lightState.lamp = lightGoal.lamp;
        lightState.dirPos.copy(lightGoal.dirPos);
        lightState.fogNear = lightGoal.fogNear;
        lightState.fogFar = lightGoal.fogFar;
      }
    }

    function pushLightToScene() {
      scene.background.copy(lightState.sky);
      scene.fog.color.copy(lightState.fog);
      scene.fog.near = lightState.fogNear;
      scene.fog.far = lightState.fogFar;
      hemi.color.copy(lightState.hemiSky);
      hemi.groundColor.copy(lightState.hemiGround);
      hemi.intensity = lightState.hemiInt;
      dir.color.copy(lightState.dirColor);
      dir.intensity = lightState.dirInt;
      dir.position.copy(lightState.dirPos);
      matWater.color.copy(lightState.water);
      lampHeadMat.emissiveIntensity = lightState.lamp;
      lampLights.forEach(function (light) {
        light.intensity = lightState.lamp * 1.15;
        light.visible = lightState.lamp > 0.03;
      });
    }

    /* ---------------- place markers ---------------- */
    var markers = {};
    var pickables = [];
    var selectedIds = {};

    function makeNumberSprite(number) {
      var c = makeCanvas(128);
      var ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(12,26,30,0.85)';
      ctx.beginPath(); ctx.arc(64, 64, 52, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#dfbe80'; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = '#f3e9d5';
      ctx.font = 'bold 56px Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(number), 64, 68);
      var tex = track(new THREE.CanvasTexture(c));
      tex.encoding = THREE.sRGBEncoding;
      var sprite = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })));
      sprite.scale.set(2.6, 2.6, 1);
      return sprite;
    }

    function makeNameSprite(name) {
      var c = makeCanvas(512);
      c.height = 128;
      var ctx = c.getContext('2d');
      var size = 44;
      ctx.font = 'bold ' + size + 'px Georgia, serif';
      while (size > 22 && ctx.measureText(name).width > 470) {
        size -= 2;
        ctx.font = 'bold ' + size + 'px Georgia, serif';
      }
      ctx.fillStyle = 'rgba(12,26,30,0.62)';
      var w = Math.min(500, ctx.measureText(name).width + 44);
      ctx.fillRect((512 - w) / 2, 30, w, 68);
      ctx.fillStyle = '#f3e9d5';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(name, 256, 66);
      var tex = track(new THREE.CanvasTexture(c));
      tex.encoding = THREE.sRGBEncoding;
      var sprite = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })));
      sprite.scale.set(11, 2.75, 1);
      return sprite;
    }

    var MARKER_HEIGHTS = {
      church: 19.5, xius: 14.5, front: 12, rear: 12, lanao: 10, dock: 7,
      square: 7.5, shop: 8.5, flora: 10, market: 6.5, vicario: 10,
      yamil: 8.5, club: 10.5, maria: 9.5
    };
    var diamondGeo = track(new THREE.OctahedronGeometry(0.85));
    var ringGeo = track(new THREE.RingGeometry(1.35, 1.75, 36));

    places.forEach(function (place, index) {
      var w = mapToWorld(place.x, place.y);
      var g = new THREE.Group();
      g.position.set(w.x, 0, w.z);

      var ringMat = track(new THREE.MeshBasicMaterial({ color: 0xdfbe80, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;
      g.add(ring);

      var diamondMat = track(new THREE.MeshBasicMaterial({ color: 0xdfbe80 }));
      var diamond = new THREE.Mesh(diamondGeo, diamondMat);
      var baseY = MARKER_HEIGHTS[place.id] || 10;
      diamond.position.y = baseY;
      g.add(diamond);

      var number = makeNumberSprite(index + 1);
      number.position.y = baseY + 2.2;
      g.add(number);

      var label = makeNameSprite(place.name);
      label.position.y = baseY + 4.6;
      g.add(label);

      [ring, diamond, number, label].forEach(function (node) { node.userData.placeId = place.id; });
      g.userData = {
        placeId: place.id, diamond: diamond, ring: ring, ringMat: ringMat,
        diamondMat: diamondMat, baseY: baseY, phase: index * 0.7, world: w
      };
      town.add(g);
      markers[place.id] = g;
      pickables.push(ring, diamond, number, label);
    });

    function setMarkerSelected(id, selected) {
      var marker = markers[id];
      if (!marker) return;
      var data = marker.userData;
      data.diamondMat.color.setHex(selected ? 0xbe4b3d : 0xdfbe80);
      data.ringMat.color.setHex(selected ? 0xbe4b3d : 0xdfbe80);
      data.ringMat.opacity = selected ? 1 : 0.85;
    }

    function setSelection(ids) {
      Object.keys(selectedIds).forEach(function (id) {
        if (ids.indexOf(id) === -1) { delete selectedIds[id]; setMarkerSelected(id, false); }
      });
      ids.forEach(function (id) {
        if (!selectedIds[id] && markers[id]) { selectedIds[id] = true; setMarkerSelected(id, true); }
      });
    }

    /* ---------------- camera rig ---------------- */
    function computeOverview() {
      var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      places.forEach(function (place) {
        var w = mapToWorld(place.x, place.y);
        minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x);
        minZ = Math.min(minZ, w.z); maxZ = Math.max(maxZ, w.z);
      });
      if (!places.length) { minX = -50; maxX = 50; minZ = -40; maxZ = 40; }
      var cx = (minX + maxX) / 2;
      var cz = (minZ + maxZ) / 2;
      var span = Math.max(maxX - minX, (maxZ - minZ) * 1.6);
      return { tx: cx, ty: 0, tz: cz, yaw: 0.42, pitch: 0.92, dist: clamp(span * 1.15, 90, 230) };
    }
    var OVERVIEW = computeOverview();
    var cur = { tx: OVERVIEW.tx, ty: OVERVIEW.ty, tz: OVERVIEW.tz, yaw: OVERVIEW.yaw, pitch: OVERVIEW.pitch, dist: OVERVIEW.dist };
    var goal = { tx: cur.tx, ty: cur.ty, tz: cur.tz, yaw: cur.yaw, pitch: cur.pitch, dist: cur.dist };
    var flight = null; // {from, to, start, dur}

    function applyCamera() {
      var cp = Math.cos(cur.pitch), sp = Math.sin(cur.pitch);
      camera.position.set(
        cur.tx + cur.dist * cp * Math.sin(cur.yaw),
        cur.ty + cur.dist * sp,
        cur.tz + cur.dist * cp * Math.cos(cur.yaw)
      );
      camera.lookAt(cur.tx, cur.ty, cur.tz);
    }

    function flyTo(target, animate) {
      goal = { tx: target.tx, ty: target.ty, tz: target.tz, yaw: target.yaw, pitch: target.pitch, dist: target.dist };
      if (animate && !reduceMotion && !document.documentElement.classList.contains('ambient-off')) {
        flight = { from: { tx: cur.tx, ty: cur.ty, tz: cur.tz, yaw: cur.yaw, pitch: cur.pitch, dist: cur.dist }, to: goal, start: performance.now(), dur: 1600 };
      } else {
        flight = null;
        cur = { tx: goal.tx, ty: goal.ty, tz: goal.tz, yaw: goal.yaw, pitch: goal.pitch, dist: goal.dist };
      }
    }

    function cancelFlightSnapGoal() {
      if (flight) { flight = null; }
      goal = { tx: cur.tx, ty: cur.ty, tz: cur.tz, yaw: cur.yaw, pitch: cur.pitch, dist: cur.dist };
    }

    function clampGoal() {
      goal.pitch = clamp(goal.pitch, 0.14, 1.45);
      goal.dist = clamp(goal.dist, 14, 260);
      goal.tx = clamp(goal.tx, -110, 110);
      goal.tz = clamp(goal.tz, -75, 85);
      goal.ty = clamp(goal.ty, 0, 30);
    }

    function focus(ids, animate) {
      if (typeof ids === 'string') ids = [ids];
      ids = (ids || []).filter(function (id) { return markers[id]; });
      // An empty selection clears highlighting but never invents a location,
      // so the camera stays exactly where the reader left it.
      if (!ids.length) { setSelection([]); cancelFlightSnapGoal(); return; }
      setSelection(ids);
      var cx = 0, cz = 0, radius = 0;
      ids.forEach(function (id) {
        var w = markers[id].userData.world;
        cx += w.x; cz += w.z;
      });
      cx /= ids.length; cz /= ids.length;
      ids.forEach(function (id) {
        var w = markers[id].userData.world;
        radius = Math.max(radius, Math.hypot(w.x - cx, w.z - cz));
      });
      var dist = ids.length === 1 ? 34 : clamp(radius * 2.4 + 26, 42, 220);
      flyTo({
        tx: cx, ty: 2, tz: cz,
        yaw: cur.yaw,
        pitch: ids.length === 1 ? 0.62 : 0.85,
        dist: dist
      }, animate !== false);
    }

    function resetView(animate) {
      flyTo({ tx: OVERVIEW.tx, ty: OVERVIEW.ty, tz: OVERVIEW.tz, yaw: OVERVIEW.yaw, pitch: OVERVIEW.pitch, dist: OVERVIEW.dist }, animate !== false);
    }

    function setLight(light) {
      applyLightGoal(light, reduceMotion || document.documentElement.classList.contains('ambient-off'));
    }

    /* ---------------- pointer / touch controls ---------------- */
    var pointers = {};
    var pointerCount = 0;
    var dragButton = 0;
    var dragMoved = 0;
    var downTime = 0;
    var downPos = null;
    var pinchStart = 0;
    var pinchDist = 0;
    var pinchMid = null;
    var hoverCheck = null;

    function pointerPos(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect: rect };
    }

    function panBy(dx, dy) {
      var sinY = Math.sin(goal.yaw), cosY = Math.cos(goal.yaw);
      var scale = goal.dist * 0.0016;
      // Camera ground basis: right = (cosY, 0, -sinY), forward = (-sinY, 0, -cosY).
      // Dragging right moves the target left; dragging down moves it away.
      goal.tx += (-dx * cosY - dy * sinY) * scale;
      goal.tz += (dx * sinY - dy * cosY) * scale;
      clampGoal();
    }

    function onPointerDown(event) {
      container.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
      pointerCount++;
      cancelFlightSnapGoal();
      if (pointerCount === 1) {
        dragButton = event.button;
        dragMoved = 0;
        downTime = performance.now();
        downPos = { x: event.clientX, y: event.clientY };
      } else if (pointerCount === 2) {
        var pts = Object.keys(pointers).map(function (k) { return pointers[k]; });
        pinchStart = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchDist = goal.dist;
        pinchMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      }
      event.preventDefault();
    }

    function onPointerMove(event) {
      if (!pointers[event.pointerId]) {
        hoverCheck = { x: event.clientX, y: event.clientY };
        return;
      }
      var prev = pointers[event.pointerId];
      var dx = event.clientX - prev.x;
      var dy = event.clientY - prev.y;
      pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
      if (pointerCount === 1) {
        dragMoved += Math.abs(dx) + Math.abs(dy);
        if (dragButton === 2 || event.shiftKey) {
          panBy(dx, dy);
        } else {
          goal.yaw -= dx * 0.0052;
          goal.pitch = clamp(goal.pitch + dy * 0.0042, 0.14, 1.45);
        }
      } else if (pointerCount === 2) {
        var pts = Object.keys(pointers).map(function (k) { return pointers[k]; });
        var distNow = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchStart > 0 && distNow > 0) {
          goal.dist = clamp(pinchDist * (pinchStart / distNow), 14, 260);
        }
        var mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        if (pinchMid) panBy((mid.x - pinchMid.x) * 1.4, (mid.y - pinchMid.y) * 1.4);
        pinchMid = mid;
        dragMoved += Math.abs(dx) + Math.abs(dy);
      }
      event.preventDefault();
    }

    function onPointerUp(event) {
      var wasTracked = !!pointers[event.pointerId];
      delete pointers[event.pointerId];
      pointerCount = Math.max(0, pointerCount - 1);
      if (wasTracked && pointerCount === 0) {
        var isClick = dragMoved < 7 && performance.now() - downTime < 600 &&
          downPos && Math.hypot(event.clientX - downPos.x, event.clientY - downPos.y) < 7;
        if (isClick) pickAt(event.clientX, event.clientY);
      }
      if (pointerCount < 2) { pinchStart = 0; pinchMid = null; }
    }

    function onWheel(event) {
      cancelFlightSnapGoal();
      goal.dist = clamp(goal.dist * Math.exp(event.deltaY * 0.0011), 14, 260);
      event.preventDefault();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', function (event) { event.preventDefault(); });

    function onKeyDown(event) {
      var handled = true;
      switch (event.key) {
        case 'ArrowLeft': cancelFlightSnapGoal(); goal.yaw += 0.16; break;
        case 'ArrowRight': cancelFlightSnapGoal(); goal.yaw -= 0.16; break;
        case 'ArrowUp': cancelFlightSnapGoal(); goal.pitch = clamp(goal.pitch + 0.08, 0.14, 1.45); break;
        case 'ArrowDown': cancelFlightSnapGoal(); goal.pitch = clamp(goal.pitch - 0.08, 0.14, 1.45); break;
        case '+': case '=': cancelFlightSnapGoal(); goal.dist = clamp(goal.dist * 0.82, 14, 260); break;
        case '-': case '_': cancelFlightSnapGoal(); goal.dist = clamp(goal.dist * 1.22, 14, 260); break;
        case 'r': case 'R': case '0': case 'Home': resetView(true); break;
        default: handled = false;
      }
      if (handled) event.preventDefault();
    }
    container.addEventListener('keydown', onKeyDown);

    /* ---------------- on-screen controls ---------------- */
    var controls = document.createElement('div');
    controls.setAttribute('style', 'position:absolute;top:10px;right:10px;display:flex;gap:6px;z-index:2;');
    function makeButton(label, aria, onClick) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.setAttribute('aria-label', aria);
      btn.setAttribute('style',
        'min-width:44px;min-height:42px;font:700 18px/1 Arial,sans-serif;color:#f3e9d5;' +
        'background:#182e32;border:1px solid #718783;cursor:pointer;border-radius:3px;');
      btn.addEventListener('click', function (event) { event.stopPropagation(); onClick(); });
      controls.appendChild(btn);
      return btn;
    }
    makeButton('+', 'Zoom in', function () { cancelFlightSnapGoal(); goal.dist = clamp(goal.dist * 0.78, 14, 260); });
    makeButton('−', 'Zoom out', function () { cancelFlightSnapGoal(); goal.dist = clamp(goal.dist * 1.28, 14, 260); });
    makeButton('⟲', 'Reset view of the whole town', function () { resetView(true); });
    container.appendChild(controls);

    var hint = document.createElement('div');
    hint.setAttribute('style',
      'position:absolute;left:10px;bottom:8px;z-index:2;pointer-events:none;' +
      'color:#dfbe80;font:11px Arial,sans-serif;text-shadow:0 1px 2px #000;');
    hint.textContent = 'Drag to orbit · scroll or pinch to zoom · shift-drag to pan · arrow keys, +, −, R';
    container.appendChild(hint);

    /* ---------------- screen-reader place list ---------------- */
    var srList = document.createElement('div');
    srList.setAttribute('style',
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;');
    srList.setAttribute('aria-label', 'Town places in 3D');
    places.forEach(function (place) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Go to ' + place.name + ' in 3D';
      btn.addEventListener('click', function () {
        focus([place.id], true);
        onPlace(place.id);
      });
      srList.appendChild(btn);
    });
    container.appendChild(srList);

    /* ---------------- picking & hover ---------------- */
    var raycaster = new THREE.Raycaster();
    var pointerNdc = new THREE.Vector2();
    var hoveredId = null;

    function pickAt(clientX, clientY) {
      var p = pointerPos({ clientX: clientX, clientY: clientY });
      pointerNdc.set((p.x / p.rect.width) * 2 - 1, -(p.y / p.rect.height) * 2 + 1);
      raycaster.setFromCamera(pointerNdc, camera);
      var hits = raycaster.intersectObjects(pickables, false);
      if (!hits.length) return;
      var id = hits[0].object.userData.placeId;
      if (!id) return;
      setSelection([id]);
      onPlace(id);
    }

    function updateHover() {
      if (!hoverCheck) return;
      var p = pointerPos(hoverCheck);
      hoverCheck = null;
      pointerNdc.set((p.x / p.rect.width) * 2 - 1, -(p.y / p.rect.height) * 2 + 1);
      raycaster.setFromCamera(pointerNdc, camera);
      var hits = raycaster.intersectObjects(pickables, false);
      var id = hits.length ? hits[0].object.userData.placeId : null;
      if (id !== hoveredId) {
        if (hoveredId && markers[hoveredId]) markers[hoveredId].userData.diamond.scale.setScalar(1);
        hoveredId = id;
        if (hoveredId && markers[hoveredId]) markers[hoveredId].userData.diamond.scale.setScalar(1.3);
        canvas.style.cursor = hoveredId ? 'pointer' : '';
      }
    }

    /* ---------------- sizing ---------------- */
    function resize() {
      var rect = container.getBoundingClientRect();
      var w = Math.max(1, Math.floor(rect.width));
      var h = Math.max(1, Math.floor(rect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(clamp(window.devicePixelRatio || 1, 1, 2));
      renderer.setSize(w, h, false);
    }
    var resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    var inView = true;
    var intersectionObserver = null;
    if (window.IntersectionObserver) {
      intersectionObserver = new IntersectionObserver(function (entries) {
        inView = entries[0] ? entries[0].isIntersecting : true;
      }, { threshold: 0.02 });
      intersectionObserver.observe(container);
    }

    /* ---------------- render loop ---------------- */
    var rafId = 0;
    var lastTime = performance.now();
    var destroyed = false;

    function frame(now) {
      if (destroyed) return;
      rafId = requestAnimationFrame(frame);
      if (document.hidden || !inView) { lastTime = now; return; }
      var dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Camera flight / damping.
      if (flight) {
        var p = clamp((now - flight.start) / flight.dur, 0, 1);
        var e = easeInOutCubic(p);
        ['tx', 'ty', 'tz', 'yaw', 'pitch', 'dist'].forEach(function (k) {
          cur[k] = lerp(flight.from[k], flight.to[k], e);
        });
        if (p >= 1) flight = null;
      } else {
        var follow = 1 - Math.exp(-dt * 7);
        ['tx', 'ty', 'tz', 'yaw', 'pitch', 'dist'].forEach(function (k) {
          cur[k] += (goal[k] - cur[k]) * follow;
        });
      }
      applyCamera();

      // Light transition.
      var lf = 1 - Math.exp(-dt * 3);
      lightState.sky.lerp(lightGoal.sky, lf);
      lightState.fog.lerp(lightGoal.fog, lf);
      lightState.hemiSky.lerp(lightGoal.hemiSky, lf);
      lightState.hemiGround.lerp(lightGoal.hemiGround, lf);
      lightState.dirColor.lerp(lightGoal.dirColor, lf);
      lightState.water.lerp(lightGoal.water, lf);
      lightState.hemiInt = lerp(lightState.hemiInt, lightGoal.hemiInt, lf);
      lightState.dirInt = lerp(lightState.dirInt, lightGoal.dirInt, lf);
      lightState.lamp = lerp(lightState.lamp, lightGoal.lamp, lf);
      lightState.dirPos.lerp(lightGoal.dirPos, lf);
      lightState.fogNear = lerp(lightState.fogNear, lightGoal.fogNear, lf);
      lightState.fogFar = lerp(lightState.fogFar, lightGoal.fogFar, lf);
      pushLightToScene();

      // Ambient motion (skipped entirely under reduced motion).
      if (!reduceMotion && !document.documentElement.classList.contains('ambient-off')) {
        var t = now / 1000;
        var waterMap = matWater.map;
        waterMap.offset.x = (t * 0.014) % 1;
        waterMap.offset.y = (t * 0.006) % 1;
        Object.keys(markers).forEach(function (id) {
          var data = markers[id].userData;
          data.diamond.position.y = data.baseY + Math.sin(t * 1.6 + data.phase) * 0.35;
          data.diamond.rotation.y = t * 0.8 + data.phase;
        });
      }

      updateHover();
      renderer.render(scene, camera);
    }

    /* ---------------- teardown ---------------- */
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', resize);
      if (intersectionObserver) intersectionObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      container.removeEventListener('keydown', onKeyDown);
      disposables.forEach(function (resource) {
        if (resource && typeof resource.dispose === 'function') resource.dispose();
      });
      renderer.dispose();
      if (typeof renderer.forceContextLoss === 'function') renderer.forceContextLoss();
      container.removeChild(canvas);
      container.removeChild(controls);
      container.removeChild(hint);
      container.removeChild(srList);
      if (window.__chronicleTown3DDebug === api) window.__chronicleTown3DDebug = null;
    }

    /* ---------------- go ---------------- */
    resize();
    applyLightGoal('day', true);
    pushLightToScene();
    applyCamera();
    rafId = requestAnimationFrame(frame);
    setStatus('3D view ready.');
    window.__chronicleTown3DDebug = api;
    return api;
  }

  window.ChronicleTown3D = { create: create, version: VERSION };
})();
