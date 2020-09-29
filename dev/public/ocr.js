const path = require('path');
const { createWorker } = Tesseract;

/** Create OCR engine */
const worker = createWorker({
  workerPath: '../node_modules/tesseract.js/dist/worker.min.js',
  langPath: './public/lang-data',
  corePath: '../node_modules/tesseract.js-core/tesseract-core.wasm.js',
});

(async () => {
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data: { text } } = await worker.recognize(path.join(__dirname, 'public/images/testocr.png'));
  console.log(text);
  await worker.terminate();
})();
