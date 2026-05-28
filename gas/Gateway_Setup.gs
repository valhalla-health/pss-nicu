// PSS:NICU Gateway — One-Time Setup
// Paste alongside Gateway.gs in the gateway Apps Script project
// Run RUN_ME_ONCE() once, then populate registry with real staff rows

const KCMH_API = 'https://script.google.com/macros/s/AKfycbxdIS1_einxU-q9229f8stlU0Yx3-iPtx1iy6NQtcIRo6b9ubRFkORHToJ_W8ZKX36f/exec';
const SPR_API  = 'https://script.google.com/macros/s/AKfycbwegxLwcQyl-WQY9gu0Yyf-Rl3UYkjoPf3w6TQVceaH1k93jFPCdl3xalZ_XiNhwoMa/exec';

function RUN_ME_ONCE() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName('registry');
  if (sheet) { Logger.log('⚠️ Registry already exists — skipped. Edit rows directly.'); return; }

  sheet = ss.insertSheet('registry');
  sheet.appendRow(['email', 'name', 'role', 'hospitalCode', 'hospitalName', 'apiUrl', 'active']);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f3f3');
  sheet.setFrozenRows(1);

  // ── Sample rows — replace with real staff emails before going live ─────────
  // KCMH staff
  sheet.appendRow(['admin@kcmh.or.th',  'ผู้ดูแลระบบ KCMH', 'admin',  'KCMH', 'โรงพยาบาลจุฬาลงกรณ์',       KCMH_API, true]);
  sheet.appendRow(['doctor@kcmh.or.th', 'แพทย์ KCMH',        'doctor', 'KCMH', 'โรงพยาบาลจุฬาลงกรณ์',       KCMH_API, true]);
  sheet.appendRow(['nurse@kcmh.or.th',  'พยาบาล KCMH',       'nurse',  'KCMH', 'โรงพยาบาลจุฬาลงกรณ์',       KCMH_API, true]);
  // SPR staff
  sheet.appendRow(['admin@spr.go.th',   'ผู้ดูแลระบบ SPR',   'admin',  'SPR',  'โรงพยาบาลสวรรค์ประชารักษ์', SPR_API,  true]);
  sheet.appendRow(['nurse@spr.go.th',   'พยาบาล SPR',         'nurse',  'SPR',  'โรงพยาบาลสวรรค์ประชารักษ์', SPR_API,  true]);

  sheet.autoResizeColumns(1, 7);

  Logger.log('✅ Registry created with sample rows');
  Logger.log('   → Edit email/name/role to match real staff accounts');
  Logger.log('   → Script Properties → add GATEWAY_SS_ID = ' + ss.getId());
  Logger.log('   → Deploy → Web App → Execute as Me → Anyone with Google account');
  Logger.log('   → Copy URL → set window.PSS_GATEWAY_URL in index.html');
}

// Run this to add a new hospital in future — no code deploy needed
function ADD_HOSPITAL_STAFF() {
  // Edit these, then run
  const newStaff = [
    // { email: 'nurse@newhospital.go.th', name: 'พยาบาล', role: 'nurse',
    //   hospitalCode: 'NEW', hospitalName: 'โรงพยาบาลใหม่',
    //   apiUrl: 'https://script.google.com/macros/s/NEW_DEPLOYMENT_ID/exec', active: true },
  ];
  if (!newStaff.length) { Logger.log('⚠️ Edit newStaff array first'); return; }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('registry');
  newStaff.forEach(s => sheet.appendRow([s.email, s.name, s.role, s.hospitalCode, s.hospitalName, s.apiUrl, s.active]));
  Logger.log('✅ Added ' + newStaff.length + ' staff row(s)');
}
