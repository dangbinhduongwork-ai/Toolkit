---
name: web-audio-asmr
description: Zero-latency interactive Web Audio API patterns, sound effects, background music crossfading, pitch variations, and mobile autoplay unlocking. Use when adding sound effects, tactile feedback, ASMR, ambient loops, or audio toggles to web applications.
---

# Web Audio API for Web Applications & ASMR

This skill provides robust patterns for implementing interactive sound design in modern web apps, overcoming mobile browser restrictions (iOS Safari / Android Chrome).

## 1. Browser Autoplay & Unlock Policy

Mobile browsers start `AudioContext` in `'suspended'` state. You must unlock it on the first user interaction:
- Listen to `pointerdown`, `touchend`, and `click`.
- Play a 1-sample silent buffer synchronously inside the event callback.
- Resume the context: `audioContext.resume()`.

```javascript
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.isUnlocked = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  unlock() {
    this.init();
    if (!this.ctx || this.isUnlocked) return;
    
    // Play silent buffer for iOS Safari compatibility
    const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start(0);

    this.ctx.resume().then(() => {
      this.isUnlocked = true;
    });
  }

  async loadSound(id, url) {
    this.init();
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.buffers.set(id, audioBuffer);
  }

  // Play sound with pitch variation (avoids mechanical fatigue)
  play(id, { volume = 1, pitchVariance = 0.1, minGap = 0.05 } = {}) {
    const buffer = this.buffers.get(id);
    if (!this.ctx || !buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    // Vary pitch slightly (e.g. 0.95 to 1.05)
    source.playbackRate.value = 1.0 + (Math.random() * 2 - 1) * pitchVariance;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(0);
  }
}
```

## 2. Best Practices for Micro-Interactions
- **Pitch Jitter**: Always apply $\pm 5\%\text{ - }10\%$ random playback rate to repeating sound effects (clicks, pops, taps).
- **Throttling (`minGap`)**: Never let sounds overlap too fast if a user spam-clicks; enforce a minimum interval (e.g. 50ms).
- **Visibility Pause**: Listen to `visibilitychange` and suspend the audio context when the user switches tabs.
