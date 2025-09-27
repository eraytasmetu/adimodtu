class AudioManager {
  private static instance: AudioManager;
  private audioEl: HTMLAudioElement | null = null;
  private _currentSrc: string | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  get currentSrc(): string | null {
    return this._currentSrc;
  }

  isPlaying(): boolean {
    return !!this.audioEl && !this.audioEl.paused;
  }

  async play(src: string, onEnded?: () => void): Promise<void> {
    // Stop any current audio
    this.stop();

    if (!this.audioEl) {
      this.audioEl = new Audio();
    }

    const audio = this.audioEl;
    this._currentSrc = src;
    audio.src = src;
    audio.currentTime = 0;

    // Optional ended handler
    if (onEnded) {
      audio.onended = () => {
        onEnded();
      };
    } else {
      audio.onended = null;
    }

    try {
      await audio.play();
    } catch (e) {
      // Autoplay might be blocked; surface as resolved without playing
      this._currentSrc = null;
    }
  }

  stop(): void {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
        this.audioEl.src = '';
      } catch {}
    }
    this._currentSrc = null;
  }
}

export default AudioManager.getInstance();


