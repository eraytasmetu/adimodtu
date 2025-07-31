// Bu fonksiyon, ses motorunu "ısıtmak" ve anons yapmak için kullanılır.
export const speak = (text: string, onEndCallback?: () => void) => {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';

  // Ses seçiminde daha doğal olanı bul
  const voices = window.speechSynthesis.getVoices();
  const turkishVoice = voices.find(v => 
    v.lang === 'tr-TR' && (v.name.includes('Google') || v.name.includes('Tolga') || v.name.includes('Aslı'))
  );
  if (turkishVoice) {
    utterance.voice = turkishVoice;
  }

  // Daha doğal konuşma hızı ve ton
  utterance.rate = 1;   // Hız
  utterance.pitch = 1.1;  // Ton
  utterance.volume = 1;   // Ses seviyesi


  if (onEndCallback) utterance.onend = onEndCallback;

  if (voices.length > 0) {
    window.speechSynthesis.speak(utterance);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.speak(utterance);
    };
  }
};
  
  // Bu fonksiyon, kullanıcı bir butona tıkladıktan sonra gibi
  // garantili durumlarda kullanılabilir.
  export const simpleSpeak = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      window.speechSynthesis.speak(utterance);
  }