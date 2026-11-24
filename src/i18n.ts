import type { ThemeId } from './themes';
import type { IconName } from './types';

export type Language = 'en' | 'id';

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'id', label: 'Bahasa Indonesia' },
];

const en = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  addEvent: 'Add event',
  newEvent: 'New event',
  editEvent: 'Edit event',
  cancel: 'Cancel',
  save: 'Save',
  eventName: 'Event name',
  icon: 'Icon',
  start: 'Start',
  duration: 'Duration',
  noDuration: 'No duration',
  deleteEvent: 'Delete event',
  at: 'at',
  tabTimeline: 'Timeline',
  tabRoutines: 'Routines',
  tabStats: 'Stats',
  tabSettings: 'Settings',
  language: 'Language',
  theme: 'Theme',
  hour: 'hour',
  hours: 'hours',
  minute: 'minute',
  minutes: 'minutes',
  welcomeTagline: 'Plan your day, block by block.',
  getStarted: 'Get started',
  other: 'Other',
  replayWelcome: 'Show welcome screen',
  periodWeek: 'This week',
  periodMonth: 'This month',
  periodAll: 'All time',
  statEvents: 'Events',
  statPlanned: 'Planned time',
  statAvgPerDay: 'Avg per active day',
  statBusiestDay: 'Busiest day',
  chartByWeekday: 'Planned time per weekday',
  chartByCategory: 'By category',
  chartByDayPart: 'Time of day',
  topEvents: 'Most frequent events',
  noStats: 'No events in this period yet.',
  eventsCount: 'events',
  eventCount: 'event',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  tapBarHint: 'Tap a bar to see its value',
  newRoutine: 'New routine',
  editRoutine: 'Edit routine',
  deleteRoutine: 'Delete routine',
  routineName: 'Routine name',
  everyDay: 'Every day',
  weekdaysPreset: 'Weekdays',
  weekendsPreset: 'Weekends',
  noRoutines: 'No routines yet',
  noRoutinesHint: 'Routines repeat automatically on your timeline.',
  suggestions: 'Suggestions',
  activeRoutines: 'active',
  perWeek: 'per week',
  routineNote: 'This is a routine. Changes apply to every day it repeats.',
  routineMorning: 'Morning routine',
  routineWorkout: 'Workout',
  routineFocus: 'Focus work',
  routineLunch: 'Lunch',
  routineBedtime: 'Bedtime',
  addRoutine: 'Add routine',
  paused: 'Paused',
  delete: 'Delete',
  skip: 'Skip',
  undo: 'Undo',
  eventDeleted: 'Event deleted',
  routineSkipped: 'Routine skipped for this day',
  conflictWith: 'Clashes with',
  widgetNext: 'Next up',
  widgetProgress: 'Progress',
  widgetNothingNext: 'Nothing planned',
  widgetAllDone: 'All done for today',
  widgetNow: 'Happening now',
  widgetIn: 'in',
  widgetMore: 'more',
  widgetDone: 'done',
  widgetNoEvents: 'No events today',
  tabHome: 'Home',
  greetingMorning: 'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening: 'Good evening',
  greetingNight: 'Good night',
  laterToday: 'Later today',
  openTimeline: 'Open timeline',
  homeWidgets: 'Home screen widgets',
  homeWidgetsHint: 'Keep your day on your home screen.',
  addWidget: 'Add',
  howToAdd: 'How to add a widget',
  widgetStepsAndroid: '1. Touch and hold an empty spot on your home screen\n2. Tap Widgets\n3. Find Blockstar and drag a widget onto your screen',
  widgetStepsIos: '1. Touch and hold an empty spot on your home screen\n2. Tap Edit → Add Widget\n3. Search for Blockstar and pick a widget',
  widgetNeedsBuild: 'Widgets need the installed Blockstar app (they are not available in Expo Go).',
  widgetSmall: 'Small',
  widgetMedium: 'Medium',
  widgetNextDesc: 'Your next event with a countdown',
  widgetTodayDesc: 'The rest of today\'s agenda',
  widgetProgressDesc: 'How much of today is done',
  onboardWidgetsTitle: 'Your day at a glance',
  onboardWidgetsText: 'Add Blockstar widgets to your home screen to see what’s next without opening the app.',
  nextStep: 'Next',
  done: 'Done',
  chooseIcon: 'Choose icon',
  moveTo: 'Move to {time}',
  reminders: 'Reminders',
  reminderOff: 'Off',
  reminderBefore: 'before',
  reminderBody: 'Starts in {lead} · {time}',
  reminderHint: 'Get a notification before each event and routine starts.',
  notificationsBlocked: 'Notifications are turned off for Blockstar.',
  openSettings: 'Open settings',
  allowNotifications: 'Allow notifications',
  notificationsUnsupported: 'Reminders are only available on iOS and Android.',
};

export type StringKey = keyof typeof en;

const id: Record<StringKey, string> = {
  today: 'Hari ini',
  tomorrow: 'Besok',
  yesterday: 'Kemarin',
  addEvent: 'Tambah event',
  newEvent: 'Event baru',
  editEvent: 'Ubah event',
  cancel: 'Batal',
  save: 'Simpan',
  eventName: 'Nama event',
  icon: 'Ikon',
  start: 'Mulai',
  duration: 'Durasi',
  noDuration: 'Tanpa durasi',
  deleteEvent: 'Hapus event',
  at: 'pukul',
  tabTimeline: 'Linimasa',
  tabRoutines: 'Rutinitas',
  tabStats: 'Statistik',
  tabSettings: 'Pengaturan',
  language: 'Bahasa',
  theme: 'Tema',
  hour: 'jam',
  hours: 'jam',
  minute: 'menit',
  minutes: 'menit',
  welcomeTagline: 'Rencanakan harimu, blok demi blok.',
  getStarted: 'Mulai',
  other: 'Lainnya',
  replayWelcome: 'Tampilkan layar sambutan',
  periodWeek: 'Minggu ini',
  periodMonth: 'Bulan ini',
  periodAll: 'Semua',
  statEvents: 'Event',
  statPlanned: 'Waktu terencana',
  statAvgPerDay: 'Rata-rata per hari aktif',
  statBusiestDay: 'Hari tersibuk',
  chartByWeekday: 'Waktu terencana per hari',
  chartByCategory: 'Per kategori',
  chartByDayPart: 'Waktu dalam sehari',
  topEvents: 'Event paling sering',
  noStats: 'Belum ada event di periode ini.',
  eventsCount: 'event',
  eventCount: 'event',
  morning: 'Pagi',
  afternoon: 'Siang',
  evening: 'Sore',
  night: 'Malam',
  tapBarHint: 'Ketuk batang untuk melihat nilainya',
  newRoutine: 'Rutinitas baru',
  editRoutine: 'Ubah rutinitas',
  deleteRoutine: 'Hapus rutinitas',
  routineName: 'Nama rutinitas',
  everyDay: 'Setiap hari',
  weekdaysPreset: 'Hari kerja',
  weekendsPreset: 'Akhir pekan',
  noRoutines: 'Belum ada rutinitas',
  noRoutinesHint: 'Rutinitas muncul otomatis di linimasa kamu.',
  suggestions: 'Saran',
  activeRoutines: 'aktif',
  perWeek: 'per minggu',
  routineNote: 'Ini rutinitas. Perubahan berlaku di semua hari pengulangannya.',
  routineMorning: 'Rutinitas pagi',
  routineWorkout: 'Olahraga',
  routineFocus: 'Kerja fokus',
  routineLunch: 'Makan siang',
  routineBedtime: 'Tidur',
  addRoutine: 'Tambah rutinitas',
  paused: 'Dijeda',
  delete: 'Hapus',
  skip: 'Lewati',
  undo: 'Urungkan',
  eventDeleted: 'Event dihapus',
  routineSkipped: 'Rutinitas dilewati untuk hari ini',
  conflictWith: 'Bentrok dengan',
  widgetNext: 'Berikutnya',
  widgetProgress: 'Progres',
  widgetNothingNext: 'Tidak ada rencana',
  widgetAllDone: 'Semua selesai hari ini',
  widgetNow: 'Sedang berlangsung',
  widgetIn: 'dalam',
  widgetMore: 'lagi',
  widgetDone: 'selesai',
  widgetNoEvents: 'Tidak ada event hari ini',
  tabHome: 'Beranda',
  greetingMorning: 'Selamat pagi',
  greetingAfternoon: 'Selamat siang',
  greetingEvening: 'Selamat sore',
  greetingNight: 'Selamat malam',
  laterToday: 'Nanti hari ini',
  openTimeline: 'Buka linimasa',
  homeWidgets: 'Widget layar utama',
  homeWidgetsHint: 'Taruh jadwalmu langsung di layar utama HP.',
  addWidget: 'Tambah',
  howToAdd: 'Cara menambah widget',
  widgetStepsAndroid: '1. Tekan lama area kosong di layar utama\n2. Ketuk Widget\n3. Cari Blockstar lalu seret widget ke layar',
  widgetStepsIos: '1. Tekan lama area kosong di layar utama\n2. Ketuk Edit → Tambah Widget\n3. Cari Blockstar lalu pilih widget',
  widgetNeedsBuild: 'Widget butuh aplikasi Blockstar yang terpasang (tidak tersedia di Expo Go).',
  widgetSmall: 'Kecil',
  widgetMedium: 'Sedang',
  widgetNextDesc: 'Event berikutnya dengan hitung mundur',
  widgetTodayDesc: 'Sisa agenda hari ini',
  widgetProgressDesc: 'Seberapa banyak hari ini yang selesai',
  onboardWidgetsTitle: 'Harimu dalam sekilas',
  onboardWidgetsText: 'Tambahkan widget Blockstar di layar utama untuk melihat jadwal berikutnya tanpa membuka aplikasi.',
  nextStep: 'Lanjut',
  done: 'Selesai',
  chooseIcon: 'Pilih ikon',
  moveTo: 'Pindah ke {time}',
  reminders: 'Pengingat',
  reminderOff: 'Mati',
  reminderBefore: 'sebelumnya',
  reminderBody: 'Mulai {lead} lagi · {time}',
  reminderHint: 'Dapatkan notifikasi sebelum setiap event dan rutinitas dimulai.',
  notificationsBlocked: 'Notifikasi untuk Blockstar sedang dimatikan.',
  openSettings: 'Buka pengaturan',
  allowNotifications: 'Izinkan notifikasi',
  notificationsUnsupported: 'Pengingat hanya tersedia di iOS dan Android.',
};

const STRINGS: Record<Language, Record<StringKey, string>> = { en, id };

const WEEKDAYS: Record<Language, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  id: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
};

const MONTHS: Record<Language, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
};

/** "23 November 2026" */
export function formatLongDate(lang: Language, d: Date): string {
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}

const WEEKDAYS_SHORT: Record<Language, string[]> = {
  en: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  id: ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'],
};

const THEME_NAMES: Record<Language, Record<ThemeId, string>> = {
  en: {
    midnight: 'Midnight',
    ocean: 'Ocean',
    forest: 'Forest',
    sunset: 'Sunset',
    daylight: 'Daylight',
    blossom: 'Blossom',
  },
  id: {
    midnight: 'Tengah Malam',
    ocean: 'Samudra',
    forest: 'Hutan',
    sunset: 'Senja',
    daylight: 'Siang',
    blossom: 'Mekar',
  },
};

export function translate(lang: Language, key: StringKey): string {
  return STRINGS[lang][key];
}

export function weekdayName(lang: Language, day: number): string {
  return WEEKDAYS[lang][day];
}

export function weekdayShort(lang: Language, day: number): string {
  return WEEKDAYS_SHORT[lang][day];
}

export function themeName(lang: Language, theme: ThemeId): string {
  return THEME_NAMES[lang][theme];
}

/** 75 -> "1 hour 15 minutes" / "1 jam 15 menit" */
export function formatDuration(lang: Language, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${translate(lang, h === 1 ? 'hour' : 'hours')}`);
  if (m > 0) parts.push(`${m} ${translate(lang, m === 1 ? 'minute' : 'minutes')}`);
  return parts.join(' ');
}

const CATEGORY_NAMES: Record<Language, Partial<Record<IconName, string>>> = {
  en: {
    briefcase: 'Work',
    cart: 'Shopping',
    'silverware-fork-knife': 'Meals',
    'weather-night': 'Sleep',
    dumbbell: 'Workout',
    'book-open-variant': 'Study',
    laptop: 'Computer',
    coffee: 'Break',
    run: 'Running',
    car: 'Travel',
    phone: 'Calls',
    music: 'Music',
  },
  id: {
    briefcase: 'Kerja',
    cart: 'Belanja',
    'silverware-fork-knife': 'Makan',
    'weather-night': 'Tidur',
    dumbbell: 'Olahraga',
    'book-open-variant': 'Belajar',
    laptop: 'Komputer',
    coffee: 'Istirahat',
    run: 'Lari',
    car: 'Perjalanan',
    phone: 'Telepon',
    music: 'Musik',
  },
};

export function categoryName(lang: Language, icon: IconName): string {
  return CATEGORY_NAMES[lang][icon] ?? String(icon);
}
