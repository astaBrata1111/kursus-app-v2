export type LanguageCode = "id" | "en" | "zh";

type Dictionary = Record<string, string>;

const id: Dictionary = {
    // Sidebar Roles
    'role_owner': 'Owner',
    'role_admin': 'Administrator',
    'role_teacher': 'Pengajar',
    'role_student': 'Murid',
    'role_parent': 'Orang Tua',

    // Sidebar Navigation
    'nav_dashboard_eksekutif': 'Dashboard Eksekutif',
    'nav_dashboard': 'Dashboard',
    'nav_murid': 'Data Murid',
    'nav_jadwal': 'Jadwal',
    'nav_jadwal_mengajar': 'Jadwal Mengajar',
    'nav_jadwal_kelas': 'Jadwal Kelas',
    'nav_jadwal_anak': 'Jadwal Anak',
    'nav_pengajar': 'Pengajar',
    'nav_ruangan': 'Ruangan',
    'nav_pembayaran': 'Pembayaran',
    'nav_tagihan': 'Tagihan',
    'nav_absensi': 'Absensi',
    'nav_absensi_kelas': 'Absensi Kelas',
    'nav_absensi_saya': 'Absensi Saya',
    'nav_absensi_anak': 'Absensi Anak',
    'nav_paket': 'Paket Kursus',
    'nav_trials': 'Trial Funnel',
    'nav_laporan': 'Laporan',
    'nav_laporan_belajar': 'Laporan Belajar',
    'nav_notifikasi': 'Notifikasi WA',
    'nav_checklist': 'Checklist Harian',
    'nav_settings': 'Pengaturan',
    'nav_nilai': 'Nilai & Catatan',
    'nav_logout': 'Keluar',

    // Settings Page
    'settings_title': 'Pengaturan Sistem',
    'settings_desc': 'Kelola preferensi, tampilan, dan akses peran aplikasi.',
    'settings_save': 'Simpan Perubahan',
    'settings_saving': 'Menyimpan...',
    'settings_success': 'Pengaturan berhasil disimpan!',
    'settings_error': 'Terjadi kesalahan saat menyimpan pengaturan.',
    'tab_general': 'Umum',
    'tab_appearance': 'Tampilan & Tema',
    'tab_roles': 'Hak Akses Peran',

    // General Tab
    'app_name_label': 'Nama Aplikasi',
    'app_name_desc': 'Akan ditampilkan di sidebar dan judul tab browser.',
    'lang_label': 'Bahasa Utama',
    'lang_id': 'Bahasa Indonesia',
    'lang_en': 'English',
    'lang_zh': '中文 (Mandarin)',
    'trial_expiry_label': 'Batas Waktu Kedaluwarsa Trial (Hari)',
    'trial_expiry_desc': 'Jumlah hari maksimum untuk menindaklanjuti calon murid trial.',

    // Appearance Tab
    'logo_label': 'Logo Institusi',
    'logo_uploading': 'Mengunggah...',
    'logo_choose': 'Pilih Gambar',
    'logo_remove': 'Hapus',
    'logo_desc': 'Format: JPG, PNG, atau SVG. Rasio 1:1 disarankan.',
    'theme_label': 'Tema Warna',
    'theme_classic_title': 'Classic Amber',
    'theme_classic_desc': 'Skema warna hangat yang ceria.',
    'theme_geo_title': 'GEO Elegance',
    'theme_geo_desc': 'Desain profesional dengan palet warna tenang (Slate Blue & Sage).',

    // Roles Tab
    'roles_desc': 'Atur modul apa saja yang dapat diakses oleh masing-masing peran di sidebar. (Peran Owner memiliki akses penuh ke semua modul secara permanen).',
    'roles_module': 'Modul',

    // Dashboard & Tables
    'welcome_message': 'Selamat Datang, {name}!',
    'total_classes': 'Total Kelas',
    'students_present_total': 'Murid Hadir (Total)',
    'classes_this_week': 'Kelas Minggu Ini',
    'classes_today': 'Kelas Hari Ini',
    'no_classes_today': 'Tidak ada kelas hari ini',
    'room_not_assigned': 'Ruangan belum ditentukan',
    'all_teaching_schedules': 'Semua Jadwal Mengajar',
    'col_class': 'Kelas',
    'col_day': 'Hari',
    'col_time': 'Jam',
    'col_room': 'Ruangan',
    'col_type': 'Jenis',
    'badge_general': 'General',

    // Common
    'loading_settings': 'Memuat Pengaturan...',
};

const en: Dictionary = {
    // Sidebar Roles
    'role_owner': 'Owner',
    'role_admin': 'Administrator',
    'role_teacher': 'Teacher',
    'role_student': 'Student',
    'role_parent': 'Parent',

    // Sidebar Navigation
    'nav_dashboard_eksekutif': 'Executive Dashboard',
    'nav_dashboard': 'Dashboard',
    'nav_murid': 'Students',
    'nav_jadwal': 'Schedules',
    'nav_jadwal_mengajar': 'Teaching Schedule',
    'nav_jadwal_kelas': 'Class Schedule',
    'nav_jadwal_anak': 'Child Schedule',
    'nav_pengajar': 'Teachers',
    'nav_ruangan': 'Rooms',
    'nav_pembayaran': 'Payments',
    'nav_tagihan': 'Billing',
    'nav_absensi': 'Attendance',
    'nav_absensi_kelas': 'Class Attendance',
    'nav_absensi_saya': 'My Attendance',
    'nav_absensi_anak': 'Child Attendance',
    'nav_paket': 'Course Packages',
    'nav_trials': 'Trial Funnel',
    'nav_laporan': 'Reports',
    'nav_laporan_belajar': 'Learning Reports',
    'nav_notifikasi': 'WA Notifications',
    'nav_checklist': 'Daily Checklist',
    'nav_settings': 'Settings',
    'nav_nilai': 'Grades & Notes',
    'nav_logout': 'Logout',

    // Settings Page
    'settings_title': 'System Settings',
    'settings_desc': 'Manage application preferences, appearance, and role access.',
    'settings_save': 'Save Changes',
    'settings_saving': 'Saving...',
    'settings_success': 'Settings successfully saved!',
    'settings_error': 'An error occurred while saving settings.',
    'tab_general': 'General',
    'tab_appearance': 'Appearance & Themes',
    'tab_roles': 'Role Permissions',

    // General Tab
    'app_name_label': 'Application Name',
    'app_name_desc': 'Will be displayed in the sidebar and browser tab title.',
    'lang_label': 'Primary Language',
    'lang_id': 'Bahasa Indonesia',
    'lang_en': 'English',
    'lang_zh': '中文 (Mandarin)',
    'trial_expiry_label': 'Trial Expiry Limit (Days)',
    'trial_expiry_desc': 'Maximum number of days to follow up on prospective trial students.',

    // Appearance Tab
    'logo_label': 'Institution Logo',
    'logo_uploading': 'Uploading...',
    'logo_choose': 'Choose Image',
    'logo_remove': 'Remove',
    'logo_desc': 'Format: JPG, PNG, or SVG. 1:1 ratio represents best results.',
    'theme_label': 'Color Theme',
    'theme_classic_title': 'Classic Amber',
    'theme_classic_desc': 'A warm and cheerful color scheme.',
    'theme_geo_title': 'GEO Elegance',
    'theme_geo_desc': 'Professional design with a calm color palette (Slate Blue & Sage).',

    // Roles Tab
    'roles_desc': 'Configure which modules can be accessed by each role in the sidebar. (The Owner role has full access to all modules permanently).',
    'roles_module': 'Module',

    // Dashboard & Tables
    'welcome_message': 'Welcome, {name}!',
    'total_classes': 'Total Classes',
    'students_present_total': 'Students Present (Total)',
    'classes_this_week': 'Classes This Week',
    'classes_today': 'Classes Today',
    'no_classes_today': 'No classes today',
    'room_not_assigned': 'Room not assigned',
    'all_teaching_schedules': 'All Teaching Schedules',
    'col_class': 'Class',
    'col_day': 'Day',
    'col_time': 'Time',
    'col_room': 'Room',
    'col_type': 'Type',
    'badge_general': 'General',

    // Common
    'loading_settings': 'Loading Settings...',
};

const zh: Dictionary = {
    // Sidebar Roles
    'role_owner': '拥有者',
    'role_admin': '管理员',
    'role_teacher': '教师',
    'role_student': '学生',
    'role_parent': '家长',

    // Sidebar Navigation
    'nav_dashboard_eksekutif': '高管仪表板',
    'nav_dashboard': '仪表板',
    'nav_murid': '学生数据',
    'nav_jadwal': '时间表',
    'nav_jadwal_mengajar': '教学时间表',
    'nav_jadwal_kelas': '课程表',
    'nav_jadwal_anak': '孩子的时间表',
    'nav_pengajar': '教师',
    'nav_ruangan': '房间',
    'nav_pembayaran': '支付',
    'nav_tagihan': '账单',
    'nav_absensi': '考勤',
    'nav_absensi_kelas': '班级考勤',
    'nav_absensi_saya': '我的考勤',
    'nav_absensi_anak': '孩子考勤',
    'nav_paket': '课程套餐',
    'nav_trials': '试听漏斗',
    'nav_laporan': '报告',
    'nav_laporan_belajar': '学习报告',
    'nav_notifikasi': 'WhatsApp 通知',
    'nav_checklist': '每日清单',
    'nav_settings': '设置',
    'nav_nilai': '成绩和笔记',
    'nav_logout': '退出',

    // Settings Page
    'settings_title': '系统设置',
    'settings_desc': '管理应用程序首选项、外观和角色访问权限。',
    'settings_save': '保存更改',
    'settings_saving': '正在保存...',
    'settings_success': '设置保存成功！',
    'settings_error': '保存设置时发生错误。',
    'tab_general': '常规',
    'tab_appearance': '外观与主题',
    'tab_roles': '角色权限',

    // General Tab
    'app_name_label': '应用程序名称',
    'app_name_desc': '将显示在侧边栏和浏览器标签标题中。',
    'lang_label': '主要语言',
    'lang_id': 'Bahasa Indonesia',
    'lang_en': 'English',
    'lang_zh': '中文 (Mandarin)',
    'trial_expiry_label': '试听到期时间（天）',
    'trial_expiry_desc': '跟进潜在试听学生的最大天数。',

    // Appearance Tab
    'logo_label': '机构标识',
    'logo_uploading': '上传中...',
    'logo_choose': '选择图像',
    'logo_remove': '移除',
    'logo_desc': '格式：JPG，PNG 或 SVG。 建议 1:1 比例。',
    'theme_label': '颜色主题',
    'theme_classic_title': '经典琥珀 (Classic Amber)',
    'theme_classic_desc': '温暖欢快的配色方案。',
    'theme_geo_title': 'GEO 优雅 (GEO Elegance)',
    'theme_geo_desc': '具有平静调色板（板岩蓝和鼠尾草绿）的专业设计。',

    // Roles Tab
    'roles_desc': '配置侧边栏中每个角色可以访问哪些模块。（拥有者角色永久拥有访问所有模块的完全权限）。',
    'roles_module': '模块',

    // Dashboard & Tables
    'welcome_message': '欢迎, {name}!',
    'total_classes': '总课程',
    'students_present_total': '出席学生 (总计)',
    'classes_this_week': '本周课程',
    'classes_today': '今日课程',
    'no_classes_today': '今天没有课',
    'room_not_assigned': '未分配房间',
    'all_teaching_schedules': '所有教学时间表',
    'col_class': '课程',
    'col_day': '天',
    'col_time': '时间',
    'col_room': '房间',
    'col_type': '类型',
    'badge_general': '普通',

    // Common
    'loading_settings': '正在加载设置...',
};

export const dictionaries: Record<string, Dictionary> = { id, en, zh };

export function getTranslation(lang: LanguageCode, key: string): string {
    const dict = dictionaries[lang] || dictionaries.id;
    return dict[key] || key;
}
