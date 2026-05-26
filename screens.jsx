// =========================================================
// PSS:NICU — Screens (ภาษาไทย)
// =========================================================

const { useState: uS, useEffect: uE, useMemo: uM } = React;

const ROLE_TH = { doctor: 'แพทย์', nurse: 'พยาบาล', admin: 'ผู้ดูแลระบบ' };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'สวัสดีตอนเช้า';
  if (h < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

// ===== LOGIN =======================================================
function LoginScreen({ onLogin, lang }) {
  const [loading, setLoading] = uS(false);
  const [clicked, setClicked] = uS(false);
  const [error, setError]     = uS(null);
  const [googleReady, setGoogleReady] = uS(false);
  const btnRef = React.useRef(null);

  // Safety reset: if user cancels Google popup, restore button after 500ms of focus return
  uE(() => {
    if (!clicked || loading) return;
    const onFocus = () => {
      setTimeout(() => { if (!loading) setClicked(false); }, 600);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [clicked, loading]);

  uE(() => {
    const init = () => {
      if (!window.google?.accounts?.id || !btnRef.current) return;
      google.accounts.id.initialize({
        client_id: window.PSS_CLIENT_ID,
        callback: async (resp) => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch(window.PSS_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'login', token: resp.credential })
            });
            const data = await res.json();
            if (data.status !== 'ok') throw new Error('ไม่พบบัญชีนี้ในระบบ หรือบัญชีถูกระงับ');
            sessionStorage.setItem('pss_token', resp.credential);
            onLogin({ ...data, token: resp.credential });
          } catch (err) {
            setError('ไม่พบบัญชีนี้ในระบบ หรือเกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
            setLoading(false);
            setClicked(false);
          }
        }
      });
      google.accounts.id.renderButton(btnRef.current, {
        type: 'standard', shape: 'pill', theme: 'outline',
        text: 'signin_with', locale: 'th', size: 'large', width: 280
      });
      setGoogleReady(true);
    };
    if (window.google?.accounts?.id) { init(); }
    else { window.addEventListener('load', init, { once: true }); }
    return () => window.removeEventListener('load', init);
  }, []);

  const isBusy = clicked || loading;

  return (
    <div style={{
      minHeight: '100vh',
      /* Ambient: warm terracotta blooms on parchment — brand consistent */
      background: `
        radial-gradient(ellipse 78% 58% at 20% 12%, rgba(196,90,62,0.09) 0%, transparent 58%),
        radial-gradient(ellipse 62% 52% at 80% 88%, rgba(214,138,94,0.10) 0%, transparent 54%),
        radial-gradient(ellipse 48% 38% at 70% 16%, rgba(244,212,190,0.20) 0%, transparent 48%),
        #faf4ea
      `,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px 32px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--sans)',
    }}>

      {/* Fine grain — paper texture */}
      <svg aria-hidden="true" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: 0.03, pointerEvents: 'none',
      }}>
        <filter id="lg"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
        <rect width="100%" height="100%" filter="url(#lg)"/>
      </svg>

      <div className="fade-in" style={{ textAlign: 'center', width: '100%', maxWidth: 340, position: 'relative', flex: '1 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* Logo — PNG (transparent bg) so no blend mode needed */}
        <img
          src="assets/pss-nicu-logo.png"
          alt="PSS:NICU"
          style={{
            width: 96, height: 96,
            display: 'block', margin: '0 auto 28px',
            objectFit: 'contain',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />

        {/* PSS : NICU — single line institutional wordmark */}
        <div style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '0.08em',
          color: 'var(--ink)',
          lineHeight: 1,
          marginBottom: 18,
        }}>
          PSS<span style={{
            color: 'var(--terracotta)',
            fontWeight: 400,
            margin: '0 0.18em',
            fontStyle: 'normal',
            display: 'inline-block',
            transform: 'translateY(-0.04em)',
          }}>:</span>NICU
        </div>

        {/* Tagline — what it actually is (trust + clarity) */}
        <div style={{
          fontSize: 10,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: 'var(--ink-3)',
          marginBottom: 8,
        }}>
          Parental Stress Scale
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--ink-2)',
          fontWeight: 400,
          letterSpacing: '0.02em',
          marginBottom: 44,
          lineHeight: 1.5,
        }}>
          ประเมินความเครียดผู้ปกครอง · หอผู้ป่วยทารกแรกเกิด
        </div>

        {/* Sign-in */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', minHeight: 44 }}>
          {/* Skeleton — แสดงขณะ Google SDK ยังไม่โหลด */}
          {!googleReady && !isBusy && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'var(--card)', borderRadius: 99, border: '1px solid var(--line)',
              fontSize: 13, color: 'var(--ink-4)',
              animation: 'pulse-soft 1.6s ease infinite',
              pointerEvents: 'none',
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--paper-3)' }} />
              <span>กำลังโหลด...</span>
            </div>
          )}
          <div
            ref={btnRef}
            onClickCapture={() => setClicked(true)}
            style={{
              minHeight: 44,
              visibility: isBusy ? 'hidden' : 'visible',
              pointerEvents: isBusy ? 'none' : 'auto',
            }}
          />
          {isBusy && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, color: 'var(--ink-3)', fontSize: 12,
              letterSpacing: '0.04em',
              background: 'transparent',
            }}>
              <div style={{
                width: 14, height: 14, flexShrink: 0,
                border: '1.5px solid var(--line)', borderTopColor: 'var(--terracotta)',
                borderRadius: '50%', animation: 'spin 0.9s linear infinite',
              }} />
              {loading ? 'กำลังตรวจสอบสิทธิ์' : 'กำลังเชื่อมต่อ Google'}
            </div>
          )}
        </div>

        {/* Buyer hook — for hospitals not yet on the system */}
        {!isBusy && (
          <div style={{
            marginTop: 22,
            fontSize: 12,
            color: 'var(--ink-3)',
            letterSpacing: '0.01em',
          }}>
            ยังไม่มีบัญชี?{' '}
            <a
              href="mailto:valhalla.team.th@gmail.com?subject=ขอทดลองใช้ PSS:NICU&body=สวัสดีครับ/ค่ะ%0Aสนใจทดลองใช้ระบบ PSS:NICU สำหรับโรงพยาบาล%0A%0Aชื่อโรงพยาบาล:%0Aผู้ติดต่อ:%0Aตำแหน่ง:%0Aอีเมล:%0Aเบอร์โทร:"
              style={{
                color: 'var(--terracotta)',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(196,90,62,0.4)',
                paddingBottom: 1,
                fontWeight: 500,
              }}
            >
              ขอทดลองใช้สำหรับโรงพยาบาล →
            </a>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 20, padding: '10px 18px',
            background: 'rgba(179,80,62,0.05)',
            border: '1px solid rgba(179,80,62,0.14)',
            borderRadius: 8, color: 'var(--rose)', fontSize: 11,
            lineHeight: 1.65, letterSpacing: '0.02em',
          }}>
            {error}
          </div>
        )}

      </div>

      {/* Footer — institutional trust signals */}
      <div style={{
        position: 'relative',
        marginTop: 40,
        paddingTop: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        fontWeight: 500,
      }}>
        <span>Valhalla Team</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span style={{ fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'none' }}>v5.0</span>
      </div>
    </div>
  );
}

const bedAbbr = (bed) => { const s = String(bed || ''); return s.startsWith('iso ') ? s.slice(4) : s; };
const bedFs = (bed, size) => { const s = bedAbbr(bed); return s.length > 3 ? size * 0.26 : size * 0.38; };
const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }); } catch { return String(d).slice(0, 10); } };
const fmtBy = (by) => by ? (by.includes('@') ? by.split('@')[0] : by) : '';
const daysIn = (admitDate, dayAdmit) => { if (admitDate) { const d = Math.floor((Date.now() - new Date(admitDate)) / 86400000) + 1; return d > 0 ? d : 1; } return Number(dayAdmit) || null; };

// ===== GLOBAL SEARCH ==============================================
function GlobalSearch({ families, assessments, thresholds, onOpen, onClose }) {
  const isMobile = useIsMobile();
  const [q, setQ] = uS('');
  const [cursor, setCursor] = uS(0);
  const inputRef = React.useRef(null);

  uE(() => { inputRef.current?.focus(); }, []);

  const latestMap = uM(() => {
    const m = {};
    families.forEach(f => {
      const fa = assessments.filter(a => a.famId === f.famId).sort((a, b) => a.date.localeCompare(b.date));
      m[f.famId] = fa[fa.length - 1] || null;
    });
    return m;
  }, [families, assessments]);

  const results = uM(() => {
    const s = q.toLowerCase().trim();
    const list = s
      ? families.filter(f =>
          String(f.bed).toLowerCase().includes(s) ||
          String(f.infantId || '').toLowerCase().includes(s)
        )
      : families;
    return list.slice(0, 8);
  }, [q, families]);

  uE(() => { setCursor(0); }, [q]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && results[cursor]) { onOpen(results[cursor].famId); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(42,34,26,0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 800,
      }} />

      {/* Modal */}
      <div className="scale-in" style={{
        position: 'fixed',
        top: 'max(60px, 8vh)',
        left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', maxWidth: 560,
        background: 'var(--card)', borderRadius: 18,
        boxShadow: '0 28px 80px rgba(60,40,20,.22), 0 2px 8px rgba(60,40,20,.06)',
        overflow: 'hidden', zIndex: 801,
      }}>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <Icon name="search" size={18} color="var(--terracotta)" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาเตียง หรือ HN…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 16, background: 'transparent',
              color: 'var(--ink)', fontFamily: 'var(--sans)',
            }}
          />
          {q
            ? <button onClick={() => setQ('')} style={{ color: 'var(--ink-4)', fontSize: 13, padding: '2px 6px', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>✕</button>
            : <kbd style={{ fontSize: 10, padding: '2px 7px', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>Esc</kbd>
          }
        </div>

        {/* Results list */}
        <div style={{ maxHeight: isMobile ? 'min(280px, 45dvh)' : 360, overflowY: 'auto' }}>
          {!q && <div style={{ padding: '8px 20px 4px', fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ครอบครัวทั้งหมด ({families.length} ราย)</div>}
          {q && results.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              ไม่พบครอบครัวที่ตรงกับ "{q}"
            </div>
          )}
          {results.map((fam, i) => {
            const last = latestMap[fam.famId];
            const sev = severity(last?.total, thresholds);
            const days = daysIn(fam.admitDate, fam.dayAdmit);
            return (
              <button key={fam.famId} onClick={() => onOpen(fam.famId)}
                onMouseEnter={() => setCursor(i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 20px', textAlign: 'left',
                  background: i === cursor ? 'var(--peach-soft)' : 'transparent',
                  borderBottom: i < results.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  transition: 'background .08s',
                }}>
                <Avatar initials={bedAbbr(fam.bed)} size={36} _fontSize={bedFs(fam.bed, 36)}
                  palette={sev.key === 'extreme' ? 'plum' : sev.key === 'high' ? 'terracotta' : 'sage'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>เตียง {fam.bed}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    HN {fam.infantId} · {fam.relation}
                    {days != null && <span style={{ marginLeft: 6, fontFamily: 'var(--mono)', color: 'var(--ink-4)', fontSize: 11 }}>D {days}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {last && <SeverityBadge severity={sev} lang="th" size="sm" />}
                  <Icon name="arrow-right" size={14} color="var(--ink-4)" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Keyboard hints — desktop only */}
        <div style={{ padding: '8px 20px', borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-4)' }}>
          {isMobile
            ? <span>แตะเพื่อเปิด · กด ✕ เพื่อปิด</span>
            : <><span>↑↓ เลื่อน</span><span>↵ เปิด</span><span>Esc ปิด</span></>
          }
        </div>
      </div>
    </>
  );
}

// ===== DASHBOARD ===================================================
function DashboardScreen({ user, families, assessments, interventions, lang, onOpenFamily, onRoute, thresholds, density }) {
  const isMobile = useIsMobile();
  const enriched = uM(() => families.map((f) => {
    const fa = assessments.filter((a) => a.famId === f.famId).sort((a, b) => a.date.localeCompare(b.date));
    const last = fa[fa.length - 1];
    const trend = fa.map((a) => a.total);
    const isRising = trend.length >= 2 && trend[trend.length - 1] > trend[trend.length - 2];
    const fivList = (interventions || []).filter(iv => iv.famId === f.famId).sort((a, b) => b.date.localeCompare(a.date));
    const lastInterv = fivList[0] || null;
    return { fam: f, last, trend, isRising, lastInterv };
  }), [families, assessments, interventions]);

  const highRisk = enriched.filter((e) => e.last && severity(e.last.total, thresholds).key === 'high' || severity(e.last?.total, thresholds).key === 'extreme');
  const rising = enriched.filter((e) => e.isRising && e.last);
  const newToday = enriched.filter((e) => e.fam.dayAdmit <= 2);
  const avgScore = uM(() => {
    const all = enriched.filter((e) => e.last).map((e) => e.last.total);
    return all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0;
  }, [enriched]);

  const subAgg = uM(() => {
    const sums = { ss: 0, ia: 0, pr: 0, sc: 0 }; let n = 0;
    enriched.forEach((e) => {
      if (e.last) { n++; for (const k in sums) sums[k] += e.last.subTotals[k]; }
    });
    if (!n) return null;
    return { ss: Math.round(sums.ss / n), ia: Math.round(sums.ia / n), pr: Math.round(sums.pr / n), sc: Math.round(sums.sc / n) };
  }, [enriched]);

  const priorityList = [...enriched].filter((e) => e.last).sort((a, b) => b.last.total - a.last.total).slice(0, 5);

  return (
    <div style={{ padding: isMobile ? '20px 16px 130px' : '32px 28px 80px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: isMobile ? 12 : 0,
        marginBottom: 28
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            {new Date(TODAY).toLocaleDateString('th-TH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 className="serif">{greeting()}, <em style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>{(user.name || fmtBy(user.email)).split(/\s+/)[0]}</em></h1>
          <p style={{ marginTop: 8, fontSize: 15, color: 'var(--ink-3)' }}>
            {highRisk.length} {highRisk.length === 1 ? 'ราย' : 'ราย'}ต้องการความใส่ใจเป็นพิเศษวันนี้
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onRoute('families')}>
          <Icon name="plus" size={16} /> {t('new_assessment', lang)}
        </button>
      </div>

      {/* Stat strip — horizontal scroll on mobile, grid on desktop */}
      {isMobile ? (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingBottom: 6, marginBottom: 20, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { label: 'ครอบครัวทั้งหมด', value: families.length, suffix: 'ราย', accent: 'var(--ink-2)' },
            { label: 'ความเสี่ยงสูง', value: highRisk.length, suffix: '/ ' + families.length, accent: 'var(--sev-high)', hint: highRisk.length > 0 ? 'ติดตามด่วน' : 'ปกติ' },
            { label: 'แนวโน้มเพิ่ม', value: rising.length, suffix: 'ราย', accent: 'var(--sev-mod)', hint: 'จากครั้งก่อน' },
            { label: 'คะแนนเฉลี่ย', value: avgScore, suffix: '/104', accent: 'var(--terracotta)', hint: `${enriched.filter(e => e.last).length} ราย` },
          ].map((c, i) => (
            <div key={i} style={{ minWidth: 130, flexShrink: 0 }}>
              <StatCard label={c.label} value={c.value} suffix={c.suffix} accent={c.accent} hint={c.hint} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard label="ครอบครัวทั้งหมด" value={families.length} suffix="ราย" accent="var(--ink-2)" />
          <StatCard label="ความเสี่ยงสูง" value={highRisk.length} suffix={'/ ' + families.length} accent="var(--sev-high)"
            hint={highRisk.length > 0 ? 'ควรติดตามด่วนวันนี้' : 'อยู่ในเกณฑ์ปกติ'} />
          <StatCard label="แนวโน้มเพิ่มขึ้น" value={rising.length} suffix="ราย" accent="var(--sev-mod)"
            hint="คะแนนสูงขึ้นจากครั้งก่อน" />
          <StatCard label="คะแนนเฉลี่ย PSS" value={avgScore} suffix="/ 104" accent="var(--terracotta)"
            hint={`จาก ${enriched.filter((e) => e.last).length} ราย`} />
        </div>
      )}

      {/* Severity legend */}
      <div style={{ display: 'flex', gap: isMobile ? 6 : 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'none',    label: 'ไม่เครียด',   color: 'var(--sev-none)',    range: '0' },
          { key: 'mild',    label: 'เล็กน้อย',     color: 'var(--sev-mild)',    range: `1–${thresholds.mild - 1}` },
          { key: 'mod',     label: 'ปานกลาง',      color: 'var(--sev-mod)',     range: `${thresholds.mild}–${thresholds.mod - 1}` },
          { key: 'high',    label: 'มาก',          color: 'var(--sev-high)',    range: `${thresholds.mod}–${thresholds.high - 1}` },
          { key: 'extreme', label: 'มากที่สุด',     color: 'var(--sev-extreme)', range: `${thresholds.high}+` },
        ].map(s =>
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMobile ? '5px 10px' : '4px 10px', background: 'var(--card)', border: '1px solid var(--line-soft)', borderRadius: 99, fontSize: isMobile ? 13 : 11, color: 'var(--ink-2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{s.label}</span>
            {!isMobile && <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-4)', fontSize: 10 }}>{s.range}</span>}
          </div>
        )}
      </div>

      {/* Two-column: Priority list + subscale aggregate */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Priority */}
        <div className="card" style={{ padding: isMobile ? 16 : 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h3 className="serif" style={{ fontSize: isMobile ? 18 : 20 }}>ความเครียดสูงสุด</h3>
            <button onClick={() => onRoute('families')} style={{ fontSize: 13, color: 'var(--terracotta)', fontWeight: 600 }}>ดูทั้งหมด →</button>
          </div>

          {priorityList.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14 }}>ไม่มีครอบครัวที่ต้องติดตามด่วน</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {priorityList.map((e, i) => {
              const sev = severity(e.last.total, thresholds);
              return (
                <button key={e.fam.famId} onClick={() => onOpenFamily(e.fam.famId)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'auto 1fr auto' : '24px auto 1fr auto auto',
                  alignItems: 'center', gap: isMobile ? 12 : 14,
                  padding: isMobile ? '14px 12px' : '12px 14px', textAlign: 'left',
                  background: 'var(--paper)', border: '1px solid var(--line-soft)',
                  borderLeft: isMobile ? `3px solid ${sev.color}` : '1px solid var(--line-soft)',
                  borderRadius: 12, transition: 'background .15s',
                  touchAction: 'manipulation',
                }}
                onMouseEnter={(e2) => {e2.currentTarget.style.background = 'var(--paper-2)';}}
                onMouseLeave={(e2) => {e2.currentTarget.style.background = 'var(--paper)';}}>
                  {!isMobile && <span className="mono" style={{ fontSize: 12, color: 'var(--ink-4)' }}>{String(i + 1).padStart(2, '0')}</span>}
                  <Avatar initials={bedAbbr(e.fam.bed)} size={isMobile ? 40 : 32} _fontSize={bedFs(e.fam.bed, isMobile ? 40 : 32)}
                  palette={sev.key === 'extreme' ? 'plum' : sev.key === 'high' ? 'terracotta' : 'sage'} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: isMobile ? 15 : 13, fontWeight: 700 }}>เตียง {e.fam.bed}</span>
                      {(() => { const d = daysIn(e.fam.admitDate, e.fam.dayAdmit); return d ? <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)', background: 'var(--paper-3)', padding: '1px 6px', borderRadius: 99 }}>D {d}</span> : null; })()}
                    </div>
                    <div style={{ fontSize: isMobile ? 13 : 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.fam.relation}{e.fam.dx ? ` · ${e.fam.dx}` : ''}</div>
                  </div>
                  {!isMobile && <MiniTrend values={e.trend} color={sev.color} width={60} height={22} />}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-end' : 'center', gap: isMobile ? 4 : 10 }}>
                    <span className="serif" style={{ fontSize: isMobile ? 24 : 22, color: sev.color, lineHeight: 1 }}>{e.last.total}</span>
                    <SeverityBadge severity={sev} lang={lang} size="sm" />
                  </div>
                </button>);
            })}
          </div>
        </div>

        {/* Subscale aggregate */}
        <div className="card" style={{ padding: isMobile ? 16 : 24 }}>
          <h3 className="serif" style={{ marginBottom: 6, fontSize: isMobile ? 18 : 20 }}>แหล่งความเครียด</h3>
          <p style={{ fontSize: isMobile ? 14 : 13, color: 'var(--ink-3)', marginBottom: 18, lineHeight: 1.6 }}>
            คะแนนเฉลี่ย subscale ของผู้ปกครองทุกราย
          </p>
          {subAgg && <SubscaleBars subTotals={subAgg} lang={lang} />}
          <div style={{ marginTop: 20, padding: 14, background: 'var(--peach-soft)', borderRadius: 10, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <Icon name="sparkle" size={13} color="var(--terracotta)" />{' '}
            <strong>รูปแบบที่พบ:</strong> รูปลักษณ์ทารกเป็นปัจจัยกดดันสูงสุดอย่างสม่ำเสมอ — ควรพิจารณาจัดการปฐมนิเทศให้ผู้ปกครองในหอผู้ป่วย
          </div>
        </div>
      </div>

      {/* Rising trend list */}
      <div className="card" style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 className="serif" style={{ fontSize: isMobile ? 18 : 20 }}>แนวโน้มเพิ่มขึ้น</h3>
          <span className="pill" style={{ fontSize: isMobile ? 12 : 11 }}>{rising.length} รายที่ต้องระวัง</span>
        </div>
        {rising.length === 0 ?
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>ไม่มีแนวโน้มเพิ่มขึ้น ดีมากวันนี้</div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {rising.map((e) => {
            const sev = severity(e.last.total, thresholds);
            const delta = e.trend[e.trend.length - 1] - e.trend[e.trend.length - 2];
            return (
              <button key={e.fam.famId} onClick={() => onOpenFamily(e.fam.famId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 14, textAlign: 'left',
                background: 'var(--paper)', border: '1px solid var(--line-soft)', borderRadius: 12
              }}>
                  <Avatar initials={bedAbbr(e.fam.bed)} size={36} _fontSize={bedFs(e.fam.bed, 36)}
                  palette={sev.key === 'extreme' ? 'plum' : 'terracotta'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>เตียง {e.fam.bed}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                      {e.fam.admitDate
                        ? new Date(e.fam.admitDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                        : e.fam.dayAdmit ? `D${e.fam.dayAdmit}` : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--rose)', fontSize: 14, fontWeight: 700 }}>
                    <Icon name="trend-up" size={16} /> +{delta}
                  </div>
                </button>);
          })}
          </div>
        }
      </div>
    </div>);

}

// ===== ADD FAMILY FORM ============================================
const RELATION_OPTIONS = ['มารดา', 'บิดา', 'ผู้ปกครองอื่น'];
const KCMH_BEDS = [
  '1','2','3','4','5','6','7','8','9','10','11','12',
  'iso 1-1','iso 1-2','iso 2-1','iso 2-2','iso 3-1','iso 3-2','iso 3-3','iso 3-4'
];
// Hospital-specific bed list — set window.PSS_BEDS in index.html to override KCMH default
const BEDS = window.PSS_BEDS || KCMH_BEDS;

function AddFamilyForm({ onSave, onCancel, lang, isMobile }) {
  const empty = { bed: BEDS[0], infantId:'', ga:'', bw:'', admitDate:'', dx:'', relation: RELATION_OPTIONS[0] };
  const [f, setF] = uS(empty);
  const [saving, setSaving] = uS(false);

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const valid = !!f.bed;

  const submit = () => {
    if (!valid) return;
    setSaving(true);
    onSave({ ...f, ga: Number(f.ga) || '', bw: Number(f.bw) || '', famId: 'F' + Date.now(), active: true });
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: 'var(--card)', fontFamily: 'var(--sans)' };
  const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', display: 'block', marginBottom: 6 };

  return (
    <div className={`card scale-in${isMobile ? ' bottom-sheet' : ''}`} style={{ padding: 28, marginBottom: isMobile ? 0 : 24 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 20 }}>เพิ่มครอบครัวใหม่</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>เตียง *</label>
          <select value={f.bed} onChange={e => set('bed', e.target.value)} style={inputStyle}>
            {BEDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>HN ทารก</label>
          <input value={f.infantId} onChange={e => set('infantId', e.target.value)} placeholder="เช่น 1234/69" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>ความสัมพันธ์</label>
          <select value={f.relation} onChange={e => set('relation', e.target.value)} style={inputStyle}>
            {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>GA (สัปดาห์)</label>
          <input type="number" value={f.ga} onChange={e => set('ga', e.target.value)} placeholder="28" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>น้ำหนักแรกเกิด (ก.)</label>
          <input type="number" value={f.bw} onChange={e => set('bw', e.target.value)} placeholder="1200" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>วันที่รับไว้</label>
          <input type="date" value={f.admitDate} onChange={e => set('admitDate', e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>การวินิจฉัย</label>
        <input value={f.dx} onChange={e => set('dx', e.target.value)} placeholder="เช่น RDS, ventilator support" style={inputStyle} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>{t('cancel', lang)}</button>
        <button className="btn btn-primary" onClick={submit} disabled={!valid || saving} style={{ opacity: valid ? 1 : 0.5 }}>
          <Icon name="check" size={14} /> บันทึกครอบครัว
        </button>
      </div>
    </div>
  );
}

// ===== FAMILY LIST ================================================
function FamilyListScreen({ families, assessments, lang, density, thresholds, onOpenFamily, onNewAssessment, user, onAddFamily }) {
  const isMobile = useIsMobile();
  const [q, setQ] = uS('');
  const [sortBy, setSortBy] = uS('risk');
  const [filter, setFilter] = uS('all');
  const [showAddForm, setShowAddForm] = uS(false);

  const canAddFamily = user?.role !== null; // admin, nurse, doctor ทำได้เท่ากัน

  const enriched = uM(() => families.map((f) => {
    const fa = assessments.filter((a) => a.famId === f.famId).sort((a, b) => a.date.localeCompare(b.date));
    const last = fa[fa.length - 1];
    const trend = fa.map((a) => a.total);
    const isRising = trend.length >= 2 && trend[trend.length - 1] > trend[trend.length - 2];
    return { fam: f, last, trend, isRising };
  }), [families, assessments]);

  const filtered = enriched.filter((e) => {
    if (q) {
      const s = q.toLowerCase().trim();
      const hit = (e.fam.bed + ' ' + e.fam.infantId).toLowerCase().includes(s);
      if (!hit) return false;
    }
    if (filter === 'high') {
      const k = severity(e.last?.total, thresholds).key;
      return k === 'high' || k === 'extreme';
    }
    if (filter === 'rising') return e.isRising;
    if (filter === 'new') return e.fam.dayAdmit <= 3;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'risk') return (b.last?.total || 0) - (a.last?.total || 0);
    if (sortBy === 'bed') return a.fam.bed.localeCompare(b.fam.bed);
    if (sortBy === 'day') return b.fam.dayAdmit - a.fam.dayAdmit;
    return 0;
  });

  const filters = [
  { k: 'all',    label: 'ทั้งหมด',          count: enriched.length },
  { k: 'high',   label: 'ความเสี่ยงสูง',     count: enriched.filter((e) => { const k = severity(e.last?.total, thresholds).key; return k === 'high' || k === 'extreme'; }).length },
  { k: 'rising', label: 'แนวโน้มเพิ่ม',      count: enriched.filter((e) => e.isRising).length },
  { k: 'new',    label: 'รายใหม่ (≤3 วัน)',  count: enriched.filter((e) => e.fam.dayAdmit <= 3).length }];

  return (
    <div style={{ padding: isMobile ? '20px 16px 130px' : '32px 28px 80px', maxWidth: 1400, margin: '0 auto' }}>
      <SectionHeading
        eyebrow={`${families.length} ราย`}
        title={<span>ครอบครัว <em style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>ในความดูแล</em></span>}
        action={canAddFamily && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(v => !v)}>
            <Icon name="plus" size={16} /> {t('new_family', lang)}
          </button>
        )} />

      {showAddForm && isMobile && (
        <div className="sheet-overlay" onClick={() => setShowAddForm(false)} />
      )}
      {showAddForm && (
        <AddFamilyForm lang={lang} isMobile={isMobile}
          onCancel={() => setShowAddForm(false)}
          onSave={(fam) => { onAddFamily(fam); setShowAddForm(false); }} />
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', gap: isMobile ? 8 : 12, marginBottom: 18 }}>
        {/* Search */}
        <div style={{ flex: isMobile ? undefined : 1, position: 'relative', height: 44 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเตียง หรือ HN"
          style={{
            width: '100%', height: '100%', padding: '0 14px 0 40px',
            border: '1px solid var(--line)', borderRadius: 10, background: 'var(--card)',
            fontSize: 14, boxSizing: 'border-box'
          }} />
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <Icon name="search" size={16} color="var(--ink-3)" />
          </div>
        </div>

        {/* Filters + Sort */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, height: 44 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'stretch',
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: 3,
            overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {filters.map((f) =>
            <button key={f.k} onClick={() => setFilter(f.k)}
            style={{
              padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: filter === f.k ? 'var(--peach-soft)' : 'transparent',
              color: filter === f.k ? 'var(--terracotta)' : 'var(--ink-2)',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
                {f.label}
                <span style={{ fontSize: 10, color: filter === f.k ? 'var(--terracotta)' : 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{f.count}</span>
              </button>
            )}
          </div>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ height: '100%', padding: '0 10px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--card)', fontSize: 13, fontWeight: 600, boxSizing: 'border-box', flexShrink: 0 }}>
            <option value="risk">ความเสี่ยง</option>
            <option value="bed">เตียง</option>
            <option value="day">วันที่รับไว้</option>
          </select>
        </div>
      </div>

      {!isMobile && <div style={{
        padding: '0 20px 8px', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600,
        display: 'grid', gap: density === 'compact' ? 12 : 18,
        gridTemplateColumns: 'auto 1.6fr 1fr 1.2fr 1.5fr auto',
        alignItems: 'center'
      }}>
        <span></span>
        <span>{t('parent', lang)}</span>
        <span>{t('day', lang)}</span>
        <span>{t('last', lang)} {t('score', lang)}</span>
        <span>{t('trend', lang)} · {t('risk', lang)}</span>
        <span></span>
      </div>}

      {sorted.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-3)', border: '1px dashed var(--line)', borderRadius: 14, marginTop: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏥</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
            {enriched.length === 0 ? 'ยังไม่มีครอบครัวในระบบ' : 'ไม่พบครอบครัวที่ตรงกับการค้นหา'}
          </div>
          <div style={{ fontSize: 13 }}>
            {enriched.length === 0 ? 'กด "+ เพิ่มครอบครัว" เพื่อเริ่มต้น' : 'ลองเปลี่ยน filter หรือคำค้นหา'}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 6 : 8 }}>
        {sorted.map((e) =>
        <FamilyRow key={e.fam.famId} fam={e.fam} lastAss={e.last} trend={e.trend}
        lang={lang} dense={density === 'compact'} thresholds={thresholds}
        onOpen={() => onOpenFamily(e.fam.famId)} />
        )}
      </div>
    </div>);

}

// ===== FAMILY DETAIL ==============================================
function FamilyDetailScreen({ famId, families, assessments, interventions, notes = [], lang, thresholds, showSubscales, onBack, onNewAssessment, onOpenAlert, onSaveNote, onSaveIntervention, carePlan, onUpdateCarePlan }) {
  const isMobile = useIsMobile();
  const fam = families.find((f) => f.famId === famId);
  const fa = assessments.filter((a) => a.famId === famId).sort((a, b) => a.date.localeCompare(b.date));
  const last = fa[fa.length - 1];
  const sev = severity(last?.total, thresholds);
  const interv = interventions.filter((i) => i.famId === famId);

  const [tab, setTab] = uS('overview');
  const [showNote, setShowNote] = uS(false);
  const [noteText, setNoteText] = uS('');
  const [savedNote, setSavedNote] = uS('');
  const saveNote = () => {
    const text = noteText.trim();
    if (!text) return;
    setSavedNote(text);
    setShowNote(false);
    if (onSaveNote) onSaveNote(text);
  };

  if (!fam) return null;
  return (
    <div style={{ padding: isMobile ? '16px 16px 130px' : '24px 28px 80px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--ink-3)', marginBottom: 16, fontWeight: 600 }}>
        <Icon name="arrow-left" size={14} /> {t('back', lang)}
      </button>

      {/* Hero */}
      <div className="card" style={{ padding: isMobile ? 16 : 28, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${sev.color}15, transparent 70%)` }} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto', gap: isMobile ? 12 : 24, alignItems: isMobile ? 'flex-start' : 'center', position: 'relative' }}>
          <Avatar initials={bedAbbr(fam.bed)} size={68} _fontSize={bedFs(fam.bed, 68)}
          palette={sev.key === 'extreme' ? 'plum' : sev.key === 'high' ? 'terracotta' : 'sage'} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="pill" style={{ fontFamily: 'var(--mono)' }}>{fam.bed}</span>
              <span className="pill">HN {fam.infantId}</span>
              <SeverityBadge severity={sev} lang={lang} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
              <h1 className="serif" style={{ fontSize: isMobile ? 24 : 32 }}>เตียง {fam.bed}</h1>
              {(() => { const d = daysIn(fam.admitDate, fam.dayAdmit); return d ? <span style={{ fontSize: 14, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>D {d}</span> : null; })()}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 4 }}>
              {fam.relation} · GA {fam.ga} wk · BW {fam.bw} g
              {fam.admitDate && <span style={{ marginLeft: 8, color: 'var(--ink-4)' }}>· รับ {fmtDate(fam.admitDate)}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              <Icon name="baby" size={12} /> {fam.dx}
            </div>
          </div>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>คะแนนล่าสุด</div>
            <div className="serif" style={{ fontSize: isMobile ? 40 : 56, lineHeight: 1, color: sev.color, marginTop: 4 }}>
              {last ? last.total : '—'}
              <span style={{ fontSize: isMobile ? 14 : 18, color: 'var(--ink-4)', marginLeft: 4, fontFamily: 'var(--mono)' }}>/104</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {last ? `${fmtDate(last.date)} · ${fmtBy(last.by)}` : 'ยังไม่มีการประเมิน'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, position: 'relative', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onNewAssessment}>
            <Icon name="plus" size={14} /> {t('new_assessment', lang)}
          </button>
          {(sev.key === 'high' || sev.key === 'extreme') &&
          <button className="btn btn-ghost" onClick={onOpenAlert} style={{ borderColor: 'var(--rose)', color: 'var(--rose)' }}>
              <Icon name="bell" size={14} /> ดูการแจ้งเตือน
            </button>
          }
          <button className="btn btn-ghost" onClick={() => setShowNote(v => !v)}
            style={{ color: showNote ? 'var(--terracotta)' : undefined, borderColor: showNote ? 'var(--terracotta)' : undefined }}>
            <Icon name="message" size={14} /> เพิ่มบันทึก
          </button>
        </div>

        {showNote && (
          <div style={{ marginTop: 16, position: 'relative' }}>
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                บันทึก — เตียง {fam.bed} · HN {fam.infantId}
              </div>
              <textarea value={noteText} onChange={ev => setNoteText(ev.target.value)}
                placeholder="สังเกตการณ์ การช่วยเหลือ การติดตาม…"
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid var(--line)', borderRadius: 8,
                  fontSize: 13, color: 'var(--ink)', background: 'var(--card)',
                  resize: 'vertical', fontFamily: 'var(--sans)',
                }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowNote(false)}>{t('cancel', lang)}</button>
                <button className="btn btn-primary" onClick={saveNote}><Icon name="check" size={14} /> บันทึก</button>
              </div>
              {savedNote && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--sage-soft)', borderRadius: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                  <strong>บันทึกล่าสุด:</strong> {savedNote}
                </div>
              )}
              {notes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>ประวัติบันทึก ({notes.length})</div>
                  {[...notes].sort((a,b) => b.date.localeCompare(a.date)).map(n => (
                    <div key={n.noteId} style={{ padding: '8px 12px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>{fmtDate(n.date)} · {fmtBy(n.by)}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 24, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[
        { k: 'overview', label: t('overview', lang) },
        { k: 'history',  label: 'ประวัติการประเมิน' },
        { k: 'care',     label: 'การดูแลและช่วยเหลือ' }].
        map((tb) =>
        <button key={tb.k} onClick={() => setTab(tb.k)}
        style={{
          padding: '12px 18px', fontSize: 13, fontWeight: 600,
          flexShrink: 0, whiteSpace: 'nowrap',
          color: tab === tb.k ? 'var(--terracotta)' : 'var(--ink-3)',
          borderBottom: '2px solid ' + (tab === tb.k ? 'var(--terracotta)' : 'transparent'),
          marginBottom: -1
        }}>{tb.label}</button>
        )}
      </div>

      {tab === 'overview' && <FamilyOverviewTab fa={fa} sev={sev} thresholds={thresholds} lang={lang} showSubscales={showSubscales} />}
      {tab === 'history' && <FamilyHistoryTab fa={fa} interv={interv} thresholds={thresholds} lang={lang} fam={fam} />}
      {tab === 'care' && <CareAndLogTab sev={sev} lang={lang} interv={interv} onSaveIntervention={onSaveIntervention} carePlan={carePlan || {}} onUpdateCarePlan={onUpdateCarePlan} />}
    </div>);

}

function FamilyOverviewTab({ fa, sev, thresholds, lang, showSubscales }) {
  const isMobile = useIsMobile();
  const last = fa[fa.length - 1];
  const dates = fa.map((a) => a.date);
  const totals = fa.map((a) => a.total);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 20 }}>
      {/* Trend chart */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>แนวโน้ม</div>
          <h3 className="serif" style={{ marginTop: 4 }}>ความเครียดตามเวลา</h3>
        </div>
        <AreaTrend values={totals} dates={dates} thresholds={thresholds} color={sev.color} width={620} height={200} />
        <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 11, color: 'var(--ink-3)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--sev-mild)', verticalAlign: 'middle', marginRight: 6 }} />เล็กน้อย ({thresholds.mild})</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--sev-mod)', verticalAlign: 'middle', marginRight: 6 }} />ปานกลาง ({thresholds.mod})</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--sev-high)', verticalAlign: 'middle', marginRight: 6 }} />มาก ({thresholds.high})</span>
        </div>
      </div>

      {/* Subscale breakdown */}
      {showSubscales &&
      <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>แยกย่อยล่าสุด</div>
            <h3 className="serif" style={{ marginTop: 4 }}>แหล่งที่มาของความเครียด</h3>
          </div>
          {last && <SubscaleBars subTotals={last.subTotals} lang={lang} />}
          <div style={{ marginTop: 20, padding: 14, background: 'var(--paper-2)', borderRadius: 10, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--terracotta)' }}>ปัจจัยหลัก:</strong>{' '}
            {last && Object.entries(last.subTotals).
          map(([k, v]) => ({ k, pct: v / SUBSCALE_META[k].max })).
          sort((a, b) => b.pct - a.pct)[0] && (() => {
            const top = Object.entries(last.subTotals).
            map(([k, v]) => ({ k, pct: v / SUBSCALE_META[k].max })).
            sort((a, b) => b.pct - a.pct)[0];
            return SUBSCALE_META[top.k]['th'] + ` (${Math.round(top.pct * 100)}% ของคะแนนสูงสุด)`;
          })()}
          </div>
        </div>
      }
    </div>);

}

function FamilyHistoryTab({ fa, interv, thresholds, lang, fam }) {
  // Merge assessments + interventions → sort oldest→newest (top=earliest so you see score → intervention → effect)
  const events = [
    ...fa.map(a  => ({ type: 'assessment',   date: a.date,  data: a  })),
    ...(interv || []).map(iv => ({ type: 'intervention', date: iv.date, data: iv })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  if (events.length === 0)
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>ยังไม่มีบันทึก</div>;

  // Pre-compute score delta between consecutive assessments
  const assChron = [...fa].sort((a, b) => a.date.localeCompare(b.date));
  const deltaMap = {};
  assChron.forEach((a, i) => {
    if (i > 0) deltaMap[a.assId || a.date] = a.total - assChron[i - 1].total;
  });

  const dNum = (dateStr) => {
    if (!dateStr) return null;
    if (fam?.admitDate) {
      const d = Math.floor((new Date(dateStr) - new Date(fam.admitDate)) / 86400000) + 1;
      return d > 0 ? d : null;
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {events.map((ev, i) => {
        const isLast = i === events.length - 1;
        const d = dNum(ev.date);

        if (ev.type === 'assessment') {
          const a = ev.data;
          const sev = severity(a.total, thresholds);
          const delta = deltaMap[a.assId || a.date];

          return (
            <div key={a.assId || i} style={{ display: 'grid', gridTemplateColumns: '76px 28px 1fr', alignItems: 'flex-start' }}>
              {/* Date column */}
              <div style={{ textAlign: 'right', paddingTop: 14, paddingRight: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', lineHeight: 1.3 }}>{fmtDate(a.date)}</div>
                {d && <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-4)', marginTop: 2 }}>D {d}</div>}
              </div>

              {/* Timeline spine */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: sev.color, marginTop: 12, flexShrink: 0, zIndex: 1, boxShadow: `0 0 0 3px ${sev.color}22` }} />
                {!isLast && <div style={{ flex: 1, width: 2, background: 'var(--line)', minHeight: 24 }} />}
              </div>

              {/* Assessment card */}
              <div style={{ padding: '12px 16px 16px', marginBottom: isLast ? 0 : 8, marginLeft: 4, background: 'var(--card)', border: '1px solid var(--line-soft)', borderLeft: `3px solid ${sev.color}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-4)' }}>การประเมิน PSS</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className="serif" style={{ fontSize: 28, color: sev.color, lineHeight: 1 }}>{a.total}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>/104</span>
                  <SeverityBadge severity={sev} lang={lang} size="sm" />
                  {delta != null && (
                    <span style={{
                      fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)',
                      color: delta > 0 ? 'var(--rose)' : delta < 0 ? 'var(--sage)' : 'var(--ink-4)',
                    }}>
                      {delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : '→ 0'}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 'auto' }}>{fmtBy(a.by)}</span>
                </div>
                {a.notes && <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 8, lineHeight: 1.5 }}>{a.notes}</div>}
                <div style={{ display: 'flex', gap: 14, fontSize: 13 }}>
                  {Object.entries(a.subTotals).map(([k, v]) =>
                    <span key={k}>
                      <span style={{ color: SUBSCALE_META[k].color, fontWeight: 700 }}>{SUBSCALE_META[k].code}</span>
                      <span style={{ fontFamily: 'var(--mono)', marginLeft: 3, color: 'var(--ink-2)' }}>{v}/{SUBSCALE_META[k].max}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // Intervention
        const iv = ev.data;
        return (
          <div key={iv.intervId || i} style={{ display: 'grid', gridTemplateColumns: '76px 28px 1fr', alignItems: 'flex-start' }}>
            {/* Date column */}
            <div style={{ textAlign: 'right', paddingTop: 10, paddingRight: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', lineHeight: 1.3 }}>{fmtDate(iv.date)}</div>
              {d && <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-4)', marginTop: 2 }}>D {d}</div>}
            </div>

            {/* Timeline spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terracotta)', border: '2px solid var(--terracotta)', marginTop: 12, flexShrink: 0, zIndex: 1 }} />
              {!isLast && <div style={{ flex: 1, width: 2, background: 'var(--line)', minHeight: 20 }} />}
            </div>

            {/* Intervention chip */}
            <div style={{ padding: '8px 14px', marginBottom: isLast ? 0 : 8, marginLeft: 4, background: 'var(--peach-soft)', border: '1px solid var(--peach)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="pill" style={{ background: 'var(--card)', color: 'var(--terracotta)', border: '1px solid var(--peach)', fontSize: 11 }}>{iv.kind}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtBy(iv.by)}</span>
              </div>
              {iv.note && <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '6px 0 0', lineHeight: 1.5 }}>{iv.note}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const IV_KINDS = ['ประชุมครอบครัว', 'งานสังคมสงเคราะห์', 'ให้ความรู้', 'Skin-to-skin', 'สนับสนุนจิตใจ', 'อื่นๆ'];

function FamilyLogTab({ interv, lang, onSaveIntervention }) {
  const [showForm, setShowForm] = uS(false);
  const [kind, setKind]         = uS(IV_KINDS[0]);
  const [note, setNote]         = uS('');
  const [saving, setSaving]     = uS(false);

  const submit = () => {
    if (!kind) return;
    setSaving(true);
    if (onSaveIntervention) onSaveIntervention(kind, note.trim());
    setKind(IV_KINDS[0]); setNote(''); setShowForm(false); setSaving(false);
  };

  const AddForm = (
    <div style={{ marginTop: 16, padding: 20, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>บันทึกการช่วยเหลือใหม่</div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label>ประเภท</label>
        <select value={kind} onChange={e => setKind(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: 'var(--card)', fontFamily: 'var(--sans)' }}>
          {IV_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <label>รายละเอียด</label>
        <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
          placeholder="สรุปสิ่งที่ทำ สิ่งที่พูดคุย หรือผลลัพธ์…"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--sans)', resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t('cancel', lang)}</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          <Icon name="check" size={14} /> บันทึก
        </button>
      </div>
    </div>
  );

  if (interv.length === 0 && !showForm) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>
        <Icon name="note" size={32} color="var(--ink-4)" />
        <div style={{ marginTop: 12, fontSize: 14 }}>ยังไม่มีการบันทึกการช่วยเหลือ</div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
          <Icon name="plus" size={14} /> เพิ่มรายการ
        </button>
        {showForm && AddForm}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {interv.map((it, i) =>
      <div key={it.intervId || i} style={{ display: 'grid', gridTemplateColumns: '120px 24px 1fr', gap: 16, alignItems: 'flex-start', padding: '16px 0' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{it.date}</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--terracotta)', margin: '6px auto 0' }} />
            {i < interv.length - 1 && <div style={{ position: 'absolute', left: '50%', top: 18, bottom: -16, width: 1, background: 'var(--line)', transform: 'translateX(-50%)' }} />}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="pill" style={{ background: 'var(--peach-soft)', color: 'var(--terracotta)', border: 'none' }}>{it.kind}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{it.by}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>{it.note}</p>
          </div>
        </div>
      )}

      {showForm ? AddForm : (
        <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 12 }} onClick={() => setShowForm(true)}>
          <Icon name="plus" size={14} /> เพิ่มรายการ
        </button>
      )}
    </div>
  );
}

// Care plan schema helpers — backward compat: old={bool}, new={checked,by,at}
const cpChecked = (v) => v === true || v?.checked === true;
const cpMeta = (v) => (v?.at ? `${fmtBy(v.by)} · ${v.at}` : null);

const OWNER_META = {
  nurse:  { label: 'พยาบาล',     color: 'var(--ss-color)',    bg: 'var(--ss-bg)' },
  doctor: { label: 'แพทย์',       color: 'var(--terracotta)',  bg: 'var(--peach-soft)' },
  sw:     { label: 'Social Work', color: 'var(--sage)',         bg: 'var(--sage-soft)' },
  psych:  { label: 'จิตวิทยา',    color: 'var(--pr-color)',    bg: 'var(--pr-bg)' },
};

function CareAndLogTab({ sev, lang, interv, onSaveIntervention, carePlan, onUpdateCarePlan }) {
  const isMobile = useIsMobile();
  const recData  = RECOMMENDATIONS[sev.key] || RECOMMENDATIONS.none;
  const recs     = recData.items || [];
  const timeframe = recData.timeframe || '';
  const [showForm, setShowForm] = uS(false);
  const [kind, setKind]         = uS(IV_KINDS[0]);
  const [customKind, setCustomKind] = uS('');
  const [note, setNote]         = uS('');

  const submitInterv = () => {
    const effectiveKind = kind === 'อื่นๆ' ? customKind.trim() : kind;
    if (!effectiveKind) return;
    if (onSaveIntervention) onSaveIntervention(effectiveKind, note.trim());
    setKind(IV_KINDS[0]); setCustomKind(''); setNote(''); setShowForm(false);
  };

  const doneCount   = recs.filter((_, i) => cpChecked(carePlan[i])).length;
  const safetyIdx   = recs.findIndex(r => r.safety);
  const safetyDone  = safetyIdx < 0 || cpChecked(carePlan[safetyIdx]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>

      {/* Left: Intervention log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>บันทึกการช่วยเหลือ</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{interv.length} รายการ</div>
          </div>
          {!showForm && (
            <button className="btn btn-subtle" style={{ fontSize: 12 }} onClick={() => setShowForm(true)}>
              <Icon name="plus" size={13} /> เพิ่ม
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ padding: 18, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 16 }}>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>ประเภท</label>
              <select value={kind} onChange={e => { setKind(e.target.value); setCustomKind(''); }}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: 'var(--card)', fontFamily: 'var(--sans)' }}>
                {IV_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              {kind === 'อื่นๆ' && (
                <input value={customKind} onChange={e => setCustomKind(e.target.value)}
                  placeholder="ระบุประเภทการช่วยเหลือ…" autoFocus
                  style={{ width: '100%', marginTop: 8, padding: '8px 12px', border: '1px solid var(--terracotta)', borderRadius: 8, fontSize: 13, background: 'var(--card)', fontFamily: 'var(--sans)', boxSizing: 'border-box' }} />
              )}
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>รายละเอียด</label>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="สรุปสิ่งที่ทำ สิ่งที่พูดคุย หรือผลลัพธ์…"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--sans)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>{t('cancel', lang)}</button>
              <button className="btn btn-primary" onClick={submitInterv}
                disabled={kind === 'อื่นๆ' && !customKind.trim()}
                style={{ opacity: kind === 'อื่นๆ' && !customKind.trim() ? 0.5 : 1 }}>
                <Icon name="check" size={14} /> บันทึก
              </button>
            </div>
          </div>
        )}

        {interv.length === 0 && !showForm ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-3)', border: '1px dashed var(--line)', borderRadius: 12 }}>
            <Icon name="note" size={28} color="var(--ink-4)" />
            <div style={{ marginTop: 10, fontSize: 13 }}>ยังไม่มีการบันทึก</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {interv.map((it, i) =>
            <div key={it.intervId || i} style={{ display: 'grid', gridTemplateColumns: '100px 20px 1fr', gap: 12, alignItems: 'flex-start', padding: '12px 0' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>{fmtDate(it.date)}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{fmtBy(it.by)}</div>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terracotta)', margin: '5px auto 0' }} />
                  {i < interv.length - 1 && <div style={{ position: 'absolute', left: '50%', top: 15, bottom: -12, width: 1, background: 'var(--line)', transform: 'translateX(-50%)' }} />}
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
                  <span className="pill" style={{ background: 'var(--peach-soft)', color: 'var(--terracotta)', border: 'none', fontSize: 10, marginBottom: 4, display: 'inline-flex' }}>{it.kind}</span>
                  {it.note && <p style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>{it.note}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Care plan checklist */}
      <div>
        {/* Safety warning — extreme only */}
        {sev.key === 'extreme' && !safetyDone && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(179,80,62,.08)', border: '1px solid rgba(179,80,62,.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)' }}>ยังไม่ได้ประเมิน safety — กรุณาดำเนินการก่อน</span>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>แผนการดูแล</div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: (sev.key === 'extreme' || sev.key === 'high') ? 'rgba(179,80,62,.1)' : 'var(--paper-3)',
              color: (sev.key === 'extreme' || sev.key === 'high') ? 'var(--rose)' : 'var(--ink-3)',
            }}>{timeframe}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            ระดับ <span style={{ color: sev.color, fontWeight: 700 }}>{sev.th}</span> — {doneCount}/{recs.length} เสร็จสิ้น
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recs.map((item, i) => {
            const checked = cpChecked(carePlan[i]);
            const meta    = cpMeta(carePlan[i]);
            const owner   = OWNER_META[item.owner] || OWNER_META.nurse;
            const isUrgent = item.urgent && !checked;
            return (
              <div key={i} style={{
                padding: 12, borderRadius: 10, cursor: 'pointer',
                background: checked ? 'var(--sage-soft)' : isUrgent ? 'rgba(196,90,62,.04)' : 'var(--paper)',
                border: '1px solid ' + (checked ? 'var(--sage-soft)' : isUrgent ? 'rgba(196,90,62,.25)' : 'var(--line-soft)'),
                transition: 'background .15s',
              }}
              onClick={() => onUpdateCarePlan && onUpdateCarePlan(i, !checked)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input type="checkbox" checked={checked} readOnly
                    style={{ marginTop: 3, accentColor: 'var(--terracotta)', flexShrink: 0, pointerEvents: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      {isUrgent && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--rose)', background: 'rgba(179,80,62,.12)', padding: '2px 6px', borderRadius: 99 }}>ด่วน</span>}
                      {item.safety && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--rose)', background: 'rgba(179,80,62,.12)', padding: '2px 6px', borderRadius: 99 }}>SAFETY</span>}
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, color: owner.color, background: owner.bg }}>{owner.label}</span>
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--ink-2)', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.55 : 1, lineHeight: 1.65 }}>{item.text}</span>
                    {checked && meta && <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 3 }}>{meta}</div>}
                  </div>
                  {/* Quick-action: pre-fill intervention form */}
                  {item.ivKind && !checked && (
                    <button
                      onClick={e => { e.stopPropagation(); setKind(item.ivKind); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--terracotta)', whiteSpace: 'nowrap', touchAction: 'manipulation' }}>
                      + บันทึก
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {doneCount > 0 && doneCount === recs.length && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--sage-soft)', borderRadius: 10, fontSize: 13, color: 'var(--sage)', fontWeight: 600, textAlign: 'center' }}>
            ✓ ดำเนินการครบทุกข้อแล้ว
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ASSESSMENT FORM ============================================
const DRAFT_KEY = (famId) => 'pss_draft_' + famId;
const TOTAL_Q = Object.values(PSS_QUESTIONS).reduce((s, qs) => s + qs.length, 0);

function AssessmentScreen({ famId, families, lang, onBack, onSubmit, thresholds, user }) {
  const isMobile = useIsMobile();
  const fam = families.find((f) => f.famId === famId);
  const [step, setStep] = uS(0);
  const [answers, setAnswers] = uS({});
  const [notes, setNotes] = uS('');
  const [draftSaved, setDraftSaved] = uS(false);

  // Load draft on mount
  uE(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY(famId)) || 'null');
      if (saved?.answers && Object.keys(saved.answers).length > 0) {
        setAnswers(saved.answers);
        if (saved.step != null) setStep(saved.step);
      }
    } catch {}
  }, [famId]);

  // Auto-save draft on answers/step change
  uE(() => {
    if (Object.keys(answers).length === 0) return;
    localStorage.setItem(DRAFT_KEY(famId), JSON.stringify({ answers, step }));
    setDraftSaved(true);
    const t = setTimeout(() => setDraftSaved(false), 1500);
    return () => clearTimeout(t);
  }, [answers, step, famId]);

  const sections = ['ss', 'ia', 'pr', 'sc'];
  const sectionMeta = sections[step];

  const allAnswered = (s) => PSS_QUESTIONS[s].every((q) => answers[q.id] !== undefined);
  const totals = uM(() => {
    const t = { ss: 0, ia: 0, pr: 0, sc: 0 };
    sections.forEach((s) => PSS_QUESTIONS[s].forEach((q) => { t[s] += answers[q.id] || 0; }));
    return t;
  }, [answers]);
  const total = totals.ss + totals.ia + totals.pr + totals.sc;
  const sev = severity(total, thresholds);
  const reviewing = step === 4;

  const setAns = (qid, v) => setAnswers((prev) => ({ ...prev, [qid]: v }));

  const stepLabels = [
  { k: 'ss', label: t('ss', lang), code: 'SS' },
  { k: 'ia', label: t('ia', lang), code: 'IA' },
  { k: 'pr', label: t('pr', lang), code: 'PR' },
  { k: 'sc', label: t('sc', lang), code: 'SC' },
  { k: 'review', label: 'ตรวจสอบ', code: '✓' }];

  return (
    <div style={{ padding: isMobile ? '16px 16px 100px' : '24px 28px 80px', maxWidth: 920, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--ink-3)', marginBottom: 16, fontWeight: 600 }}>
        <Icon name="arrow-left" size={14} /> {t('back', lang)}
      </button>

      {/* Header card */}
      <div className="card" style={{ padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar initials={bedAbbr(fam.bed)} size={48} _fontSize={bedFs(fam.bed, 48)} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>การประเมินใหม่</div>
          <div className="serif" style={{ fontSize: 22, marginTop: 2 }}>เตียง {fam.bed}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>HN {fam.infantId} · {fam.relation} · GA {fam.ga}wk · BW {fam.bw}g</div>
        </div>
        <button className="btn btn-ghost"
          onClick={() => { localStorage.setItem(DRAFT_KEY(famId), JSON.stringify({ answers, step })); setDraftSaved(true); setTimeout(() => setDraftSaved(false), 1500); }}>
          <Icon name="note" size={14} /> {draftSaved ? '✓ บันทึกแล้ว' : t('save_draft', lang)}
        </button>
      </div>

      {/* Stepper */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 24 }}>
        {stepLabels.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 4, borderRadius: 99, background: active ? 'var(--terracotta)' : done ? 'var(--sage)' : 'var(--line)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: isMobile ? 10 : 11, color: active ? 'var(--ink)' : 'var(--ink-3)', fontWeight: active ? 700 : 500 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: active ? 'var(--terracotta)' : done ? 'var(--sage)' : 'var(--paper-3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                  {done ? '✓' : s.code}
                </span>
                {!isMobile && <span>{s.label}</span>}
              </div>
            </div>);
        })}
      </div>

      {/* Overall progress bar */}
      {!reviewing && (() => {
        const doneQ = Object.keys(answers).length;
        const pct = Math.round((doneQ / TOTAL_Q) * 100);
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>
              <span>ความคืบหน้า</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{doneQ}/{TOTAL_Q} ข้อ ({pct}%)</span>
            </div>
            <div style={{ height: 4, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--terracotta)', borderRadius: 99, transition: 'width .3s ease' }} />
            </div>
          </div>
        );
      })()}

      {!reviewing &&
      <div className="card scale-in" style={{ padding: 28, marginBottom: 20 }} key={step}>
          <div style={{ fontSize: 11, color: SUBSCALE_META[sectionMeta].color, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            ส่วนที่ {step + 1} จาก 4 · {SUBSCALE_META[sectionMeta].code}
          </div>
          <h3 className="serif" style={{ marginBottom: 6 }}>{SUBSCALE_META[sectionMeta].th}</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 22 }}>
            สำหรับแต่ละข้อ ให้ถามผู้ปกครองว่า <em>"ข้อนี้ทำให้ท่านเครียดมากแค่ไหน?"</em>
          </p>

          {/* Scale legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20, fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>
            {STRESS_LEVELS.map((l) =>
          <div key={l.v} style={{ padding: isMobile ? '8px 2px' : '6px 4px', background: 'var(--paper-2)', borderRadius: 8 }}>
                <div className="mono" style={{ fontSize: isMobile ? 15 : 14, color: 'var(--ink-2)', fontWeight: 700 }}>{l.v}</div>
                <div style={{ marginTop: 3, lineHeight: 1.3 }}>{l.th}</div>
              </div>
          )}
          </div>

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PSS_QUESTIONS[sectionMeta].map((q, i) =>
          <div key={q.id} style={{ padding: 16, background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{SUBSCALE_META[sectionMeta].code}{i + 1}</span>
                  <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5, flex: 1 }} className="thai">
                    {q.th}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {[0, 1, 2, 3, 4].map((v) => {
                const sel = answers[q.id] === v;
                return (
                  <button key={v} onClick={() => setAns(q.id, v)}
                  style={{
                    padding: isMobile ? '13px 4px' : '10px 4px',
                    minHeight: 44,
                    touchAction: 'manipulation',
                    borderRadius: 10,
                    border: '1.5px solid ' + (sel ? SUBSCALE_META[sectionMeta].color : 'var(--line)'),
                    background: sel ? SUBSCALE_META[sectionMeta].color : 'var(--card)',
                    color: sel ? '#fff' : 'var(--ink-2)',
                    fontWeight: 700,
                    transition: 'all .12s',
                    transform: sel ? 'scale(1.06)' : 'scale(1)',
                    boxShadow: sel ? `0 2px 8px ${SUBSCALE_META[sectionMeta].color}44` : 'none',
                  }}>
                        <div style={{ fontSize: isMobile ? 18 : 16 }}>{v}</div>
                      </button>);
              })}
                </div>
              </div>
          )}
          </div>
        </div>
      }

      {reviewing &&
      <div className="card scale-in" style={{ padding: isMobile ? 20 : 28, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>คะแนนรวม</div>
              <div className="serif" style={{ fontSize: 64, lineHeight: 1, color: sev.color, marginTop: 6 }}>
                {total}<span style={{ fontSize: 20, color: 'var(--ink-4)', marginLeft: 4 }}>/104</span>
              </div>
              <div style={{ marginTop: 10 }}><SeverityBadge severity={sev} lang={lang} /></div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>แยกย่อยตาม subscale</div>
              <SubscaleBars subTotals={totals} lang={lang} />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label>{t('notes', lang)}</label>
            <textarea rows="4" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="สังเกตการณ์จากการเยี่ยมวันนี้ อารมณ์ผู้ปกครอง บริบทครอบครัว…" />
          </div>

          <div style={{ padding: 16, background: 'var(--peach-soft)', borderRadius: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--terracotta)' }}>การดำเนินการที่แนะนำ:</strong>{' '}
            {RECOMMENDATIONS[sev.key].items[0].text}
          </div>
        </div>
      }

      {/* Nav — sticky on mobile */}
      <div className={isMobile ? 'pss-sticky-cta' : undefined}
        style={isMobile ? {} : { display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost" onClick={() => { step === 0 ? onBack() : setStep(step - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Icon name="arrow-left" size={14} /> {step === 0 ? t('cancel', lang) : t('prev', lang)}
        </button>
        {!reviewing ?
        <button className="btn btn-primary"
        disabled={!allAnswered(sectionMeta)}
        style={{ opacity: allAnswered(sectionMeta) ? 1 : 0.5, cursor: allAnswered(sectionMeta) ? 'pointer' : 'not-allowed' }}
        onClick={() => { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            {t('next', lang)} <Icon name="arrow-right" size={14} />
          </button> :
        <button className="btn btn-primary" onClick={() => { onSubmit({ totals, total, notes, sev, answers, famId }); localStorage.removeItem(DRAFT_KEY(famId)); }}>
            <Icon name="check" size={14} /> {t('submit', lang)}
          </button>
        }
      </div>
    </div>);

}


// ===== RESULT / SUMMARY ===========================================
function ResultScreen({ result, fam, lang, thresholds, onDone, onView }) {
  const isMobile = useIsMobile();
  const sev = result.sev;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : 40 }}>
      <div className="card scale-in" style={{ maxWidth: 640, width: '100%', padding: isMobile ? '24px 20px' : 40, textAlign: 'center', background: `linear-gradient(180deg, ${sev.color}08, var(--card))` }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--sage-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon name="check" size={36} color="var(--sage)" stroke={2.5} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>บันทึกแล้ว</div>
        <h2 className="serif" style={{ fontSize: 28, marginTop: 8, marginBottom: 6 }}>บันทึกการประเมินแล้ว</h2>
        <p style={{ color: 'var(--ink-3)' }}>เตียง {fam?.bed} · HN {fam?.infantId}</p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20, marginTop: 28, padding: isMobile ? 16 : 24, background: 'var(--paper)', borderRadius: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>คะแนนรวม</div>
            <div className="serif" style={{ fontSize: 48, lineHeight: 1, color: sev.color }}>{result.total}<span style={{ fontSize: 16, color: 'var(--ink-4)' }}>/104</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{t('severity', lang)}</div>
            <SeverityBadge severity={sev} lang={lang} />
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 12, lineHeight: 1.5 }}>{RECOMMENDATIONS[sev.key].items[0].text}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={onDone}>กลับสู่รายชื่อ</button>
          <button className="btn btn-primary" onClick={onView}>ดูแผนการดูแล <Icon name="arrow-right" size={14} /></button>
        </div>
      </div>
    </div>);

}

// ===== ALERTS / TRIAGE ============================================
function AlertsScreen({ families, assessments, lang, thresholds, onOpenFamily }) {
  const isMobile = useIsMobile();
  const enriched = uM(() => families.map((f) => {
    const fa = assessments.filter((a) => a.famId === f.famId).sort((a, b) => a.date.localeCompare(b.date));
    const last = fa[fa.length - 1];
    const trend = fa.map((a) => a.total);
    const isRising = trend.length >= 2 && trend[trend.length - 1] > trend[trend.length - 2];
    return { fam: f, last, trend, isRising, sev: severity(last?.total, thresholds) };
  }), [families, assessments, thresholds]);

  const alerts = enriched.filter((e) => e.last && (e.sev.key === 'high' || e.sev.key === 'extreme' || e.isRising));

  return (
    <div style={{ padding: isMobile ? '20px 16px 130px' : '32px 28px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeading
        eyebrow={`${alerts.length} รายการ`}
        title={<span>การแจ้งเตือน <em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>ที่ต้องดำเนินการ</em></span>} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {alerts.map((e) => {
          const reasons = [];
          if (e.sev.key === 'extreme') reasons.push({ label: 'เครียดมากที่สุด', urgent: true });
          else if (e.sev.key === 'high') reasons.push({ label: 'เครียดมาก', urgent: true });
          if (e.isRising) reasons.push({ label: `แนวโน้มเพิ่มขึ้น (+${e.trend[e.trend.length - 1] - e.trend[e.trend.length - 2]})`, urgent: false });
          return <AlertCard key={e.fam.famId} item={e} reasons={reasons} lang={lang} thresholds={thresholds} onOpen={() => onOpenFamily(e.fam.famId)} />;
        })}
      </div>
    </div>);

}

function AlertCard({ item, reasons, lang, thresholds, onOpen }) {
  const isMobile = useIsMobile();
  const e = item;
  const sev = e.sev;
  const recs = (RECOMMENDATIONS[sev.key] || RECOMMENDATIONS.none).items || [];
  const topSub = e.last && Object.entries(e.last.subTotals).
  map(([k, v]) => ({ k, pct: v / SUBSCALE_META[k].max })).
  sort((a, b) => b.pct - a.pct)[0];

  const [showNote, setShowNote] = uS(false);
  const [noteText, setNoteText] = uS('');
  const [savedNote, setSavedNote] = uS('');

  const saveNote = () => {
    if (noteText.trim()) { setSavedNote(noteText.trim()); }
    setShowNote(false);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${sev.color}` }}>
      <div style={{ padding: isMobile ? 16 : 24, display: 'grid', gridTemplateColumns: isMobile ? 'auto 1fr' : 'auto 1fr auto', gap: isMobile ? 12 : 20, alignItems: 'flex-start' }}>
        <Avatar initials={bedAbbr(e.fam.bed)} size={56} _fontSize={bedFs(e.fam.bed, 56)}
        palette={sev.key === 'extreme' ? 'plum' : 'terracotta'} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {reasons.map((r, i) =>
            <span key={i} className="pill" style={{
              background: r.urgent ? 'rgba(179,80,62,.12)' : 'rgba(214,138,94,.14)',
              color: r.urgent ? 'var(--sev-high)' : 'var(--sev-mod)',
              border: 'none', fontWeight: 700
            }}>
                <Icon name={r.urgent ? 'flag' : 'trend-up'} size={11} /> {r.label}
              </span>
            )}
          </div>
          <h3 className="serif" style={{ fontSize: 24, marginBottom: 4 }}>เตียง {e.fam.bed} · HN {e.fam.infantId}</h3>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {e.fam.relation} · GA {e.fam.ga}wk · BW {e.fam.bw}g · {e.fam.dx}
          </div>
          {e.last?.notes &&
          <div style={{ marginTop: 12, padding: 12, background: 'var(--paper)', borderRadius: 10, fontSize: 13, color: 'var(--ink-2)', fontStyle: 'italic', borderLeft: '2px solid var(--line)' }}>
              "{e.last.notes}"
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4, fontStyle: 'normal' }}>— {fmtBy(e.last.by)}, {fmtDate(e.last.date)}</div>
            </div>
          }
        </div>

        {!isMobile && (
          <div style={{ textAlign: 'right' }}>
            <div className="serif" style={{ fontSize: 44, lineHeight: 1, color: sev.color }}>{e.last.total}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>/104</div>
            <div style={{ marginTop: 8 }}>
              <MiniTrend values={e.trend} color={sev.color} width={80} height={28} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? '0 16px 12px' : '0 24px 16px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>ปัจจัยหลัก</div>
          {topSub &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: SUBSCALE_META[topSub.k].bg, borderRadius: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: SUBSCALE_META[topSub.k].color }}>
                {SUBSCALE_META[topSub.k].th}
              </span>
              <span style={{ fontSize: 11, color: SUBSCALE_META[topSub.k].color, fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
                {Math.round(topSub.pct * 100)}% ของคะแนนสูงสุด
              </span>
            </div>
          }
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>การดำเนินการที่แนะนำ</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {recs[0]?.text}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: isMobile ? '12px 16px' : '14px 24px', background: 'var(--paper)', borderTop: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onOpen}><Icon name="eye" size={14} /> ดูรายละเอียด</button>
        {!isMobile && <button className="btn btn-ghost"><Icon name="phone" size={14} /> ติดต่อนักสังคมสงเคราะห์</button>}
        <button className="btn btn-ghost" onClick={() => setShowNote(v => !v)}
          style={{ color: showNote ? 'var(--terracotta)' : undefined, borderColor: showNote ? 'var(--terracotta)' : undefined }}>
          <Icon name="message" size={14} /> เพิ่มบันทึก
        </button>
      </div>

      {showNote && (
        <div style={{ padding: '0 24px 20px', background: 'var(--paper)' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              บันทึก — เตียง {e.fam.bed} · HN {e.fam.infantId}
            </div>
            <textarea value={noteText} onChange={ev => setNoteText(ev.target.value)}
              placeholder="สังเกตการณ์ การช่วยเหลือ การติดตาม…"
              rows={4}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid var(--line)', borderRadius: 8,
                fontSize: 13, color: 'var(--ink)', background: 'var(--paper)',
                resize: 'vertical', fontFamily: 'var(--sans)',
              }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowNote(false)}>{t('cancel', lang)}</button>
              <button className="btn btn-primary" onClick={saveNote}><Icon name="check" size={14} /> บันทึก</button>
            </div>
            {savedNote && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--sage-soft)', borderRadius: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                <strong>บันทึกล่าสุด:</strong> {savedNote}
              </div>
            )}
          </div>
        </div>
      )}
    </div>);

}

// ===== ADMIN ======================================================
function AdminScreen({ families, assessments, lang, thresholds, user }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = uS('users');
  const [staff, setStaff] = uS([]);
  const [staffLoading, setStaffLoading] = uS(true);

  uE(() => {
    if (!user?.token || !window.PSS_API_URL) return;
    fetch(`${window.PSS_API_URL}?action=getStaff&token=${encodeURIComponent(user.token)}`)
      .then(r => r.json())
      .then(d => { if (d.status === 'ok') setStaff(d.staff); })
      .catch(() => {})
      .finally(() => setStaffLoading(false));
  }, [user]);
  return (
    <div style={{ padding: isMobile ? '20px 16px 130px' : '32px 28px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeading eyebrow="การตั้งค่า" title="ผู้ดูแลระบบ" />

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 24, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[
        { k: 'users',      label: 'ผู้ใช้งาน' },
        { k: 'thresholds', label: 'ค่าเกณฑ์' },
        { k: 'export',     label: 'ส่งออกข้อมูล' }].
        map((tb) =>
        <button key={tb.k} onClick={() => setTab(tb.k)}
        style={{
          padding: '12px 18px', fontSize: 13, fontWeight: 600,
          color: tab === tb.k ? 'var(--terracotta)' : 'var(--ink-3)',
          borderBottom: '2px solid ' + (tab === tb.k ? 'var(--terracotta)' : 'transparent'),
          marginBottom: -1
        }}>{tb.label}</button>
        )}
      </div>

      {tab === 'users' &&
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
            <thead>
              <tr style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>ผู้ใช้งาน</th>
                <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>บทบาท</th>
                <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>แผนก</th>
                <th style={{ padding: 14, textAlign: 'right', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}></th>
              </tr>
            </thead>
            <tbody>
              {staffLoading
                ? <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>กำลังโหลด...</td></tr>
                : staff.length === 0
                  ? <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>ไม่พบข้อมูล — เพิ่ม staff ใน Google Sheets โดยตรง</td></tr>
                  : staff.filter(s => s.active !== false && s.active !== 'FALSE').map((u, i) =>
                    <tr key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                      <td style={{ padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={nameToInitials(u.name || u.email)} size={32} palette={u.role === 'doctor' ? 'terracotta' : u.role === 'admin' ? 'plum' : 'sage'} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name || fmtBy(u.email)}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 14 }}>
                        <span className="pill">{ROLE_TH[u.role] || u.role}</span>
                      </td>
                      <td style={{ padding: 14, color: 'var(--ink-3)' }}>{u.hospitalCode}</td>
                      <td style={{ padding: 14, textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: u.active === true || u.active === 'TRUE' ? 'var(--sage)' : 'var(--ink-4)', fontWeight: 600 }}>
                          {u.active === true || u.active === 'TRUE' ? '● ใช้งาน' : '○ ระงับ'}
                        </span>
                      </td>
                    </tr>
                  )
              }
            </tbody>
          </table>
        </div>
          <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
            <button className="btn btn-primary"><Icon name="plus" size={14} /> เพิ่มผู้ใช้งาน</button>
          </div>
        </div>
      }

      {tab === 'thresholds' &&
      <div className="card" style={{ padding: 28 }}>
          <h3 className="serif" style={{ marginBottom: 6 }}>ค่าเกณฑ์ความเครียด</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24 }}>
            ปรับค่าผ่านแผง Tweaks (ปุ่มมุมขวาบน) ค่าปัจจุบันแสดงด้านล่าง
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {[
          { label: 'เล็กน้อย ≥', v: thresholds.mild, color: 'var(--sev-mild)' },
          { label: 'ปานกลาง ≥', v: thresholds.mod,  color: 'var(--sev-mod)' },
          { label: 'มาก ≥',      v: thresholds.high, color: 'var(--sev-high)' }].
          map((x) =>
          <div key={x.label} style={{ padding: 18, background: 'var(--paper)', borderRadius: 12, borderLeft: `3px solid ${x.color}` }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{x.label}</div>
                <div className="serif" style={{ fontSize: 36, color: x.color, marginTop: 4 }}>{x.v}<span style={{ fontSize: 14, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>/104</span></div>
              </div>
          )}
          </div>
        </div>
      }

      {tab === 'export' &&
      <div className="card" style={{ padding: 28 }}>
          <h3 className="serif" style={{ marginBottom: 6 }}>ส่งออกข้อมูล</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
            ส่งออกข้อมูลการประเมินที่ไม่ระบุตัวตน สำหรับการพัฒนาคุณภาพหรืองานวิจัย
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary"><Icon name="arrow-down" size={14} /> ส่งออก CSV ({assessments.length} แถว)</button>
            <button className="btn btn-ghost">ส่งออก JSON</button>
          </div>
        </div>
      }
    </div>);

}

// ===== ANALYTICS ==================================================

function isoWeekKey(dateStr) {
  const d = new Date(dateStr);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function SeverityHistogram({ counts, total }) {
  const levels = [
    { key: 'extreme', label: 'มากที่สุด', color: 'var(--sev-extreme)' },
    { key: 'high',    label: 'มาก',        color: 'var(--sev-high)'    },
    { key: 'mod',     label: 'ปานกลาง',   color: 'var(--sev-mod)'     },
    { key: 'mild',    label: 'เล็กน้อย',   color: 'var(--sev-mild)'    },
    { key: 'none',    label: 'ไม่เครียด',  color: 'var(--sev-none)'    },
  ];
  const maxCount = Math.max(...Object.values(counts), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {levels.map(l => {
        const count = counts[l.key] || 0;
        const pct = Math.round(count / (total || 1) * 100);
        const barPct = count / maxCount * 100;
        return (
          <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 76, fontSize: 12, color: l.color, fontWeight: 700, flexShrink: 0, textAlign: 'right' }}>{l.label}</span>
            <div style={{ flex: 1, height: 28, background: 'var(--paper-3)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: barPct + '%', background: l.color,
                borderRadius: 6, transition: 'width .5s ease',
                minWidth: count > 0 ? 4 : 0,
              }} />
            </div>
            <span style={{ width: 26, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: count > 0 ? l.color : 'var(--ink-4)' }}>{count}</span>
            <span style={{ width: 36, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function AnalyticsScreen({ families, assessments, lang, thresholds }) {
  const isMobile = useIsMobile();

  // Latest assessment per family
  const latestByFam = uM(() => families.map(f => {
    const fa = assessments.filter(a => a.famId === f.famId).sort((a, b) => a.date.localeCompare(b.date));
    return fa[fa.length - 1] || null;
  }).filter(Boolean), [families, assessments]);

  // Severity distribution (latest per family)
  const sevCounts = uM(() => {
    const c = { none: 0, mild: 0, mod: 0, high: 0, extreme: 0 };
    latestByFam.forEach(a => { c[severity(a.total, thresholds).key]++; });
    return c;
  }, [latestByFam, thresholds]);

  // Weekly trend — group all assessments by ISO week, keep last 12
  const weeklyTrend = uM(() => {
    const buckets = {};
    assessments.forEach(a => {
      const w = isoWeekKey(a.date);
      if (!buckets[w]) buckets[w] = { sum: 0, n: 0, firstDate: a.date };
      buckets[w].sum += Number(a.total) || 0;
      buckets[w].n++;
      if (a.date < buckets[w].firstDate) buckets[w].firstDate = a.date;
    });
    const sorted = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
    return {
      values: sorted.map(([, d]) => Math.round(d.sum / d.n)),
      dates: sorted.map(([, d]) => d.firstDate),  // ISO → .slice(5) = "05-18"
    };
  }, [assessments]);

  // Subscale averages across ALL assessments
  const subAvg = uM(() => {
    if (!assessments.length) return null;
    const s = { ss: 0, ia: 0, pr: 0, sc: 0 };
    assessments.forEach(a => {
      s.ss += Number(a.subTotals?.ss ?? a.ssScore) || 0;
      s.ia += Number(a.subTotals?.ia ?? a.iaScore) || 0;
      s.pr += Number(a.subTotals?.pr ?? a.prScore) || 0;
      s.sc += Number(a.subTotals?.sc ?? a.scScore) || 0;
    });
    const n = assessments.length;
    return { ss: Math.round(s.ss / n), ia: Math.round(s.ia / n), pr: Math.round(s.pr / n), sc: Math.round(s.sc / n) };
  }, [assessments]);

  // Summary numbers
  const avgScore = latestByFam.length
    ? Math.round(latestByFam.reduce((s, a) => s + a.total, 0) / latestByFam.length)
    : 0;
  const highCount = (sevCounts.high || 0) + (sevCounts.extreme || 0);
  const wv = weeklyTrend.values;
  const weeklyDelta = wv.length >= 2 ? wv[wv.length - 1] - wv[wv.length - 2] : null;
  const deltaLabel = weeklyDelta == null ? '—' : weeklyDelta >= 0 ? `+${weeklyDelta}` : `${weeklyDelta}`;
  const deltaColor = weeklyDelta == null ? 'var(--ink-4)'
    : weeklyDelta > 0 ? 'var(--sev-high)'
    : weeklyDelta < 0 ? 'var(--sage)' : 'var(--ink-3)';

  // Top subscale
  const topSub = subAvg
    ? Object.entries(subAvg).map(([k, v]) => ({ k, pct: v / SUBSCALE_META[k].max })).sort((a, b) => b.pct - a.pct)[0]
    : null;

  return (
    <div style={{ padding: isMobile ? '20px 16px 130px' : '32px 28px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeading
        eyebrow={`${assessments.length} การประเมิน · ${families.length} ครอบครัว`}
        title={<span>วิเคราะห์ <em style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>ข้อมูล PSS:NICU</em></span>}
      />

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="ครอบครัวที่ประเมินแล้ว" value={latestByFam.length} suffix={`/ ${families.length}`} accent="var(--terracotta)" />
        <StatCard label="คะแนนเฉลี่ย PSS" value={avgScore || '—'} suffix={avgScore ? '/104' : ''} accent="var(--clay)"
          hint="จากการประเมินล่าสุดต่อครอบครัว" />
        <StatCard label="ความเสี่ยงสูง–สูงมาก" value={highCount} suffix="ราย" accent="var(--sev-high)"
          hint={highCount > 0 ? 'ต้องติดตามด่วน' : 'อยู่ในเกณฑ์ปกติ'} />
        <StatCard label="แนวโน้มสัปดาห์ล่าสุด" value={deltaLabel} suffix="" accent={deltaColor}
          hint={weeklyDelta == null ? 'ยังไม่มีข้อมูล' : weeklyDelta > 0 ? 'คะแนนเฉลี่ยเพิ่มขึ้น' : weeklyDelta < 0 ? 'คะแนนเฉลี่ยลดลง' : 'ไม่เปลี่ยนแปลง'} />
      </div>

      {/* Severity distribution + Subscale breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Histogram */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>การกระจายตัว</div>
          <h3 className="serif" style={{ marginTop: 4, marginBottom: 8 }}>ระดับความเครียดปัจจุบัน</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
            คะแนนล่าสุดของแต่ละครอบครัว — {latestByFam.length} ราย
          </p>
          {latestByFam.length > 0
            ? <SeverityHistogram counts={sevCounts} total={latestByFam.length} />
            : <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>ยังไม่มีข้อมูลการประเมิน</div>
          }
        </div>

        {/* Subscale bars */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>แยกย่อย subscale</div>
          <h3 className="serif" style={{ marginTop: 4, marginBottom: 8 }}>แหล่งที่มาของความเครียด</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
            คะแนนเฉลี่ยจากทุกการประเมิน — {assessments.length} ครั้ง
          </p>
          {subAvg
            ? <>
                <SubscaleBars subTotals={subAvg} lang={lang} />
                {topSub && (
                  <div style={{ marginTop: 16, padding: 12, background: 'var(--peach-soft)', borderRadius: 10, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    <Icon name="sparkle" size={13} color="var(--terracotta)" />{' '}
                    <strong>ปัจจัยหลัก:</strong> {SUBSCALE_META[topSub.k].th} ({Math.round(topSub.pct * 100)}% ของคะแนนสูงสุด)
                  </div>
                )}
              </>
            : <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>ยังไม่มีข้อมูล</div>
          }
        </div>
      </div>

      {/* Weekly trend chart */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>แนวโน้มตามเวลา</div>
          <h3 className="serif" style={{ marginTop: 4 }}>คะแนนเฉลี่ยรายสัปดาห์</h3>
        </div>
        {wv.length >= 2
          ? <>
              <AreaTrend values={wv} dates={weeklyTrend.dates} thresholds={thresholds}
                color="var(--terracotta)" width={900} height={isMobile ? 160 : 220} />
              <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--sev-mild)', verticalAlign: 'middle', marginRight: 6 }} />เล็กน้อย ({thresholds.mild})</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--sev-mod)', verticalAlign: 'middle', marginRight: 6 }} />ปานกลาง ({thresholds.mod})</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--sev-high)', verticalAlign: 'middle', marginRight: 6 }} />มาก ({thresholds.high})</span>
              </div>
            </>
          : <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)', border: '1px dashed var(--line)', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14 }}>ต้องมีอย่างน้อย 2 สัปดาห์ที่มีการประเมิน</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>ปัจจุบันมีข้อมูล {wv.length} สัปดาห์</div>
            </div>
        }
      </div>
    </div>
  );
}

Object.assign(window, {
  LoginScreen, DashboardScreen, FamilyListScreen, FamilyDetailScreen,
  AssessmentScreen, ResultScreen, AlertsScreen, AdminScreen,
  AnalyticsScreen, SeverityHistogram, GlobalSearch
});
