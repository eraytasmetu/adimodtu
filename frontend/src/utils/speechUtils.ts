// Bu fonksiyon, ses motorunu "ısıtmak" ve anons yapmak için kullanılır.
export const speak = (text: string, onEndCallback?: () => void) => {
    // Önceki konuşmaları iptal et
    window.speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
  
    // Konuşma bittiğinde bir fonksiyon çalıştırmak istersek...
    if (onEndCallback) {
      utterance.onend = onEndCallback;
    }
  
    // Chrome için hile: Seslerin yüklenmesini bekleyip sonra konuş
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Sesler zaten yüklüyse hemen konuş
      window.speechSynthesis.speak(utterance);
    } else {
      // Sesler henüz yüklenmediyse, yüklendiğinde konuşmayı tetikle
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