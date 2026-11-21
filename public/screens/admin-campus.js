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
          <div class="page-subtitle" id="campusGateLine"></div>
        </div>
      </div>
      <div class="campus-legend" id="campusLegend"></div>
      <div class="campus-tower-bar" id="campusGateBar"></div>
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
    fetchFn('/api/settings').catch(function() { return null; }),
    fetchFn('/api/staff').catch(function() { return null; }),
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
  var settingsData = await read(pack[5]);
  var staffData = await read(pack[6]);
  var housingType = (settingsData.organization && settingsData.organization.housingType) || '';
  var savedGates = []
    .concat(dutyData.gates || [], staffData.gates || [])
    .map(function(name) { return String(name || '').trim(); })
    .filter(Boolean);

  window.__campusSnapshot = { units: units, blocks: blocks, vehicles: vehicles, complaints: complaints, passes: passes, duties: duties, housingType: housingType, gates: savedGates };
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

function campusLayoutKind(housingType) {
  var text = String(housingType || '').toLowerCase();
  if (/villa|plotted|plot|row house|rowhouse|enclave/.test(text)) return 'villa';
  if (/builder|floor/.test(text)) return 'floors';
  if (/commercial|mixed/.test(text)) return 'commercial';
  if (/chb|pocket/.test(text)) return 'chb';
  if (/cghs|cooperative/.test(text)) return 'cghs';
  return 'towers';
}

function campusLayoutLabel(kind, housingType) {
  if (String(housingType || '').trim()) return String(housingType).trim();
  if (kind === 'villa') return 'Plotted / Villa Gated Colony';
  if (kind === 'floors') return 'Independent Builder Floors';
  if (kind === 'commercial') return 'Commercial / Mixed-Use Complex';
  if (kind === 'chb') return 'CHB Multi-Pocket Flats';
  if (kind === 'cghs') return 'Cooperative Group Housing (CGHS)';
  return 'Multi-Tower High-Rise Apartments';
}

function expandCampusStructures(towers, kind) {
  if (kind === 'villa') {
    var plots = [];
    towers.forEach(function(tower) {
      var units = tower.units && tower.units.length ? tower.units : [{ id: tower.id, unitNumber: tower.name }];
      units.forEach(function(unit, index) {
        if (plots.length >= 30) return;
        plots.push({
          id: String(tower.id) + ':' + (unit.id || index),
          name: unit.unitNumber || tower.name,
          units: [unit],
        });
      });
    });
    return plots.length ? plots : towers;
  }
  if (kind === 'floors') {
    var houses = [];
    towers.forEach(function(tower) {
      var units = tower.units || [];
      if (!units.length || units.length <= 6) {
        houses.push(tower);
        return;
      }
      for (var i = 0; i < units.length && houses.length < 16; i += 4) {
        var slice = units.slice(i, i + 4);
        houses.push({
          id: String(tower.id) + ':f' + i,
          name: tower.name,
          units: slice,
        });
      }
    });
    return houses.length ? houses : towers;
  }
  return towers;
}

function parkingBays(x, z, yaw, count, firstRow) {
  var bays = [];
  var across = 3;
  var start = firstRow || 0;
  for (var i = 0; i < count; i++) {
    var col = i % across;
    var row = start + Math.floor(i / across);
    var localX = (col - (across - 1) / 2) * 3.6;
    var localZ = 7.4 + row * 3.5;
    var cos = Math.cos(yaw);
    var sin = Math.sin(yaw);
    bays.push({
      x: x + localX * cos + localZ * sin,
      z: z - localX * sin + localZ * cos,
      yaw: yaw,
    });
  }
  return bays;
}

function placeCampusStructures(list, kind) {
  var count = Math.max(1, list.length);
  var maxZ = -8;
  var cols = kind === 'villa'
    ? Math.max(2, Math.ceil(Math.sqrt(count)))
    : Math.min(4, Math.max(2, Math.ceil(Math.sqrt(count))));
  if (count === 1) cols = 1;
  var rows = Math.ceil(count / cols);
  var colGap = kind === 'villa' ? 10 : (kind === 'floors' ? 14 : 18);
  var rowGap = kind === 'villa' ? 12 : (kind === 'floors' ? 16 : 24);
  list.forEach(function(item, index) {
    var floors = Math.max(1, Math.ceil(((item.units || []).length || 1) / 4));
    var col = index % cols;
    var row = Math.floor(index / cols);
    var x = (col - (cols - 1) / 2) * colGap;
    var z = ((rows - 1) / 2 - row) * rowGap;
    var yaw = row % 2 === 0 ? 0 : Math.PI;
    var height = Math.min(22, 4 + floors * 1.05);
    if (kind === 'villa') height = 3.6 + (index % 3) * 0.55;
    else if (kind === 'floors') height = 6.8;
    else if (kind === 'cghs') height = Math.min(11, 5.2 + floors * 0.85);
    else if (kind === 'chb') height = Math.min(14, 6.2 + floors * 0.75);
    else if (kind === 'commercial') height = Math.min(12, 6 + floors * 0.5);
    item.x = x;
    item.z = z;
    item.height = height;
    item.yaw = yaw;
    item.bays = parkingBays(x, z, yaw, 6, 0);
    item.visitorBays = parkingBays(x, z, yaw, 3, 2);
    if (z > maxZ) maxZ = z;
  });
  return maxZ + 18;
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
    var clean = String(name || '').trim();
    if (!clean || gateNames.some(function(existing) { return existing.toLowerCase() === clean.toLowerCase(); })) return;
    gateNames.push(clean);
  }
  (snap.gates || []).forEach(addGate);
  (snap.duties || []).forEach(function(duty) {
    var post = String(duty.locationPost || '').trim();
    if (/gate/i.test(post)) addGate(post);
    else addGate(campusGateName(duty.blockName));
  });
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
    var posted = String(duty.locationPost || duty.blockName || '').trim().toLowerCase();
    var gate = gateNames.find(function(name) { return name.toLowerCase() === posted; });
    if (!gate) {
      var normalized = campusGateName(duty.locationPost) || campusGateName(duty.blockName);
      gate = normalized && gateNames.find(function(name) { return name.toLowerCase() === normalized.toLowerCase() || campusGateName(name).toLowerCase() === normalized.toLowerCase(); });
    }
    if (!gate) gate = gateNames[0];
    guardsByGate[gate].push(duty);
  });

  var openComplaints = (snap.complaints || []).filter(function(item) { return campusComplaintTone(item.status); });
  var layoutKind = campusLayoutKind(snap.housingType);
  var structures = expandCampusStructures(towers, layoutKind);
  var gateZ = placeCampusStructures(structures, layoutKind);
  var placeWord = layoutKind === 'villa' ? 'plot' : (layoutKind === 'floors' ? 'building' : 'block');
  window.__campusSubtitleBase = campusLayoutLabel(layoutKind, snap.housingType) + ' · ' + towers.length + ' ' + placeWord + (towers.length === 1 ? '' : 's') + ' · ' + units.length + ' flats · ' + gateNames.length + ' gate' + (gateNames.length === 1 ? '' : 's') + ' · ';
  if (subtitle) {
    subtitle.textContent = window.__campusSubtitleBase + campusVisitorLine() + ' · ' + openComplaints.length + ' open complaints';
  }
  var gateLine = document.getElementById('campusGateLine');
  if (gateLine) {
    gateLine.textContent = gateNames.length + (gateNames.length === 1 ? ' gate: ' : ' gates: ') + gateNames.join(', ');
  }
  if (legend) {
    legend.innerHTML = [
      ['live', 'Occupied'],
      ['empty', 'Vacant'],
      ['open', 'New complaint'],
      ['work', 'Work in progress'],
      ['wait', 'Waiting'],
      ['car', 'Parked vehicle'],
      ['approach', 'Visitor waiting outside'],
      ['guest', 'Visitor inside'],
    ].map(function(item) {
      return '<span><i class="campus-swatch campus-swatch-' + item[0] + '"></i>' + item[1] + '</span>';
    }).join('');
  }

  var gateBar = document.getElementById('campusGateBar');
  if (gateBar) {
    gateBar.innerHTML = gateNames.map(function(name) {
      return '<button type="button" class="campus-tower-btn" onclick="window.focusCampusGate(' + JSON.stringify(name) + ')">' + campusText(name) + '</button>';
    }).join('');
  }

  stage.innerHTML = '<div id="campusViewport" class="campus-viewport"><div class="campus-viewport-note">Drag to look around. Scroll to zoom. Use the gate buttons to move to an entrance.</div></div>';
  window.__campusStructures = structures;
  window.mountCampus3D({
    towers: structures,
    layout: layoutKind,
    gateZ: gateZ,
    gateNames: gateNames,
    guardsByGate: guardsByGate,
    complaintsByUnit: complaintsByUnit,
    vehiclesByUnit: vehiclesByUnit,
  });
};

function campusVisitorLine() {
  var list = (window.__campusSnapshot && window.__campusSnapshot.passes) || [];
  var outsideN = 0;
  var insideN = 0;
  list.forEach(function(pass) {
    var status = String(pass.status || '').toUpperCase();
    if (status === 'APPROVED') outsideN += 1;
    else if (status === 'CHECKED_IN') insideN += 1;
  });
  return outsideN + ' waiting outside · ' + insideN + ' inside';
}

window.focusCampusGate = function(name) {
  window.__campusTowerFocus = 'all';
  var buttons = document.querySelectorAll('#campusGateBar .campus-tower-btn');
  for (var i = 0; i < buttons.length; i++) {
    var onclick = buttons[i].getAttribute('onclick') || '';
    if (onclick.indexOf(JSON.stringify(name)) !== -1) buttons[i].classList.add('is-active');
    else buttons[i].classList.remove('is-active');
  }
  if (window.__campus3D && typeof window.__campus3D.focusGate === 'function') window.__campus3D.focusGate(name);
};

window.focusCampusTower = function(id) {
  window.__campusTowerFocus = id || 'all';
  var buttons = document.querySelectorAll('#campusTowerBar .campus-tower-btn');
  for (var i = 0; i < buttons.length; i++) {
    var onclick = buttons[i].getAttribute('onclick') || '';
    var selected = window.__campusTowerFocus === 'all' ? onclick.indexOf("'all'") !== -1 : onclick.indexOf("'" + window.__campusTowerFocus + "'") !== -1;
    if (selected) buttons[i].classList.add('is-active');
    else buttons[i].classList.remove('is-active');
  }
  if (window.__campus3D && typeof window.__campus3D.focusTower === 'function') {
    window.__campus3D.focusTower(window.__campusTowerFocus);
  }
};

window.showCampusTower = function(towerId) {
  var snap = window.__campusSnapshot || {};
  var box = document.getElementById('campusDetail');
  if (!box) return;
  var structures = window.__campusStructures || [];
  var tower = null;
  for (var i = 0; i < structures.length; i++) if (structures[i].id === towerId) tower = structures[i];
  var units = tower && tower.units ? tower.units : [];
  var title = (tower && tower.name) || 'Block';
  box.removeAttribute('data-visit');
  box.innerHTML = '<div class="campus-detail-title">' + campusText(title) + '</div>' +
    '<div class="campus-detail-copy">' + units.length + ' flat' + (units.length === 1 ? '' : 's') + ' in this block.</div>' +
    (units.length ? units.map(function(unit) {
      var person = String(unit.ownerName || unit.tenantName || '').trim() || 'Vacant';
      var tone = '';
      (snap.complaints || []).some(function(item) {
        if (item.unitId !== unit.id) return false;
        tone = campusComplaintTone(item.status);
        return !!tone;
      });
      return '<button type="button" class="campus-detail-row' + (person === 'Vacant' ? '' : ' is-live') + (tone ? ' is-' + tone : '') + '" onclick="window.showCampusUnit(\'' + String(unit.id).replace(/'/g, '') + '\')">Flat ' + campusText(unit.unitNumber) + ' · ' + campusText(person) + '</button>';
    }).join('') : '<div class="campus-detail-copy">No flats are saved in this block.</div>');
};

window.syncCampusVisitor = function(pass, action) {
  if (!pass || !pass.id) return;
  var snap = window.__campusSnapshot || (window.__campusSnapshot = { passes: [] });
  var list = snap.passes || (snap.passes = []);
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === pass.id) idx = i;
  }
  var merged = idx >= 0 ? Object.assign({}, list[idx], pass) : pass;
  var act = String(action || merged.status || '').toUpperCase();
  if (act === 'CHECK_IN' || act === 'CHECKED_IN') merged.status = 'CHECKED_IN';
  else if (act === 'CHECK_OUT' || act === 'CHECKED_OUT') merged.status = 'CHECKED_OUT';
  else if (act === 'CANCEL' || act === 'CANCELLED' || act === 'REVOKE' || act === 'REVOKED') merged.status = 'CANCELLED';
  else if (act === 'CREATED' || act === 'APPROVE' || act === 'APPROVED') merged.status = merged.status || 'APPROVED';
  if (idx >= 0) list[idx] = merged;
  else list.unshift(merged);
  if (window.__campus3D && typeof window.__campus3D.syncVisitor === 'function') {
    window.__campus3D.syncVisitor(merged, act);
  } else {
    window.__campusVisitorQueue = window.__campusVisitorQueue || [];
    window.__campusVisitorQueue.push({ pass: merged, action: act });
  }
  var subtitle = document.getElementById('campusSubtitle');
  if (subtitle && window.__campusSubtitleBase && document.getElementById('campusViewport')) {
    var openN = (snap.complaints || []).filter(function(item) { return campusComplaintTone(item.status); }).length;
    subtitle.textContent = window.__campusSubtitleBase + campusVisitorLine() + ' · ' + openN + ' open complaints';
  }
  var detail = document.getElementById('campusDetail');
  if (detail && detail.getAttribute('data-visit') === String(merged.id) && typeof window.showCampusVisit === 'function') {
    window.showCampusVisit(merged.id);
  }
};

window.mountCampus3D = async function(model) {
  var host = document.getElementById('campusViewport');
  if (!host) return;
  if (window.__campus3D && window.__campus3D.dispose) window.__campus3D.dispose();
  window.__campus3D = null;
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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewport.appendChild(renderer.domElement);

  var kit = { car: null, suv: null, taxi: null, guard: null, tree: null, towers: [], houses: [], blocks: [] };
  try {
    var gltfMod = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js');
    var gltfLoader = new gltfMod.GLTFLoader();
    var kitRoot = 'https://cdn.jsdelivr.net/gh/shorepine/kenney@main/3d/';
    function loadKit(url) {
      return new Promise(function(resolve) {
        gltfLoader.load(url, function(gltf) { resolve(gltf.scene); }, undefined, function() { resolve(null); });
      });
    }
    var localBuildings = '/models/modular/';
    var loadedKits = await Promise.all([
      loadKit(kitRoot + 'car/sedan.glb'),
      loadKit(kitRoot + 'car/suv.glb'),
      loadKit(kitRoot + 'car/taxi.glb'),
      loadKit(kitRoot + 'mini-characters/character-male-a.glb'),
      loadKit(kitRoot + 'city-suburban/tree-large.glb'),
      loadKit(kitRoot + 'city-suburban/tree-small.glb'),
      loadKit(localBuildings + 'building-sample-tower-a.glb'),
      loadKit(localBuildings + 'building-sample-tower-b.glb'),
      loadKit(localBuildings + 'building-sample-tower-c.glb'),
      loadKit(localBuildings + 'building-sample-tower-d.glb'),
      loadKit(localBuildings + 'building-sample-house-a.glb'),
      loadKit(localBuildings + 'building-sample-house-b.glb'),
      loadKit(localBuildings + 'building-sample-house-c.glb'),
    ]);
    kit.car = loadedKits[0];
    kit.suv = loadedKits[1];
    kit.taxi = loadedKits[2];
    kit.guard = loadedKits[3];
    kit.tree = loadedKits[4];
    kit.treeSmall = loadedKits[5];
    kit.towers = [loadedKits[6], loadedKits[7], loadedKits[8], loadedKits[9]].filter(Boolean);
    kit.houses = [loadedKits[10], loadedKits[11], loadedKits[12]].filter(Boolean);
    kit.blocks = kit.towers;
  } catch (err) {
    kit = { car: null, suv: null, taxi: null, guard: null, tree: null, towers: [], houses: [], blocks: [] };
  }
  if (!document.getElementById('campusViewport')) return;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color('#c5d4e4');
  scene.fog = new THREE.Fog('#c5d4e4', 70, 160);
  var camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
  var layout = model.layout || 'towers';
  var wide = layout === 'villa' || layout === 'cghs' || layout === 'chb' || (model.towers || []).length > 3;
  scene.fog = new THREE.Fog('#c5d4e4', wide ? 90 : 70, wide ? 220 : 160);
  camera.position.set(wide ? 42 : 34, layout === 'villa' ? 36 : 28, wide ? 48 : 42);

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 3, 0);
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minPolarAngle = 0.35;
  controls.minDistance = 16;
  controls.maxDistance = wide ? 190 : 110;

  scene.add(new THREE.HemisphereLight('#f4f7fb', '#6b8f71', 1.15));
  var sun = new THREE.DirectionalLight('#fff4e0', 1.65);
  sun.position.set(24, 40, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
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
    var grass = ctx.createLinearGradient(0, 0, 1024, 1024);
    grass.addColorStop(0, '#8fb56a');
    grass.addColorStop(1, '#6f9a52');
    ctx.fillStyle = grass;
    ctx.fillRect(0, 0, 1024, 1024);
    for (var i = 0; i < 700; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(40,70,30,0.08)';
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 14, 4);
    }
    [[180, 140, 90, 70], [640, 220, 120, 80], [300, 700, 160, 90], [780, 640, 140, 100]].forEach(function(patch) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.ellipse(patch[0], patch[1], patch[2], patch[3], 0, 0, Math.PI * 2);
      ctx.fill();
    });
    return canvasTex(canvas);
  }
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    new THREE.MeshStandardMaterial({ map: satellite(), roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  function placeModel(source, opts) {
    if (!source) return null;
    var model = source.clone(true);
    model.traverse(function(obj) {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    if (opts.faceX) model.rotation.y = Math.PI / 2;
    model.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(model);
    var size = new THREE.Vector3();
    box.getSize(size);
    var current = opts.height ? size.y : Math.max(size.x, size.z);
    var target = opts.height || opts.length || 2;
    if (!current) return null;
    model.scale.setScalar(target / current);
    model.updateMatrixWorld(true);
    box.setFromObject(model);
    model.position.y -= box.min.y;
    model.position.x -= (box.min.x + box.max.x) / 2;
    model.position.z -= (box.min.z + box.max.z) / 2;
    var holder = new THREE.Group();
    holder.add(model);
    return holder;
  }
  function plate(title, detail) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = detail ? 176 : 120;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fillRect(16, 16, 480, canvas.height - 32);
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 480, canvas.height - 32);
    ctx.fillStyle = '#18181B';
    ctx.font = '700 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var head = String(title || '').slice(0, 18);
    ctx.fillText(head, 256, detail ? 68 : 60);
    if (detail) {
      ctx.fillStyle = '#3F3F46';
      ctx.font = '500 34px sans-serif';
      ctx.fillText(String(detail).slice(0, 26), 256, 122);
    }
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(canvas), transparent: true, depthWrite: false }));
    sprite.scale.set(3.6, detail ? 1.24 : 0.84, 1);
    sprite.position.y = 2.05;
    return sprite;
  }
  function unitOwnerName(unit) {
    var owner = String((unit && unit.ownerName) || '').trim();
    if (owner) return owner;
    var tenant = String((unit && unit.tenantName) || '').trim();
    if (tenant) return tenant;
    return 'Vacant';
  }
  function unitTag(unitNumber, person, tone, occupied) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 168;
    var ctx = canvas.getContext('2d');
    var stroke = tone === 'open' ? '#DC2626' : (tone === 'work' ? '#C2410C' : (tone === 'wait' ? '#B45309' : (occupied ? '#14532D' : '#A1A1AA')));
    ctx.fillStyle = occupied ? '#14532D' : '#F4F4F5';
    ctx.fillRect(12, 12, 488, 144);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 488, 144);
    ctx.fillStyle = occupied ? '#FFFFFF' : '#3F3F46';
    ctx.font = '700 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(unitNumber || 'Flat').slice(0, 16), 256, 58);
    ctx.fillStyle = occupied ? '#DCFCE7' : '#A1A1AA';
    ctx.font = '500 36px sans-serif';
    ctx.fillText(String(person || 'Vacant').slice(0, 22), 256, 112);
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(canvas), transparent: true, depthWrite: false }));
    sprite.scale.set(2.3, 0.76, 1);
    return sprite;
  }

  function tree(x, z, small) {
    var grown = placeModel(small && kit.treeSmall ? kit.treeSmall : kit.tree, { height: small ? 2.3 : 3.8 });
    if (grown) {
      grown.position.set(x, 0, z);
      scene.add(grown);
      return;
    }
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
  var towerGroups = [];
  towers.forEach(function(tower, index) {
    var towerGroup = new THREE.Group();
    towerGroup.userData = { kind: 'tower', id: tower.id };
    var units = (tower.units || []).slice(0, 48);
    var floors = Math.max(1, Math.ceil(units.length / 4));
    var height = tower.height || Math.min(26, 3.2 + floors * 1.15);
    var depth = layout === 'villa' ? 4 : 7;
    var widthB = layout === 'villa' ? 4.5 : (layout === 'commercial' ? 10 : 8);
    var x = tower.x != null ? tower.x : (index - (span - 1) / 2) * gap;
    var z = tower.z != null ? tower.z : -2;
    towerPos[tower.id] = { x: x, z: z, height: height };
    var usedModel = false;
    var front = { minX: x - widthB / 2 + 0.6, maxX: x + widthB / 2 - 0.6, minY: 1.2, maxY: height - 0.6, z: z + depth / 2 + 0.08 };
    var modelSet = kit.towers;
    if ((layout === 'villa' || layout === 'floors') && kit.houses.length) modelSet = kit.houses;
    else if (kit.blocks.length && layout !== 'towers') modelSet = kit.blocks;
    if (modelSet.length) {
      var building = placeModel(modelSet[index % modelSet.length], { height: height });
      if (building) {
        building.position.set(x, 0, z);
        if (tower.yaw) building.rotation.y = tower.yaw;
        towerGroup.add(building);
        var bounds = new THREE.Box3().setFromObject(building);
        front = {
          minX: bounds.min.x + 0.35,
          maxX: bounds.max.x - 0.35,
          minY: Math.max(1.1, bounds.min.y + 0.8),
          maxY: Math.max(2.4, bounds.max.y - 0.7),
          z: bounds.max.z + 0.08,
        };
        usedModel = true;
      }
    }
    if (!usedModel) {
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
    towerGroup.add(body);
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(widthB + 0.4, 0.45, depth + 0.4),
      new THREE.MeshStandardMaterial({ color: '#5f6770', roughness: 0.5, metalness: 0.2 })
    );
    roof.position.set(x, height + 0.2, z);
    roof.castShadow = true;
    towerGroup.add(roof);
    }
    var name = label(tower.name);
    name.position.set(x, (usedModel ? front.maxY : height) + 1.8, z);
    towerGroup.add(name);

    var windowCols = 4;
    var windowRows = Math.max(1, Math.ceil(Math.min(units.length, 48) / windowCols));
    units.forEach(function(unit, unitIndex) {
      var col = unitIndex % windowCols;
      var row = Math.floor(unitIndex / windowCols);
      if (row > 11) return;
      var issues = (model.complaintsByUnit && model.complaintsByUnit[unit.id]) || [];
      var tone = issues.length ? campusComplaintTone(issues[0].status) : '';
      var occupied = String(unit.occupancyStatus || '').toUpperCase() !== 'VACANT' && String(unit.occupancyStatus || '') !== '';
      var color = occupied ? '#f6e7bf' : '#7f8b97';
      if (tone === 'open') color = '#ef4444';
      else if (tone === 'work') color = '#ea580c';
      else if (tone === 'wait') color = '#d97706';
      var colsForUnit = units.length === 1 ? 1 : windowCols;
      var rowsForUnit = units.length === 1 ? 1 : windowRows;
      var spanX = Math.max(1.2, front.maxX - front.minX);
      var spanY = Math.max(1.2, front.maxY - front.minY);
      var wx = front.minX + ((col + 0.5) / colsForUnit) * spanX;
      var wy = front.minY + ((row + 0.5) / rowsForUnit) * spanY;
      if (!(usedModel && !tone)) {
        var win = new THREE.Mesh(
          new THREE.BoxGeometry(Math.min(1.15, spanX / colsForUnit * 0.62), Math.min(0.72, spanY / rowsForUnit * 0.55), 0.12),
          new THREE.MeshStandardMaterial({
            color: color,
            emissive: tone ? color : (occupied ? '#f6e7bf' : '#000000'),
            emissiveIntensity: tone ? 0.55 : (occupied ? 0.18 : 0),
            roughness: 0.25,
            metalness: 0.05,
          })
        );
        win.position.set(wx, wy, front.z);
        win.userData = { kind: 'unit', id: unit.id };
        win.castShadow = true;
        towerGroup.add(win);
      }
      var ownerLabel = unitOwnerName(unit);
      var tag = unitTag(unit.unitNumber, ownerLabel, tone, ownerLabel !== 'Vacant');
      var tagWidth = Math.min(1.7, Math.max(0.85, spanX / colsForUnit * 0.78));
      tag.scale.set(tagWidth, tagWidth * 0.33, 1);
      tag.position.set(wx, wy, front.z + 0.35);
      tag.userData = { kind: 'unit', id: unit.id };
      towerGroup.add(tag);
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
      var vehicleKind = String(vehicle.type || '').toLowerCase();
      var carSource = /suv|jeep/.test(vehicleKind) ? kit.suv : kit.car;
      var car = placeModel(carSource, { length: 2.6, faceX: true });
      if (!car) {
        car = new THREE.Group();
        var shell = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.48, 0.95), new THREE.MeshStandardMaterial({ color: paint, metalness: 0.45, roughness: 0.35 }));
        shell.position.y = 0.38;
        var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.4, 0.82), new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.5, roughness: 0.15 }));
        cabin.position.set(-0.12, 0.75, 0);
        shell.castShadow = cabin.castShadow = true;
        car.add(shell, cabin);
      }
      var bay = tower.bays && tower.bays[carIndex];
      if (bay) {
        car.position.set(bay.x, 0, bay.z);
        car.rotation.y = bay.yaw === 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        car.position.set(x - 4.8 + carIndex * 3.6, 0, z + depth / 2 + 4);
        car.rotation.y = Math.PI / 2;
      }
      car.userData = { kind: 'vehicle', id: vehicle.id };
      var unitNo = (vehicle.unit && vehicle.unit.unitNumber) || '';
      var carTag = plate(vehicle.registrationNo || 'Vehicle', [unitNo ? 'Flat ' + unitNo : '', vehicle.parkingSlot ? 'Slot ' + vehicle.parkingSlot : ''].filter(Boolean).join(' · ') || 'Parked');
      car.add(carTag);
      towerGroup.add(car);
    });
    scene.add(towerGroup);
    towerGroups.push(towerGroup);
  });

  (function dressSurroundings() {
    if (!towers.length) return;
    var minX = Infinity;
    var maxX = -Infinity;
    var minZ = Infinity;
    var maxZ = -Infinity;
    towers.forEach(function(tower) {
      minX = Math.min(minX, tower.x);
      maxX = Math.max(maxX, tower.x);
      minZ = Math.min(minZ, tower.z);
      maxZ = Math.max(maxZ, tower.z);
    });
    var gateLine = model.gateZ || 18;
    var gateNames = model.gateNames && model.gateNames.length ? model.gateNames : ['Main Gate'];
    var left = minX - (layout === 'villa' ? 7 : 11);
    var right = maxX + (layout === 'villa' ? 7 : 11);
    var back = minZ - 8;
    var front = gateLine;
    var sideOrder = ['front', 'right', 'back', 'left'];
    var buckets = { front: [], right: [], back: [], left: [] };
    gateNames.forEach(function(name, index) { buckets[sideOrder[index % 4]].push(name); });
    function spreadAlong(count, start, end) {
      var margin = 10;
      if (count <= 1) return [(start + end) / 2];
      var from = start + margin;
      var to = end - margin;
      var spots = [];
      for (var i = 0; i < count; i++) spots.push(from + (to - from) * (i / (count - 1)));
      return spots;
    }
    model.gateSlots = [];
    spreadAlong(buckets.front.length, left, right).forEach(function(x, index) {
      if (!buckets.front[index]) return;
      model.gateSlots.push({ name: buckets.front[index], x: x, z: front, side: 'front', outX: 0, outZ: 1 });
    });
    spreadAlong(buckets.back.length, left, right).forEach(function(x, index) {
      if (!buckets.back[index]) return;
      model.gateSlots.push({ name: buckets.back[index], x: x, z: back, side: 'back', outX: 0, outZ: -1 });
    });
    spreadAlong(buckets.left.length, back, front).forEach(function(z, index) {
      if (!buckets.left[index]) return;
      model.gateSlots.push({ name: buckets.left[index], x: left, z: z, side: 'left', outX: -1, outZ: 0 });
    });
    spreadAlong(buckets.right.length, back, front).forEach(function(z, index) {
      if (!buckets.right[index]) return;
      model.gateSlots.push({ name: buckets.right[index], x: right, z: z, side: 'right', outX: 1, outZ: 0 });
    });
    function slab(w, d, color, x, z, y) {
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.05, d),
        new THREE.MeshStandardMaterial({ color: color, roughness: 0.94 })
      );
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      scene.add(mesh);
    }
    function hedge(w, d, x, z) {
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.55, d),
        new THREE.MeshStandardMaterial({ color: '#3f7d3a', roughness: 0.85 })
      );
      mesh.position.set(x, 0.28, z);
      mesh.castShadow = true;
      scene.add(mesh);
    }
    function boundary(x1, z1, x2, z2) {
      var dx = x2 - x1;
      var dz = z2 - z1;
      var length = Math.sqrt(dx * dx + dz * dz);
      if (length < 0.8) return;
      var wall = new THREE.Mesh(
        new THREE.BoxGeometry(length, 1.2, 0.32),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 })
      );
      wall.position.set((x1 + x2) / 2, 0.6, (z1 + z2) / 2);
      wall.rotation.y = Math.atan2(dz, dx);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      var cap = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.12, 0.46),
        new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4 })
      );
      cap.position.set((x1 + x2) / 2, 1.24, (z1 + z2) / 2);
      cap.rotation.y = wall.rotation.y;
      scene.add(cap);
    }
    var centerZ = (minZ + maxZ) / 2;
    slab(Math.max(8, right - left - 4), Math.max(8, front - back - 6), '#7ea35a', (left + right) / 2, (back + front) / 2 - 1, 0.012);
    var roadStart = maxZ + (layout === 'villa' ? 3.2 : 4.8);
    var spineLength = Math.max(6, front - 4 - roadStart);
    var spineZ = (roadStart + front - 4) / 2;
    slab(7.4, spineLength, '#d4d4d8', 0, spineZ, 0.02);
    slab(5.4, spineLength - 0.4, '#4b5563', 0, spineZ, 0.035);
    var dashCount = Math.max(3, Math.floor(spineLength / 3.2));
    for (var dash = 0; dash < dashCount; dash++) {
      slab(0.18, 1.3, '#f8fafc', 0, roadStart + 1.4 + dash * 3.2, 0.05);
    }
    if (towers.length > 1) {
      slab(right - left - 6, 4.2, '#d4d4d8', (left + right) / 2, roadStart, 0.02);
      slab(right - left - 8, 2.6, '#4b5563', (left + right) / 2, roadStart, 0.035);
    }
    (model.gateSlots || []).forEach(function(slot) {
      if (slot.side === 'front') slab(5.2, 7, '#4b5563', slot.x, front + 3.6, 0.04);
      else if (slot.side === 'back') slab(5.2, 7, '#4b5563', slot.x, back - 3.6, 0.04);
      else if (slot.side === 'left') slab(7, 5.2, '#4b5563', left - 3.6, slot.z, 0.04);
      else slab(7, 5.2, '#4b5563', right + 3.6, slot.z, 0.04);
    });
    towers.forEach(function(tower) {
      var widePad = layout === 'villa' || layout === 'floors' ? 5.4 : 8.2;
      slab(widePad, layout === 'villa' ? 5 : 6.4, '#e7e5e4', tower.x, tower.z + (tower.yaw ? -0.4 : 0.4), 0.02);
      (tower.bays || []).forEach(function(bay) {
        slab(3.1, 1.7, '#9ca3af', bay.x, bay.z, 0.03);
        slab(2.5, 0.08, '#f8fafc', bay.x, bay.z + (tower.yaw ? -0.7 : 0.7), 0.05);
      });
      (tower.visitorBays || []).forEach(function(bay) {
        slab(3.1, 1.7, '#dbeafe', bay.x, bay.z, 0.03);
      });
    });
    if (layout === 'cghs') {
      slab(8, 5, '#86b36a', 0, centerZ, 0.025);
      tree(-2.2, centerZ - 0.4, true);
      tree(2.2, centerZ + 0.6, true);
      tree(0, centerZ + 1.4);
    }
    function wallWithGaps(x1, z1, x2, z2, gaps) {
      var horizontal = Math.abs(z2 - z1) < 0.01;
      var start = horizontal ? Math.min(x1, x2) : Math.min(z1, z2);
      var end = horizontal ? Math.max(x1, x2) : Math.max(z1, z2);
      var fixed = horizontal ? z1 : x1;
      var cursor = start;
      gaps.slice().sort(function(a, b) { return a - b; }).forEach(function(opening) {
        var gapStart = Math.max(start, opening - 3.4);
        var gapEnd = Math.min(end, opening + 3.4);
        if (horizontal) boundary(cursor, fixed, gapStart, fixed);
        else boundary(fixed, cursor, fixed, gapStart);
        cursor = gapEnd;
      });
      if (horizontal) boundary(cursor, fixed, end, fixed);
      else boundary(fixed, cursor, fixed, end);
    }
    var slots = model.gateSlots || [];
    wallWithGaps(left, back, right, back, slots.filter(function(slot) { return slot.side === 'back'; }).map(function(slot) { return slot.x; }));
    wallWithGaps(left, back, left, front, slots.filter(function(slot) { return slot.side === 'left'; }).map(function(slot) { return slot.z; }));
    wallWithGaps(right, back, right, front, slots.filter(function(slot) { return slot.side === 'right'; }).map(function(slot) { return slot.z; }));
    wallWithGaps(left, front, right, front, slots.filter(function(slot) { return slot.side === 'front'; }).map(function(slot) { return slot.x; }));
    hedge(Math.max(2, right - left - 2), 0.7, (left + right) / 2, back + 1.1);
    var plant = back + 2;
    while (plant < front - 3) {
      tree(left + 1.6, plant, plant % 2 > 0.5);
      tree(right - 1.6, plant, plant % 2 < 0.5);
      plant += layout === 'villa' ? 6.5 : 8;
    }
    for (var edge = left + 4; edge < right - 3; edge += 8) {
      tree(edge, back + 2.4, true);
    }
  })();

  var gates = (model.gateSlots || []).map(function(slot) { return slot.name; });
  if (!gates.length) gates = model.gateNames || ['Main Gate'];
  var gatePos = {};
  gates.forEach(function(name, index) {
    var slot = (model.gateSlots || []).find(function(item) { return item.name === name; }) || (model.gateSlots || [])[index] || { x: 0, z: model.gateZ || 18, side: 'front', outX: 0, outZ: 1 };
    var x = slot.x;
    var z = slot.z;
    gatePos[name] = { x: x, z: z, side: slot.side, outX: slot.outX || 0, outZ: slot.outZ == null ? 1 : slot.outZ };
    var frame = new THREE.Group();
    frame.position.set(x, 0, z);
    if (slot.side === 'left' || slot.side === 'right') frame.rotation.y = Math.PI / 2;
    var pillarMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
    [-2.2, 2.2].forEach(function(offset) {
      var pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.4, 0.7), pillarMat);
      pillar.position.set(offset, 1.7, 0);
      pillar.castShadow = true;
      frame.add(pillar);
    });
    var bar = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: '#18181b' }));
    bar.position.set(0, 3.3, 0);
    frame.add(bar);
    var gateLabel = label(name);
    gateLabel.position.set(0, 4.6, 0);
    frame.add(gateLabel);
    scene.add(frame);
    var inwardX = -(slot.outX || 0);
    var inwardZ = -(slot.outZ == null ? 1 : slot.outZ);
    var alongX = slot.side === 'left' || slot.side === 'right' ? 0 : 1;
    var alongZ = slot.side === 'left' || slot.side === 'right' ? 1 : 0;
    var guards = (model.guardsByGate && model.guardsByGate[name]) || [];
    guards.slice(0, 3).forEach(function(guard, guardIndex) {
      var person = placeModel(kit.guard, { height: 1.8 });
      if (!person) {
        person = new THREE.Group();
        var legs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.28), new THREE.MeshStandardMaterial({ color: '#1e293b' }));
        legs.position.y = 0.35;
        var torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.32), new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.5 }));
        torso.position.y = 1.05;
        var head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: '#e7c2a2', roughness: 0.6 }));
        head.position.y = 1.6;
        person.add(legs, torso, head);
      }
      var along = (guardIndex - 1) * 1.35;
      person.position.set(x + alongX * along + inwardX * 1.8, 0, z + alongZ * along + inwardZ * 1.8);
      person.userData = { kind: 'guard', gateIndex: index, guardIndex: guardIndex, bob: guardIndex };
      var guardTag = plate(guard.staffName || 'Guard', guard.shiftName || guard.locationPost || 'On duty');
      person.add(guardTag);
      scene.add(person);
    });
  });

  var visitors = [];
  function resolveGate(value) {
    var posted = String(value || '').trim().toLowerCase();
    var exact = gates.find(function(name) { return name.toLowerCase() === posted; });
    if (exact) return exact;
    var normalized = campusGateName(value);
    var fuzzy = normalized && gates.find(function(name) {
      return name.toLowerCase() === normalized.toLowerCase() || campusGateName(name).toLowerCase() === normalized.toLowerCase();
    });
    return fuzzy || gates[0];
  }
  function visitorSpots(pass, slot) {
    var gateName = resolveGate(pass.gateNumber);
    var gate = gatePos[gateName] || gatePos[gates[0]] || { x: 0, z: 18 };
    var tower = towers.find(function(item) {
      return (item.units || []).some(function(unit) { return unit.id === pass.unitId || unit.unitNumber === pass.residentUnit; });
    }) || towers[0];
    var home = tower && towerPos[tower.id] ? towerPos[tower.id] : { x: 0, z: -2 };
    var lane = slot % 5;
    var rank = Math.floor(slot / 5);
    var outX = gate.outX || 0;
    var outZ = gate.outZ == null ? 1 : gate.outZ;
    var sideX = outZ;
    var sideZ = -outX;
    var holdX = gate.x + outX * (8 + rank * 3.6) + sideX * (-9 + lane * 3.6);
    var holdZ = gate.z + outZ * (8 + rank * 3.6) + sideZ * (-9 + lane * 3.6);
    var visitBay = tower && tower.visitorBays && tower.visitorBays[slot % tower.visitorBays.length];
    return {
      far: { x: gate.x + outX * (16 + rank * 3.6) + sideX * (-9 + lane * 3.6), z: gate.z + outZ * (16 + rank * 3.6) + sideZ * (-9 + lane * 3.6) },
      outside: { x: holdX, z: holdZ },
      gate: { x: gate.x + sideX * (lane - 2) * 0.15, z: gate.z + sideZ * (lane - 2) * 0.15 },
      towerId: tower && tower.id,
      tower: visitBay ? { x: visitBay.x, z: visitBay.z } : { x: home.x + (lane - 2) * 3.6, z: home.z + 12 },
    };
  }
  function makeVisitorCar(pass) {
    var car = placeModel(kit.taxi || kit.car, { length: 2.6, faceX: true });
    if (!car) {
      car = new THREE.Group();
      var shell = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.48, 0.95),
        new THREE.MeshStandardMaterial({ color: '#1d4ed8', metalness: 0.4, roughness: 0.35 })
      );
      shell.position.y = 0.38;
      var cabin = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.38, 0.82),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.2, roughness: 0.2 })
      );
      cabin.position.set(-0.05, 0.74, 0);
      var lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.1, 0.7),
        new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#fde68a', emissiveIntensity: 0.8 })
      );
      lamp.position.set(0.82, 0.42, 0);
      shell.castShadow = cabin.castShadow = true;
      car.add(shell, cabin, lamp);
    }
    car.userData = { kind: 'visit', id: pass.id };
    var visitTag = plate(
      pass.visitorName || 'Visitor',
      [pass.vehicleNumber, pass.residentUnit ? 'Flat ' + pass.residentUnit : ''].filter(Boolean).join(' · ') || 'Visitor'
    );
    car.add(visitTag);
    return car;
  }
  function pointCar(mesh, from, to) {
    var dx = to.x - from.x;
    var dz = to.z - from.z;
    if (!dx && !dz) return;
    mesh.rotation.y = Math.atan2(-dz, dx);
  }
  function setLeg(visitor, phase, from, to, speed) {
    visitor.phase = phase;
    visitor.from = from;
    visitor.to = to;
    visitor.t = 0;
    visitor.speed = speed;
    pointCar(visitor.mesh, from, to);
  }
  function findVisitor(id) {
    for (var i = 0; i < visitors.length; i++) {
      if (visitors[i].id === id && visitors[i].phase !== 'done') return visitors[i];
    }
    return null;
  }
  function addVisitor(pass, phase) {
    var existing = findVisitor(pass.id);
    if (existing) return existing;
    if (visitors.length >= 24) return null;
    var spots = visitorSpots(pass, visitors.length);
    var car = makeVisitorCar(pass);
    var start = phase === 'parked' ? spots.tower : (phase === 'wait' ? spots.outside : spots.far);
    car.position.set(start.x, 0, start.z);
    if (phase === 'parked') pointCar(car, spots.tower, spots.gate);
    else pointCar(car, spots.outside, spots.gate);
    scene.add(car);
    var visitor = { id: pass.id, mesh: car, pass: pass, spots: spots, phase: phase, from: start, to: start, t: 1, speed: 0 };
    visitors.push(visitor);
    if (phase === 'arrive') setLeg(visitor, 'arrive', spots.far, spots.outside, 0.01);
    else if (phase === 'enter') setLeg(visitor, 'enterGate', spots.outside, spots.gate, 0.014);
    else if (phase === 'leave') setLeg(visitor, 'exitGate', spots.tower, spots.gate, 0.014);
    return visitor;
  }
  function syncVisitor(pass, action) {
    if (stopped || !pass || !pass.id) return;
    var act = String(action || pass.status || '').toUpperCase();
    var leaving = act === 'CHECK_OUT' || act === 'CHECKED_OUT' || act === 'CANCEL' || act === 'CANCELLED' || act === 'REVOKE' || act === 'REVOKED' || String(pass.status || '').toUpperCase() === 'CHECKED_OUT' || String(pass.status || '').toUpperCase() === 'CANCELLED';
    var entering = !leaving && (act === 'CHECK_IN' || act === 'CHECKED_IN' || String(pass.status || '').toUpperCase() === 'CHECKED_IN');
    var arriving = !leaving && !entering && (act === 'CREATED' || act === 'APPROVE' || act === 'APPROVED' || String(pass.status || '').toUpperCase() === 'APPROVED');
    var visitor = findVisitor(pass.id);
    if (leaving) {
      var wasOutside = visitor && (visitor.phase === 'wait' || visitor.phase === 'arrive');
      if (!visitor) visitor = addVisitor(pass, 'parked');
      if (!visitor || visitor.phase === 'exitGate' || visitor.phase === 'exitOut') return;
      visitor.pass = pass;
      visitor.spots = visitorSpots(pass, visitors.indexOf(visitor));
      var here = { x: visitor.mesh.position.x, z: visitor.mesh.position.z };
      if (wasOutside) setLeg(visitor, 'exitOut', here, visitor.spots.far, 0.012);
      else setLeg(visitor, 'exitGate', here, visitor.spots.gate, 0.014);
      return;
    }
    if (entering) {
      if (!visitor) visitor = addVisitor(pass, 'wait');
      if (!visitor || visitor.phase === 'parked' || visitor.phase === 'enterTower' || visitor.phase === 'enterGate') return;
      visitor.pass = pass;
      visitor.spots = visitorSpots(pass, visitors.indexOf(visitor));
      setLeg(visitor, 'enterGate', { x: visitor.mesh.position.x, z: visitor.mesh.position.z }, visitor.spots.gate, 0.014);
      return;
    }
    if (arriving && !visitor) addVisitor(pass, 'arrive');
  }

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  function onClick(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(scene.children, true);
    for (var i = 0; i < hits.length; i++) {
      var node = hits[i].object;
      var data = null;
      while (node) {
        if (node.userData && node.userData.kind) { data = node.userData; break; }
        node = node.parent;
      }
      if (!data || !data.kind) continue;
      if (data.kind === 'unit') window.showCampusUnit(data.id);
      else if (data.kind === 'tower') window.focusCampusTower(data.id);
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
    visitors.forEach(function(visitor) {
      if (!visitor || !visitor.mesh || !visitor.from || !visitor.to) return;
      if (visitor.phase === 'wait' || visitor.phase === 'parked' || visitor.phase === 'done') return;
      if (visitor.from.x == null || visitor.to.x == null) return;
      visitor.t += visitor.speed;
      if (visitor.t >= 1) {
        visitor.mesh.position.set(visitor.to.x, 0, visitor.to.z);
        if (visitor.phase === 'arrive') visitor.phase = 'wait';
        else if (visitor.phase === 'enterGate') setLeg(visitor, 'enterTower', visitor.spots.gate, visitor.spots.tower, 0.01);
        else if (visitor.phase === 'enterTower') {
          visitor.phase = 'parked';
          pointCar(visitor.mesh, visitor.spots.tower, visitor.spots.gate);
        } else if (visitor.phase === 'exitGate') setLeg(visitor, 'exitOut', visitor.spots.gate, visitor.spots.far, 0.012);
        else if (visitor.phase === 'exitOut') {
          scene.remove(visitor.mesh);
          visitor.phase = 'done';
        }
        return;
      }
      visitor.mesh.position.set(
        visitor.from.x + (visitor.to.x - visitor.from.x) * visitor.t,
        0,
        visitor.from.z + (visitor.to.z - visitor.from.z) * visitor.t
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
  var overviewCamera = camera.position.clone();
  var overviewTarget = controls.target.clone();
  function focusTower(id) {
    var single = id && id !== 'all';
    var chosen = null;
    towerGroups.forEach(function(group) {
      var show = !single || group.userData.id === id;
      group.visible = show;
      if (show && single) chosen = group;
    });
    visitors.forEach(function(visitor) {
      if (!visitor.mesh) return;
      var homeId = visitor.spots && visitor.spots.towerId;
      visitor.mesh.visible = !single || !homeId || homeId === id;
    });
    if (!chosen) {
      camera.position.copy(overviewCamera);
      controls.target.copy(overviewTarget);
      return;
    }
    var spot = towerPos[id] || { x: 0, z: 0, height: 12 };
    controls.target.set(spot.x, Math.min(6, spot.height * 0.28), spot.z);
    camera.position.set(spot.x + 12, Math.max(8, spot.height * 0.45), spot.z + 16);
    if (typeof window.showCampusTower === 'function') window.showCampusTower(id);
  }
  window.__campus3D = {
    dispose: function() {
      window.removeEventListener('resize', resize);
      dispose();
    },
    syncVisitor: syncVisitor,
    focusTower: focusTower,
    focusGate: function(name) {
      focusTower('all');
      var spot = gatePos[name];
      if (!spot) return;
      var outX = spot.outX || 0;
      var outZ = spot.outZ == null ? 1 : spot.outZ;
      controls.target.set(spot.x, 1.6, spot.z);
      camera.position.set(spot.x + outX * 18 + 6, 14, spot.z + outZ * 18 + 6);
    },
  };
  if (window.__campusTowerFocus && window.__campusTowerFocus !== 'all') focusTower(window.__campusTowerFocus);
  (window.__campusVisitorQueue || []).forEach(function(item) {
    if (item && item.pass) syncVisitor(item.pass, item.action);
  });
  window.__campusVisitorQueue = [];
  ((window.__campusSnapshot && window.__campusSnapshot.passes) || []).forEach(function(pass) {
    var status = String(pass.status || '').toUpperCase();
    if (status === 'APPROVED') addVisitor(pass, 'wait');
    else if (status === 'CHECKED_IN') addVisitor(pass, 'parked');
  });
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
  box.removeAttribute('data-visit');
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
  box.removeAttribute('data-visit');
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
  box.removeAttribute('data-visit');
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
  var status = String(pass.status || '').toUpperCase();
  var where = 'On the way';
  if (status === 'APPROVED') where = 'Waiting outside ' + (campusGateName(pass.gateNumber) || pass.gateNumber || 'the gate');
  else if (status === 'CHECKED_IN') where = 'Inside, at flat ' + (pass.residentUnit || '—');
  else if (status === 'CHECKED_OUT') where = 'Left through ' + (pass.gateNumber || 'the gate');
  else if (status === 'CANCELLED') where = 'Pass cancelled';
  box.setAttribute('data-visit', String(pass.id));
  box.innerHTML = '<div class="campus-detail-title">' + campusText(pass.visitorName || 'Visitor') + '</div>' +
    '<div class="campus-detail-copy">' + campusText(pass.vehicleNumber || pass.visitorType || 'Guest') + '</div>' +
    '<div class="campus-detail-row">' + campusText(where) + '</div>' +
    '<div class="campus-detail-row">Flat ' + campusText(pass.residentUnit || '—') + ' · ' + campusText(pass.residentName || '') + '</div>';
};
