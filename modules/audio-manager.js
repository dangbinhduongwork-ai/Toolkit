/**
 * AudioManager - Module âm thanh Web Audio API chuyên dụng cho Web App & Game.
 * - Giải quyết hoàn toàn lỗi chặn Autoplay trên iOS Safari & Android Chrome.
 * - Phát âm thanh không độ trễ, biến đổi cao độ ngẫu nhiên (chống nhàm chán khi bấm nhiều lần).
 * - Nhạc nền lặp vô tận (seamless loop), fade in/out mượt mà.
 * - Tự động tạm dừng khi ẩn tab (document.hidden) để tiết kiệm pin.
 */

export class AudioManager {
  constructor({ masterVolume = 1.0, sfxVolume = 1.0, musicVolume = 0.5 } = {}) {
    this.buffers = new Map();
    this.lastPlayTime = new Map();
    this.musicSource = null;
    this.isUnlocked = false;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      console.warn('[AudioManager] Web Audio API không được hỗ trợ.');
      return;
    }
    this.ctx = new AudioCtx();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = masterVolume;
    this.masterGain.connect(this.ctx.destination);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // Music bus
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = musicVolume;
    this.musicGain.connect(this.masterGain);

    // Tự động tạm dừng khi chuyển tab
    document.addEventListener('visibilitychange', () => {
      if (!this.isUnlocked) return;
      if (document.hidden) {
        this.ctx.suspend();
      } else {
        this.ctx.resume();
      }
    });
  }

  /**
   * Mở khóa AudioContext trên thiết bị di động.
   * Cần gọi hàm này trong các sự kiện: pointerdown, touchend, hoặc click đầu tiên.
   */
  unlock() {
    if (!this.ctx || this.isUnlocked) return;

    if (this.ctx.state === 'running') {
      this.isUnlocked = true;
      return;
    }

    try {
      // Phát 1 frame buffer câm để iOS Safari kích hoạt AudioContext
      const silentBuffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const source = this.ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch {
      // bỏ qua lỗi
    }

    this.ctx.resume().then(() => {
      this.isUnlocked = true;
    }).catch(() => {});
  }

  /**
   * Tải trước âm thanh và giải mã vào bộ nhớ
   */
  async load(key, url) {
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(key, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn(`[AudioManager] Không tải được âm thanh '${key}' từ ${url}:`, err);
    }
  }

  /**
   * Phát hiệu ứng âm thanh (SFX)
   * @param {string} key - Mã định danh âm thanh đã tải
   * @param {object} options
   * @param {number} options.volume - Âm lượng (0 đến 1)
   * @param {number} options.pitchVariance - Mức độ thay đổi cao độ (mặc định 0.08 = ±8%)
   * @param {number} options.minGap - Khoảng cách tối thiểu giữa 2 lần phát (chống rè khi spam click)
   */
  play(key, { volume = 1.0, pitchVariance = 0.08, minGap = 0.05 } = {}) {
    const buffer = this.buffers.get(key);
    if (!this.ctx || !buffer) return false;

    // Throttle để tránh chồng chéo tiếng quá dày
    const now = performance.now() / 1000;
    const last = this.lastPlayTime.get(key) || -9999;
    if (minGap && now - last < minGap) return false;
    this.lastPlayTime.set(key, now);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Ngẫu nhiên hóa cao độ nhẹ để âm thanh sinh động, tự nhiên
    if (pitchVariance > 0) {
      source.playbackRate.value = 1.0 + (Math.random() * 2 - 1) * pitchVariance;
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.sfxGain);
    source.start(0);
    return true;
  }

  /**
   * Bật nhạc nền lặp vô tận (Looping background music)
   */
  playMusic(key, { fadeInSeconds = 1.5, volume = 0.5 } = {}) {
    const buffer = this.buffers.get(key);
    if (!this.ctx || !buffer || this.musicSource) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);

    const now = this.ctx.currentTime;
    this.musicGain.gain.setValueAtTime(0, now);
    this.musicGain.gain.linearRampToValueAtTime(volume, now + fadeInSeconds);

    source.start(0);
    this.musicSource = source;
  }

  /**
   * Dừng nhạc nền
   */
  stopMusic({ fadeOutSeconds = 1.0 } = {}) {
    if (!this.musicSource || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0, now + fadeOutSeconds);
    setTimeout(() => {
      if (this.musicSource) {
        this.musicSource.stop();
        this.musicSource.disconnect();
        this.musicSource = null;
      }
    }, fadeOutSeconds * 1000);
  }

  /**
   * Bật / tắt tiếng toàn bộ ứng dụng
   */
  setMuted(muted) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, now, 0.05);
  }
}
