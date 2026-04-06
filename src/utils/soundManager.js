/**
 * Sound Manager for Private Session Classroom
 *
 * - Web Audio API for UI clicks (instant, no files needed)
 * - Bundled mp3s for join/leave/screenshare (richer audio)
 * - Per-user mute toggle (persisted in localStorage)
 * - Volume control
 *
 * Sounds:
 *   LOCAL ONLY (only the user who clicks hears them):
 *     - buttonClick: soft click for mic/cam/screen/hand/chat toggles
 *     - messageSend: subtle whoosh when sending a chat message
 *     - messageReceive: gentle ping when receiving a chat message
 *
 *   AUDIBLE TO ALL (event-based, each user's client plays them independently):
 *     - participantJoin: chime when someone joins the room
 *     - participantLeave: lower tone when someone leaves
 *     - screenShareStart: notification sound when screen share begins
 *     - screenShareStop: soft sound when screen share ends
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.muted = false;
    this.volume = 0.5; // 0.0 to 1.0

    // Load saved preferences
    try {
      const saved = localStorage.getItem("shiksha_sound_prefs");
      if (saved) {
        const prefs = JSON.parse(saved);
        this.muted = prefs.muted ?? false;
        this.volume = prefs.volume ?? 0.5;
      }
    } catch {}
  }

  _getContext() {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  _savePrefs() {
    try {
      localStorage.setItem("shiksha_sound_prefs", JSON.stringify({
        muted: this.muted,
        volume: this.volume,
      }));
    } catch {}
  }

  setMuted(muted) {
    this.muted = muted;
    this._savePrefs();
  }

  toggleMute() {
    this.muted = !this.muted;
    this._savePrefs();
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this._savePrefs();
  }

  isMuted() {
    return this.muted;
  }

  getVolume() {
    return this.volume;
  }

  // ── Web Audio API synthesized sounds ──

  _playTone(frequency, duration, type = "sine", gainValue = null) {
    if (this.muted) return;
    try {
      const ctx = this._getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      const vol = (gainValue ?? this.volume) * 0.3; // Keep synthetic sounds subtle
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  _playChord(frequencies, duration, type = "sine") {
    if (this.muted) return;
    frequencies.forEach((f, i) => {
      setTimeout(() => this._playTone(f, duration, type), i * 60);
    });
  }

  // ── Sound Effects ──

  /** Soft click for button presses (LOCAL ONLY) */
  buttonClick() {
    this._playTone(800, 0.08, "sine");
  }

  /** Subtle whoosh for sending a message (LOCAL ONLY) */
  messageSend() {
    if (this.muted) return;
    try {
      const ctx = this._getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

      const vol = this.volume * 0.2;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  /** Gentle ping for receiving a message (LOCAL ONLY) */
  messageReceive() {
    this._playChord([880, 1100], 0.15, "sine");
  }

  /** Rising chime when someone joins (PLAYS FOR ALL) */
  participantJoin() {
    this._playChord([523, 659, 784], 0.25, "sine");
  }

  /** Falling tone when someone leaves (PLAYS FOR ALL) */
  participantLeave() {
    if (this.muted) return;
    try {
      const ctx = this._getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);

      const vol = this.volume * 0.25;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  /** Screen share started notification (PLAYS FOR ALL) */
  screenShareStart() {
    this._playChord([440, 554, 659, 880], 0.2, "triangle");
  }

  /** Screen share stopped notification (PLAYS FOR ALL) */
  screenShareStop() {
    if (this.muted) return;
    try {
      const ctx = this._getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);

      const vol = this.volume * 0.2;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  /** Raise hand notification */
  handRaise() {
    this._playChord([700, 900], 0.12, "sine");
  }

  /** Toast / notification sound */
  notification() {
    this._playTone(1000, 0.1, "sine");
  }
}

// Singleton instance
const soundManager = new SoundManager();
export default soundManager;
