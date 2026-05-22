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

// Activity recommendations by severity (paraphrased from F-WI-RAISO-QS-201/01)
// RECOMMENDATIONS — intervention protocol per severity level
// item fields: text, owner ('nurse'|'doctor'|'sw'|'psych'), urgent (bool), ivKind (string|null), safety (bool)
const RECOMMENDATIONS = {
  none: {
    timeframe: 'ประเมินซ้ำ 7 วัน',
    items: [
      { text: 'สนับสนุนการเยี่ยมทุกวันและสร้างความผูกพันระหว่างผู้ปกครองกับทารก', owner: 'nurse', urgent: false, ivKind: null },
      { text: 'ส่งเสริม skin-to-skin เมื่ออาการทารกคงที่', owner: 'nurse', urgent: false, ivKind: 'Skin-to-skin' },
    ],
  },
  mild: {
    timeframe: 'ประเมินซ้ำ 5 วัน',
    items: [
      { text: 'แนะนำสภาพแวดล้อม อุปกรณ์ และ monitor ต่างๆ ใน NICU', owner: 'nurse', urgent: false, ivKind: 'ให้ความรู้' },
      { text: 'มอบเอกสารข้อมูล NICU ภาษาไทยให้ผู้ปกครอง', owner: 'nurse', urgent: false, ivKind: 'ให้ความรู้' },
      { text: 'ส่งเสริมการเยี่ยมสม่ำเสมอและ skin-to-skin', owner: 'nurse', urgent: false, ivKind: 'Skin-to-skin' },
    ],
  },
  mod: {
    timeframe: 'ประเมินซ้ำ 3 วัน',
    items: [
      { text: 'นัดประชุมครอบครัวอย่างเป็นทางการ อัปเดตอาการและแผนการรักษา', owner: 'doctor', urgent: false, ivKind: 'ประชุมครอบครัว' },
      { text: 'แนะนำ kangaroo care หากเหมาะสมทางคลินิก', owner: 'nurse', urgent: false, ivKind: 'Skin-to-skin' },
      { text: 'ประสานกลุ่ม peer support ผู้ปกครองที่ผ่านประสบการณ์คล้ายกัน', owner: 'sw', urgent: false, ivKind: 'งานสังคมสงเคราะห์' },
      { text: 'ให้ความรู้บทบาทผู้ปกครองใน NICU และพัฒนาการทารก', owner: 'nurse', urgent: false, ivKind: 'ให้ความรู้' },
    ],
  },
  high: {
    timeframe: 'ดำเนินการภายใน 24 ชั่วโมง',
    items: [
      { text: 'ส่งต่อนักสังคมสงเคราะห์ NICU', owner: 'sw', urgent: true, ivKind: 'งานสังคมสงเคราะห์' },
      { text: 'นัด check-in รายวันโดยพยาบาลหลักที่ดูแล', owner: 'nurse', urgent: true, ivKind: null },
      { text: 'เสนอแบบคัดกรองสุขภาพจิต (EPDS / PHQ-9)', owner: 'doctor', urgent: true, ivKind: 'สนับสนุนจิตใจ' },
      { text: 'ประสานแพทย์เจ้าของไข้ นัดประชุมครอบครัวร่วม', owner: 'doctor', urgent: false, ivKind: 'ประชุมครอบครัว' },
    ],
  },
  extreme: {
    timeframe: 'ดำเนินการวันนี้ทันที',
    items: [
      { text: 'ประเมิน safety — ไม่มีความคิดทำร้ายตนเองหรือผู้อื่น', owner: 'doctor', urgent: true, ivKind: null, safety: true },
      { text: 'ส่งต่อนักสังคมสงเคราะห์ + นักจิตวิทยา ทันที', owner: 'sw', urgent: true, ivKind: 'งานสังคมสงเคราะห์' },
      { text: 'แจ้งแพทย์เพื่อพิจารณา psychiatry consult', owner: 'doctor', urgent: true, ivKind: 'สนับสนุนจิตใจ' },
      { text: 'บันทึก safety plan และแจ้งทีมดูแลรับทราบ', owner: 'nurse', urgent: true, ivKind: null },
      { text: 'จัดกิจกรรม grounding / ผ่อนคลาย นำโดยพยาบาล ทุกวัน', owner: 'nurse', urgent: false, ivKind: 'สนับสนุนจิตใจ' },
    ],
  },
};

const TODAY = new Date();
function daysAgo(n) {
  const d = new Date(TODAY); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Expose to window for cross-script access
Object.assign(window, {
  PSS_QUESTIONS,
  SUBSCALE_META,
  STRESS_LEVELS,
  severity,
  RECOMMENDATIONS,
  daysAgo,
  TODAY,
});
