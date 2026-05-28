// =========================================================
// PSS:NICU — App shell, routing, tweaks integration
// =========================================================

const { useState: aS, useEffect: aE, useMemo: aM } = React;

// Gateway URL — single login endpoint for all hospitals
// Falls back to PSS_API_URL so existing deployments keep working until gateway is live
const GATEWAY_URL       = window.PSS_GATEWAY_URL || window.PSS_API_URL || '';
const OFFLINE_QUEUE_KEY = 'pss_pending_assessments';

function App() {
  const isCompact = useIsMobile(1024);
  const isMobLoad = useIsMobile();
  const [user, setUser]           = aS(null);
  const [route, setRoute]         = aS('dashboard');
  const [openFamId, setOpenFamId] = aS(null);
  const [resultData, setResultData] = aS(null);
  const [families, setFamilies]     = aS([]);
  const [assessments, setAssessments] = aS([]);
  const [loading, setLoading]       = aS(false);
  const [loadError, setLoadError]   = aS(null);
  const [interventions, setInterventions] = aS([]);
  const [notes, setNotes] = aS([]);
  const [carePlans, setCarePlans] = aS(() => {
    try { return JSON.parse(localStorage.getItem('pss_care_plans') || '{}'); }
    catch { return {}; }
  });
  const [showSearch, setShowSearch] = aS(false);

  // Restore session from sessionStorage on mount (survives page reload)
  aE(() => {
    const stored = sessionStorage.getItem('pss_token');
    if (!stored) return;
    fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', token: stored })
    }).then(r => r.json())
      .then(d => { if (d.status === 'ok') setUser({ ...d, token: stored }); })
      .catch(() => {});
  }, []);

  // Load data from API after login
  aE(() => {
    if (!user?.token) return;
    setLoading(true);
    setLoadError(null);

    // Safety net: abort after 20s so spinner never hangs forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[PSS] Data load timeout (20s) — aborting');
      controller.abort();
    }, 20000);

    // ── offline queue flush — also registered as online event listener ────────
    const flushQueue = () => {
      const q = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (!q.length) return;
      Promise.all(q.map(ass =>
        fetch(user?.apiUrl || window.PSS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveAssessment', ass, token: user.token })
        }).then(r => r.json()).then(d => d.status === 'ok' ? null : ass).catch(() => ass)
      )).then(results => {
        const failed = results.filter(Boolean);
        if (failed.length) {
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
          window.showToast?.(`ซิงค์ไม่สำเร็จ ${failed.length} รายการ — จะลองใหม่`, 'info', 5000);
        } else {
          localStorage.removeItem(OFFLINE_QUEUE_KEY);
          window.showToast?.(`ซิงค์ ${q.length} รายการสำเร็จ ✓`, 'success');
        }
      });
    };
    flushQueue();
    window.addEventListener('online', flushQueue);

    console.log('[PSS] Loading data from API...', user.apiUrl);
    const postLoad = (payload) => fetch(user?.apiUrl || window.PSS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, token: user.token }),
      signal: controller.signal,
    }).then(r => r.json());

    Promise.all([
      postLoad({ action: 'getFamilies' }),
      postLoad({ action: 'getAssessments' }),
    ]).then(([fData, aData]) => {
      console.log('[PSS] Data loaded:', { families: fData.status, assessments: aData.status });
      if (fData.status === 'ok') setFamilies(fData.families);
      else setLoadError(`โหลดข้อมูลครอบครัวไม่สำเร็จ: ${fData.status || 'unknown'}`);
      if (aData.status === 'ok') {
        // Normalize API shape → add subTotals for screens compatibility
        setAssessments(aData.assessments.map(a => ({
          ...a,
          total:     Number(a.total) || 0,
          subTotals: {
            ss: Number(a.ssScore) || 0,
            ia: Number(a.iaScore) || 0,
            pr: Number(a.prScore) || 0,
            sc: Number(a.scScore) || 0,
          }
        })));
      }
    }).catch((err) => {
      console.error('[PSS] Data load failed:', err);
      setLoadError(err.name === 'AbortError'
        ? 'หมดเวลาโหลดข้อมูล (20 วินาที) — เซิร์ฟเวอร์อาจช้า ลองใหม่อีกครั้ง'
        : 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    }).finally(() => {
      clearTimeout(timeoutId);
      setLoading(false);
    });

    return () => {
      controller.abort();
      window.removeEventListener('online', flushQueue);
    };
  }, [user]);

  // ── 55-min Google ID token silent refresh ───────────────────────────────────
  aE(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.prompt((n) => {
        if (n.isSkippedMoment() || n.isDismissedMoment()) {
          // Check JWT exp before forcing logout — One Tap is suppressed on iOS Safari
          // even when the token is still valid; only log out if actually expired
          try {
            const exp = JSON.parse(atob(user.token.split('.')[1])).exp;
            if (Date.now() / 1000 < exp - 60) return;
          } catch {}
          console.warn('[PSS] Token refresh suppressed — forcing re-login');
          setUser(null);
        }
      });
    }, 55 * 60 * 1000);
    return () => clearInterval(id);
  }, [user]);

  // Tweaks
  const [tweaks, setTweak] = useTweaks(window.PSS_TWEAK_DEFAULTS);
  const lang = 'th';
  const density = tweaks.density;
  const thresholds = { mild: tweaks.thMild, mod: tweaks.thMod, high: tweaks.thHigh };
  const showSubscales = tweaks.showSubscales;

  // Apply density
  aE(() => {
    document.documentElement.style.setProperty('--d', density === 'compact' ? '0.82' : '1');
  }, [density]);

  // Apply font pair
  aE(() => {
    const pairs = {
      'newsreader-manrope': { serif: '"Newsreader", Georgia, serif', sans: '"Manrope", system-ui, sans-serif' },
      'sarabun-only':       { serif: '"Sarabun", sans-serif', sans: '"Sarabun", sans-serif' },
      'system':             { serif: 'Georgia, serif', sans: '-apple-system, system-ui, sans-serif' },
    };
    const p = pairs[tweaks.fontPair] || pairs['newsreader-manrope'];
    document.documentElement.style.setProperty('--serif', p.serif);
    document.documentElement.style.setProperty('--sans', p.sans);
  }, [tweaks.fontPair]);

  // Apply palette
  aE(() => {
    const palettes = {
      terracotta: { primary: '#c45a3e', soft: '#fbe8d8' },
      sage:       { primary: '#6e8a6a', soft: '#e1ead5' },
      plum:       { primary: '#6f3b58', soft: '#f1e2eb' },
      indigo:     { primary: '#4f5d8a', soft: '#e0e4ee' },
    };
    const p = palettes[tweaks.palette] || palettes.terracotta;
    document.documentElement.style.setProperty('--terracotta', p.primary);
    document.documentElement.style.setProperty('--peach-soft', p.soft);
  }, [tweaks.palette]);

  // Global search keyboard shortcut (Cmd/Ctrl + K)
  aE(() => {
    if (!user) return;
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user]);

  // Compute alert count
  const alertCount = aM(() => {
    return families.filter(f => {
      const fa = assessments.filter(a => a.famId === f.famId).sort((a, b) => a.date.localeCompare(b.date));
      const last = fa[fa.length - 1];
      const trend = fa.map(a => a.total);
      const isRising = trend.length >= 2 && trend[trend.length - 1] > trend[trend.length - 2];
      const sev = severity(last?.total, thresholds);
      return last && (sev.key === 'high' || sev.key === 'extreme' || isRising);
    }).length;
  }, [families, assessments, thresholds]);

  // ── API helpers (only called when user is set) ────────────────────────────
  const apiPost = (payload) => {
    return fetch(user?.apiUrl || window.PSS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, token: user?.token })
    }).then(r => r.json()).then(d => {
      if (d.status === 'unauthorized') { setUser(null); throw new Error('unauthorized'); }
      return d;
    });
  };

  const handleAssessmentSubmit = (r) => {
    const fam      = families.find(f => f.famId === openFamId) || {};
    const dayAdmit = fam.admitDate
      ? (() => { const [y,m,d] = fam.admitDate.split('-').map(Number); return Math.floor((Date.now() - new Date(y,m-1,d).getTime()) / 86400000) + 1; })()
      : (Number(fam.dayAdmit) || 0);
    const assId = openFamId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const ass = {
      assId, famId: openFamId, hospitalCode: user.hospitalCode,
      parentName: fam.parentName || '', bed: fam.bed || '',
      date: new Date().toISOString().slice(0, 10), dayAdmit,
      ssScore: r.totals.ss, iaScore: r.totals.ia,
      prScore: r.totals.pr, scScore: r.totals.sc,
      total: r.total, severity: r.sev.key, notes: r.notes || '',
      ...r.answers,
    };
    setAssessments(prev => [...prev, {
      ...ass,
      subTotals: { ss: r.totals.ss, ia: r.totals.ia, pr: r.totals.pr, sc: r.totals.sc },
      by: user.name || user.email,
    }]);
    setResultData(r);
    setRoute('result');
    apiPost({ action: 'saveAssessment', ass })
      .then(d => {
        if (d.status !== 'ok') throw new Error(d.status);
        window.showToast?.('ซิงค์กับระบบสำเร็จ ✓', 'success');
      })
      .catch(() => {
        const pending = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...pending, ass]));
        window.showToast?.('บันทึกไว้ชั่วคราว — จะซิงค์เมื่อออนไลน์', 'info', 5000);
      });
  };

  const handleAddFamily = (fam) => {
    const newFam = { ...fam, hospitalCode: user.hospitalCode };
    setFamilies(prev => [...prev, newFam]);
    apiPost({ action: 'saveFamily', fam: newFam })
      .then(d => {
        if (d.status !== 'ok') throw new Error(d.status);
        window.showToast?.('เพิ่มครอบครัวสำเร็จ ✓', 'success');
      })
      .catch(err => {
        console.warn('saveFamily:', err);
        window.showToast?.('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
      });
  };

  const handleUpdateCarePlan = (famId, idx, val) => {
    const entry = val
      ? { checked: true, by: user?.name || user?.email || '', at: new Date().toISOString().slice(0, 10) }
      : { checked: false };
    const updated = { ...carePlans, [famId]: { ...(carePlans[famId] || {}), [idx]: entry } };
    setCarePlans(updated);
    localStorage.setItem('pss_care_plans', JSON.stringify(updated));
    // Sync to GAS (fire-and-forget)
    apiPost({ action: 'saveCarePlan', carePlan: { famId, itemIdx: idx, ...entry } })
      .catch(err => console.warn('saveCarePlan:', err));
  };

  const handleSaveNote = (famId, text) => {
    apiPost({
      action: 'saveNote',
      note: {
        noteId: 'N' + Date.now(), famId,
        hospitalCode: user.hospitalCode,
        text, date: new Date().toISOString().slice(0, 10),
      }
    }).then(d => {
      if (d?.status !== 'ok') throw new Error(d?.status);
      window.showToast?.('บันทึกหมายเหตุแล้ว ✓', 'success');
    }).catch(err => {
      console.warn('saveNote:', err);
      window.showToast?.('บันทึกไม่สำเร็จ', 'error');
    });
  };

  const handleSaveIntervention = (famId, kind, note) => {
    const iv = {
      intervId: 'IV' + Date.now(), famId,
      hospitalCode: user.hospitalCode,
      kind, note, date: new Date().toISOString().slice(0, 10),
      by: user.name || user.email,
    };
    setInterventions(prev => [...prev, iv]);
    apiPost({ action: 'saveIntervention', intervention: iv })
      .then(d => {
        if (d?.status !== 'ok') throw new Error(d?.status);
        window.showToast?.('บันทึกการช่วยเหลือแล้ว ✓', 'success');
      })
      .catch(err => {
        console.warn('saveIntervention:', err);
        window.showToast?.('บันทึกไม่สำเร็จ', 'error');
      });
  };

  if (!user) return <LoginScreen onLogin={setUser} lang={lang} />;

  if (loading) {
    return (
      <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
        {/* Skeleton TopNav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobLoad ? 8 : 16, padding: isMobLoad ? '10px 14px' : '14px 28px', background: 'var(--card)', borderBottom: '1px solid var(--line)' }}>
          <SkeletonBlock w={isMobLoad ? 28 : 130} h={32} r={8} />
          {(isMobLoad ? [40,40,40,40] : [90,100,80,90]).map((w, i) => <SkeletonBlock key={i} w={w} h={32} r={99} />)}
          <div style={{ flex: 1 }} />
          <SkeletonBlock w={isMobLoad ? 32 : 110} h={32} r={99} />
          <SkeletonBlock w={isMobLoad ? 30 : 36} h={isMobLoad ? 30 : 36} r={99} />
          {!isMobLoad && <SkeletonBlock w={80} h={32} r={99} />}
        </div>
        {/* Skeleton Dashboard */}
        <div style={{ padding: isMobLoad ? '20px 16px' : '32px 28px', maxWidth: 1400, margin: '0 auto' }}>
          <SkeletonBlock w={isMobLoad ? '70%' : '36%'} h={isMobLoad ? 32 : 44} r={8} />
          <div style={{ marginTop: 10, marginBottom: 28 }}><SkeletonBlock w="22%" h={16} r={6} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobLoad ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SkeletonBlock w="55%" h={11} r={4} />
                <SkeletonBlock w="40%" h={40} r={6} />
                <SkeletonBlock w="65%" h={11} r={4} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobLoad ? '1fr' : '1.4fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SkeletonBlock w="50%" h={14} r={5} />
              <SkeletonBlock w="65%" h={22} r={6} />
              {[0,1,2,3,4].map(i => <SkeletonBlock key={i} h={44} r={12} />)}
            </div>
            {!isMobLoad && <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SkeletonBlock w="50%" h={14} r={5} />
              <SkeletonBlock w="65%" h={22} r={6} />
              {[0,1,2,3].map(i => <SkeletonBlock key={i} h={36} r={8} />)}
            </div>}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--paper)', padding: 24 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 14, color: 'var(--ink-2)', textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>{loadError}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => { setLoadError(null); setUser({ ...user }); }}
          style={{ padding: '10px 20px', fontSize: 13, background: 'var(--terracotta)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
          ลองใหม่
        </button>
        <button onClick={() => { sessionStorage.removeItem('pss_token'); setUser(null); setLoadError(null); }}
          style={{ padding: '10px 20px', fontSize: 13, background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
          ออกจากระบบ
        </button>
      </div>
    </div>
  );

  const goRoute = (r) => { setRoute(r); setOpenFamId(null); };
  const openFamily = (id) => {
    setOpenFamId(id);
    setRoute('familyDetail');
    const lazyPost = (payload) => fetch(user?.apiUrl || window.PSS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, token: user.token }),
    }).then(r => r.json());

    // Lazy-load interventions (server replaces optimistic for this family)
    lazyPost({ action: 'getInterventions', famId: id })
      .then(d => {
        if (d.status === 'ok') setInterventions(prev => [
          ...prev.filter(iv => iv.famId !== id),
          ...d.interventions
        ]);
      }).catch(() => {});

    // Lazy-load notes
    lazyPost({ action: 'getNotes', famId: id })
      .then(d => {
        if (d.status === 'ok') setNotes(prev => [
          ...prev.filter(n => n.famId !== id),
          ...d.notes
        ]);
      }).catch(() => {});

    // Lazy-load care plan (server state wins over localStorage)
    lazyPost({ action: 'getCarePlan', famId: id })
      .then(d => {
        if (d.status === 'ok' && d.carePlans?.length) {
          const planMap = {};
          d.carePlans.forEach(cp => {
            planMap[cp.itemIdx] = {
              checked: cp.checked === true || cp.checked === 'TRUE',
              by: cp.by, at: cp.at,
            };
          });
          setCarePlans(prev => ({ ...prev, [id]: planMap }));
        }
      }).catch(() => {});
  };
  const newAss = (id) => { setOpenFamId(id); setRoute('assessment'); };

  const handleLogout = () => {
    sessionStorage.removeItem('pss_token');
    window.google?.accounts?.id?.disableAutoSelect?.();
    Object.keys(localStorage).filter(k => k.startsWith('pss_')).forEach(k => localStorage.removeItem(k));
    setFamilies([]); setAssessments([]);
    setUser(null);
  };

  return (
    <div data-screen-label={`pss-nicu - ${route}`}
      style={{ paddingBottom: isCompact ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : 0 }}>
      {loadError && (
        <div style={{ padding: '10px 20px', background: 'rgba(179,80,62,.1)', borderBottom: '1px solid rgba(179,80,62,.2)', color: 'var(--rose)', fontSize: 13, display: 'flex', gap: 8 }}>
          ⚠ {loadError}
          <button onClick={() => setUser({...user})} style={{ marginLeft: 8, color: 'var(--terracotta)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>ลองใหม่</button>
        </div>
      )}
      {isCompact
        ? <SlimHeader alertCount={alertCount} onSearch={() => setShowSearch(true)} user={user} onLogout={handleLogout} />
        : <TopNav user={user} route={route === 'familyDetail' || route === 'assessment' || route === 'result' ? 'families' : route}
            onRoute={goRoute} lang={lang} alertCount={alertCount}
            onLangToggle={null}
            onSearch={() => setShowSearch(true)}
            onLogout={handleLogout} />
      }

      <main className="fade-in" key={route + (openFamId || '')}>
        {route === 'dashboard' && (
          <DashboardScreen user={user} families={families} assessments={assessments}
            interventions={interventions}
            lang={lang} density={density} thresholds={thresholds}
            onOpenFamily={openFamily} onRoute={goRoute} />
        )}
        {route === 'families' && (
          <FamilyListScreen families={families} assessments={assessments}
            lang={lang} density={density} thresholds={thresholds}
            onOpenFamily={openFamily} onNewAssessment={newAss}
            user={user} onAddFamily={handleAddFamily} />
        )}
        {route === 'familyDetail' && openFamId && (
          <FamilyDetailScreen famId={openFamId} families={families} assessments={assessments}
            interventions={interventions} notes={notes.filter(n => n.famId === openFamId)}
            lang={lang} thresholds={thresholds} showSubscales={showSubscales}
            onBack={() => setRoute('families')}
            onNewAssessment={() => newAss(openFamId)}
            onOpenAlert={() => setRoute('alerts')}
            onSaveNote={(text) => handleSaveNote(openFamId, text)}
            onSaveIntervention={(kind, note) => handleSaveIntervention(openFamId, kind, note)}
            carePlan={carePlans[openFamId] || {}}
            onUpdateCarePlan={(idx, val) => handleUpdateCarePlan(openFamId, idx, val)} />
        )}
        {route === 'assessment' && openFamId && (
          <AssessmentScreen famId={openFamId} families={families} lang={lang} thresholds={thresholds}
            user={user}
            onBack={() => setRoute('familyDetail')}
            onSubmit={handleAssessmentSubmit} />
        )}
        {route === 'result' && resultData && (
          <ResultScreen result={resultData} fam={families.find(f => f.famId === openFamId)} lang={lang}
            thresholds={thresholds}
            onDone={() => setRoute('families')}
            onView={() => setRoute('familyDetail')} />
        )}
        {route === 'alerts' && (
          <AlertsScreen families={families} assessments={assessments} lang={lang} thresholds={thresholds}
            onOpenFamily={openFamily} />
        )}
        {route === 'analytics' && (
          <AnalyticsScreen families={families} assessments={assessments} lang={lang} thresholds={thresholds} />
        )}
        {route === 'admin' && (
          <AdminScreen families={families} assessments={assessments} lang={lang} thresholds={thresholds} user={user} />
        )}
      </main>

      {/* Toast notifications */}
      <ToastContainer />

      {/* Global Search modal */}
      {showSearch && user && (
        <GlobalSearch
          families={families}
          assessments={assessments}
          thresholds={thresholds}
          onOpen={(famId) => { openFamily(famId); setShowSearch(false); }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Bottom Tab Bar — mobile-native nav (≤1024px) */}
      {isCompact && (
        <BottomTabBar
          route={route}
          onRoute={goRoute}
          alertCount={alertCount}
          userRole={user.role}
        />
      )}

      {/* FAB — บันทึกด่วน: ปรากฏบน familyDetail เท่านั้น */}
      {route === 'familyDetail' && openFamId && (
        <button
          onClick={() => newAss(openFamId)}
          title="บันทึกด่วน"
          style={{
            position: 'fixed',
            bottom: isCompact
              ? 'calc(68px + env(safe-area-inset-bottom, 0px))'
              : 'calc(28px + env(safe-area-inset-bottom, 0px))',
            right: 'max(28px, env(safe-area-inset-right, 28px))',
            zIndex: 900,
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--terracotta)', color: '#fff',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(196,90,62,0.38)',
            transition: 'transform .15s, box-shadow .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(196,90,62,0.48)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(196,90,62,0.38)'; }}
        >
          <Icon name="plus" size={22} />
        </button>
      )}

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
