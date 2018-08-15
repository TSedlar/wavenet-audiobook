const ffmpeg = require('fluent-ffmpeg')

const FFMPEG_PATH = require('ffmpeg-static').path
const FFPROBE_PATH = require('ffprobe-static').path

const OPTS = {
  quality: 'highestaudio',
  filter: 'audioonly'
}

ffmpeg.setFfmpegPath(FFMPEG_PATH)
ffmpeg.setFfprobePath(FFPROBE_PATH)

const mergeFiles = (files, target) => new Promise((resolve, reject) => {
  let ff = ffmpeg()

  for (let file of files) {
    ff = ff.addInput(file)
  }

  ff = ff.audioQuality(0)

  ff.mergeToFile(target)
    .on('end', () => resolve(target))
    .on('error', (err) => reject(err))
})

module.exports = {
  mergeFiles
}