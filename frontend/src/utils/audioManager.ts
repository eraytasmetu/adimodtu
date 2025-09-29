class AudioManager {
  private static instance: AudioManager;
  private audioEl: HTMLAudioElement | null = null;
  private _currentSrc: string | null = null;

  // Tarayıcı engeli için eklenen yeni özellikler
  private queuedAudio: { src: string, onEnded?: () => void } | null = null;
  private hasInteracted: boolean = false;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // Kullanıcı etkileşimini dinlemek için constructor'a eklenen kısım
    this.handleInteraction = this.handleInteraction.bind(this);
    document.addEventListener('click', this.handleInteraction, { once: true });
    document.addEventListener('keydown', this.handleInteraction, { once: true });
    document.addEventListener('touchstart', this.handleInteraction, { once: true });
  }

  // Kullanıcı etkileşime girdiğinde bir kerelik çalışan fonksiyon
  private handleInteraction(): void {
    if (this.hasInteracted) return;
    this.hasInteracted = true;

    // Sesin çalınabilmesi için AudioContext'i başlat
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      } catch (e) {
        console.error("AudioContext oluşturulamadı.", e);
      }
    }

    // Eğer engellendiği için kuyruğa alınmış bir ses varsa, şimdi çal
    if (this.queuedAudio) {
      console.log("Kullanıcı etkileşimi algılandı. Kuyruktaki ses çalınıyor.");
      const { src, onEnded } = this.queuedAudio;
      this.queuedAudio = null; // Kuyruğu temizle
      this.play(src, onEnded); // Play metodunu tekrar çağır
    }
  }

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
    this.stop();

    if (!this.audioEl) {
      this.audioEl = new Audio();
    }

    const audio = this.audioEl;
    this._currentSrc = src;
    audio.src = src;
    audio.currentTime = 0;

    // Önceki onended olayını temizleyip yenisini ata
    audio.onended = null;
    const endHandler = () => {
        this._currentSrc = null;
        if(onEnded) onEnded();
    };
    audio.onended = endHandler;

    try {
      await audio.play();
      console.log(`Ses çalmaya başladı: ${src}`);
    } catch (e: any) {
      console.warn(`Ses çalınamadı (${src}):`, e.name);
      this._currentSrc = null;

      // Hata, tarayıcının otomatik oynatma engeli ise ve kullanıcı henüz etkileşime girmediyse sesi kuyruğa al
      if (e.name === 'NotAllowedError' && !this.hasInteracted) {
        console.log(`Tarayıcı politikası nedeniyle ses kuyruğa alındı: ${src}`);
        this.queuedAudio = { src, onEnded };
      }
    }
  }

  stop(): void {
    // Kuyruktaki sesi de temizle
    this.queuedAudio = null; 
    
    if (this.audioEl) {
      try {
        if (!this.audioEl.paused) {
          this.audioEl.pause();
        }
        this.audioEl.currentTime = 0;
      } catch {}
    }
    this._currentSrc = null;
  }
}

export default AudioManager.getInstance();