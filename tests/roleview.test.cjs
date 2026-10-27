// Unit tests for gas/RoleView.gs, the per-role allow-lists that decide which
// fields a hospital backend may send. Run: node --test "tests/*.test.cjs"
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const fx = require('./fixtures.cjs');

const ROOT = path.join(__dirname, '..');

function loadRoleView() {
  const ctx = vm.createContext({});
  const src = fs.readFileSync(path.join(ROOT, 'gas', 'RoleView.gs'), 'utf8');
  vm.runInContext(src, ctx, { filename: 'RoleView.gs' });
  return ctx;
}

const rv = loadRoleView();
const g = (expr) => vm.runInContext(expr, rv);

const { CLINICAL, EXPECTED_FIELDS, EXPECTED_ACTIONS, EXPECTED_REPLY_KEYS, LIST_KIND } = require('./expected.cjs');

// A raw reply as today's handlers build it: whole sheet rows from both sites.
function rawReply(action) {
  const both = fx.SITES.map(fx.siteRecords);
  const all = (k) => both.flatMap((r) => r[k]);
  switch (action) {
    case 'login': return { status: 'ok', email: 'x@example.test', name: 'X', role: 'nurse', hospitalCode: 'KCMH', hospitalName: 'H', token: 'leak' };
    case 'getFamilies': return { status: 'ok', families: all('families') };
    case 'getAssessments': return { status: 'ok', assessments: all('assessments') };
    case 'getInterventions': return { status: 'ok', interventions: all('interventions') };
    case 'getNotes': return { status: 'ok', notes: all('notes') };
    case 'getCarePlan': return { status: 'ok', carePlans: all('carePlans') };
    case 'getList': return { status: 'ok', role: 'nurse', hospitalCode: 'KCMH', families: all('families'), assessments: all('assessments') };
    case 'getStaff': return { status: 'ok', staff: all('staff') };
    case 'getHospitals': return { status: 'ok', hospitals: all('hospitals') };
    case 'saveAssessment': return { status: 'ok', assId: 'A-1', normAvg: 1.3 };
    case 'saveCarePlan': return { status: 'ok', planId: 'CP-9' };
    case 'deleteFamily': return { status: 'ok', famId: 'F-1', deleted: { families: 1 } };
    default: return { status: 'ok', famId: 'F-1', assId: 'A-1', intervId: 'IV-1', noteId: 'N-1' };
  }
}

const ALL_ACTIONS = [...EXPECTED_ACTIONS.admin, 'getStaff', 'getHospitals'];

test('allow-lists match what the screens render, role by role', () => {
  for (const role of fx.ROLES) {
    const got = JSON.parse(JSON.stringify(g(`ROLE_VIEW_FIELDS[${JSON.stringify(role)}]`)));
    assert.deepEqual(Object.keys(got).sort(), Object.keys(EXPECTED_FIELDS[role]).sort(), role);
    for (const kind of Object.keys(got)) {
      assert.deepEqual([...got[kind]].sort(), [...EXPECTED_FIELDS[role][kind]].sort(), `${role}.${kind}`);
    }
    assert.deepEqual([...g(`ROLE_VIEW_ACTIONS[${JSON.stringify(role)}]`)].sort(),
      [...EXPECTED_ACTIONS[role]].sort(), `${role} actions`);
  }
  const replyKeys = JSON.parse(JSON.stringify(g('ROLE_VIEW_REPLY_KEYS')));
  assert.deepEqual(Object.keys(replyKeys).sort(), Object.keys(EXPECTED_REPLY_KEYS).sort());
  for (const [action, keys] of Object.entries(EXPECTED_REPLY_KEYS)) {
    assert.deepEqual([...replyKeys[action]].sort(), [...keys].sort(), `${action} reply keys`);
  }
});

test('every allow-listed field is one the frontend actually reads', () => {
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const jsx = ['app.jsx', 'screens.jsx', 'components.jsx'].map(read).join('\n');
  const data = read('data.jsx');
  for (const role of fx.ROLES) {
    for (const [kind, fields] of Object.entries(EXPECTED_FIELDS[role])) {
      for (const f of fields) {
        const used = new RegExp(`\\.${f}\\b`).test(jsx) || data.includes(`id: '${f}'`);
        assert.ok(used, `${role}.${kind}.${f} is allow-listed but no screen reads it`);
      }
    }
  }
});

for (const role of fx.ROLES) {
  for (const site of fx.SITES) {
    const user = { role, hospitalCode: site };
    const other = fx.SITES.find((s) => s !== site);

    test(`${role} at ${site}: every reply carries only allow-listed keys from its own site`, () => {
      for (const action of ALL_ACTIONS) {
        const raw = rawReply(action);
        const out = JSON.parse(JSON.stringify(g('roleViewReply')(user, action, raw)));
        if (!EXPECTED_ACTIONS[role].includes(action)) {
          assert.equal(out.status, 'forbidden', `${action} should be denied for ${role}`);
          continue;
        }
        const listKeys = Object.keys(out).filter((k) => LIST_KIND[k]);
        for (const k of Object.keys(out)) {
          assert.ok(k === 'status' || EXPECTED_REPLY_KEYS[action].includes(k), `${action}: key ${k} is not allow-listed`);
        }
        for (const k of listKeys) {
          const allowed = EXPECTED_FIELDS[role][LIST_KIND[k]];
          for (const rec of out[k]) {
            for (const key of Object.keys(rec)) {
              assert.ok(allowed.includes(key), `${role}/${site} ${action}.${k}: key ${key} is not allow-listed`);
            }
          }
          assert.ok(out[k].length > 0, `${action}.${k}: own-site rows were dropped`);
        }
        const text = JSON.stringify(out);
        for (const marker of fx.siteMarkers(other)) {
          assert.ok(!text.includes(marker), `${role}/${site} ${action} leaks ${other} data (${marker})`);
        }
      }
    });
  }
}

test('roleView drops other-site, unlabelled and unknown-role records', () => {
  const roleView = g('roleView');
  const famK = fx.siteRecords('KCMH').families[0];
  assert.deepEqual(Object.keys(roleView('nurse', 'KCMH', famK, 'family')).sort(),
    [...CLINICAL.family].sort());
  assert.equal(roleView('nurse', 'SPR', famK, 'family'), null);
  assert.equal(roleView('admin', 'SPR', famK, 'family'), null);
  assert.equal(roleView('nurse', 'KCMH', { ...famK, hospitalCode: '' }, 'family'), null);
  assert.equal(roleView('nurse', '', famK, 'family'), null);
  assert.equal(roleView('resident', 'KCMH', famK, 'family'), null);
  assert.equal(roleView('nurse', 'KCMH', famK, 'staff'), null);
  assert.ok(roleView(' Nurse ', 'KCMH', { ...famK, hospitalCode: 'KCMH ' }, 'family'));
});

test('an unknown role gets the denial for every action', () => {
  for (const action of ALL_ACTIONS) {
    const out = g('roleViewReply')({ role: 'resident', hospitalCode: 'KCMH' }, action, rawReply(action));
    assert.equal(out.status, 'forbidden', action);
  }
});

test('the denial names no field, site or parent', () => {
  const denial = JSON.parse(JSON.stringify(g('roleViewDenied()')));
  assert.deepEqual(Object.keys(denial).sort(), ['message', 'status']);
  assert.equal(denial.status, 'forbidden');
  const text = denial.message.toLowerCase();
  const banned = [...fx.ALL_COLUMNS, ...fx.SITES, ...fx.SITES.flatMap(fx.siteMarkers), 'parent', 'site', 'hospital'];
  for (const word of banned) {
    assert.ok(!text.includes(String(word).toLowerCase()), `denial mentions "${word}"`);
  }
});
