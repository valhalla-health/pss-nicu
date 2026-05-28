// PSS:NICU — Auth Gateway GAS v1.1
// Central login router: Google token → hospital apiUrl + user info
// No patient data stored here — this script is login-only
//
// Registry sheet cols (7):
//   email | name | role | hospitalCode | hospitalName | apiUrl | active
//
// Setup:
//   1. Create a new Google Spreadsheet (the registry)
//   2. New Apps Script project → paste this file + Gateway_Setup.gs
//   3. Run RUN_ME_ONCE() → add staff rows → save
//   4. Script Properties → add GATEWAY_SS_ID = <spreadsheet ID>
//   5. Deploy → Web App → Execute as Me → Anyone with Google account
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

    const rows = getRegistry().getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const [email, name, role, hospitalCode, hospitalName, apiUrl, active] = rows[i];
      if (String(email).trim().toLowerCase() !== verified.email.toLowerCase()) continue;
      if (active !== true && String(active).trim().toUpperCase() !== 'TRUE')
        return out({ status: 'suspended' });
      return out({ status: 'ok', email: verified.email, name, role, hospitalCode, hospitalName, apiUrl });
    }
    return out({ status: 'not_found' });
  } catch (err) {
    return out({ status: 'config_error', message: err.message });
  }
}

function doGet() {
  return out({ status: 'method_not_allowed' });
}
