// Synthetic two-site data for the role-view tests. Every value is made up:
// no real patient, parent, staff member or sheet appears here.
'use strict';

const SITES = ['KCMH', 'SPR'];
const ROLES = ['nurse', 'doctor', 'admin'];

const ITEM_IDS = [
  ...[1, 2, 3, 4, 5, 6].map((n) => 'ss' + n),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => 'ia' + n),
  ...[1, 2, 3, 4, 5, 6].map((n) => 'pr' + n),
  ...[1, 2, 3, 4, 5].map((n) => 'sc' + n),
];

// Sheet headers as the hospital backends create them. The assessments sheet
// keeps the two legacy columns (parentName, bed) that older sheets still have.
const HEADERS = {
  hospitals: ['hospitalCode', 'name'],
  staff: ['email', 'hospitalCode', 'role', 'active', 'name'],
  families: ['hospitalCode', 'famId', 'bed', 'infantId', 'parentName', 'parentInitials',
    'relation', 'babyName', 'ga', 'bw', 'admitDate', 'dx', 'active', 'createdAt'],
  assessments: ['hospitalCode', 'assId', 'famId', ...ITEM_IDS,
    'ssScore', 'iaScore', 'prScore', 'scScore', 'total', 'normAvg', 'severity',
    'date', 'dayAdmit', 'notes', 'by', 'synced', 'parentName', 'bed'],
  interventions: ['hospitalCode', 'intervId', 'famId', 'date', 'kind', 'note', 'by', 'createdAt'],
  notes: ['hospitalCode', 'noteId', 'famId', 'assId', 'text', 'date', 'by', 'createdAt'],
  carePlans: ['hospitalCode', 'planId', 'famId', 'itemIdx', 'checked', 'by', 'at', 'createdAt'],
};

const ALL_COLUMNS = [...new Set(Object.values(HEADERS).flat())];

function fam(site, n) { return `F-${site}-${n}`; }

// One site's rows, as objects keyed by header. Strings that must never reach
// another site's account carry the site code, so a leak is easy to spot.
function siteRecords(site) {
  const old = '2026-01-01T00:00:00.000Z';
  const families = [1, 2].map((n) => ({
    hospitalCode: site, famId: fam(site, n), bed: String(n), infantId: `HN-${site}-${n}`,
    parentName: `Parent-${site}-${n}`, parentInitials: `P${site}${n}`, relation: 'mother',
    babyName: `Baby-${site}-${n}`, ga: 28 + n, bw: 1000 + n, admitDate: '2026-10-01',
    dx: `Dx-${site}-${n}`, active: true, createdAt: old,
  }));
  const assessments = [1, 2].map((n) => {
    const row = {
      hospitalCode: site, assId: `A-${site}-${n}`, famId: fam(site, n),
      ssScore: 6, iaScore: 9, prScore: 6, scScore: 5, total: 26, normAvg: 1.3, severity: 'mild',
      date: '2026-10-05', dayAdmit: 5, notes: `Answer-note-${site}-${n}`,
      by: `nurse.${site.toLowerCase()}@example.test`, synced: old,
      parentName: `Parent-${site}-${n}`, bed: String(n),
    };
    ITEM_IDS.forEach((id) => { row[id] = 1; });
    return row;
  });
  const interventions = [{
    hospitalCode: site, intervId: `IV-${site}-1`, famId: fam(site, 1), date: '2026-10-06',
    kind: 'counselling', note: `Iv-note-${site}`, by: `nurse.${site.toLowerCase()}@example.test`, createdAt: old,
  }];
  const notes = [{
    hospitalCode: site, noteId: `N-${site}-1`, famId: fam(site, 1), assId: `A-${site}-1`,
    text: `Note-text-${site}`, date: '2026-10-06', by: `doctor.${site.toLowerCase()}@example.test`, createdAt: old,
  }];
  const carePlans = [{
    hospitalCode: site, planId: `CP-${site}-1`, famId: fam(site, 1), itemIdx: 0, checked: true,
    by: `nurse.${site.toLowerCase()}@example.test`, at: '2026-10-06', createdAt: old,
  }];
  const staff = ROLES.map((role) => ({
    email: `${role}.${site.toLowerCase()}@example.test`, hospitalCode: site, role, active: true,
    name: `${role} ${site}`,
  }));
  const hospitals = [{ hospitalCode: site, name: `Hospital ${site}` }];
  return { families, assessments, interventions, notes, carePlans, staff, hospitals };
}

// Strings that identify a site's parents and patients.
function siteMarkers(site) {
  const r = siteRecords(site);
  return [
    ...r.families.flatMap((f) => [f.famId, f.infantId, f.parentName, f.babyName, f.dx]),
    ...r.assessments.flatMap((a) => [a.assId, a.notes]),
    ...r.interventions.map((i) => i.note),
    ...r.notes.map((n) => n.text),
  ];
}

function accounts() {
  return SITES.flatMap((site) => ROLES.map((role) => ({
    token: `tok-${role}-${site}`,
    email: `${role}.${site.toLowerCase()}@example.test`,
    name: `${role} ${site}`,
    role,
    hospitalCode: site,
  })));
}

// The one account that may read and write both sites, once its email is in
// the CROSS_SITE_EDITORS Script Property. An admin at KCMH otherwise.
function editorAccount() {
  return { token: 'tok-editor-KCMH', email: 'editor.kcmh@example.test', name: 'editor KCMH', role: 'admin', hospitalCode: 'KCMH' };
}

module.exports = { SITES, ROLES, ITEM_IDS, HEADERS, ALL_COLUMNS, siteRecords, siteMarkers, accounts, editorAccount };
