// PSS:NICU — what each role may receive from a hospital backend
//
// Copy this file into every hospital's Apps Script project, beside the
// backend's code file. A file there shares one global scope with the others.
// The backend then does four things in doPost:
//   1. after verifyToken:   if (!roleViewAllows(user, action)) return out(roleViewDenied());
//   2. every data reply:    return out(roleViewReply(user, action, { status: 'ok', ... }));
//   3. every refusal:       return out(roleViewDenied());
//   4. every read filter and every write or delete: roleViewHasSite(user, row's hospitalCode)
//
// Hiding a field on screen is not enough: whatever a reply carries can be read
// in the browser's network tab. So the server sends only the fields a role's
// screens render, and only rows from the caller's own site (hospitalCode).
// tests/roleview.test.cjs and tests/handlers.test.cjs check both.
//
// One exception (Pp, 2026-10-28): an admin whose email is listed in the Script
// Property CROSS_SITE_EDITORS reads, writes and deletes on every site, because
// editing the other site needs reading it. With the property empty, nobody
// works across sites. Every other admin stays on its own site.

// The one refusal text. It says only that the item is not open to this role
// and never names the field, site or family behind it.
const ROLE_VIEW_DENIED = 'รายการนี้ไม่เปิดให้บทบาทของคุณ';

const ROLE_VIEW_ITEM_IDS_ = [
  'ss1', 'ss2', 'ss3', 'ss4', 'ss5', 'ss6',
  'ia1', 'ia2', 'ia3', 'ia4', 'ia5', 'ia6', 'ia7', 'ia8', 'ia9',
  'pr1', 'pr2', 'pr3', 'pr4', 'pr5', 'pr6',
  'sc1', 'sc2', 'sc3', 'sc4', 'sc5',
];

// Fields the clinical screens read, per record kind (2026-10-27). Nurse,
// doctor and admin see the same screens; admin only adds the threshold card.
// Not sent to any role: parentName, parentInitials, relation, babyName,
// active and createdAt on families; normAvg, severity, dayAdmit, synced and
// the legacy parentName/bed on assessments; planId; every row's site code
// except the family's, which picks the ward's bed list.
const ROLE_VIEW_CLINICAL_ = Object.freeze({
  family:       Object.freeze(['famId', 'hospitalCode', 'bed', 'infantId', 'ga', 'bw', 'admitDate', 'dx']),
  assessment:   Object.freeze(['assId', 'famId', 'date', 'total', 'ssScore', 'iaScore', 'prScore', 'scScore',
                               'notes', 'by'].concat(ROLE_VIEW_ITEM_IDS_)),
  intervention: Object.freeze(['intervId', 'famId', 'date', 'kind', 'note', 'by']),
  note:         Object.freeze(['noteId', 'famId', 'date', 'text', 'by']),
  carePlan:     Object.freeze(['itemIdx', 'checked', 'by', 'at']),
});

const ROLE_VIEW_FIELDS = Object.freeze({
  nurse:  ROLE_VIEW_CLINICAL_,
  doctor: ROLE_VIEW_CLINICAL_,
  admin:  ROLE_VIEW_CLINICAL_,
});

// Actions each role may call. getStaff and getHospitals are open to no role:
// no screen calls them.
const ROLE_VIEW_COMMON_ACTIONS_ = Object.freeze([
  'login', 'getFamilies', 'getAssessments', 'getInterventions', 'getNotes', 'getCarePlan', 'getList',
  'saveFamily', 'saveAssessment', 'saveIntervention', 'saveNote', 'saveCarePlan', 'deleteAssessment',
]);

const ROLE_VIEW_ACTIONS = Object.freeze({
  nurse:  ROLE_VIEW_COMMON_ACTIONS_,
  doctor: ROLE_VIEW_COMMON_ACTIONS_,
  admin:  Object.freeze(ROLE_VIEW_COMMON_ACTIONS_.concat(['deleteFamily', 'deleteNote', 'deleteIntervention'])),
});

// Top-level keys each action's reply may carry besides status.
const ROLE_VIEW_REPLY_KEYS = Object.freeze({
  login:              ['email', 'name', 'role', 'hospitalCode', 'hospitalName'],
  getFamilies:        ['families'],
  getAssessments:     ['assessments'],
  getInterventions:   ['interventions'],
  getNotes:           ['notes'],
  getCarePlan:        ['carePlans'],
  getList:            ['role', 'hospitalCode', 'families', 'assessments'],
  saveFamily:         ['famId'],
  saveAssessment:     ['assId'],
  saveIntervention:   ['intervId'],
  saveNote:           ['noteId'],
  saveCarePlan:       [],
  deleteAssessment:   ['assId'],
  deleteFamily:       ['famId', 'deleted'],
  deleteNote:         ['noteId'],
  deleteIntervention: ['intervId'],
});

// Which record kind each list in a reply holds.
const ROLE_VIEW_LISTS_ = Object.freeze({
  families: 'family', assessments: 'assessment', interventions: 'intervention',
  notes: 'note', carePlans: 'carePlan',
});

function roleViewRole_(role) {
  return String(role == null ? '' : role).trim().toLowerCase();
}

function roleViewSite_(site) {
  return String(site == null ? '' : site).trim();
}

// Pass as `site` to roleView() for an account that may see every site.
const ROLE_VIEW_ANY_SITE = '*';

const ROLE_VIEW_CROSS_SITE_PROPERTY = 'CROSS_SITE_EDITORS';

// True for an admin listed in CROSS_SITE_EDITORS (emails separated by commas,
// semicolons or spaces). False when the property is empty or unreadable.
function roleViewCrossSite_(user) {
  if (!user || roleViewRole_(user.role) !== 'admin') return false;
  const email = String(user.email == null ? '' : user.email).trim().toLowerCase();
  if (!email) return false;
  let listed = '';
  try {
    listed = PropertiesService.getScriptProperties().getProperty(ROLE_VIEW_CROSS_SITE_PROPERTY) || '';
  } catch (e) {
    return false;
  }
  return String(listed).toLowerCase().split(/[\s,;]+/).indexOf(email) >= 0;
}

/**
 * True when `user` may read, write and delete records of `site`: its own site,
 * or any site for a cross-site editor. A record with no site is nobody's.
 */
function roleViewHasSite(user, site) {
  const s = roleViewSite_(site);
  if (!user || !s) return false;
  return s === roleViewSite_(user.hospitalCode) || roleViewCrossSite_(user);
}

/**
 * One record as `role` at `site` may see it, or null when it may not see the
 * record at all: another site's row, a row with no site, an unknown role, or a
 * kind of record that role's screens never show. `site` may be
 * ROLE_VIEW_ANY_SITE for a cross-site editor.
 */
function roleView(role, site, record, kind) {
  const kinds = ROLE_VIEW_FIELDS[roleViewRole_(role)];
  const fields = kinds && kinds[kind];
  const want = roleViewSite_(site);
  const has = record ? roleViewSite_(record.hospitalCode) : '';
  if (!fields || !record || !want || !has || (want !== ROLE_VIEW_ANY_SITE && has !== want)) return null;
  const view = {};
  fields.forEach(function (f) {
    if (Object.prototype.hasOwnProperty.call(record, f)) view[f] = record[f];
  });
  return view;
}

/** True when `user` (from verifyToken) may call `action` at all. */
function roleViewAllows(user, action) {
  const actions = user && ROLE_VIEW_ACTIONS[roleViewRole_(user.role)];
  return !!actions && actions.indexOf(action) >= 0;
}

/** The refusal every handler returns, whatever was refused. */
function roleViewDenied() {
  return { status: 'forbidden', message: ROLE_VIEW_DENIED };
}

/**
 * A handler's reply cut down to what `user` may receive: only the keys listed
 * for `action`, and in each list only the user's own-site rows, each reduced
 * to its role's fields.
 */
function roleViewReply(user, action, reply) {
  if (!roleViewAllows(user, action)) return roleViewDenied();
  const keys = ROLE_VIEW_REPLY_KEYS[action] || [];
  const site = roleViewCrossSite_(user) ? ROLE_VIEW_ANY_SITE : user.hospitalCode;
  const out = { status: reply && reply.status };
  keys.forEach(function (key) {
    if (!reply || !Object.prototype.hasOwnProperty.call(reply, key)) return;
    const kind = ROLE_VIEW_LISTS_[key];
    if (!kind) { out[key] = reply[key]; return; }
    out[key] = (reply[key] || [])
      .map(function (rec) { return roleView(user.role, site, rec, kind); })
      .filter(function (rec) { return rec !== null; });
  });
  return out;
}
