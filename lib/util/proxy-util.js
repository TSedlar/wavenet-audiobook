const requester = require('./request-util')
const cheerio = require('cheerio')

let sources = [
  {
    name: 'FreeProxyCZ',
    url: 'http://free-proxy.cz/en/proxylist/country/US/https/speed/all',
    parse: async (url) => {
      let data = []
      for (let i = 1; i <= 10; i++) {
        let body = await requester.readWeb(`${url}/${i}`)
        let $ = cheerio.load(body)
        let tds = $('table[id="proxy_list"] td[colspan!=11]')
        if (tds.length == 0) {
          break;
        }
        tds.each((idx, element) => {
          let text = $(element).text().trim()
          if (text.length == 0) {
            let firstChild = $(element).eq(0)
            if (firstChild) {
              let html = firstChild.html()
              if (html.indexOf('Base64.decode') >= 0) {
                let b64 = html.split("Base64.decode\(\"")[1].split("\")")[0]
                text = Buffer.from(b64, 'base64').toString()
              }
            }
          }
          data.push(text)
        })
      }
      let proxies = []
      for (let i = 0; i < data.length; i++) {
        proxies.push({
          ip: data[i++],
          port: data[i++],
          protocol: data[i++],
          country: data[i++],
          region: data[i++],
          city: data[i++],
          anonymity: data[i++],
          speed: data[i++],
          uptime: data[i++],
          response: data[i++],
          lastChecked: data[i]
        })
      }
      return proxies
    }
  }
]

const proxyToURL = (proxy) => {
  return `http://${proxy['ip']}:${proxy['port']}`
}

const fetchProxies = async () => {
  let proxies = []
  for (let source of sources) {
    let parsedProxies = await source.parse(source.url)
    proxies.push(...parsedProxies)
  }
  return proxies
}

const choose = async (proxies, done) => {
  let proxy = null
  do {
    proxy = proxyToURL(proxies[Math.floor(Math.random() * proxies.length)])
  } while (done.includes(proxy))
  done.push(proxy)
  return proxy
}

module.exports = {
  fetchProxies, choose
}