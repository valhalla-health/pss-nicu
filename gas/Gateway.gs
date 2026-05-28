// PSS:NICU — Auth Gateway GAS v1.2
// Central login router: Google token → hospital apiUrl + user info
// No patient data stored here — this script is login-only
//
// Registry sheet: any column order is fine — reads by HEADER NAME.
// Required headers (case-insensitive): email, apiUrl, active
// Optional but recommended: name, role, hospitalCode, hospitalName
//
// Setup:
//   1. Create a new Google Spreadsheet (the registry)
//   2. New Apps Script project → paste this file + Gateway_Setup.gs
//   3. Run RUN_ME_ONCE() → add staff rows → save
//   4. Script Properties → add GATEWAY_SS_ID = <spreadsheet ID>
//   5. Deploy → Web App → Execute as Me → Anyone   ← IMPORTANT: "Anyone", not "Google Account"
//   6. Copy URL → set as window.PSS_GATEWAY_URL in index.html

const AUD = '658466851314-fq13cdqd608e4lp8tbv3n4me443b2fb0.apps.googleusercontent.com';

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRegistry() {
  const ssId = PropertiesService.getScriptProperties().getProperty('GATEWAY_SS_ID');
  if (!ssId) throw new Error('GATEWAY_SS_ID script property not set');
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName('registry');
  if (!sheet) throw new Error('Sheet "registry" not found in spreadsheet');
  return sheet;
}

// Reads registry rows as objects keyed by header — column order doesn't matter.
function readRegistryAsObjects() {
  const sheet = getRegistry();
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function verifyGoogleToken(token) {
  if (!token) return null;
  const cache    = CacheService.getScriptCache();
  const cacheKey = 'gw_' + token.slice(-32);
  const cached   = cache.get(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch {} }

  try {
    const res = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + token,
      { muteHttpExceptions: true }
    );
    if (res.getResponseCode() !== 200) return null;
    const p = JSON.parse(res.getContentText());
    if (p.aud !== AUD) return null;
    if (Number(p.exp) < Date.now() / 1000) return null;
    const result = { email: p.email };
    cache.put(cacheKey, JSON.stringify(result), 300);
    return result;
  } catch { return null; }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action !== 'login') return out({ status: 'unknown_action' });

    const verified = verifyGoogleToken(body.token);
    if (!verified) return out({ status: 'unauthorized' });

    const rows = readRegistryAsObjects();
    for (const r of rows) {
      const rowEmail = String(r['email'] || '').trim().toLowerCase();
      if (rowEmail !== verified.email.toLowerCase()) continue;

      const active = r['active'];
      if (active !== true && String(active).trim().toUpperCase() !== 'TRUE')
        return out({ status: 'suspended' });

      // apiUrl is required; fall back to hospitalCode-based lookup if missing
      const apiUrl = String(r['apiurl'] || r['apiUrl'] || '').trim();
      if (!apiUrl) return out({ status: 'config_error', message: 'apiUrl missing for ' + verified.email });

      return out({
        status:       'ok',
        email:        verified.email,
        name:         r['name']         || '',
        role:         r['role']         || '',
        hospitalCode: r['hospitalcode'] || r['hospitalCode'] || '',
        hospitalName: r['hospitalname'] || r['hospitalName'] || '',
        apiUrl,
      });
    }
    return out({ status: 'not_found' });
  } catch (err) {
    return out({ status: 'config_error', message: err.message });
  }
}

function doGet() {
  return out({ status: 'method_not_allowed' });
}
