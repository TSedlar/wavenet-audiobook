const fs = require('fs')
const Files = require('./util/file-util')
const Audio = require('./util/audio-util')
const Promises = require('./util/promise-util')
const TTS = require('./util/tts')
const Proxies = require('./util/proxy-util')

let totalEstimate = 0
let proxies = []
let usedProxies = []
let proxy = null

function escapeText(text) {
  text = text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return text
}

function createSSML(text) {
  let builder = '<speak>\n'
  builder += escapeText(text).replace(/\n/g, '<break />')
  builder += '</speak>'
  return builder
}

function estimateCost(text) {
  return (createSSML(text).length / 62504.0)
}

function findConfig(file) {
  let config = Files.parentOf(file) + '/config.json'
  if (fs.existsSync(config)) {
    return config
  } else {
    config = Files.parentOf(Files.parentOf(file)) + '/config.json'
    if (!fs.existsSync(config)) {
      throw new Error(`Config not found for file: ${file}`)
    }
    return config
  }
}

async function createAudioRequest(text, outFile, config) {
  console.log(`  writing: ${outFile}`)

  let ssmlText = createSSML(text)

  let request = {
    input: {
      ssml: ssmlText
    },
    voice: {
      languageCode: config['voice_lang'],
      name: config['voice_name']
    },
    audioConfig: {
      audioEncoding: 'LINEAR16',
      sampleRateHertz: 20480,
      speakingRate: config['voice_rate'],
      pitch: config['voice_pitch'],
      effectsProfileId: [
        "headphone-class-device"
      ]
    },
  }

  let speech = null
  let attempts = 0

  while (speech == null && attempts < 5) {
    attempts++

    if (proxies.length == 0) {
      proxies = await Proxies.fetchProxies()
      console.log(`    fetched ${proxies.length} proxies`)
      // console.log(proxies)
    }

    if (proxy == null) {
      proxy = await Proxies.choose(proxies, usedProxies)
      console.log(`    proxy: ${proxy}`)
    }

    let error = null
    try {
      let start = Date.now()
      speech = await TTS.requestTTS(request, proxy)
      let end = Date.now()
      if (end - start > 22500) {
        proxy = await Proxies.choose(proxies, usedProxies)
        console.log(`    proxy: ${proxy} (${end - start}ms)`)
      }
    } catch (err) {
      error = err
    }
    if (error || (speech != null && speech['error'])) {
      if (!error) {
        error = speech['error']
      }

      request.input = { text: text }
      speech = null

      console.log('    failed... retrying in 5 seconds...')

      if (attempts > 1) {
        proxy = await Proxies.choose(proxies, usedProxies)
        console.log(`    proxy: ${proxy}`)

        fs.writeFileSync('google-err.txt', error, 'utf8')

        if (attempts > 3) {
          proxies = await Proxies.fetchProxies()
          console.log(`    fetched ${proxies.length} proxies`)
        }
      }
      
      await Promises.delay(5000)
    }
  }

  if (speech == null) {
    return null
  }

  try {
    let decoded = Files.decodeB64(speech['audioContent'])

    fs.writeFileSync(outFile, decoded, 'binary')

    console.log(`  wrote file: ${outFile}`)
  } catch (err) {
    throw new Error(JSON.stringify(speech))
  }

  return outFile
}

async function createAudio(text, outPath) {
  let splitText = text.match(/(.|[\r\n]){1,1500}/g)

  let estimate = estimateCost(text)
  totalEstimate += estimate

  console.log(`  estimate: $${estimate}`)
  console.log(`  chunks: ${splitText.length}`)

  let config = JSON.parse(fs.readFileSync(findConfig(outPath), 'utf8'))

  let audioParts = []

  for (let i = 1; i <= splitText.length; i++) {
    let chunk = splitText[i - 1]
    let outFile = `${outPath.replace('.mp3', '')}-p${i}.wav`
    if (fs.existsSync(outFile)) {
      audioParts.push(outFile)
    } else {
      let audioPart = await createAudioRequest(chunk, outFile, config)
      if (audioPart != null) {
        audioParts.push(audioPart)
      }
    }
  }

  return audioParts
}

async function mergeAudioFiles(files) {
  console.log('  merging files...')
  let targetFile = files[0].replace(/(-.[0-9]+\.wav)$/g, '.mp3') // encode with ffmpeg quality 0 (best)
  let target = await Audio.mergeFiles(files, targetFile)
  for (let file of files) {
    fs.unlinkSync(file)
  }
  console.log('  merged!')
  return target
}

async function handleTxtFile(txtFile) {
  let targetFile = txtFile.replace('.txt', '.mp3')
  console.log(`Task: ${txtFile} -> ${targetFile}`)
  if (fs.existsSync(targetFile)) {
    return targetFile
  } else {
    let txt = fs.readFileSync(txtFile, 'utf8')
    let audioParts = await createAudio(txt, targetFile)
    let audioFile = await mergeAudioFiles(audioParts)
    return audioFile
  }
}

(async () => {
  let txtFiles = Files.collectFiles('./audio/', (item) => item.endsWith('.txt'))

  for (let txtFile of txtFiles) {
    await handleTxtFile(txtFile)
    console.log('  finished!')
  }

  console.log(`Estimate: $${totalEstimate}`)
})()