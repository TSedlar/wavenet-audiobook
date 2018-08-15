const request = require('request')

const GOOGLE_URL = 'https://cxl-services.appspot.com/proxy?url=https%3A%2F%2Ftexttospeech.googleapis.com%2Fv1beta1%2Ftext%3Asynthesize'

// const TTS = require('@google-cloud/text-to-speech').TextToSpeechClient
// const client = new TTS()
// client.synthesizeSpeech(data)
const requestTTS = (data, proxy = null) => new Promise((resolve, reject) => {
  let req = request({
    url: GOOGLE_URL,
    method: 'POST',
    json: true,
    body: data,
    gzip: true,
    headers: {
      'Referer': 'https://cloud.google.com/',
      'Host': 'cxl-services.appspot.com',
      'Accept': '*/*',
      'Accept-Language': 'en-US, en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0',
      'Content-Type': 'text/plain;charset=UTF-8',
      'Origin': 'https://cloud.google.com',
      'DNT': 1,
      'Connection': 'keep-alive'
    },
    proxy: proxy,
    timeout: 7500
  }, (err, res, body) => {
    if (err) {
      reject(err)
      return
    } else {
      resolve(body)
    }
  })
  
  req.on('socket', (socket) => {
    socket.setTimeout(7500, () => {
      req.abort()
    })
  })
})

module.exports = {
  requestTTS
}