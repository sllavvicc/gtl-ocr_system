const { createWorker } = Tesseract;
const path = require('path');

/**
 * @description Document is ready
 */
document.addEventListener('DOMContentLoaded', function () {
  /** Clear all speech info */
  wordsToSpeech = [];
  wordsTextSpeech = '';

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
    utterance.volume = 1;
  });

  /** Listen video devices changes and try to launch scaner */
  navigator.mediaDevices.ondevicechange = () => {
    _initVideoSource();
  };

  /** Listen key press events */
  document.addEventListener('keypress', function (key) {
    /** If user press Space key and current area is not read-area make scan */
    if (key.code === 'Space' && document.querySelector('#read-area.disable')) {
      capture();
    }

    /** If user press Space key and current area is not ocr-area make scan */
    if (key.code === 'Space' && document.querySelector('#ocr-area.disable')) {
      setOcrAreaActive();
    }

    if (document.querySelector('#ocr-area.disable')) {
      switch (key.code) {
        case 'Digit1':
          setColor('color_1');
          break;
        case 'Digit2':
          setColor('color_2');
          break;
        case 'Digit3':
          setColor('color_3');
          break;
        case 'Digit4':
          setColor('color_4');
          break;
        case 'Digit5':
          setColor('color_5');
          break;
      }
    }

    if ((key.code === 'Equal' || key.code === 'Minus') && document.querySelector('#ocr-area.disable')) {
      const el = document.querySelector('.main__layout__wrapper#read-area .page__content__wrapper .read__area');
      switch (key.code) {
        case 'Equal':
          if (fontSize <= 30) {
            fontSize++
            el.style.fontSize = `${fontSize}px`;
          }
          break;
        case 'Minus':
          if (fontSize >= 20) {
            fontSize--;
            el.style.fontSize = `${fontSize}px`;
          }
          break;
      }
    }
  });
});

/**
 * @description System variables
 */
let wordsToSpeech = [];
let wordsTextSpeech = '';
let lastWordSpeeched = '';
let systemLang = null;
let synth = null;
let fontSize = 20;
let utterance = new SpeechSynthesisUtterance();

/**
 * @description Take photo from video source and send buffer data to OCR system
 */
const capture = () => {
  document.querySelector("canvas.video__canvas")
    .getContext('2d')
    .drawImage(document.querySelector("video.video__source"), 0, 0, 1920, 1080);
  const base64Data = document.querySelector("canvas.video__canvas").toDataURL('image/png', 1);
  _getTextFromImage(base64Data);
}

/**
 * @description Change read area colors
 * @param {string} colorName 
 */
const setColor = (colorName) => {
  const el = document.querySelector('.main__layout__wrapper#read-area .page__content__wrapper');
  const currentClass = el.classList[1];
  el.classList.replace(currentClass, colorName);

  /** Change active class from colors buttons */
  document.querySelector('.main__layout__wrapper#read-area .available__colors--item.active').classList.remove('active');
  document.querySelector(`.main__layout__wrapper#read-area .available__colors--item.${colorName}`).classList.add('active');
};

/**
 * @description Switch area from read to ocr
 */
const setOcrAreaActive = () => {
  const node = document.querySelector('.main__layout__wrapper#read-area .read__area');
  node.querySelectorAll('*').forEach(n => n.remove());
  document.getElementById('ocr-area').classList.remove('disable');
  document.getElementById('read-area').classList.add('disable');
  wordsToSpeech = [];
  wordsTextSpeech = '';
  lastWordSpeeched = '';
  synth.cancel();
};

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
 * @description Check if connected camera is allowed to run with this application
 * @private
 */
const _initVideoSource = () => {
  const noCameraSelector = document.querySelector('.no__camera');
  const videoSelector = document.querySelector('.video');
  const scanButtonSelector = document.querySelector('.video__capture');

  /** Get all devices and find required model by label */
  navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
      const findDevice = devices.filter(device =>
        device.kind === 'videoinput' && device.label.includes('JY-VP216'));

      /** If target device is connected, send notification to user and launch video stream */
      if (findDevice.length !== 0) {
        switch (systemLang) {
          case 'rom':
            scanButtonSelector.textContent = 'Scanare';
            _speechText('Scaner-ul a fost conectat cu success. Pentru a scana pagina dorită tastați butonul space de pe tastatură.');
            break;
          case 'rus':
            scanButtonSelector.textContent = 'Сканировать';
            _speechText('Сканер был успешно подключен. Для сканирования нажмите кнопку пробел на клавиатуре.');
            break;
          case 'eng':
            scanButtonSelector.textContent = 'Scan';
            _speechText('The scanner was successfully connected. To scan the desired page, type the space button on the keyboard.');
            break;
        }
        _getCameraVideoStream(findDevice[0].deviceId);
        noCameraSelector.classList.add('disable');
        videoSelector.classList.remove('disable');
      }

      /** If target device not connected, send notification to user and show no camera label */
      if (findDevice.length === 0) {
        noCameraSelector.classList.remove('disable');
        videoSelector.classList.add('disable');
        switch (systemLang) {
          case 'rom':
            noCameraSelector.innerHTML = 'Verificați conexiunea scanerului!<br>Model acceptat de scaner este JY-VP216.';
            _speechText('Verificați conexiunea scanerului! Model acceptat de scaner este JY-VP216.');
            break;
          case 'rus':
            noCameraSelector.innerHTML = 'Проверьте подключение сканера!<br>Поддерживаемая модель сканера: JY-VP216.';
            _speechText('Проверьте подключение сканера! Поддерживаемая модель сканера: JY-VP216.');
            break;
          case 'eng':
            noCameraSelector.innerHTML = 'Check the scanner connection!<br>The supported scanner model is JY-VP216.';
            _speechText('Check the scanner connection! The supported scanner model is JY-VP216.');
            break;
        }
      }
    });
};

/**
* @description Check if user hase connected to target camera and get stream if is connected
* @param deviceId
* @private
*/
const _getCameraVideoStream = (deviceId) => {
  const camSettings = {
    audio: false,
    video: {
      width: 1920,
      height: 1080,
      facingMode: 'environment',
      exact: deviceId
    }
  };
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(camSettings).then(stream => {
      const video = document.querySelector("video.video__source");
      video.srcObject = stream;
      video.play();
    });
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

/**
 * @description Speech specific text
 * @param text
 * @private
 */
const _speechTextWithWords = (text) => {
  synth.cancel();
  utterance.text = text;
  synth.speak(utterance);
  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      let word = _getWordAt(event.utterance.text, event.charIndex);
      /** Check if last word is not same with current */
      if (lastWordSpeeched !== word) {
        lastWordSpeeched = word;
        const indexToWord = document.querySelector(`.main__layout__wrapper#read-area .read__area .word[data-value="${word}"]:not(.speech)`).getAttribute('data-index');
        const wordsOnDom = document.querySelectorAll('.main__layout__wrapper#read-area .read__area .word');
        for (let i = 0; i <= indexToWord; i++) {
          wordsOnDom[i].classList.add('speech');
        }
      }
    }
  };
}

/**
 * @description Get current speechWord
 * @param str
 * @param pos
 * @private
 */
const _getWordAt = (str, pos) => {
  const left = str.slice(0, pos + 1).search(/\S+$/);
  const right = str.slice(pos).search(/\s/);
  if (right < 0) {
    return str.slice(left);
  }
  return str.slice(left, right + pos);
}

/**
 * @description Init ocr engine to transform image to text
 * @private
 */
const _getTextFromImage = async (base64Image) => {
  const badKeyWords = ['*', '|', '-', '—', 'S.A.', 'S.A', 'S.A,', '"'];
  const worker = createWorker({
    workerPath: '../node_modules/tesseract.js/dist/worker.min.js',
    langPath: path.join(__dirname, 'public/lang-data'),
    corePath: '../node_modules/tesseract.js-core/tesseract-core.wasm.js',
    gzip: false,
    logger: m => {
      if (m.status && m.status === 'recognizing text') {
        const progress = Math.round(m.progress * 100);
        const scanStatusSelector = document.querySelector('.scan__status');
        scanStatusSelector.classList.remove('disable');
        scanStatusSelector.textContent = `${progress}%`;

        /** Send notification is scan level is 25, 50, 75 percents */
        if (progress === 25 || progress === 50 || progress === 75) {
          switch (systemLang) {
            case 'rom':
              _speechText(`A fost scanat ${progress}% din 100, vă rugăm să așteptați.`);
              break;
            case 'rus':
              _speechText(`Было просканировано ${progress}% из 100, пожалуйста подождите.`);
              break;
            case 'eng':
              _speechText(`${progress}% of 100 have been scanned, please wait.`);
              break;
          }
        };
      }
    },
  });

  try {
    await worker.load();
    await worker.loadLanguage(systemLang === 'rom' ? 'ron' : systemLang);
    await worker.initialize(systemLang === 'rom' ? 'ron' : systemLang);
    await worker.recognize(base64Image).then(response => {

      /** Filter finded word to exclude bad words and save words to local storage */
      response.data.words.map(word => {
        if (!badKeyWords.includes(word.text)) {
          wordsToSpeech.push(word.text);
        }
      });
      wordsTextSpeech = wordsToSpeech.join(' ');
      const scanStatusSelector = document.querySelector('.scan__status');
      scanStatusSelector.classList.add('disable');
      scanStatusSelector.textContent = '';

      /** Init generation read area */
      _initSpeachArea();

      /** Switch user area */
      document.getElementById('ocr-area').classList.add('disable');
      document.getElementById('read-area').classList.remove('disable');

      /** Init speech text */
      _speechTextWithWords(wordsTextSpeech);
    });

  } catch (error) {
    console.log(error);
  }
};

/**
 * @description Append words to DOM
 */
const _initSpeachArea = () => {
  wordsToSpeech.forEach((word, index) => {
    const el = document.createElement('span');
    el.textContent = word;
    el.setAttribute('data-value', word);
    el.setAttribute('data-index', index);
    el.classList.add('word');
    document.querySelector('.main__layout__wrapper#read-area .read__area').appendChild(el);
  })
}
