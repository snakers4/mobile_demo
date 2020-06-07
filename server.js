const express = require('express');
const request = require('request-promise');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const WaveFile = require('wavefile').WaveFile;

app.use(express.static('dist'));

app.use(bodyParser.json({
  limit: '50mb'
}));

app.post('/transcribe', async function (req, res) {
  const form = req.body;

  if(form.format == 'wav') {
    let buffer = Buffer.from(form.payload, 'base64');
    let wav = new WaveFile(buffer);
    if(wav.fmt.sampleRate != 16000) {
      wav.toSampleRate(16000);
      let newBuffer = Buffer.from(wav.toBuffer());

      form.payload = newBuffer.toString('base64');
    }
  }

  // form.api_token = '54d045da11cf71a3ac85430ea75be7bd76dd9611';
  /**
   * @fix @todo Небезопасное использование form.format
   */
  let files = fs.readdirSync('./data');
  let fileNum = files.length + 1;
  let ext = null;
  switch(form.format) {
    case 'webm/opus':
      ext = 'webm';
      break;
    case 'wav':
      ext = 'wav';
      break;
    case 'opus':
      ext = 'ogg';
      break;
  }
  fs.writeFileSync('./data/' + fileNum + '.' + ext, Buffer.from(form.payload, 'base64'));

  const apiQuery = await request.post({
    url: 'https://api.silero.ai/transcribe',
    json: form
  });

  res.json(apiQuery);
});

app.listen(3000);
