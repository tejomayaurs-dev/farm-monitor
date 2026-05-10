/**
 * i18n translations scaffold.
 * Supports English (en) and Kannada (kn).
 * Add new keys as features grow.
 */

export type Locale = "en" | "kn";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Auth
    "auth.title": "Farm Monitor",
    "auth.subtitle": "Organic Farm Management",
    "auth.phone_label": "Mobile Number",
    "auth.phone_placeholder": "+91 9876543210",
    "auth.send_otp": "Send OTP",
    "auth.otp_label": "Enter OTP",
    "auth.verify_otp": "Verify & Login",
    "auth.back": "Back",
    "auth.demo_login": "Demo Login",

    // Nav
    "nav.home": "Home",
    "nav.insights": "Insights",
    "nav.admin": "Admin",
    "nav.sync": "Sync",

    // Dashboard
    "dashboard.select_partition": "Select Partition",
    "dashboard.select_line": "Select Line",
    "dashboard.plants": "Plants",

    // Plant status
    "status.good": "Good",
    "status.medium": "Medium",
    "status.no_growth": "No Growth",
    "status.replace": "Replace",
    "status.pest_attack": "Pest Attack",

    // Activities
    "activity.input": "Input",
    "activity.pruning": "Pruning",
    "activity.harvest": "Harvest",
    "activity.water_check": "Water Check",

    // Sync
    "sync.synced": "All Synced",
    "sync.pending": "Pending",
    "sync.failed": "Sync Failed",
    "sync.sync_now": "Sync Now",
    "sync.offline": "Offline",
    "sync.syncing": "Syncing…",

    // Admin
    "admin.partitions": "Partitions",
    "admin.lines": "Lines",
    "admin.plants": "Add Plants",
    "admin.plant_master": "Plant Names",
    "admin.reports": "Reports",
    "admin.add": "Add",
    "admin.save": "Save",
    "admin.delete": "Delete",
    "admin.cancel": "Cancel",

    // Actions
    "action.update_status": "Update Status",
    "action.add_activity": "Add Activity",
    "action.done": "Done",
    "action.restore_default": "Restore to Default",
    "action.restore_confirm": "This will clear all local data and reload from the server. Are you sure?",
    "action.restoring": "Restoring data...",

    // Misc
    "misc.offline_banner": "You're offline — changes saved locally",
    "misc.loading": "Loading…",
    "misc.no_plants": "No plants in this line",
    "misc.tap_to_log": "Tap to log",
  },

  kn: {
    // Auth
    "auth.title": "ಫಾರ್ಮ್ ಮಾನಿಟರ್",
    "auth.subtitle": "ಸಾವಯವ ಕೃಷಿ ನಿರ್ವಹಣೆ",
    "auth.phone_label": "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    "auth.phone_placeholder": "+91 9876543210",
    "auth.send_otp": "OTP ಕಳುಹಿಸಿ",
    "auth.otp_label": "OTP ನಮೂದಿಸಿ",
    "auth.verify_otp": "ಪರಿಶೀಲಿಸಿ & ಲಾಗಿನ್",
    "auth.back": "ಹಿಂದೆ",
    "auth.demo_login": "ಡೆಮೋ ಲಾಗಿನ್",

    // Nav
    "nav.home": "ಮನೆ",
    "nav.insights": "ವಿಶ್ಲೇಷಣೆ",
    "nav.admin": "ನಿರ್ವಾಹಕ",
    "nav.sync": "ಸಿಂಕ್",

    // Dashboard
    "dashboard.select_partition": "ವಿಭಾಗ ಆಯ್ಕೆ",
    "dashboard.select_line": "ಸಾಲು ಆಯ್ಕೆ",
    "dashboard.plants": "ಸಸ್ಯಗಳು",

    // Plant status
    "status.good": "ಉತ್ತಮ",
    "status.medium": "ಮಧ್ಯಮ",
    "status.no_growth": "ಬೆಳವಣಿಗೆ ಇಲ್ಲ",
    "status.replace": "ಬದಲಾಯಿಸಿ",
    "status.pest_attack": "ಕೀಟ ದಾಳಿ",

    // Activities
    "activity.input": "ಒಳಸುರಿ",
    "activity.pruning": "ಕತ್ತರಿಸುವಿಕೆ",
    "activity.harvest": "ಕೊಯ್ಲು",
    "activity.water_check": "ನೀರು ತಪಾಸಣೆ",

    // Sync
    "sync.synced": "ಎಲ್ಲ ಸಿಂಕ್ ಆಗಿದೆ",
    "sync.pending": "ಬಾಕಿ ಇದೆ",
    "sync.failed": "ಸಿಂಕ್ ವಿಫಲ",
    "sync.sync_now": "ಈಗ ಸಿಂಕ್ ಮಾಡಿ",
    "sync.offline": "ಆಫ್‌ಲೈನ್",
    "sync.syncing": "ಸಿಂಕ್ ಆಗುತ್ತಿದೆ…",

    // Admin
    "admin.partitions": "ವಿಭಾಗಗಳು",
    "admin.lines": "ಸಾಲುಗಳು",
    "admin.plants": "ಸಸ್ಯಗಳನ್ನು ಸೇರಿಸಿ",
    "admin.plant_master": "ಸಸ್ಯ ಹೆಸರುಗಳು",
    "admin.reports": "ವರದಿಗಳು",
    "admin.add": "ಸೇರಿಸಿ",
    "admin.save": "ಉಳಿಸಿ",
    "admin.delete": "ಅಳಿಸಿ",
    "admin.cancel": "ರದ್ದು",

    // Actions
    "action.update_status": "ಸ್ಥಿತಿ ಅಪ್ಡೇಟ್",
    "action.add_activity": "ಚಟುವಟಿಕೆ ಸೇರಿಸಿ",
    "action.done": "ಮುಗಿಯಿತು",
    "action.restore_default": "ಪೂರ್ವಸ್ಥಿತಿಗೆ ತರಿಸಿ",
    "action.restore_confirm": "ಇದು ಎಲ್ಲಾ ಸ್ಥಳೀಯ ಡೇಟಾವನ್ನು ಅಳಿಸುತ್ತದೆ ಮತ್ತು ಸರ್ವರ್‌ನಿಂದ ಮರುಲೋಡ್ ಮಾಡುತ್ತದೆ. ನೀವು ಖಚಿತವೇ?",
    "action.restoring": "ಡೇಟಾವನ್ನು ಮರುಸ್ಥಾಪಿಸಲಾಗುತ್ತಿದೆ...",

    // Misc
    "misc.offline_banner": "ನೀವು ಆಫ್‌ಲೈನ್ — ಬದಲಾವಣೆಗಳು ಸ್ಥಳೀಯವಾಗಿ ಉಳಿಸಲಾಗಿದೆ",
    "misc.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    "misc.no_plants": "ಈ ಸಾಲಿನಲ್ಲಿ ಸಸ್ಯಗಳಿಲ್ಲ",
    "misc.tap_to_log": "ದಾಖಲಿಸಲು ತಟ್ಟಿ",
  },
};

export function t(key: string, locale: Locale = "en"): string {
  return translations[locale][key] ?? translations["en"][key] ?? key;
}

export default translations;
