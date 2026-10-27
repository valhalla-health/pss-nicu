// The allow-lists the tests expect, pinned so that widening one means editing
// this file in the same pull request. Built on 2026-10-27 from what the
// screens read (app.jsx, screens.jsx, components.jsx); the three roles render
// the same clinical screens, and only admin adds the threshold card.
'use strict';

const fx = require('./fixtures.cjs');

const CLINICAL = {
  family: ['famId', 'hospitalCode', 'bed', 'infantId', 'ga', 'bw', 'admitDate', 'dx'],
  assessment: ['assId', 'famId', 'date', 'total', 'ssScore', 'iaScore', 'prScore', 'scScore',
    'notes', 'by', ...fx.ITEM_IDS],
  intervention: ['intervId', 'famId', 'date', 'kind', 'note', 'by'],
  note: ['noteId', 'famId', 'date', 'text', 'by'],
  carePlan: ['itemIdx', 'checked', 'by', 'at'],
};
const EXPECTED_FIELDS = { nurse: CLINICAL, doctor: CLINICAL, admin: CLINICAL };

const COMMON_ACTIONS = ['login', 'getFamilies', 'getAssessments', 'getInterventions', 'getNotes',
  'getCarePlan', 'getList', 'saveFamily', 'saveAssessment', 'saveIntervention', 'saveNote',
  'saveCarePlan', 'deleteAssessment'];
const EXPECTED_ACTIONS = {
  nurse: COMMON_ACTIONS,
  doctor: COMMON_ACTIONS,
  admin: [...COMMON_ACTIONS, 'deleteFamily', 'deleteNote', 'deleteIntervention'],
};

// Top-level keys each reply may carry besides status.
const EXPECTED_REPLY_KEYS = {
  login: ['email', 'name', 'role', 'hospitalCode', 'hospitalName'],
  getFamilies: ['families'],
  getAssessments: ['assessments'],
  getInterventions: ['interventions'],
  getNotes: ['notes'],
  getCarePlan: ['carePlans'],
  getList: ['role', 'hospitalCode', 'families', 'assessments'],
  saveFamily: ['famId'],
  saveAssessment: ['assId'],
  saveIntervention: ['intervId'],
  saveNote: ['noteId'],
  saveCarePlan: [],
  deleteAssessment: ['assId'],
  deleteFamily: ['famId', 'deleted'],
  deleteNote: ['noteId'],
  deleteIntervention: ['intervId'],
};

const LIST_KIND = {
  families: 'family', assessments: 'assessment', interventions: 'intervention',
  notes: 'note', carePlans: 'carePlan',
};

module.exports = { CLINICAL, EXPECTED_FIELDS, EXPECTED_ACTIONS, EXPECTED_REPLY_KEYS, LIST_KIND };
