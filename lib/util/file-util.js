const fs = require('fs')
const path = require('path')

const walkFileTree = (dir, callback = null) => {
  let items = fs.readdirSync(dir)
  for (let item of items) {
    let fullPath = (dir + item)
    let stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walkFileTree(fullPath + '/', callback)
    } else if (callback != null) {
      callback(fullPath)
    }
  }
}

const collectFiles = (dir, filter) => {
  let files = []
  walkFileTree(dir, (item) => {
    if (filter(item)) {
      files.push(item)
    }
  })
  return files
}

const parentOf = (file) => path.dirname(file)

const isBase64 = (str) => {
  return Buffer.from(str, 'base64').toString('base64') === str
}

const decodeB64 = (str) => {
  return isBase64(str) ? Buffer.from(str, 'base64') : str
}

module.exports = {
  walkFileTree, collectFiles, parentOf, decodeB64
}