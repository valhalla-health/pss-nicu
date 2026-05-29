// PSS:NICU — Auth Gateway GAS v2.0
// Central login router: Google token OR email+password → session token + hospital apiUrl
// No patient data stored here — this script is login-only
//
// Registry sheet headers (cols A–I):
//   email | name | role | hospitalCode | hospitalName | apiUrl | active | password_hash | salt
//
// Setup:
//   1. Create a new Google Spreadsheet (the registry)
//   2. New Apps Script project → paste this file + Gateway_Setup.gs
//   3. Run RUN_ME_ONCE() → add staff rows → save
//   4. Script Properties → add GATEWAY_SS_ID = <spreadsheet ID>
//   5. Deploy → Web App → Execute as Me → Anyone   ← IMPORTANT: "Anyone", not "Google Account"
//   6. Copy URL → set as window.PSS_GATEWAY_URL in index.html
//   7. Non-Gmail staff: run setInitialPassword("email","pwd") from Apps Script editor

const AUD         = '658466851314-fq13cdqd608e4lp8tbv3n4me443b2fb0.apps.googleusercontent.com';
const SESSION_TTL = 21600; // 6 hours (CacheService hard max)

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

// ── Session helpers ────────────────────────────────────────────────────────────

function hashPassword(password, salt) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + password,
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function createSession(userObj) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('pss_sess_' + token, JSON.stringify(userObj), SESSION_TTL);
  return token;
}

function lookupSession(token) {
  const raw = CacheService.getScriptCache().get('pss_sess_' + token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
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

function buildUserObj(r, email) {
  return {
    email:        email || String(r['email'] || '').trim(),
    name:         r['name']         || '',
    role:         r['role']         || '',
    hospitalCode: r['hospitalcode'] || r['hospitalCode'] || '',
    hospitalName: r['hospitalname'] || r['hospitalName'] || '',
    apiUrl:       String(r['apiurl'] || r['apiUrl'] || '').trim(),
  };
}

// ── Request router ─────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // verifySession — called by hospital GAS on every request ──────────────────
    if (body.action === 'verifySession') {
      if (!body.token) return out({ status: 'unauthorized' });
      const user = lookupSession(body.token);
      if (!user) return out({ status: 'unauthorized' });
      return out({ status: 'ok', ...user });
    }

    if (body.action !== 'login') return out({ status: 'unknown_action' });

    const rows = readRegistryAsObjects();

    // Path A: Google ID token ──────────────────────────────────────────────────
    if (body.token && !body.email) {
      const verified = verifyGoogleToken(body.token);
      if (!verified) return out({ status: 'unauthorized' });

      for (const r of rows) {
        if (String(r['email'] || '').trim().toLowerCase() !== verified.email.toLowerCase()) continue;
        const active = r['active'];
        if (active !== true && String(active).trim().toUpperCase() !== 'TRUE')
          return out({ status: 'suspended' });
        const userObj = buildUserObj(r, verified.email);
        if (!userObj.apiUrl) return out({ status: 'config_error', message: 'apiUrl missing' });
        const token = createSession(userObj);
        return out({ status: 'ok', token, ...userObj });
      }
      return out({ status: 'not_found' });
    }

    // Path B: email + password ─────────────────────────────────────────────────
    if (body.email && body.password) {
      const emailLow = String(body.email).trim().toLowerCase();
      for (const r of rows) {
        if (String(r['email'] || '').trim().toLowerCase() !== emailLow) continue;
        const active = r['active'];
        if (active !== true && String(active).trim().toUpperCase() !== 'TRUE')
          return out({ status: 'suspended' });
        const storedHash = String(r['password_hash'] || '').trim();
        const salt       = String(r['salt'] || '').trim();
        if (!storedHash || !salt) return out({ status: 'no_password' });
        if (hashPassword(body.password, salt) !== storedHash) return out({ status: 'unauthorized' });
        const userObj = buildUserObj(r, emailLow);
        if (!userObj.apiUrl) return out({ status: 'config_error', message: 'apiUrl missing' });
        const token = createSession(userObj);
        return out({ status: 'ok', token, ...userObj });
      }
      return out({ status: 'not_found' });
    }

    return out({ status: 'bad_request' });
  } catch (err) {
    return out({ status: 'config_error', message: err.message });
  }
}

function doGet() {
  return out({ status: 'method_not_allowed' });
}
