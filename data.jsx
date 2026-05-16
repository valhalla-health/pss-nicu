// =========================================================
// PSS:NICU — Mock data + question bank (lifted from v4.1)
// =========================================================

const PSS_QUESTIONS = {
  ss: [
    { id: 'ss1', en: 'I see monitors and equipment around the NICU.',
      th: 'ฉันเห็นจอภาพ และเครื่องมือต่างๆ ภายในหอผู้ป่วยวิกฤตทารกแรกเกิด' },
    { id: 'ss2', en: 'I hear constant loud noise from medical equipment.',
      th: 'ฉันได้ยินเสียงดังจากการทำงานของเครื่องมือต่างๆ ตลอดเวลา' },
    { id: 'ss3', en: 'I hear sudden alarm sounds from machines.',
      th: 'ฉันได้ยินเสียงเตือนของเครื่องมือต่างๆ ดังขึ้นทันทีทันใด' },
    { id: 'ss4', en: 'I see other sick infants in the unit (on ventilators, undergoing procedures).',
      th: 'ฉันเห็นทารกป่วยรายอื่นๆ ในหอผู้ป่วยวิกฤตทารกแรกเกิด' },
    { id: 'ss5', en: 'I see large numbers of staff working in the unit.',
      th: 'ฉันเห็นเจ้าหน้าที่จำนวนมากกำลังปฏิบัติงานในหอผู้ป่วยวิกฤตทารกแรกเกิด' },
    { id: 'ss6', en: 'I see my baby on a ventilator.',
      th: 'ฉันเห็นบุตรได้รับการรักษาด้วยเครื่องช่วยหายใจ' },
  ],
  ia: [
    { id: 'ia1', en: 'My baby has tubes and lines coming out of their body.',
      th: 'บุตรมีเครื่องช่วยหายใจและสายต่างๆ ออกจากตัวหรืออยู่รอบๆ ตัว' },
    { id: 'ia2', en: 'My baby has wounds, surgical marks, or bruising on the skin.',
      th: 'บุตรมีรอยแผลรอยผ่าตัดหรือรอยฟกช้ำที่ผิวหนัง' },
    { id: 'ia3', en: 'My baby has abnormal skin color (pale or cyanotic).',
      th: 'บุตรมีสีผิวผิดปกติ เช่น ขาวซีดหรือเขียวคล้ำ' },
    { id: 'ia4', en: 'My baby breathes rapidly or with chest retractions.',
      th: 'บุตรมีอาการหายใจเร็ว เหนื่อยหรือหน้าอกบุ๋ม' },
    { id: 'ia5', en: 'My baby looks small, limp, or fragile.',
      th: 'บุตรตัวเล็ก อ่อนปวกเปียกหรือดูอ่อนแอ' },
    { id: 'ia6', en: 'My baby shows expressions of pain.',
      th: 'บุตรแสดงสีหน้าเจ็บปวด' },
    { id: 'ia7', en: 'My baby lies still and does not move arms or legs.',
      th: 'บุตรมีท่าทางนอนนิ่งๆ ไม่เคลื่อนไหวแขนขา' },
    { id: 'ia8', en: 'My baby twitches or seems restless frequently.',
      th: 'บุตรมีอาการกระตุกหรือกระสับกระส่ายบ่อยครั้ง' },
    { id: 'ia9', en: 'My baby does not cry like other babies.',
      th: 'บุตรไม่ส่งเสียงร้องแบบทารกคนอื่น' },
  ],
  pr: [
    { id: 'pr1', en: 'I cannot be with my baby as much as I want.',
      th: 'ฉันไม่ได้อยู่กับบุตรตลอดเวลาตามต้องการ' },
    { id: 'pr2', en: 'I cannot hold my baby when I want to.',
      th: 'ฉันไม่สามารถอุ้มบุตรได้ตามต้องการ' },
    { id: 'pr3', en: 'I am afraid to touch my baby.',
      th: 'ฉันไม่กล้าจับต้องสัมผัสบุตรเนื่องจากกลัว' },
    { id: 'pr4', en: 'I cannot care for my baby alone (feeding, changing).',
      th: 'ฉันไม่สามารถช่วยเหลือกิจวัตรประจำวันบุตรได้เพียงคนเดียว' },
    { id: 'pr5', en: 'I cannot comfort my baby when crying or in pain.',
      th: 'ฉันไม่สามารถให้ความช่วยเหลือเมื่อบุตรร้องหรือเจ็บปวด' },
    { id: 'pr6', en: 'I cannot give colostrum to my baby in the first 7 days.',
      th: 'ฉันไม่สามารถให้นมเหลืองแก่บุตรในวันแรกหลังคลอดหรือภายใน 7 วัน' },
  ],
  sc: [
    { id: 'sc1', en: 'Staff seem rushed and do not give me time for questions.',
      th: 'เจ้าหน้าที่แสดงท่าที่รีบร้อนไม่ให้เวลาในการซักถาม' },
    { id: 'sc2', en: 'Staff speak too quickly to me.',
      th: 'เจ้าหน้าที่พูดเร็วมากกับฉัน' },
    { id: 'sc3', en: 'Staff use medical terms I do not understand.',
      th: 'เจ้าหน้าที่ใช้ศัพท์ทางการแพทย์ที่ฉันไม่เข้าใจ' },
    { id: 'sc4', en: 'Different staff give me inconsistent information.',
      th: 'เจ้าหน้าที่แต่ละคนแจ้งอาการบุตรหรือการรักษาให้ฉันทราบไม่เหมือนกัน' },
    { id: 'sc5', en: 'Staff do not give me enough information about my baby.',
      th: 'เจ้าหน้าที่ให้ข้อมูลบุตรไม่เพียงพอ' },
  ],
};

const SUBSCALE_META = {
  ss: { code: 'SS', en: 'Sights & Sounds',     th: 'สภาพแวดล้อม',         max: 24, color: 'var(--ss-color)', bg: 'var(--ss-bg)' },
  ia: { code: 'IA', en: 'Infant Appearance',   th: 'รูปลักษณ์ทารก',       max: 36, color: 'var(--ia-color)', bg: 'var(--ia-bg)' },
  pr: { code: 'PR', en: 'Parental Role',       th: 'บทบาทพ่อแม่',         max: 24, color: 'var(--pr-color)', bg: 'var(--pr-bg)' },
  sc: { code: 'SC', en: 'Staff Communication', th: 'การสื่อสารเจ้าหน้าที่', max: 20, color: 'var(--sc-color)', bg: 'var(--sc-bg)' },
};

const STRESS_LEVELS = [
  { v: 0, en: 'No stress',       th: 'ไม่เครียดเลย' },
  { v: 1, en: 'Mild',            th: 'เครียดเล็กน้อย' },
  { v: 2, en: 'Moderate',        th: 'เครียดปานกลาง' },
  { v: 3, en: 'High',            th: 'เครียดมาก' },
  { v: 4, en: 'Extreme',         th: 'เครียดมากที่สุด' },
];

// Severity from total /104, with thresholds tweakable
function severity(total, th = { mild: 27, mod: 53, high: 79 }) {
  if (total == null) return { key: 'none', en: 'No data',   th: 'ยังไม่ประเมิน', color: 'var(--ink-4)' };
  if (total >= th.high) return { key: 'extreme', en: 'Extreme', th: 'เครียดมากที่สุด', color: 'var(--sev-extreme)' };
  if (total >= th.mod)  return { key: 'high',    en: 'High',    th: 'เครียดมาก',       color: 'var(--sev-high)' };
  if (total >= th.mild) return { key: 'mod',     en: 'Moderate',th: 'เครียดปานกลาง',   color: 'var(--sev-mod)' };
  if (total > 0)        return { key: 'mild',    en: 'Mild',    th: 'เครียดเล็กน้อย',   color: 'var(--sev-mild)' };
  return                       { key: 'none',    en: 'No stress', th: 'ไม่เครียด',     color: 'var(--sev-none)' };
}

// =========================================================
// Mock families + assessments
// =========================================================

const TODAY = new Date();
function daysAgo(n) {
  const d = new Date(TODAY); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const FAMILIES = [
  {
    famId: 'F001', bed: 'NICU-04', infantId: 'HN5821042',
    parentName: 'Anong Suwannakit', parentInitials: 'A.S.', relation: 'Mother',
    babyName: 'Baby Suwannakit', ga: 28, bw: 1120, dayAdmit: 14,
    dx: 'RDS, ventilator support', flag: 'rising',
  },
  {
    famId: 'F002', bed: 'NICU-07', infantId: 'HN5821067',
    parentName: 'Tanaporn Wattanakul', parentInitials: 'T.W.', relation: 'Father',
    babyName: 'Baby Wattanakul', ga: 32, bw: 1820, dayAdmit: 5,
    dx: 'TTN, CPAP weaning', flag: 'stable',
  },
  {
    famId: 'F003', bed: 'NICU-12', infantId: 'HN5821101',
    parentName: 'Sirinya Choosri', parentInitials: 'S.C.', relation: 'Mother',
    babyName: 'Baby Choosri', ga: 26, bw: 880, dayAdmit: 21,
    dx: 'Extreme prematurity, PDA', flag: 'critical',
  },
  {
    famId: 'F004', bed: 'NICU-02', infantId: 'HN5821023',
    parentName: 'Pim Lertkul', parentInitials: 'P.L.', relation: 'Mother',
    babyName: 'Baby Lertkul', ga: 34, bw: 2210, dayAdmit: 3,
    dx: 'Mild jaundice, phototherapy', flag: 'stable',
  },
  {
    famId: 'F005', bed: 'NICU-09', infantId: 'HN5821088',
    parentName: 'Kanya Phongam', parentInitials: 'K.P.', relation: 'Mother',
    babyName: 'Baby Phongam', ga: 30, bw: 1540, dayAdmit: 10,
    dx: 'Sepsis, antibiotics', flag: 'rising',
  },
  {
    famId: 'F006', bed: 'NICU-15', infantId: 'HN5821119',
    parentName: 'Niran Jaikla', parentInitials: 'N.J.', relation: 'Father',
    babyName: 'Baby Jaikla', ga: 36, bw: 2480, dayAdmit: 2,
    dx: 'Observation, transitional', flag: 'new',
  },
  {
    famId: 'F007', bed: 'NICU-11', infantId: 'HN5821095',
    parentName: 'Wanida Saetang', parentInitials: 'W.S.', relation: 'Mother',
    babyName: 'Baby Saetang', ga: 29, bw: 1280, dayAdmit: 18,
    dx: 'BPD, oxygen support', flag: 'stable',
  },
  {
    famId: 'F008', bed: 'NICU-06', infantId: 'HN5821054',
    parentName: 'Chayanin Bunsong', parentInitials: 'C.B.', relation: 'Mother',
    babyName: 'Baby Bunsong', ga: 31, bw: 1670, dayAdmit: 7,
    dx: 'NEC suspected, NPO', flag: 'rising',
  },
];

// Helpers to make plausible answers given subscale targets
function answersFor(targets /* {ss, ia, pr, sc} subscale RAW totals */) {
  const out = {};
  for (const sub of ['ss', 'ia', 'pr', 'sc']) {
    const items = PSS_QUESTIONS[sub];
    let remaining = targets[sub];
    items.forEach((it, idx) => {
      const left = items.length - idx;
      const max = Math.min(4, remaining);
      // Spread values so it doesn't bunch
      let v = Math.round(remaining / left);
      v = Math.max(0, Math.min(max, v + (idx % 2 === 0 ? 0 : (Math.random() < 0.5 ? -1 : 1))));
      v = Math.max(0, Math.min(4, v));
      remaining -= v;
      out[it.id] = v;
    });
  }
  return out;
}

function makeAss(famId, dayOffset, dayAdmit, subTotals, notes) {
  const total = subTotals.ss + subTotals.ia + subTotals.pr + subTotals.sc;
  return {
    assId: famId + '-' + dayOffset,
    famId,
    date: daysAgo(dayOffset),
    dayAdmit,
    subTotals,
    answers: answersFor(subTotals),
    total,
    notes: notes || '',
    by: 'N. Chiraporn (RN)',
  };
}

const ASSESSMENTS = [
  // F001 — rising trend, currently moderate-high
  makeAss('F001', 12, 2, { ss: 14, ia: 22, pr: 16, sc:  8 }, 'Mother first introduced to NICU environment.'),
  makeAss('F001',  7, 7, { ss: 16, ia: 26, pr: 19, sc: 10 }, 'Increased anxiety after PDA discussion.'),
  makeAss('F001',  3, 11, { ss: 18, ia: 29, pr: 21, sc: 12 }, 'Tearful during today\'s visit.'),

  // F002 — stable / mild
  makeAss('F002',  4, 1, { ss:  8, ia: 12, pr: 10, sc:  6 }, 'Father appears engaged.'),
  makeAss('F002',  1, 4, { ss:  9, ia: 13, pr: 11, sc:  6 }, 'Asked good questions during round.'),

  // F003 — critical / extreme stress
  makeAss('F003', 18, 3, { ss: 20, ia: 30, pr: 20, sc: 14 }, 'New admission — extremely emotional.'),
  makeAss('F003', 12, 9, { ss: 19, ia: 28, pr: 22, sc: 13 }, 'Considering kangaroo care.'),
  makeAss('F003',  6, 15, { ss: 21, ia: 32, pr: 23, sc: 16 }, 'Mother declined visit yesterday.'),
  makeAss('F003',  1, 20, { ss: 22, ia: 33, pr: 22, sc: 17 }, 'PRIORITY — referral to social work.'),

  // F004 — minimal stress
  makeAss('F004',  2, 1, { ss:  4, ia:  7, pr:  6, sc:  4 }, 'Mother calm, asked appropriate questions.'),
  makeAss('F004',  0, 3, { ss:  5, ia:  6, pr:  5, sc:  3 }, 'Engaging well with team.'),

  // F005 — rising
  makeAss('F005',  8, 2, { ss: 10, ia: 16, pr: 12, sc:  7 }, ''),
  makeAss('F005',  4, 6, { ss: 13, ia: 21, pr: 15, sc:  9 }, 'Sepsis update was difficult to receive.'),
  makeAss('F005',  1, 9, { ss: 16, ia: 25, pr: 17, sc: 11 }, ''),

  // F006 — new / first assessment
  makeAss('F006',  1, 1, { ss:  9, ia: 11, pr:  8, sc:  5 }, 'First-time parents.'),

  // F007 — stable mod
  makeAss('F007', 14, 4, { ss: 12, ia: 18, pr: 13, sc:  8 }, ''),
  makeAss('F007',  7, 11, { ss: 11, ia: 17, pr: 12, sc:  8 }, ''),
  makeAss('F007',  2, 16, { ss: 11, ia: 16, pr: 11, sc:  7 }, 'Stable, family adapting well.'),

  // F008 — concerning rise
  makeAss('F008',  5, 2, { ss: 11, ia: 19, pr: 14, sc:  9 }, ''),
  makeAss('F008',  2, 5, { ss: 14, ia: 24, pr: 18, sc: 12 }, 'NEC discussion — significant rise.'),
];

// Activity recommendations by severity (paraphrased from F-WI-RAISO-QS-201/01)
const RECOMMENDATIONS = {
  none: [
    'ดูแลต่อเนื่องโดยยึดครอบครัวเป็นศูนย์กลาง สนับสนุนการเยี่ยมและสร้างความผูกพันตามปกติ',
  ],
  mild: [
    'แนะนำสภาพแวดล้อมหอผู้ป่วย อุปกรณ์ และเครื่องมือต่างๆ ให้ผู้ปกครองรับทราบ',
    'ส่งเสริมการเยี่ยมทุกวัน และ skin-to-skin เมื่ออาการทารกคงที่',
  ],
  mod: [
    'นัดประชุมครอบครัวอย่างเป็นทางการเพื่ออัปเดตอาการทารก',
    'มอบเอกสารข้อมูล NICU ภาษาไทยให้ผู้ปกครอง',
    'แนะนำ kangaroo care หากเหมาะสมทางคลินิก',
    'ประสานงานกลุ่มสนับสนุนผู้ปกครองที่ผ่านประสบการณ์คล้ายกัน',
  ],
  high: [
    'ส่งต่อนักสังคมสงเคราะห์ NICU ภายใน 24 ชั่วโมง',
    'นัด check-in รายวันโดยพยาบาลหลักที่ดูแล',
    'เสนอแบบคัดกรองสุขภาพจิต (EPDS / PHQ-9)',
    'ประสานแพทย์เจ้าของไข้เพื่อนัดประชุมครอบครัวร่วม',
  ],
  extreme: [
    'ส่งต่อด้านจิตสังคมทันที — นักสังคมสงเคราะห์ + นักจิตวิทยา',
    'เปิดใช้เส้นทางสนับสนุนผู้ปกครองในภาวะวิกฤต',
    'พิจารณาผู้สนับสนุนที่มีพื้นเพวัฒนธรรมใกล้เคียง',
    'บันทึก safety plan และแจ้งทีมดูแลทราบ',
    'จัดกิจกรรม grounding / ผ่อนคลายนำโดยพยาบาล ทุกวัน',
  ],
};

// Users
const USERS = [
  { id: 'u1', name: 'Dr. Pichaya Ratan',    role: 'doctor', initials: 'PR', dept: 'Neonatology' },
  { id: 'u2', name: 'N. Chiraporn Thanin',  role: 'nurse',  initials: 'CT', dept: 'NICU Day Shift' },
  { id: 'u3', name: 'N. Malee Sirikit',     role: 'nurse',  initials: 'MS', dept: 'NICU Night Shift' },
  { id: 'u4', name: 'Admin Suchart',        role: 'admin',  initials: 'SU', dept: 'IT / Quality' },
];

// Intervention log — sample entries
const INTERVENTIONS = [
  { famId: 'F003', date: daysAgo(2), by: 'Dr. Pichaya Ratan', kind: 'Family meeting',
    note: '45-min discussion re: prognosis. Mother tearful but engaged.' },
  { famId: 'F003', date: daysAgo(1), by: 'SW. Wandee P.', kind: 'Social work',
    note: 'Connected family with NICU peer support group.' },
  { famId: 'F001', date: daysAgo(5), by: 'N. Chiraporn Thanin', kind: 'Skin-to-skin',
    note: 'First kangaroo care session. Mother very emotional but positive.' },
  { famId: 'F005', date: daysAgo(3), by: 'N. Malee Sirikit', kind: 'Education',
    note: 'Reviewed sepsis treatment plan. Provided written materials.' },
];

// Expose to window for cross-script access
Object.assign(window, {
  PSS_QUESTIONS,
  SUBSCALE_META,
  STRESS_LEVELS,
  severity,
  FAMILIES,
  ASSESSMENTS,
  RECOMMENDATIONS,
  USERS,
  INTERVENTIONS,
  daysAgo,
  TODAY,
});
