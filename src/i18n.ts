import type { ThemeId } from './themes';

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
  back: 'Back',
  menu: 'Menu',
  remaining: '{time} left',
  menuButton: 'Menu button',
  menuButtonHint: 'Where the pull-out tab sits on the edge of the screen.',
  'right-top': 'Right · top',
  'right-bottom': 'Right · bottom',
  'right-middle': 'Right · middle',
  'left-top': 'Left · top',
  'left-bottom': 'Left · bottom',
  'left-middle': 'Left · middle',
  menuLabels: 'Show text on menu buttons',
  tabRoutines: 'Routines',
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
  morning: 'Morning',
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
  yourRoutines: 'Your routines',
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
  onboardWidgetsTitle: 'Your day at a glance',
  onboardWidgetsText: 'Add Blockstar widgets to your home screen to see what’s next without opening the app.',
  nextStep: 'Next',
  done: 'Done',
  chooseIcon: 'Choose icon',
  moveTo: 'Move to {time}',
  reminders: 'Reminders',
  reminderOff: 'Off',
  remindBefore: 'Remind me before',
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
  back: 'Kembali',
  menu: 'Menu',
  remaining: 'sisa {time}',
  menuButton: 'Tombol menu',
  menuButtonHint: 'Posisi tab tarik di tepi layar.',
  'right-top': 'Kanan · atas',
  'right-bottom': 'Kanan · bawah',
  'right-middle': 'Kanan · tengah',
  'left-top': 'Kiri · atas',
  'left-bottom': 'Kiri · bawah',
  'left-middle': 'Kiri · tengah',
  menuLabels: 'Tampilkan teks pada tombol menu',
  tabRoutines: 'Rutinitas',
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
  morning: 'Pagi',
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
  yourRoutines: 'Rutinitas kamu',
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
  onboardWidgetsTitle: 'Harimu dalam sekilas',
  onboardWidgetsText: 'Tambahkan widget Blockstar di layar utama untuk melihat jadwal berikutnya tanpa membuka aplikasi.',
  nextStep: 'Lanjut',
  done: 'Selesai',
  chooseIcon: 'Pilih ikon',
  moveTo: 'Pindah ke {time}',
  reminders: 'Pengingat',
  reminderOff: 'Mati',
  remindBefore: 'Ingatkan sebelum',
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

