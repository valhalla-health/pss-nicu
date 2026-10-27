// Handler-level test: drives a hospital backend's doPost with synthetic
// accounts (three roles at two sites) and reads the raw JSON each action
// returns, not the screen. It fails on any key outside the role's allow-list,
// on any other site's data, and on a denial that says more than "not available
// for your role".
//
// The hospital backends are not in this repository. Point PSS_BACKEND at one
// or more copies of a backend's code file (separated by ; on Windows, : on
// Linux) to run it:
//
//   PSS_BACKEND=path/to/Code.gs node --test "tests/*.test.cjs"
//
// gas/RoleView.gs is loaded first, as it sits beside the backend in the Apps
// Script project. Without PSS_BACKEND the test is skipped.
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
const backends = (process.env.PSS_BACKEND || '').split(path.delimiter).filter(Boolean);

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
function sandbox(backendFile) {
  const both = fx.SITES.map(fx.siteRecords);
  const sheets = {};
  for (const [name, header] of Object.entries(fx.HEADERS)) {
    sheets[name] = makeSheet(header, both.flatMap((r) => r[name]));
  }
  const sessions = Object.fromEntries(fx.accounts().map((a) => [a.token, a]));
  const cache = new Map();
  const props = { SPREADSHEET_ID: 'SHEET-TEST', GATEWAY_URL };
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
  const roleView = path.join(ROOT, 'gas', 'RoleView.gs');
  if (fs.existsSync(roleView)) vm.runInContext(fs.readFileSync(roleView, 'utf8'), ctx, { filename: 'RoleView.gs' });
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
  for (const marker of fx.siteMarkers(other)) {
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
    const src = path.join(ROOT, 'gas', 'RoleView.gs');
    if (!fs.existsSync(src)) return '(gas/RoleView.gs is missing)';
    const c = vm.createContext({});
    vm.runInContext(fs.readFileSync(src, 'utf8'), c);
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
      if (acct.role === 'admin') return; // admin writes are not site-scoped; see the PR's open questions
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
