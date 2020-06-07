import '../css/styles.css';

import AudioRecorderPolyfill from 'audio-recorder-polyfill';
import is from 'is_js';

var isSafari = is.safari();
var isFirefox = is.firefox();
var isChrome = is.chrome();

var mediaSettings = {
  mimeType: 'audio/webm;codecs=opus',
  format: 'webm/opus',
};

if(isFirefox) {
  var mediaSettings = {
    mimeType: 'audio/ogg;codecs=opus',
    format: 'opus',
  };
} else if(isSafari) {
  mediaSettings = {
    mimeType: 'audio/wav',
    format: 'wav'
  };
}

if(isSafari) {
  window.MediaRecorder = AudioRecorderPolyfill;
}

var MIME_TYPE = mediaSettings.mimeType;

var settings = require('../../settings.json');
var form = document.forms.stt;
var startButton = form.querySelector('.button--listen');
var resultContainer = form.querySelector('#result');

var mediaRecorder;
var chunks = [];
var hstream = null;

// Заполняет опции для переданного селекта
function fillSelectFields(selectEl, configObj) {
  var keys = Object.keys(configObj);
  var options = keys.map(function(key) {
    return ['<option value=', key, '>', configObj[key], '</option>'].join('');
  });

  // if (selectEl) selectEl.insertAdjacentHTML('beforeend', options.join(''));
  selectEl.innerHTML = options.join('');
}

// Создает блоб из чанка
function chunksToBlob(chunks, options) {
  var config = options || { type: 'audio/webm; codecs=opus' };

  return new Blob(chunks, config);
}

// Переводит блоб в base64
function bufferBase64(file, callback) {
  var reader = new FileReader();

  reader.readAsBinaryString(file);

  reader.onload = function () {
    callback(window.btoa(reader.result));
  }

  reader.onerror = function (error) {
    console.log('FileReader error: ', error);
  }
}

// Заполняем селекты
fillSelectFields(form.elements.am, settings.am);
fillSelectFields(form.elements.lm, settings.lm);

function startRecord() {
  initRecorder(hstream);
  if (mediaRecorder) {
    // Очищаем чанки
    // chunks = [];
    chunks.length = 0;
    mediaRecorder.start();
  }
}

function stopRecord(e) {
  if (mediaRecorder) {
    mediaRecorder.stop();
    console.log(mediaRecorder);
  }
  e.preventDefault();
}

function send(file) {
  var xhr = new XMLHttpRequest();

  document.body.classList.add('state--pending');

  xhr.open('POST', process.env.STT_URL || '/transcribe', true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function(res) {
    try{
      var data = JSON.parse(xhr.responseText);

      resultContainer.innerHTML = data.transcriptions.map(function(item) {
        return ['<p>', item.transcript, '</p>'].join('');
      }).join('');
    } catch(error) {
      resultContainer.innerHTML = '<p class="error p-4 rounded-md">' + error + '</div>';
    }

    document.body.classList.remove('state--pending');
    document.body.classList.add('state--done');
  }

  xhr.send(JSON.stringify({
    api_token: process.env.API_TOKEN || '',
    payload: file,
    remote_id: 'demo',
    am: form.am.value,
    lm: form.lm.value,
    format: mediaSettings.format,
    channels: -1
  }));
}

// Если нашли кнопку вешаем обработчики
if (startButton) {
  startButton.addEventListener('touchstart', startRecord);
  startButton.addEventListener('touchend', stopRecord);
  startButton.addEventListener('mousedown', startRecord);
  startButton.addEventListener('mouseup', stopRecord);
}

function initRecorder(stream) {
  // alert(MIME_TYPE);
  // Создаем ссылку на рекордер с потоком
  // mediaRecorder = new MediaRecorder(stream, { mimeType: MIME_TYPE }, workerOptions);

  console.log('MIME_TYPE: ', MIME_TYPE);

  mediaRecorder = new MediaRecorder(stream, { mimeType: MIME_TYPE });

  // По мере поступления пишем данные в чанк
  // mediaRecorder.addEventListener('dataavailable', e => chunks.push(e.data));
  mediaRecorder.addEventListener('dataavailable', function(e) {chunks.push(e.data);});

  // При остановке отправляем по таймауту
  mediaRecorder.addEventListener('stop', function(e) {
    var blob = chunksToBlob(chunks, { type: MIME_TYPE });

    bufferBase64(blob, send);

    // Заранее создаем новый воркер
    // initRecorder(stream);
    // mediaRecorder._spawnWorker();
  });
}

// Получаем доступ к утройствам
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function(s) {hstream = s;window.stream = s;} )
    .catch(function(error) {
      resultContainer.innerHTML = '<p class="error p-4 rounded-md">Ошибка доступа к микрофону</div>';
    });
  } else {
    console.error('getUserMedia не поддерживается!');
  }
