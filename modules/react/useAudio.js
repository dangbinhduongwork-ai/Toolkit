import { useRef, useEffect } from 'react';
import { AudioManager } from '../audio-manager.js';

/**
 * useAudio - React Hook quản lý âm thanh tương tác:
 * - Tự động mở khóa Autoplay trên iOS Safari & Android khi chạm lần đầu.
 * - Phát âm thanh click/pop không độ trễ, biến đổi cao độ ngẫu nhiên.
 * - Quản lý nhạc nền lặp, fade-in/out, tự dừng khi ẩn tab.
 *
 * @param {object} [soundFiles] - Danh sách âm thanh { key: 'url.mp3' }
 * @returns {{ play: Function, playMusic: Function, stopMusic: Function, setMuted: Function, audioManager: AudioManager }}
 */
export function useAudio(soundFiles = {}) {
  const audioRef = useRef(null);

  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new AudioManager();
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Tự động mở khóa âm thanh khi người dùng chạm màn hình lần đầu
    const unlockHandler = () => audio.unlock();
    window.addEventListener('pointerdown', unlockHandler, { once: true });

    // Tải trước các file âm thanh đã khai báo
    Object.entries(soundFiles).forEach(([key, url]) => {
      audio.load(key, url);
    });

    return () => {
      window.removeEventListener('pointerdown', unlockHandler);
    };
  }, []);

  return {
    play: (key, opts) => audioRef.current?.play(key, opts),
    playMusic: (key, opts) => audioRef.current?.playMusic(key, opts),
    stopMusic: (opts) => audioRef.current?.stopMusic(opts),
    setMuted: (muted) => audioRef.current?.setMuted(muted),
    audioManager: audioRef.current,
  };
}

export default useAudio;
