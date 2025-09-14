const sdk = require("microsoft-cognitiveservices-speech-sdk");
const { Buffer } = require('buffer');
require('dotenv').config();

let synthesizer;
function getSynthesizer() {
    if (!synthesizer) {
        const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz16KBitRateMonoMp3; // Daha hızlı format
        speechConfig.speechSynthesisVoiceName = "tr-TR-EmelNeural";
        synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    }
    return synthesizer;
}

exports.synthesizeSpeech = async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ msg: 'Lütfen seslendirilecek metni girin.' });
    }

    const synthesizer = getSynthesizer();

    synthesizer.speakTextAsync(
        text,
        result => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                res.setHeader('Content-Type', 'audio/mpeg');
                res.send(Buffer.from(result.audioData));
            } else {
                console.error("Azure TTS Hatası: " + result.errorDetails);
                res.status(500).send('Ses oluşturulurken bir hata oluştu.');
            }
        },
        error => {
            console.error("Azure TTS Stream Hatası: " + error);
            res.status(500).send('Ses oluşturulurken bir stream hatası oluştu.');
        }
    );
};