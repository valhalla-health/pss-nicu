// PSS:NICU Gateway — One-Time Setup
// Paste alongside Gateway.gs in the gateway Apps Script project
// Run RUN_ME_ONCE() once, then populate registry with real staff rows

const KCMH_API = 'https://script.google.com/macros/s/AKfycbxdIS1_einxU-q9229f8stlU0Yx3-iPtx1iy6NQtcIRo6b9ubRFkORHToJ_W8ZKX36f/exec';
const SPR_API  = 'https://script.google.com/macros/s/AKfycbzJO4zpyzgck98NSix_ShkILpDhxEpoTQY3mw2yAWjl3wBKTezqbhd8gi4ycNQcE7DE/exec';

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

// ── ONE-TIME FIX ────────────────────────────────────────────────────────────
// Run if login is broken after registry edit. Detects missing email column,
// inserts it, assigns real/placeholder emails, fixes duplicate SPR admin row.
function FIX_REGISTRY() {
  const ssId = PropertiesService.getScriptProperties().getProperty('GATEWAY_SS_ID');
  if (!ssId) { Logger.log('❌ GATEWAY_SS_ID not set in Script Properties'); return; }
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName('registry');
  if (!sheet) { Logger.log('❌ Sheet named "registry" not found'); return; }

  // If column A is already "email" the structure is correct — nothing to do
  const a1 = String(sheet.getRange('A1').getValue()).trim().toLowerCase();
  if (a1 === 'email') {
    Logger.log('ℹ️  Email column already present — no structural fix needed.');
    Logger.log('    Check individual rows for empty emails or active ≠ TRUE.');
    return;
  }

  // ── Column A is missing (data starts at B) → insert email column ──────────
  Logger.log('🔧 Inserting email column at A...');
  sheet.insertColumnBefore(1);
  sheet.getRange('A1').setValue('email').setFontWeight('bold').setBackground('#f3f3f3');

  // Re-read after insertion: A=email(empty), B=name, C=role, D=hospitalCode,
  //                           E=hospitalName, F=apiUrl, G=active
  const data = sheet.getDataRange().getValues();

  let kcmhAdminCount = 0;
  let sprAdminCount  = 0;

  for (let i = 1; i < data.length; i++) {
    const role     = String(data[i][2]).trim();
    const hospital = String(data[i][3]).trim();
    if (!role && !hospital) continue; // skip blank rows

    const row = i + 1; // 1-indexed sheet row

    if (hospital === 'KCMH') {
      if (role === 'admin') {
        kcmhAdminCount++;
        sheet.getRange(row, 1).setValue(
          kcmhAdminCount === 1 ? 'praew.tvl@gmail.com' : 'peeraporn.po@chula.ac.th'
        );
      } else if (role === 'doctor') {
        sheet.getRange(row, 1).setValue('doctor@kcmh.or.th');
      } else if (role === 'nurse') {
        sheet.getRange(row, 1).setValue('nurse@kcmh.or.th');
      }

    } else if (hospital === 'SPR') {
      if (role === 'admin') {
        sprAdminCount++;
        if (sprAdminCount === 1) {
          sheet.getRange(row, 1).setValue('nutnicha.tappituk@gmail.com');
        } else {
          // Duplicate SPR admin — repurpose as peeraporn's KCMH admin row
          sheet.getRange(row, 1).setValue('peeraporn.po@chula.ac.th');
          sheet.getRange(row, 2).setValue('ผู้ดูแลระบบ KCMH');    // B = name
          sheet.getRange(row, 4).setValue('KCMH');                  // D = hospitalCode
          sheet.getRange(row, 5).setValue('โรงพยาบาลจุฬาลงกรณ์'); // E = hospitalName
          sheet.getRange(row, 6).setValue(KCMH_API);               // F = apiUrl
          Logger.log('  ↳ Row ' + row + ': repurposed duplicate SPR admin → peeraporn KCMH admin');
        }
      } else if (role === 'nurse') {
        sheet.getRange(row, 1).setValue('nurse@spr.go.th');
      }
    }
  }

  sheet.autoResizeColumns(1, 1);
  Logger.log('✅ Done. Registry now has:');
  Logger.log('   praew.tvl@gmail.com        — KCMH admin');
  Logger.log('   peeraporn.po@chula.ac.th   — KCMH admin');
  Logger.log('   doctor@kcmh.or.th          — KCMH doctor  (placeholder — replace)');
  Logger.log('   nurse@kcmh.or.th           — KCMH nurse   (placeholder — replace)');
  Logger.log('   nutnicha.tappituk@gmail.com — SPR admin');
  Logger.log('   nurse@spr.go.th            — SPR nurse    (placeholder — replace)');
  Logger.log('⚠️  Try logging in now. If still failing, check GATEWAY_SS_ID and redeploy Gateway.gs.');
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
