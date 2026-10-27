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

// Loads RoleView.gs; `editors` is the CROSS_SITE_EDITORS Script Property
// (undefined: no PropertiesService at all, as outside Apps Script).
function loadRoleView(editors) {
  const globals = editors === undefined ? {} : {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'CROSS_SITE_EDITORS' ? editors : null) }) },
  };
  const ctx = vm.createContext(globals);
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

// Pp's decision of 2026-10-28: only the accounts listed in the Script Property
// CROSS_SITE_EDITORS work across sites, and only if their role is admin. Since
// editing the other site needs reading it, they read every site too.
test('with CROSS_SITE_EDITORS empty or missing, nobody reads another site', () => {
  const editor = fx.editorAccount();
  for (const editors of [undefined, '', '  ']) {
    const ctx = loadRoleView(editors);
    const reply = vm.runInContext('roleViewReply', ctx)(editor, 'getFamilies', rawReply('getFamilies'));
    assert.ok(reply.families.every((f) => f.hospitalCode === 'KCMH'), `editors=${JSON.stringify(editors)}`);
    assert.equal(vm.runInContext('roleViewHasSite', ctx)(editor, 'SPR'), false);
    assert.equal(vm.runInContext('roleViewHasSite', ctx)(editor, 'KCMH'), true);
  }
});

test('a listed admin reads every site, still cut to the admin allow-list', () => {
  const ctx = loadRoleView(' someone@example.test, EDITOR.KCMH@example.test ');
  const editor = fx.editorAccount();
  const reply = JSON.parse(JSON.stringify(vm.runInContext('roleViewReply', ctx)(editor, 'getAssessments', rawReply('getAssessments'))));
  assert.deepEqual([...new Set(reply.assessments.map((a) => a.famId.split('-')[1]))].sort(), ['KCMH', 'SPR']);
  for (const a of reply.assessments) {
    for (const k of Object.keys(a)) assert.ok(EXPECTED_FIELDS.admin.assessment.includes(k), k);
  }
  const hasSite = vm.runInContext('roleViewHasSite', ctx);
  assert.equal(hasSite(editor, 'SPR'), true);
  assert.equal(hasSite(editor, ''), false, 'a row with no site stays out, even for the editor');
  const blank = vm.runInContext('roleViewReply', ctx)(editor, 'getFamilies',
    { status: 'ok', families: [{ ...fx.siteRecords('SPR').families[0], hospitalCode: '' }] });
  assert.equal(blank.families.length, 0);
});

test('a listed email gives nothing extra unless the role is admin', () => {
  const ctx = loadRoleView('nurse.kcmh@example.test, admin.spr@example.test');
  const nurse = fx.accounts().find((a) => a.role === 'nurse' && a.hospitalCode === 'KCMH');
  const plainAdmin = fx.accounts().find((a) => a.role === 'admin' && a.hospitalCode === 'KCMH');
  const hasSite = vm.runInContext('roleViewHasSite', ctx);
  assert.equal(hasSite(nurse, 'SPR'), false);
  assert.equal(hasSite(plainAdmin, 'SPR'), false, 'an admin not on the list stays on its own site');
  const reply = vm.runInContext('roleViewReply', ctx)(nurse, 'getFamilies', rawReply('getFamilies'));
  assert.ok(reply.families.every((f) => f.hospitalCode === 'KCMH'));
});
