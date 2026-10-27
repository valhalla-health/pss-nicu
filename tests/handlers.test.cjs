// Handler-level test: drives a hospital backend's doPost with synthetic
// accounts (three roles at two sites) and reads the raw JSON each action
// returns, not the screen. It fails on any key outside the role's allow-list,
// on any other site's data, and on a denial that says more than "not available
// for your role". It also checks Pp's 2026-10-28 rule: only an admin listed in
// the CROSS_SITE_EDITORS Script Property reads, writes or deletes at another
// site.
//
// This file is copied unchanged into each hospital backend's own repo, where
// it tests that repo's code file and RoleView.gs. Here in valhalla-health/
// pss-nicu there is no backend, so point PSS_BACKEND at one or more copies of
// a backend's code file (separated by ; on Windows, : on Linux):
//
//   PSS_BACKEND=path/to/Code.gs node --test "tests/*.test.cjs"
//
// RoleView.gs (gas/ here, the repo root in a backend repo) is loaded first, as
// it sits beside the backend in the Apps Script project. With no backend to
// test, the suite is skipped.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const fx = require('./fixtures.cjs');
const { EXPECTED_FIELDS, EXPECTED_ACTIONS, EXPECTED_REPLY_KEYS, LIST_KIND } = require('./expected.cjs');

const ROOT = path.join(__dirname, '..');
const GATEWAY_URL = 'https://gateway.example.test/exec';
const META_KEYS = ['status', 'message', 'reason'];
// RoleView.gs sits in gas/ here and at the root of a backend's own repo.
const ROLE_VIEW_FILE = [path.join(ROOT, 'gas', 'RoleView.gs'), path.join(ROOT, 'RoleView.gs')].find((f) => fs.existsSync(f))
  || path.join(ROOT, 'gas', 'RoleView.gs');
// In a backend's own repo the code file sits at the root; elsewhere, name it.
const OWN_BACKEND = path.join(ROOT, 'รหัส.js');
const backends = process.env.PSS_BACKEND
  ? process.env.PSS_BACKEND.split(path.delimiter).filter(Boolean)
  : (fs.existsSync(OWN_BACKEND) ? [OWN_BACKEND] : []);

function makeSheet(header, records) {
  const data = [header.slice(), ...records.map((r) => header.map((h) => (r[h] === undefined ? '' : r[h])))];
  const cell = (r, c) => (data[r] && data[r][c] !== undefined ? data[r][c] : '');
  return {
    data,
    getDataRange: () => ({ getValues: () => data.map((r) => r.slice()) }),
    getRange(row, col, nr = 1, nc = 1) {
      return {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(row - 1 + i, col - 1 + j))),
        setValues: (vals) => vals.forEach((v, i) => {
          const r = data[row - 1 + i] || (data[row - 1 + i] = []);
          v.forEach((x, j) => { r[col - 1 + j] = x; });
        }),
        setValue: (v) => { data[row - 1][col - 1] = v; },
        clearContent: () => {
          for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (data[row - 1 + i]) data[row - 1 + i][col - 1 + j] = '';
        },
      };
    },
    appendRow: (r) => { data.push(r.slice()); },
    deleteRow: (i) => { data.splice(i - 1, 1); },
    getLastRow: () => data.length,
    getLastColumn: () => data[0].length,
  };
}

// A fresh Apps Script sandbox holding both sites' synthetic rows.
function sandbox(backendFile, { editors = '' } = {}) {
  const both = fx.SITES.map(fx.siteRecords);
  const sheets = {};
  for (const [name, header] of Object.entries(fx.HEADERS)) {
    sheets[name] = makeSheet(header, both.flatMap((r) => r[name]));
  }
  const sessions = Object.fromEntries([...fx.accounts(), fx.editorAccount()].map((a) => [a.token, a]));
  const cache = new Map();
  const props = { SPREADSHEET_ID: 'SHEET-TEST', GATEWAY_URL, CROSS_SITE_EDITORS: editors };
  const ctx = vm.createContext({
    console: { log() {}, error() {}, warn() {} },
    Logger: { log() {} },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (n) => sheets[n] || null }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null, getProperties: () => ({ ...props }) }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (cache.has(k) ? cache.get(k) : null), put: (k, v) => { cache.set(k, v); } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (s) => ({ setMimeType() { return this; }, getContent: () => s }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_alg, v) => [...crypto.createHash('sha256').update(String(v), 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
      getUuid: () => crypto.randomUUID(),
    },
    UrlFetchApp: {
      fetch(url, opts) {
        let body = { status: 'unauthorized' };
        if (url === GATEWAY_URL) {
          const a = sessions[JSON.parse(opts.payload).token];
          if (a) body = { status: 'ok', email: a.email, name: a.name, role: a.role, hospitalCode: a.hospitalCode, hospitalName: 'H', apiUrl: 'x' };
        }
        return { getResponseCode: () => (url === GATEWAY_URL ? 200 : 400), getContentText: () => JSON.stringify(body) };
      },
    },
  });
  if (fs.existsSync(ROLE_VIEW_FILE)) vm.runInContext(fs.readFileSync(ROLE_VIEW_FILE, 'utf8'), ctx, { filename: 'RoleView.gs' });
  vm.runInContext(fs.readFileSync(backendFile, 'utf8'), ctx, { filename: path.basename(backendFile) });
  const call = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
  return { call, sheets };
}

function row(sheet, idCol, id) {
  const [hdr, ...rows] = sheet.data;
  const r = rows.find((x) => x[hdr.indexOf(idCol)] === id);
  return r && Object.fromEntries(hdr.map((h, i) => [h, r[i]]));
}

// Every request an account makes in one session: the screens' own calls plus
// probes at the other site's records and at actions no screen uses.
function requests(acct, other) {
  const site = acct.hospitalCode;
  const now = new Date().toISOString().slice(0, 10);
  const items = Object.fromEntries(fx.ITEM_IDS.map((id) => [id, 2]));
  return [
    { action: 'login' },
    { action: 'getFamilies' },
    { action: 'getAssessments' },
    { action: 'getList' },
    { action: 'getInterventions', famId: `F-${site}-1` },
    { action: 'getNotes', famId: `F-${site}-1` },
    { action: 'getCarePlan', famId: `F-${site}-1` },
    { action: 'getInterventions', famId: `F-${other}-1` },
    { action: 'getNotes', famId: `F-${other}-1` },
    { action: 'getCarePlan', famId: `F-${other}-1` },
    { action: 'getStaff' },
    { action: 'getHospitals' },
    { action: 'saveFamily', fam: { hospitalCode: site, famId: `F-${site}-9`, bed: '9', infantId: `HN-${site}-9`, ga: 30, bw: 1300, admitDate: now, dx: 'RDS' } },
    { action: 'saveAssessment', ass: { hospitalCode: site, assId: `A-${site}-9`, famId: `F-${site}-1`, ssScore: 12, iaScore: 18, prScore: 12, scScore: 10, total: 52, severity: 'mod', date: now, dayAdmit: 3, notes: '', ...items } },
    { action: 'saveIntervention', intervention: { hospitalCode: site, intervId: `IV-${site}-9`, famId: `F-${site}-1`, kind: 'counselling', note: '', date: now } },
    { action: 'saveNote', note: { hospitalCode: site, noteId: `N-${site}-9`, famId: `F-${site}-1`, text: 'ok', date: now } },
    { action: 'saveCarePlan', carePlan: { famId: `F-${site}-1`, itemIdx: 1, checked: true, at: now } },
    { action: 'deleteAssessment', assId: `A-${site}-9` },
    { action: 'deleteNote', noteId: `N-${site}-1` },
    { action: 'deleteIntervention', intervId: `IV-${site}-1` },
    { action: 'deleteFamily', famId: `F-${site}-2` },
  ];
}

function checkReply(acct, other, req, reply, denial) {
  const { role } = acct;
  const where = `${role}/${acct.hospitalCode} ${req.action}${req.famId ? ' ' + req.famId : ''}`;
  const allowedTop = [...META_KEYS, ...(EXPECTED_REPLY_KEYS[req.action] || [])];
  for (const k of Object.keys(reply)) {
    assert.ok(allowedTop.includes(k), `${where}: reply key "${k}" is outside the allow-list`);
  }
  for (const [k, kind] of Object.entries(LIST_KIND)) {
    if (!Array.isArray(reply[k])) continue;
    for (const rec of reply[k]) {
      for (const key of Object.keys(rec)) {
        assert.ok(EXPECTED_FIELDS[role][kind].includes(key), `${where}: ${k}[].${key} is outside the ${role} allow-list`);
      }
    }
  }
  const text = JSON.stringify(reply);
  for (const marker of other ? fx.siteMarkers(other) : []) {
    assert.ok(!text.includes(marker), `${where}: reply carries ${other} data (${marker})`);
  }
  if (!EXPECTED_ACTIONS[role].includes(req.action)) {
    assert.ok(['forbidden', 'unknown_action'].includes(reply.status), `${where}: should be denied, got ${reply.status}`);
  }
  if (reply.status === 'forbidden') {
    assert.deepEqual(reply, denial, `${where}: denial must be the plain role message`);
  }
}

if (!backends.length) {
  test('hospital backend handlers (set PSS_BACKEND to run)', { skip: 'PSS_BACKEND not set; the backends live outside this repo' }, () => {});
}

for (const file of backends) {
  const label = path.basename(path.dirname(file)) + '/' + path.basename(file);
  const denial = { status: 'forbidden', message: (() => {
    if (!fs.existsSync(ROLE_VIEW_FILE)) return '(RoleView.gs is missing)';
    const c = vm.createContext({});
    vm.runInContext(fs.readFileSync(ROLE_VIEW_FILE, 'utf8'), c);
    return vm.runInContext('ROLE_VIEW_DENIED', c);
  })() };

  for (const acct of fx.accounts()) {
    const other = fx.SITES.find((s) => s !== acct.hospitalCode);

    test(`${label}: ${acct.role} at ${acct.hospitalCode} receives only its allow-list`, () => {
      const { call } = sandbox(file);
      for (const req of requests(acct, other)) {
        const reply = call({ ...req, token: acct.token });
        checkReply(acct, other, req, reply, denial);
      }
    });

    test(`${label}: ${acct.role} at ${acct.hospitalCode} cannot tell another site's record from a missing one`, () => {
      const { call } = sandbox(file);
      const theirs = call({ action: 'deleteAssessment', assId: `A-${other}-1`, token: acct.token });
      const missing = call({ action: 'deleteAssessment', assId: 'A-nowhere', token: acct.token });
      assert.deepEqual(theirs, missing);
    });

    test(`${label}: ${acct.role} at ${acct.hospitalCode} changing a bed keeps the fields it never received`, () => {
      const { call, sheets } = sandbox(file);
      const before = row(sheets.families, 'famId', `F-${acct.hospitalCode}-1`);
      const fam = call({ action: 'getFamilies', token: acct.token }).families.find((f) => f.famId === before.famId);
      const reply = call({ action: 'saveFamily', fam: { ...fam, bed: '7' }, token: acct.token });
      assert.equal(reply.status, 'ok');
      const after = row(sheets.families, 'famId', before.famId);
      assert.equal(after.bed, '7');
      for (const k of fx.HEADERS.families.filter((h) => h !== 'bed')) {
        assert.deepEqual(after[k], before[k], `saveFamily overwrote ${k}`);
      }
    });
  }
}

// Pp's decision of 2026-10-28: only accounts listed in CROSS_SITE_EDITORS (and
// with the admin role) write, delete and read on both sites. Everyone else,
// admins included, stays on its own site.
function siteRows(sheets, site) {
  return Object.fromEntries(Object.entries(sheets).map(([name, sh]) => {
    const col = sh.data[0].indexOf('hospitalCode');
    return [name, sh.data.slice(1).filter((r) => String(r[col]).trim() === site).map((r) => r.join('|')).sort()];
  }));
}

// Writes and deletes aimed at `other`, each paired with the same call on an id
// that exists nowhere, so the two replies can be compared.
function crossSiteWrites(acct, other) {
  const site = acct.hospitalCode;
  const theirFam = fx.siteRecords(other).families[0];
  return [
    { req: { action: 'saveFamily', fam: { ...theirFam, bed: '8' } } },
    { req: { action: 'saveFamily', fam: { ...theirFam, hospitalCode: site, bed: '8' } } },
    { req: { action: 'saveAssessment', ass: { hospitalCode: site, assId: `A-${other}-1`, famId: `F-${site}-1`, total: 1 } } },
    { req: { action: 'saveAssessment', ass: { hospitalCode: other, assId: `A-${other}-9`, famId: `F-${other}-1`, total: 1 } } },
    { req: { action: 'saveIntervention', intervention: { hospitalCode: other, intervId: `IV-${other}-9`, famId: `F-${other}-1`, kind: 'x' } } },
    { req: { action: 'saveNote', note: { hospitalCode: other, noteId: `N-${other}-9`, famId: `F-${other}-1`, text: 'x' } } },
    { req: { action: 'deleteAssessment', assId: `A-${other}-1` }, missing: { action: 'deleteAssessment', assId: 'A-nowhere' } },
    { req: { action: 'deleteNote', noteId: `N-${other}-1` }, missing: { action: 'deleteNote', noteId: 'N-nowhere' } },
    { req: { action: 'deleteIntervention', intervId: `IV-${other}-1` }, missing: { action: 'deleteIntervention', intervId: 'IV-nowhere' } },
    { req: { action: 'deleteFamily', famId: `F-${other}-1` }, missing: { action: 'deleteFamily', famId: 'F-nowhere' } },
  ];
}

for (const file of backends) {
  const label = path.basename(path.dirname(file)) + '/' + path.basename(file);
  const denial = { status: 'forbidden', message: vm.runInContext('ROLE_VIEW_DENIED', (() => {
    const c = vm.createContext({});
    if (fs.existsSync(ROLE_VIEW_FILE)) vm.runInContext(fs.readFileSync(ROLE_VIEW_FILE, 'utf8'), c);
    else vm.runInContext("var ROLE_VIEW_DENIED = '(RoleView.gs is missing)'", c);
    return c;
  })()) };
  const editor = fx.editorAccount();

  for (const acct of [...fx.accounts(), editor]) {
    const other = fx.SITES.find((s) => s !== acct.hospitalCode);
    test(`${label}: ${acct.role} ${acct.email} cannot write or delete at ${other} (CROSS_SITE_EDITORS empty)`, () => {
      const { call, sheets } = sandbox(file, { editors: '' });
      const before = siteRows(sheets, other);
      for (const { req, missing } of crossSiteWrites(acct, other)) {
        const reply = call({ ...req, token: acct.token });
        if (missing) assert.deepEqual(reply, call({ ...missing, token: acct.token }), `${req.action} on ${other} differs from a missing id`);
        else assert.deepEqual(reply, denial, `${req.action} on ${other} should be refused`);
      }
      assert.deepEqual(siteRows(sheets, other), before, `${other} rows changed`);
    });
  }

  test(`${label}: with CROSS_SITE_EDITORS empty the would-be editor reads only its own site`, () => {
    const { call } = sandbox(file, { editors: '' });
    const fams = call({ action: 'getFamilies', token: editor.token }).families;
    assert.deepEqual([...new Set(fams.map((f) => f.hospitalCode))], ['KCMH']);
  });

  test(`${label}: a listed email without the admin role stays on its own site`, () => {
    const nurse = fx.accounts().find((a) => a.role === 'nurse' && a.hospitalCode === 'KCMH');
    const { call, sheets } = sandbox(file, { editors: nurse.email });
    const fams = call({ action: 'getFamilies', token: nurse.token }).families;
    assert.deepEqual([...new Set(fams.map((f) => f.hospitalCode))], ['KCMH']);
    const before = siteRows(sheets, 'SPR');
    call({ action: 'saveFamily', fam: { ...fx.siteRecords('SPR').families[0], bed: '8' }, token: nurse.token });
    assert.deepEqual(siteRows(sheets, 'SPR'), before);
  });

  test(`${label}: the listed editor reads, writes and deletes at both sites`, () => {
    const { call, sheets } = sandbox(file, { editors: `other@example.test, ${editor.email}` });
    const tok = editor.token;
    const reply = call({ action: 'getFamilies', token: tok });
    assert.deepEqual([...new Set(reply.families.map((f) => f.hospitalCode))].sort(), ['KCMH', 'SPR']);
    checkReply(editor, null, { action: 'getFamilies' }, reply, denial);
    assert.equal(call({ action: 'getAssessments', token: tok }).assessments.filter((a) => a.famId.startsWith('F-SPR')).length, 2);
    assert.equal(call({ action: 'getInterventions', famId: 'F-SPR-1', token: tok }).interventions.length, 1);
    assert.equal(call({ action: 'getNotes', famId: 'F-SPR-1', token: tok }).notes.length, 1);

    const fam = reply.families.find((f) => f.famId === 'F-SPR-1');
    const before = row(sheets.families, 'famId', 'F-SPR-1');
    assert.equal(call({ action: 'saveFamily', fam: { ...fam, bed: '8' }, token: tok }).status, 'ok');
    const after = row(sheets.families, 'famId', 'F-SPR-1');
    assert.equal(after.bed, '8');
    assert.equal(after.parentName, before.parentName, 'withheld fields survive the editor\'s bed change');
    assert.equal(after.hospitalCode, 'SPR');

    assert.equal(call({ action: 'deleteNote', noteId: 'N-SPR-1', token: tok }).status, 'ok');
    assert.equal(row(sheets.notes, 'noteId', 'N-SPR-1'), undefined);
    assert.equal(call({ action: 'deleteIntervention', intervId: 'IV-SPR-1', token: tok }).status, 'ok');
    assert.equal(call({ action: 'deleteAssessment', assId: 'A-SPR-2', token: tok }).status, 'ok');
    assert.equal(call({ action: 'deleteFamily', famId: 'F-SPR-2', token: tok }).status, 'ok');
    assert.equal(row(sheets.families, 'famId', 'F-SPR-2'), undefined);
  });
}
