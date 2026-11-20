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

  var gatesHtml = gateNames.map(function(name, index) {
    var guards = guardsByGate[name] || [];
    var waiting = expected.filter(function(pass) {
      return (campusGateName(pass.gateNumber) || 'Main Gate') === name;
    });
    return '<section class="campus-gate" data-gate="' + index + '">' +
      '<div class="campus-gate-arch"><span></span><span></span><span></span></div>' +
      '<div class="campus-gate-name">' + campusText(name) + '</div>' +
      '<div class="campus-guards">' +
        (guards.length ? guards.map(function(guard) {
          var onDuty = String(guard.status || '').toUpperCase() === 'ON_DUTY';
          return '<button type="button" class="campus-guard' + (onDuty ? ' is-on' : '') + '" onclick="window.showCampusGuard(' + index + ',' + guards.indexOf(guard) + ')">' +
            '<span class="campus-guard-figure"></span>' +
            '<strong>' + campusText(guard.staffName || 'Guard') + '</strong>' +
            '<em>' + campusText(onDuty ? 'On duty' : (guard.status || 'Off duty')) + '</em>' +
          '</button>';
        }).join('') : '<div class="campus-guard-empty">No guard saved on this post</div>') +
      '</div>' +
      (waiting.length ? '<div class="campus-waiting">' + waiting.length + ' expected</div>' : '') +
    '</section>';
  }).join('');

  var movers = inside.map(function(pass, index) {
    var gate = campusGateName(pass.gateNumber) || 'Main Gate';
    var gateIndex = Math.max(0, gateNames.indexOf(gate));
    var towerIndex = 0;
    towers.forEach(function(tower, idx) {
      if (tower.units.some(function(unit) { return unit.unitNumber === pass.residentUnit || unit.id === pass.unitId; })) towerIndex = idx;
    });
    var from = gateNames.length <= 1 ? 8 : Math.round((gateIndex + 0.5) * (100 / gateNames.length));
    var to = towers.length <= 1 ? 70 : Math.round((towerIndex + 0.5) * (100 / towers.length));
    return '<button type="button" class="campus-mover" style="--from:' + from + '%;--to:' + to + '%;animation-delay:' + (index * 0.7) + 's" onclick="window.showCampusVisit(\'' + campusText(pass.id) + '\')">' +
      '<span>' + campusText(pass.visitorName || 'Visitor') + '</span>' +
      '<em>' + campusText(gate) + ' → ' + campusText(pass.residentUnit || 'flat') + '</em>' +
    '</button>';
  }).join('');

  var towersHtml = towers.map(function(tower, index) {
    var shown = tower.units.slice(0, 24);
    var windows = shown.map(function(unit) {
      var issues = complaintsByUnit[unit.id] || [];
      var tone = issues.length ? campusComplaintTone(issues[0].status) : '';
      var occupied = String(unit.occupancyStatus || '').toUpperCase() !== 'VACANT' && String(unit.occupancyStatus || '') !== '';
      var parked = (vehiclesByUnit[unit.id] || []).length;
      var cls = 'campus-window' + (tone ? ' is-' + tone : (occupied ? ' is-live' : ' is-empty'));
      return '<button type="button" class="' + cls + '" title="' + campusText(unit.unitNumber) + '" onclick="window.showCampusUnit(\'' + campusText(unit.id) + '\')">' +
        '<b>' + campusText(unit.unitNumber) + '</b>' +
        (parked ? '<i>' + parked + '</i>' : '') +
      '</button>';
    }).join('');
    var issueCount = tower.units.reduce(function(sum, unit) { return sum + ((complaintsByUnit[unit.id] || []).length); }, 0);
    return '<section class="campus-tower">' +
      '<div class="campus-tower-top">' + campusText(tower.name) + (issueCount ? '<span class="campus-issue-count">' + issueCount + '</span>' : '') + '</div>' +
      '<div class="campus-windows">' + (windows || '<div class="campus-guard-empty">No flats in this block</div>') + '</div>' +
      (tower.units.length > shown.length ? '<div class="campus-more">+' + (tower.units.length - shown.length) + ' more flats</div>' : '') +
      '<div class="campus-park">' + tower.units.reduce(function(list, unit) {
        return list.concat(vehiclesByUnit[unit.id] || []);
      }, []).slice(0, 4).map(function(vehicle) {
        return '<button type="button" class="campus-car" onclick="window.showCampusVehicle(\'' + campusText(vehicle.id) + '\')">' + campusText(vehicle.registrationNo || 'Vehicle') + (vehicle.parkingSlot ? ' · ' + campusText(vehicle.parkingSlot) : '') + '</button>';
      }).join('') + '</div>' +
    '</section>';
  }).join('');

  stage.innerHTML = '<div class="campus-ground">' +
    '<div class="campus-gates">' + gatesHtml + '</div>' +
    '<div class="campus-road"><div class="campus-road-line"></div>' + movers + '</div>' +
    '<div class="campus-blocks">' + towersHtml + '</div>' +
  '</div>';
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
