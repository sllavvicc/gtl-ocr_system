/**
 * @description Document is ready
 */
document.addEventListener('DOMContentLoaded', function () {

  /** Init system language configuration */
  _initSystemLang('rom');

  /** Init speech engine */
  _getVoices().then(() => {
    synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const voice = _getVoicesByLang(systemLang, voices)[0];
    utterance = new SpeechSynthesisUtterance();
    utterance.voice = voice;
    utterance.text = '';
    utterance.pitch = 0.8;
    utterance.rate = 0.8;
    utterance.volume = 0.2;

    _configPageSetContent();
  });

  /** Init key press event listener for configuration language from keyboard */
  document.addEventListener('keypress', function (key) {
    switch (key.code) {
      case 'Digit1':
        setLanguage('rom');
        break;
      case 'Digit2':
        setLanguage('rus');
        break;
      case 'Digit3':
        setLanguage('eng');
        break;
      case 'Space':
        window.location.href = "ocr.html";
        break;
    }
  });
})

/**
 * @description System variables
 */
let systemLang = null;
let synth = null;
let utterance = new SpeechSynthesisUtterance();

/**
 * @description Set global system language
 * @param lang
 */
const setLanguage = (lang) => {
  localStorage.setItem('systemLang', lang);
  systemLang = lang;
  _configPageSetContent();
}

/**
 * @description Set config page content
 * @private
 */
const _configPageSetContent = () => {
  const buttonSelector = document.querySelector('.config-page .button__rounded');

  /** Find active language and remove class active */
  const activeElement = document.querySelector('.config-page button.languages--item.active');
  if (activeElement) {
    activeElement.classList.remove('active');
  }

  /** Init speechkit */
  const voices = synth.getVoices();
  utterance.voice = _getVoicesByLang(systemLang, voices)[0];

  /** Notification of selected language */
  switch (systemLang) {
    case 'rom':
      buttonSelector.textContent = 'Salvează setările';
      document.querySelector('.config-page button.languages--item#lang__rom').classList.add('active');
      _speechText('În calitate de limbaj de afișare ați ales limba Română. Pentru a modifica limba de afișare utilizați butoanele 1, 2 sau 3 de pe tastatură, după care apăsați button-ul space pentru salvare.');
      break;
    case 'rus':
      buttonSelector.textContent = 'Сохранить настройки';
      document.querySelector('.config-page button.languages--item#lang__rus').classList.add('active');
      _speechText('В качестве языка системы был выбран Русский язык. Для того что бы выбрать другой язык воспользуйтесь кнопками 1, 2 или 3 на клавиатуре, после чего нажмите пробел для сохранения.');
      break;
    case 'eng':
      buttonSelector.textContent = 'Save the settings';
      document.querySelector('.config-page button.languages--item#lang__eng').classList.add('active');
      _speechText('You have chosen English as the display language. Use the 1, 2 or 3 buttons on the keyboard to change the display language, then press the space button to save.');
      break;
  }

  /** Cancel speech go to ocr page */
  buttonSelector.addEventListener('click', () => {
    synth.cancel();
  });
}

/**
* @description Init system configuration language
* @param lang
* @private
*/
const _initSystemLang = (lang) => {
  const savedLang = localStorage.getItem('systemLang');
  if (!savedLang) {
    localStorage.setItem('systemLang', lang);
    systemLang = 'rom';
  } else {
    systemLang = savedLang;
  }
}

/**
 * @description Get list of voices available
 * @private
 */
const _getVoices = () => {
  return new Promise(resolve => window.speechSynthesis.onvoiceschanged = resolve);
}

/**
 * @description Find and return first voice by lang
 * @param lang
 * @param voices
 * @private
 */
const _getVoicesByLang = (lang, voices) => {
  switch (lang) {
    case 'rom':
      return voices.filter(voice => voice.name === 'Microsoft Andrei - Romanian (Romania)');
    case 'rus':
      return voices.filter(voice => voice.name === 'Microsoft Pavel - Russian (Russia)');
    case 'eng':
      return voices.filter(voice => voice.name === 'Microsoft David Desktop - English (United States)');
  }
}

/**
 * @description Speech specific text
 * @param text
 * @private
 */
const _speechText = (text) => {
  synth.cancel();
  utterance.text = text;
  synth.speak(utterance);
}