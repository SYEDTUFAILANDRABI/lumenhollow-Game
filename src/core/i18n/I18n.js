// I18n.js - Clean Internationalization and Localization System
// All strings centralized in one file for easy translation into other languages.

export const TRANSLATIONS = {
  en: {
    // Studio & Titles
    studio_presents: "PRESENTS",
    game_title: "LUMEN HOLLOW",
    game_subtitle: "The Celestial Moon has shattered. Relight the sacred hollow.",
    press_any_key: "PRESS ANY KEY OR TAP TO BEGIN",
    press_key_hint: "Audio context will initialize on your input",
    hold_to_skip: "Hold any key or tap to skip",
    loading: "WARMING UP...",
    saved_toast: "Game Saved",

    // Boot Tips
    tips: [
      "Hold jump while in the air to activate the gentle Firefly Glide.",
      "Wall slide down sheer cliffs and jump away to scale vertical chasms.",
      "Hold [E] or Sovereign's Aura button to unleash a staggering radial blast.",
      "Defeated enemies drop soul essence to summon Underworld Allies.",
      "Tap [R] to awaken the Astral Monarch for cosmic slashes and dominance.",
      "Visit Shrines to heal Lumi and recharge the Celestial Lantern.",
      "Press [F2] at any time during gameplay to access the Live Tuning Panel.",
      "Use Dash in mid-air to cross dangerous spike traps and brambles."
    ],

    // Main Menu Items
    menu_continue: "Continue",
    menu_new_game: "New Game",
    menu_load_game: "Load Game",
    menu_level_select: "Level Select",
    menu_skills: "Skills & Loadout",
    menu_ledger: "Moon Ledger",
    menu_collection: "Collection & Bestiary",
    menu_achievements: "Achievements",
    menu_settings: "Settings",
    menu_credits: "Credits",
    menu_replay_intro: "Replay Cinematic",
    menu_quit: "Quit to Title",

    // Save Slots
    saves_title: "Save Slots",
    slot_empty: "Empty Slot",
    slot_level: "Level {level}: {name}",
    slot_shards: "Shards: {collected}/5",
    slot_playtime: "Playtime: {time}",
    slot_last_played: "Last Played: {date}",
    slot_load: "Load",
    slot_new: "Start",
    slot_copy: "Copy",
    slot_delete: "Delete",
    slot_confirm_delete: "Are you sure you want to delete Save Slot {slot}?",
    slot_confirm_overwrite: "Overwrite existing data in Save Slot {slot}?",

    // Pause Menu
    pause_title: "PAUSED",
    pause_resume: "Resume Game",
    pause_restart_checkpoint: "Restart from Checkpoint",
    pause_settings: "Settings",
    pause_controls: "Controls Reference",
    pause_return_menu: "Return to Main Menu",
    pause_confirm_quit: "Return to Main Menu? Any unsaved progress since last checkpoint will be lost.",

    // Level Results
    results_title: "STAGE COMPLETE",
    results_time: "Clear Time",
    results_shards: "Shards Recovered",
    results_enemies: "Enemies Defeated",
    results_combo: "Best Combo",
    results_rank: "Stage Rank",
    results_next: "Proceed to Next Area",

    // Settings Categories
    settings_title: "SETTINGS",
    tab_gameplay: "Gameplay",
    tab_video: "Video",
    tab_audio: "Audio",
    tab_controls: "Controls",
    tab_accessibility: "Accessibility",
    tab_language: "Language",
    tab_data: "Data",

    // Gameplay Settings
    difficulty_label: "Difficulty",
    difficulty_gentle: "Gentle",
    difficulty_normal: "Normal",
    difficulty_hard: "Hard",
    difficulty_nightmare: "Nightmare",
    aim_assist: "Aim Assist",
    tutorial_hints: "Tutorial Hints",
    auto_save: "Auto-save at Checkpoints",
    camera_smoothing: "Camera Smoothing",
    camera_lookahead: "Camera Look-ahead",
    screen_shake: "Screen Shake Intensity",
    hit_stop: "Hit-Stop Impact",
    damage_numbers: "Floating Damage Numbers",

    // Video Settings
    fullscreen: "Fullscreen",
    render_scale: "Render Scale",
    fps_cap: "Frame Rate Cap",
    show_fps: "Show FPS Counter",
    brightness: "Brightness",
    ui_scale: "UI Scale",
    quality_preset: "Quality Preset",
    preset_low: "Low",
    preset_medium: "Medium",
    preset_high: "High",
    preset_ultra: "Ultra",
    bloom_glow: "Glow & Bloom Effects",
    lighting_quality: "Dynamic Lighting",
    film_grain: "Atmospheric Film Grain",
    vignette: "Dark Vignette",
    chromatic_aberration: "Chromatic Aberration",
    particle_density: "Particle Density",
    parallax_layers: "Parallax Background Layers",

    // Audio Settings
    master_vol: "Master Volume",
    music_vol: "Music Volume",
    sfx_vol: "SFX Volume",
    ambience_vol: "Ambience Volume",
    ui_vol: "UI Volume",
    mute_all: "Mute All Audio",
    mute_on_blur: "Mute When Tab Inactive",
    mono_audio: "Mono Audio",
    test_audio: "Test Sound",

    // Controls
    controls_rebind_title: "Keyboard Rebinding",
    controls_rebind_hint: "Click an action and press any key to rebind. ESC to cancel.",
    controls_gamepad_title: "Gamepad Settings",
    controls_deadzone: "Stick Deadzone",
    controls_vibration: "Controller Vibration",
    controls_touch_title: "Touch Controls",
    controls_touch_size: "Touch Button Size",
    controls_touch_opacity: "Touch Opacity",
    controls_touch_lefty: "Left-Handed Layout",
    reset_controls: "Reset Controls to Default",

    // Accessibility
    colorblind_mode: "Colorblind Filter",
    colorblind_none: "None",
    colorblind_protanopia: "Protanopia (Red-weak)",
    colorblind_deuteranopia: "Deuteranopia (Green-weak)",
    colorblind_tritanopia: "Tritanopia (Blue-weak)",
    high_contrast: "High Contrast UI",
    large_text: "Enlarged Text",
    reduce_motion: "Reduce Motion",
    reduced_flashing: "Reduced Flashing (<3 Hz)",
    toggle_pulse: "Toggle Lantern Pulse (Instead of Hold)",
    toggle_aura: "Toggle Sovereign Aura (Instead of Hold)",
    combat_assist: "One-Button Combat Assist",
    threat_indicators: "Off-screen Threat Indicators",

    // Data Settings
    export_save: "Export Save (JSON)",
    import_save: "Import Save (JSON)",
    reset_settings: "Reset Settings to Default",
    reset_progress: "Reset All Game Progress",
    clear_all_data: "Clear All Data (Factory Reset)",
    confirm_reset_progress: "Reset all player progress? All save slots will be cleared.",
    confirm_clear_all: "Clear all data and settings? This cannot be undone.",

    // Dialog Buttons
    btn_close: "Close",
    btn_cancel: "Cancel",
    btn_confirm: "Confirm",
    btn_apply: "Apply",
    btn_back: "Back",

    // Actions
    action_move_left: "Move Left",
    action_move_right: "Move Right",
    action_look_up: "Look Up",
    action_crouch: "Crouch / Plunge",
    action_jump: "Jump / Double Jump / Glide",
    action_pulse: "Lantern Pulse",
    action_slash: "Lantern Slash",
    action_bolt: "Umbral Bolt",
    action_dash: "Shadow Dash",
    action_plunge: "Void Plunge",
    action_aura: "Sovereign's Aura",
    action_summon: "Summon Wheel",
    action_skill_1: "Skill Slot 1",
    action_skill_2: "Skill Slot 2",
    action_skill_3: "Skill Slot 3",
    action_astral: "Astral Monarch",
    action_extract: "Soul Extraction",
    action_rise: "Shadow Army Rise",
    action_exchange: "Shadow Exchange",
    action_reach: "Monarch's Reach",
    action_ledger: "Moon Ledger",
    action_pause: "Pause Menu",

    // Credits
    credits_title: "CREDITS",
    credits_role_dev: "Lead Development & Systems",
    credits_name_dev: "Senior Game Developer",
    credits_role_art: "Visual Design & Animation",
    credits_name_art: "Procedural Canvas & Pixel Artistry",
    credits_role_sound: "Music & Audio Architecture",
    credits_name_sound: "Web Audio Synthesizer Engine",
    credits_role_special: "Special Thanks",
    credits_name_special: "All Players who Relight the Hollow",
    credits_footer: "Thank you for playing Lumen Hollow."
  }
};

class I18nManager {
  constructor() {
    this.currentLang = 'en';
  }

  setLanguage(lang) {
    if (TRANSLATIONS[lang]) {
      this.currentLang = lang;
    }
  }

  getLanguage() {
    return this.currentLang;
  }

  t(key, params = {}) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    let text = dict[key] || TRANSLATIONS.en[key] || key;

    if (typeof text !== 'string') return text;

    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }
}

export const I18n = new I18nManager();
