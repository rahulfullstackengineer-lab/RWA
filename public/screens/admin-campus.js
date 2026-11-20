window.Screens = window.Screens || {};

Screens['admin-campus'] = function() {
  setTimeout(function() {
    if (typeof window.loadLiveCampus === 'function') window.loadLiveCampus();
  }, 30);

  return Shell.render('admin-campus', {
    title: 'Live Campus',
    portal: 'admin',
    breadcrumb: 'Property',
    actions: '<button class="btn btn-secondary btn-sm" onclick="window.loadLiveCampus()">Refresh map</button>',
    content: `
      <div class="page-header" style="margin-bottom:12px;">
        <div class="page-header-left">
          <div class="page-title">Society structure</div>
          <div class="page-subtitle" id="campusSubtitle">Loading gates, blocks, guards, vehicles, visitors, and complaints.</div>
        </div>
      </div>
      <div class="campus-legend" id="campusLegend"></div>
      <div class="campus-layout">
        <div class="campus-stage" id="campusStage">
          <div style="padding:28px;color:#71717A;">Drawing the society…</div>
        </div>
        <aside class="campus-detail" id="campusDetail">
          <div class="campus-detail-title">Select a flat, gate, or vehicle</div>
          <div class="campus-detail-copy">The map uses the blocks, duty posts, parking slots, visitor passes, and open complaints already saved for this society.</div>
        </aside>
      </div>
    `,
  });
};

window.loadLiveCampus = async function() {
  var stage = document.getElementById('campusStage');
  if (!stage) return;
  var fetchFn = window.apiFetch || fetch;
  var pack = await Promise.all([
    fetchFn('/api/units').catch(function() { return null; }),
    fetchFn('/api/vehicles').catch(function() { return null; }),
    fetchFn('/api/complaints').catch(function() { return null; }),
    fetchFn('/api/entry-passes').catch(function() { return null; }),
    fetchFn('/api/staff/duty').catch(function() { return null; }),
  ]);
  async function read(res) {
    if (!res || !res.ok) return {};
    return res.json().catch(function() { return {}; });
  }
  var unitData = await read(pack[0]);
  var vehicleData = await read(pack[1]);
  var complaintData = await read(pack[2]);
  var passData = await read(pack[3]);
  var dutyData = await read(pack[4]);
  var units = unitData.units || [];
  var blocks = unitData.blocks || [];
  var vehicles = vehicleData.vehicles || [];
  var complaints = complaintData.complaints || [];
  var passes = passData.passes || [];
  var duties = dutyData.duties || [];

  window.__campusSnapshot = { units: units, blocks: blocks, vehicles: vehicles, complaints: complaints, passes: passes, duties: duties };
  window.renderLiveCampus();
};

function campusText(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function campusGateName(value) {
  var text = String(value || '').trim();
  if (!text) return '';
  var match = text.match(/gate\s*(\d+)/i);
  if (match) return 'Gate ' + match[1];
  if (/main/i.test(text) && /gate/i.test(text)) return 'Main Gate';
  if (/gate/i.test(text)) return text.length > 24 ? text.slice(0, 24) : text;
  return '';
}

function campusComplaintTone(status) {
  var key = String(status || '').toUpperCase();
  if (key === 'RESOLVED' || key === 'CLOSED' || key === 'REJECTED') return '';
  if (key === 'IN_PROGRESS' || key === 'ASSIGNED') return 'work';
  if (key === 'WAITING' || key === 'ON_HOLD') return 'wait';
  return 'open';
}

window.renderLiveCampus = function() {
  var snap = window.__campusSnapshot || {};
  var stage = document.getElementById('campusStage');
  var legend = document.getElementById('campusLegend');
  var subtitle = document.getElementById('campusSubtitle');
  if (!stage) return;

  var units = snap.units || [];
  var blockMap = {};
  (snap.blocks || []).forEach(function(block) {
    blockMap[block.id] = { id: block.id, name: block.name || 'Block', units: [] };
  });
  units.forEach(function(unit) {
    var key = unit.blockId || (unit.block && unit.block.id) || 'main';
    if (!blockMap[key]) {
      blockMap[key] = { id: key, name: (unit.block && unit.block.name) || 'Society', units: [] };
    }
    blockMap[key].units.push(unit);
  });
  var towers = Object.keys(blockMap).map(function(key) { return blockMap[key]; });
  if (!towers.length) towers = [{ id: 'main', name: 'Society', units: [] }];
  towers.forEach(function(tower) {
    tower.units.sort(function(a, b) { return String(a.unitNumber).localeCompare(String(b.unitNumber), undefined, { numeric: true }); });
  });

  var complaintsByUnit = {};
  (snap.complaints || []).forEach(function(item) {
    var tone = campusComplaintTone(item.status);
    if (!tone || !item.unitId) return;
    if (!complaintsByUnit[item.unitId]) complaintsByUnit[item.unitId] = [];
    complaintsByUnit[item.unitId].push(item);
  });

  var vehiclesByUnit = {};
  (snap.vehicles || []).forEach(function(vehicle) {
    var unitId = vehicle.unitId || (vehicle.unit && vehicle.unit.id);
    if (!unitId) return;
    if (!vehiclesByUnit[unitId]) vehiclesByUnit[unitId] = [];
    vehiclesByUnit[unitId].push(vehicle);
  });

  var gateNames = [];
  function addGate(name) {
    if (!name || gateNames.indexOf(name) !== -1) return;
    gateNames.push(name);
  }
  (snap.duties || []).forEach(function(duty) {
    if (String(duty.category || '').toUpperCase() !== 'SECURITY' && !/guard|gate|security/i.test(String(duty.role || '') + ' ' + String(duty.locationPost || ''))) return;
    addGate(campusGateName(duty.locationPost) || campusGateName(duty.blockName) || (duty.locationPost ? String(duty.locationPost).slice(0, 24) : ''));
  });
  (snap.passes || []).forEach(function(pass) { addGate(campusGateName(pass.gateNumber) || 'Main Gate'); });
  if (!gateNames.length) gateNames = ['Main Gate'];

  var guardsByGate = {};
  gateNames.forEach(function(name) { guardsByGate[name] = []; });
  window.__campusGates = gateNames;
  window.__campusGuards = guardsByGate;
  window.__campusGates = gateNames;
  window.__campusGuards = guardsByGate;
  (snap.duties || []).forEach(function(duty) {
    var security = String(duty.category || '').toUpperCase() === 'SECURITY' || /guard|gate|security/i.test(String(duty.role || '') + ' ' + String(duty.locationPost || ''));
    if (!security) return;
    var gate = campusGateName(duty.locationPost) || campusGateName(duty.blockName);
    if (!gate || !guardsByGate[gate]) gate = gateNames[0];
    guardsByGate[gate].push(duty);
  });

  var openComplaints = (snap.complaints || []).filter(function(item) { return campusComplaintTone(item.status); });
  var inside = (snap.passes || []).filter(function(pass) { return pass.status === 'CHECKED_IN'; }).slice(0, 12);
  var expected = (snap.passes || []).filter(function(pass) { return pass.status === 'APPROVED'; }).slice(0, 8);
  if (subtitle) {
    subtitle.textContent = towers.length + ' block' + (towers.length === 1 ? '' : 's') + ' · ' + units.length + ' flats · ' + gateNames.length + ' gate' + (gateNames.length === 1 ? '' : 's') + ' · ' + inside.length + ' visitors inside · ' + openComplaints.length + ' open complaints';
  }
  if (legend) {
    legend.innerHTML = [
      ['live', 'Occupied'],
      ['empty', 'Vacant'],
      ['open', 'New complaint'],
      ['work', 'Work in progress'],
      ['wait', 'Waiting'],
      ['car', 'Parked vehicle'],
      ['guest', 'Visitor moving to a flat'],
    ].map(function(item) {
      return '<span><i class="campus-swatch campus-swatch-' + item[0] + '"></i>' + item[1] + '</span>';
    }).join('');
  }

  stage.innerHTML = '<div id="campusViewport" class="campus-viewport"><div class="campus-viewport-note">Drag to look around. Scroll to zoom.</div></div>';
  window.mountCampus3D({
    towers: towers,
    gateNames: gateNames,
    guardsByGate: guardsByGate,
    complaintsByUnit: complaintsByUnit,
    vehiclesByUnit: vehiclesByUnit,
    inside: inside,
    expected: expected,
  });
};

window.mountCampus3D = async function(model) {
  var host = document.getElementById('campusViewport');
  if (!host) return;
  if (window.__campus3D && window.__campus3D.dispose) window.__campus3D.dispose();
  var libs;
  try {
    var THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
    var controlsMod = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js');
    libs = { THREE: THREE, OrbitControls: controlsMod.OrbitControls };
  } catch (err) {
    host.innerHTML = '<div style="padding:28px;color:#71717A;">The 3D map could not load. Check the network and refresh.</div>';
    return;
  }
  if (!document.getElementById('campusViewport')) return;
  var THREE = libs.THREE;
  var OrbitControls = libs.OrbitControls;

  var viewport = document.getElementById('campusViewport');
  var width = viewport.clientWidth || 900;
  var height = viewport.clientHeight || 640;
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewport.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color('#c5d4e4');
  scene.fog = new THREE.Fog('#c5d4e4', 70, 160);
  var camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
  camera.position.set(34, 28, 42);

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 3, 0);
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minPolarAngle = 0.35;
  controls.minDistance = 16;
  controls.maxDistance = 110;

  scene.add(new THREE.HemisphereLight('#f4f7fb', '#6b8f71', 1.15));
  var sun = new THREE.DirectionalLight('#fff4e0', 1.65);
  sun.position.set(24, 40, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  scene.add(sun);

  function canvasTex(canvas) {
    var tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }
  function satellite() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#7ea35a';
    ctx.fillRect(0, 0, 1024, 1024);
    for (var i = 0; i < 1800; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(90,130,60,0.35)' : 'rgba(170,190,90,0.25)';
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 8, 3);
    }
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(0, 700, 1024, 150);
    ctx.fillStyle = '#b7c0c8';
    ctx.fillRect(430, 180, 160, 700);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.setLineDash([18, 16]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 775);
    ctx.lineTo(1024, 775);
    ctx.stroke();
    ctx.setLineDash([]);
    return canvasTex(canvas);
  }
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ map: satellite(), roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  function tree(x, z) {
    var group = new THREE.Group();
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.2, 6), new THREE.MeshStandardMaterial({ color: '#6b4a32', roughness: 0.9 }));
    trunk.position.y = 0.6;
    var crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 8), new THREE.MeshStandardMaterial({ color: '#3f7d3a', roughness: 0.85 }));
    crown.position.y = 1.8;
    trunk.castShadow = crown.castShadow = true;
    group.add(trunk, crown);
    group.position.set(x, 0, z);
    scene.add(group);
  }
  [[-22, -8], [-18, 6], [20, -6], [24, 8], [-8, -16], [10, -18]].forEach(function(spot) { tree(spot[0], spot[1]); });

  function label(text) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fillRect(8, 8, 496, 80);
    ctx.strokeStyle = '#18181B';
    ctx.strokeRect(8, 8, 496, 80);
    ctx.fillStyle = '#18181B';
    ctx.font = '600 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text || '').slice(0, 22), 256, 48);
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(canvas), transparent: true, depthWrite: false }));
    sprite.scale.set(7.2, 1.35, 1);
    return sprite;
  }

  var towers = model.towers || [];
  var span = Math.max(1, towers.length);
  var gap = span > 4 ? 11 : 14;
  var towerPos = {};
  towers.forEach(function(tower, index) {
    var units = (tower.units || []).slice(0, 48);
    var floors = Math.max(4, Math.ceil(units.length / 4));
    var height = Math.min(26, 3.2 + floors * 1.15);
    var depth = 7;
    var widthB = 8;
    var x = (index - (span - 1) / 2) * gap;
    var z = -2;
    towerPos[tower.id] = { x: x, z: z, height: height };
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(widthB, height, depth),
      [
        new THREE.MeshStandardMaterial({ color: '#cfc6b8', roughness: 0.78 }),
        new THREE.MeshStandardMaterial({ color: '#cfc6b8', roughness: 0.78 }),
        new THREE.MeshStandardMaterial({ color: '#8d9398', roughness: 0.6, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ color: '#8d9398', roughness: 0.9 }),
        new THREE.MeshStandardMaterial({ color: '#ddd4c6', roughness: 0.62 }),
        new THREE.MeshStandardMaterial({ color: '#d3cabb', roughness: 0.62 }),
      ]
    );
    body.position.set(x, height / 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(widthB + 0.4, 0.45, depth + 0.4),
      new THREE.MeshStandardMaterial({ color: '#5f6770', roughness: 0.5, metalness: 0.2 })
    );
    roof.position.set(x, height + 0.2, z);
    roof.castShadow = true;
    scene.add(roof);
    var name = label(tower.name);
    name.position.set(x, height + 2.2, z);
    scene.add(name);

    units.forEach(function(unit, unitIndex) {
      var col = unitIndex % 4;
      var row = Math.floor(unitIndex / 4);
      if (row > 11) return;
      var issues = (model.complaintsByUnit && model.complaintsByUnit[unit.id]) || [];
      var tone = issues.length ? campusComplaintTone(issues[0].status) : '';
      var occupied = String(unit.occupancyStatus || '').toUpperCase() !== 'VACANT' && String(unit.occupancyStatus || '') !== '';
      var color = occupied ? '#f6e7bf' : '#7f8b97';
      if (tone === 'open') color = '#ef4444';
      else if (tone === 'work') color = '#ea580c';
      else if (tone === 'wait') color = '#d97706';
      var win = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.72, 0.12),
        new THREE.MeshStandardMaterial({
          color: color,
          emissive: tone ? color : (occupied ? '#f6e7bf' : '#000000'),
          emissiveIntensity: tone ? 0.55 : (occupied ? 0.18 : 0),
          roughness: 0.25,
          metalness: 0.05,
        })
      );
      win.position.set(x - 2.7 + col * 1.8, 1.3 + row * 1.35, z + depth / 2 + 0.08);
      win.userData = { kind: 'unit', id: unit.id };
      win.castShadow = true;
      scene.add(win);
    });

    var parked = [];
    (tower.units || []).forEach(function(unit) {
      parked = parked.concat((model.vehiclesByUnit && model.vehiclesByUnit[unit.id]) || []);
    });
    parked.slice(0, 6).forEach(function(vehicle, carIndex) {
      var paint = '#334155';
      var named = String(vehicle.color || '').toLowerCase();
      if (named.indexOf('white') !== -1) paint = '#f4f4f5';
      else if (named.indexOf('black') !== -1) paint = '#18181b';
      else if (named.indexOf('red') !== -1) paint = '#b91c1c';
      else if (named.indexOf('blue') !== -1) paint = '#1d4ed8';
      else if (named.indexOf('silver') !== -1 || named.indexOf('grey') !== -1 || named.indexOf('gray') !== -1) paint = '#d4d4d8';
      var car = new THREE.Group();
      var shell = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.48, 0.95), new THREE.MeshStandardMaterial({ color: paint, metalness: 0.45, roughness: 0.35 }));
      shell.position.y = 0.38;
      var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.4, 0.82), new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.5, roughness: 0.15 }));
      cabin.position.set(-0.12, 0.75, 0);
      shell.castShadow = cabin.castShadow = true;
      car.add(shell, cabin);
      car.position.set(x - 2.4 + (carIndex % 3) * 2.2, 0, z + depth / 2 + 2.4 + Math.floor(carIndex / 3) * 1.6);
      car.userData = { kind: 'vehicle', id: vehicle.id };
      scene.add(car);
    });
  });

  var gates = model.gateNames || ['Main Gate'];
  var gatePos = {};
  gates.forEach(function(name, index) {
    var x = (index - (gates.length - 1) / 2) * 12;
    var z = 18;
    gatePos[name] = { x: x, z: z };
    var pillarMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
    [-2.2, 2.2].forEach(function(offset) {
      var pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.4, 0.7), pillarMat);
      pillar.position.set(x + offset, 1.7, z);
      pillar.castShadow = true;
      scene.add(pillar);
    });
    var bar = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: '#18181b' }));
    bar.position.set(x, 3.3, z);
    scene.add(bar);
    var gateLabel = label(name);
    gateLabel.position.set(x, 4.6, z);
    scene.add(gateLabel);
    var guards = (model.guardsByGate && model.guardsByGate[name]) || [];
    guards.slice(0, 3).forEach(function(guard, guardIndex) {
      var person = new THREE.Group();
      var legs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.28), new THREE.MeshStandardMaterial({ color: '#1e293b' }));
      legs.position.y = 0.35;
      var torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.32), new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.5 }));
      torso.position.y = 1.05;
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: '#e7c2a2', roughness: 0.6 }));
      head.position.y = 1.6;
      person.add(legs, torso, head);
      person.position.set(x - 1.2 + guardIndex * 1.1, 0, z - 1.5);
      person.userData = { kind: 'guard', gateIndex: index, guardIndex: guardIndex, bob: guardIndex };
      scene.add(person);
    });
  });

  var walkers = [];
  (model.inside || []).forEach(function(pass) {
    var gateName = campusGateName(pass.gateNumber) || gates[0];
    var from = gatePos[gateName] || gatePos[gates[0]];
    var tower = towers.find(function(item) {
      return (item.units || []).some(function(unit) { return unit.id === pass.unitId || unit.unitNumber === pass.residentUnit; });
    }) || towers[0];
    var to = tower ? towerPos[tower.id] : { x: 0, z: -2 };
    if (!from || !to) return;
    var dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 10),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#38bdf8', emissiveIntensity: 0.35 })
    );
    dot.castShadow = true;
    dot.userData = { kind: 'visit', id: pass.id };
    scene.add(dot);
    walkers.push({ mesh: dot, from: from, to: to, t: Math.random() });
  });

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  function onClick(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(scene.children, true);
    for (var i = 0; i < hits.length; i++) {
      var data = hits[i].object.userData || (hits[i].object.parent && hits[i].object.parent.userData);
      if (!data || !data.kind) continue;
      if (data.kind === 'unit') window.showCampusUnit(data.id);
      else if (data.kind === 'vehicle') window.showCampusVehicle(data.id);
      else if (data.kind === 'visit') window.showCampusVisit(data.id);
      else if (data.kind === 'guard') window.showCampusGuard(data.gateIndex, data.guardIndex);
      break;
    }
  }
  renderer.domElement.addEventListener('click', onClick);

  var frame = 0;
  var stopped = false;
  function tick() {
    if (stopped) return;
    if (!viewport.isConnected) { dispose(); return; }
    frame = requestAnimationFrame(tick);
    controls.update();
    var time = performance.now() * 0.001;
    scene.traverse(function(obj) {
      if (obj.userData && obj.userData.kind === 'guard') obj.position.y = Math.sin(time * 2 + obj.userData.bob) * 0.06;
    });
    walkers.forEach(function(walker) {
      walker.t = (walker.t + 0.0035) % 1;
      var ease = walker.t < 0.5 ? 2 * walker.t * walker.t : 1 - Math.pow(-2 * walker.t + 2, 2) / 2;
      walker.mesh.position.set(
        walker.from.x + (walker.to.x - walker.from.x) * ease,
        0.5 + Math.sin(walker.t * Math.PI) * 0.15,
        walker.from.z + (walker.to.z - walker.from.z) * ease
      );
    });
    renderer.render(scene, camera);
  }
  function dispose() {
    stopped = true;
    cancelAnimationFrame(frame);
    renderer.domElement.removeEventListener('click', onClick);
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  function resize() {
    if (!viewport.isConnected) return;
    var nextW = viewport.clientWidth || width;
    var nextH = viewport.clientHeight || height;
    camera.aspect = nextW / nextH;
    camera.updateProjectionMatrix();
    renderer.setSize(nextW, nextH);
  }
  window.addEventListener('resize', resize);
  window.__campus3D = {
    dispose: function() {
      window.removeEventListener('resize', resize);
      dispose();
    },
  };
  tick();
};

window.showCampusUnit = function(unitId) {
  var snap = window.__campusSnapshot || {};
  var unit = (snap.units || []).find(function(item) { return item.id === unitId; });
  var box = document.getElementById('campusDetail');
  if (!unit || !box) return;
  var issues = (snap.complaints || []).filter(function(item) { return item.unitId === unit.id && campusComplaintTone(item.status); });
  var cars = (snap.vehicles || []).filter(function(item) { return item.unitId === unit.id || (item.unit && item.unit.id === unit.id); });
  var visits = (snap.passes || []).filter(function(item) { return item.unitId === unit.id || item.residentUnit === unit.unitNumber; });
  var person = unit.tenantName || unit.ownerName || 'Vacant';
  box.innerHTML = '<div class="campus-detail-title">Flat ' + campusText(unit.unitNumber) + '</div>' +
    '<div class="campus-detail-copy">' + campusText((unit.block && unit.block.name) || 'Society') + ' · ' + campusText(person) + '</div>' +
    '<div class="campus-detail-label">Complaints</div>' +
    (issues.length ? issues.map(function(item) {
      return '<div class="campus-detail-row is-' + campusComplaintTone(item.status) + '">' + campusText(item.ticketNumber || 'Ticket') + ' · ' + campusText(item.title || item.category || 'Complaint') + ' · ' + campusText(String(item.status || '').replace(/_/g, ' ')) + '</div>';
    }).join('') : '<div class="campus-detail-copy">No open complaint from this flat.</div>') +
    '<div class="campus-detail-label">Parked here</div>' +
    (cars.length ? cars.map(function(item) {
      return '<div class="campus-detail-row">' + campusText(item.registrationNo) + (item.parkingSlot ? ' · slot ' + campusText(item.parkingSlot) : '') + '</div>';
    }).join('') : '<div class="campus-detail-copy">No vehicle is saved on this flat.</div>') +
    '<div class="campus-detail-label">Visitors</div>' +
    (visits.length ? visits.slice(0, 6).map(function(item) {
      return '<div class="campus-detail-row">' + campusText(item.visitorName) + ' · ' + campusText(campusGateName(item.gateNumber) || item.gateNumber || 'Gate') + ' · ' + campusText(String(item.status || '').replace(/_/g, ' ')) + '</div>';
    }).join('') : '<div class="campus-detail-copy">No visitor pass points at this flat.</div>');
};

window.showCampusGuard = function(gateIndex, guardIndex) {
  var snap = window.__campusSnapshot || {};
  var box = document.getElementById('campusDetail');
  if (!box) return;
  var names = window.__campusGates || ['Main Gate'];
  var gate = names[gateIndex] || names[0];
  var guards = (window.__campusGuards && window.__campusGuards[gate]) || [];
  var guard = guards[guardIndex] || guards[0];
  if (!guard) return;
  var through = (snap.passes || []).filter(function(pass) {
    return (campusGateName(pass.gateNumber) || 'Main Gate') === gate;
  }).slice(0, 6);
  box.innerHTML = '<div class="campus-detail-title">' + campusText(guard.staffName || 'Guard') + '</div>' +
    '<div class="campus-detail-copy">' + campusText(guard.locationPost || gate) + ' · ' + campusText(guard.shiftName || 'Shift') + ' · ' + campusText(guard.startTime || '') + ' – ' + campusText(guard.endTime || '') + '</div>' +
    '<div class="campus-detail-label">Through this gate</div>' +
    (through.length ? through.map(function(pass) {
      return '<div class="campus-detail-row">' + campusText(pass.visitorName) + ' → ' + campusText(pass.residentUnit || 'flat') + ' · ' + campusText(String(pass.status || '').replace(/_/g, ' ')) + '</div>';
    }).join('') : '<div class="campus-detail-copy">No visitor is recorded at this gate.</div>');
};

window.showCampusVehicle = function(vehicleId) {
  var snap = window.__campusSnapshot || {};
  var vehicle = (snap.vehicles || []).find(function(item) { return item.id === vehicleId; });
  var box = document.getElementById('campusDetail');
  if (!vehicle || !box) return;
  var unit = vehicle.unit || {};
  box.innerHTML = '<div class="campus-detail-title">' + campusText(vehicle.registrationNo || 'Vehicle') + '</div>' +
    '<div class="campus-detail-copy">' + campusText([vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(' ') || vehicle.type || 'Vehicle') + '</div>' +
    '<div class="campus-detail-row">Flat ' + campusText(unit.unitNumber || '—') + (vehicle.parkingSlot ? ' · slot ' + campusText(vehicle.parkingSlot) : '') + '</div>' +
    '<div class="campus-detail-row">' + campusText(unit.tenantName || unit.ownerName || 'Resident not named') + '</div>';
};

window.showCampusVisit = function(passId) {
  var snap = window.__campusSnapshot || {};
  var pass = (snap.passes || []).find(function(item) { return item.id === passId; });
  var box = document.getElementById('campusDetail');
  if (!pass || !box) return;
  box.innerHTML = '<div class="campus-detail-title">' + campusText(pass.visitorName || 'Visitor') + '</div>' +
    '<div class="campus-detail-copy">' + campusText(pass.visitorType || 'Guest') + (pass.vehicleNumber ? ' · ' + campusText(pass.vehicleNumber) : '') + '</div>' +
    '<div class="campus-detail-row">Entered ' + campusText(pass.gateNumber || 'the gate') + '</div>' +
    '<div class="campus-detail-row">Going to flat ' + campusText(pass.residentUnit || '—') + ' · ' + campusText(pass.residentName || '') + '</div>' +
    '<div class="campus-detail-row">' + campusText(String(pass.status || '').replace(/_/g, ' ')) + '</div>';
};
