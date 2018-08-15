const request = require('request')

const readWeb = (url) => new Promise((resolve, reject) => {
  request({
    url: url,
    method: 'GET',
    headers: {
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'DNT': 1,
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0'
    },
    gzip: true,
  }, (err, res, body) => {
    if (err) {
      reject(err)
    } else {
      resolve(body)
    }
  })
})

module.exports = {
  readWeb
}