/**
 * ROUTE Demo - Hardcoded data for staff, patients, clinics, shifts, visits
 * Location: Moriya city area (守谷市), Ibaraki, Japan
 */

const DEMO_DATA = {
  // --- Clinic (拠点) ---
  clinic: {
    id: 'clinic-001',
    name: '守谷訪問看護ステーション',
    address: '茨城県守谷市中央1-23-4',
    lat: 35.9513,
    lng: 139.9756,
    phone: '0297-48-XXXX',
    source: 'HOMIS',
  },

  // --- Staff (スタッフ) ---
  // source: 'HOMIS' = imported from HOMIS EMR, 'NURSEE' = imported from NURSEE scheduling system
  staff: [
    { id: 'S001', name: '田中 花子',  role: '看護師',         transport: 'car',        speedFactor: 1.0, color: '#4A90D9', source: 'HOMIS',  calendarId: 'tanaka@example.com'     },
    { id: 'S002', name: '鈴木 太郎',  role: '看護師',         transport: 'motorcycle', speedFactor: 1.0, color: '#E8913A', source: 'NURSEE', calendarId: 'suzuki@example.com'     },
    { id: 'S003', name: '佐藤 美咲',  role: '准看護師',       transport: 'bicycle',    speedFactor: 0.6, color: '#50B86C', source: 'HOMIS',  calendarId: 'sato@example.com'       },
    { id: 'S004', name: '山田 健一',  role: 'PT(理学療法士)', transport: 'motorcycle', speedFactor: 1.0, color: '#9B59B6', source: 'NURSEE', calendarId: 'yamada@example.com'     },
    { id: 'S005', name: '伊藤 直子',  role: '看護師',         transport: 'car',        speedFactor: 1.0, color: '#E74C3C', source: 'HOMIS',  calendarId: 'ito@example.com'        },
    { id: 'S006', name: '渡辺 浩二',  role: 'PT(理学療法士)', transport: 'car',        speedFactor: 1.0, color: '#1ABC9C', source: 'NURSEE', calendarId: 'watanabe@example.com'   },
    { id: 'S007', name: '中村 さくら', role: '准看護師',      transport: 'bicycle',    speedFactor: 0.6, color: '#F39C12', source: 'HOMIS',  calendarId: 'nakamura@example.com'   },
    { id: 'S008', name: '小林 勇太',  role: '看護師',         transport: 'motorcycle', speedFactor: 1.0, color: '#27AE60', source: 'NURSEE', calendarId: 'kobayashi@example.com'  },
    { id: 'S009', name: '加藤 美穂',  role: 'OT(作業療法士)', transport: 'car',       speedFactor: 1.0, color: '#2980B9', source: 'HOMIS',  calendarId: 'kato@example.com'       },
    { id: 'S010', name: '松本 隆',    role: '看護師',         transport: 'motorcycle', speedFactor: 1.0, color: '#D35400', source: 'NURSEE', calendarId: 'matsumoto@example.com'  },
    { id: 'S011', name: '井上 幸子',  role: '准看護師',       transport: 'bicycle',    speedFactor: 0.6, color: '#8E44AD', source: 'HOMIS',  calendarId: 'inoue@example.com'      },
    { id: 'S012', name: '木村 大輔',  role: 'ST(言語聴覚士)', transport: 'car',        speedFactor: 1.0, color: '#16A085', source: 'NURSEE', calendarId: 'kimura@example.com'     },
  ],

  // --- Shifts (シフト) - for target week ---
  shifts: [
    // Monday 2026-03-30
    { staffId: 'S001', date: '2026-03-30', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S002', date: '2026-03-30', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S003', date: '2026-03-30', onDuty: true, start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S004', date: '2026-03-30', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    // Tuesday 2026-03-31
    { staffId: 'S001', date: '2026-03-31', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S002', date: '2026-03-31', onDuty: false, start: '', end: '', breakStart: '', breakEnd: '' },
    { staffId: 'S003', date: '2026-03-31', onDuty: true, start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S004', date: '2026-03-31', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    // Wednesday 2026-04-01
    { staffId: 'S001', date: '2026-04-01', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S002', date: '2026-04-01', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S003', date: '2026-04-01', onDuty: false, start: '', end: '', breakStart: '', breakEnd: '' },
    { staffId: 'S004', date: '2026-04-01', onDuty: true, start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    // Thursday 2026-04-02
    { staffId: 'S001', date: '2026-04-02', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S002', date: '2026-04-02', onDuty: true, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S003', date: '2026-04-02', onDuty: true, start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S004', date: '2026-04-02', onDuty: false, start: '', end: '', breakStart: '', breakEnd: '' },
    // Friday 2026-04-03
    { staffId: 'S001', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S002', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S003', date: '2026-04-03', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S004', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },

    // --- S005 伊藤 直子 ---
    { staffId: 'S005', date: '2026-03-30', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S005', date: '2026-03-31', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S005', date: '2026-04-01', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S005', date: '2026-04-02', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S005', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },

    // --- S006 渡辺 浩二 ---
    { staffId: 'S006', date: '2026-03-30', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S006', date: '2026-03-31', onDuty: true,  start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S006', date: '2026-04-01', onDuty: true,  start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S006', date: '2026-04-02', onDuty: true,  start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S006', date: '2026-04-03', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },

    // --- S007 中村 さくら ---
    { staffId: 'S007', date: '2026-03-30', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S007', date: '2026-03-31', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S007', date: '2026-04-01', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S007', date: '2026-04-02', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S007', date: '2026-04-03', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },

    // --- S008 小林 勇太 ---
    { staffId: 'S008', date: '2026-03-30', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S008', date: '2026-03-31', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S008', date: '2026-04-01', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S008', date: '2026-04-02', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S008', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },

    // --- S009 加藤 美穂 ---
    { staffId: 'S009', date: '2026-03-30', onDuty: true,  start: '08:30', end: '17:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S009', date: '2026-03-31', onDuty: true,  start: '08:30', end: '17:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S009', date: '2026-04-01', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S009', date: '2026-04-02', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S009', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:00', breakStart: '12:00', breakEnd: '13:00' },

    // --- S010 松本 隆 ---
    { staffId: 'S010', date: '2026-03-30', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S010', date: '2026-03-31', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S010', date: '2026-04-01', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S010', date: '2026-04-02', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S010', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },

    // --- S011 井上 幸子 ---
    { staffId: 'S011', date: '2026-03-30', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S011', date: '2026-03-31', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S011', date: '2026-04-01', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S011', date: '2026-04-02', onDuty: true,  start: '09:00', end: '16:00', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S011', date: '2026-04-03', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },

    // --- S012 木村 大輔 ---
    { staffId: 'S012', date: '2026-03-30', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S012', date: '2026-03-31', onDuty: false, start: '',      end: '',       breakStart: '',      breakEnd: ''      },
    { staffId: 'S012', date: '2026-04-01', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S012', date: '2026-04-02', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
    { staffId: 'S012', date: '2026-04-03', onDuty: true,  start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' },
  ],

  // --- Facilities (施設) ---
  facilities: [
    { id: 'F001', name: 'グリーンヒル守谷', address: '守谷市百合ケ丘2-10', lat: 35.9580, lng: 139.9810 },
    { id: 'F002', name: 'サンライズ取手', address: '取手市新町1-5-8', lat: 35.9120, lng: 140.0530 },
  ],

  // --- Patients (患者) ---
  patients: [
    {
      id: 'P001', name: '高橋 義雄', category: '医療', source: 'HOMIS',
      address: '守谷市松並青葉1-8-3', lat: 35.9590, lng: 139.9680,
      facilityId: null, forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [1, 4], timesPerDay: 1, preferredTimes: ['09:30'], durations: [60], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P002', name: '渡辺 幸子', category: '介護', source: 'NURSEE',
      address: '守谷市けやき台3-15-7', lat: 35.9470, lng: 139.9830,
      facilityId: null, forcedStaff: 'S001', ngStaff: [],
      visits: [
        { dayOfWeek: [1, 3, 5], timesPerDay: 1, preferredTimes: ['10:00'], durations: [45], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P003', name: '伊藤 正治', category: '医療', source: 'HOMIS',
      address: '守谷市久保ヶ丘2-5-1', lat: 35.9440, lng: 139.9700,
      facilityId: null, forcedStaff: null, ngStaff: ['S003'],
      visits: [
        { dayOfWeek: [2, 5], timesPerDay: 2, preferredTimes: ['09:00', '14:00'], durations: [30, 30], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P004', name: '小林 美代子', category: '介護', source: 'NURSEE',
      address: '守谷市中央4-2-9', lat: 35.9520, lng: 139.9760,
      facilityId: 'F001', forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [1, 2, 3, 4, 5], timesPerDay: 1, preferredTimes: ['am'], durations: [45], timeKind: 'am' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P005', name: '加藤 一男', category: '医療', source: 'HOMIS',
      address: '守谷市みずき野5-12', lat: 35.9630, lng: 139.9590,
      facilityId: 'F001', forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [1, 3], timesPerDay: 1, preferredTimes: ['am'], durations: [60], timeKind: 'am' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P006', name: '吉田 春江', category: '介護', source: 'NURSEE',
      address: '取手市寺田1-3-6', lat: 35.9150, lng: 140.0480,
      facilityId: 'F002', forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [2, 4], timesPerDay: 1, preferredTimes: ['14:00'], durations: [45], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P007', name: '山口 利夫', category: '医療', source: 'HOMIS',
      address: '取手市新町2-8-11', lat: 35.9100, lng: 140.0550,
      facilityId: 'F002', forcedStaff: null, ngStaff: ['S004'],
      visits: [
        { dayOfWeek: [2, 4], timesPerDay: 1, preferredTimes: ['15:00'], durations: [30], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P008', name: '中村 敏子', category: '医療', source: 'HOMIS',
      address: '守谷市本町4-7-2', lat: 35.9490, lng: 139.9790,
      facilityId: null, forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [1, 3, 5], timesPerDay: 1, preferredTimes: ['pm'], durations: [30], timeKind: 'pm' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P009', name: '松本 勇', category: '介護', source: 'NURSEE',
      address: '守谷市薬師台2-1-5', lat: 35.9560, lng: 139.9720,
      facilityId: null, forcedStaff: 'S004', ngStaff: [],
      visits: [
        { dayOfWeek: [1, 3, 5], timesPerDay: 1, preferredTimes: ['10:30'], durations: [60], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P010', name: '井上 節子', category: '医療', source: 'HOMIS',
      address: '守谷市大柏950-3', lat: 35.9410, lng: 139.9650,
      facilityId: null, forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [2, 4], timesPerDay: 1, preferredTimes: ['11:00'], durations: [45], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: { start: '2026-03-28', end: '2026-04-03' },
    },
    {
      id: 'P011', name: '木村 幸雄', category: '介護', source: 'NURSEE',
      address: '守谷市郷州290-5', lat: 35.9380, lng: 139.9820,
      facilityId: null, forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [1, 3, 5], timesPerDay: 1, preferredTimes: ['am'], durations: [45], timeKind: 'am' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P012', name: '清水 和子', category: '医療', source: 'HOMIS',
      address: '守谷市立沢501-2', lat: 35.9450, lng: 139.9610,
      facilityId: null, forcedStaff: 'S002', ngStaff: [],
      visits: [
        { dayOfWeek: [2, 4], timesPerDay: 1, preferredTimes: ['10:00'], durations: [30], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P013', name: '橋本 哲也', category: '医療', source: 'HOMIS',
      address: '取手市戸頭5-12-3', lat: 35.9220, lng: 140.0410,
      facilityId: null, forcedStaff: null, ngStaff: ['S001'],
      visits: [
        { dayOfWeek: [1, 5], timesPerDay: 1, preferredTimes: ['14:00'], durations: [60], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P014', name: '斎藤 光子', category: '介護', source: 'NURSEE',
      address: '守谷市乙子1045-1', lat: 35.9350, lng: 139.9770,
      facilityId: 'F001', forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [2, 3, 4], timesPerDay: 1, preferredTimes: ['pm'], durations: [45], timeKind: 'pm' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P015', name: '藤田 武', category: '医療', source: 'HOMIS',
      address: '守谷市高野1-3-8', lat: 35.9600, lng: 139.9850,
      facilityId: null, forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [1, 2, 3], timesPerDay: 1, preferredTimes: ['09:00'], durations: [30], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P016', name: '岡田 静江', category: '介護', source: 'NURSEE',
      address: '取手市藤代1-7-4', lat: 35.9280, lng: 140.0320,
      facilityId: 'F002', forcedStaff: null, ngStaff: [],
      visits: [
        { dayOfWeek: [3, 5], timesPerDay: 1, preferredTimes: ['10:30'], durations: [45], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P017', name: '村田 博', category: '医療', source: 'HOMIS',
      address: '守谷市野木崎280-6', lat: 35.9320, lng: 139.9680,
      facilityId: null, forcedStaff: null, ngStaff: ['S005'],
      visits: [
        { dayOfWeek: [2, 4], timesPerDay: 2, preferredTimes: ['09:30', '15:00'], durations: [30, 30], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
    {
      id: 'P018', name: '長谷川 律子', category: '介護', source: 'NURSEE',
      address: '守谷市板戸井2-4-9', lat: 35.9480, lng: 139.9540,
      facilityId: null, forcedStaff: 'S003', ngStaff: [],
      visits: [
        { dayOfWeek: [1, 3, 5], timesPerDay: 1, preferredTimes: ['11:00'], durations: [60], timeKind: 'fixed' }
      ],
      cancelPeriod: null,
      specialPeriod: null,
    },
  ],

  // --- Busy blocks (既存予定) ---
  busyBlocks: [
    { staffId: 'S001', date: '2026-03-30', start: '15:00', end: '16:00', title: 'カンファレンス' },
    { staffId: 'S002', date: '2026-04-01', start: '09:00', end: '10:00', title: '研修' },
    { staffId: 'S004', date: '2026-04-03', start: '14:00', end: '15:30', title: '会議' },
  ],
};
