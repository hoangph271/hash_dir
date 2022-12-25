const { createReadStream } = require('fs')
const { readdir, stat } = require('fs/promises')
const path = require('path')
const crypto = require('crypto')

async function fileHash(filePath) {
  const md5Sum = crypto.createHash('md5')

  const rs = createReadStream(filePath)

  rs.on('data', buffer => md5Sum.update(buffer))

  return new Promise(resolve => {
    rs.once('end', () => {
      resolve(md5Sum.digest('hex'))
    })
  })
}

async function dirHash(dirPath) {
  const children = await readdir(dirPath)

  const childrenHashPromises = children.map(async childName => {
    const childPath = path.join(dirPath, childName)

    const stats = await stat(childPath)

    return stats.isDirectory()
      ? dirHash(childPath)
      : fileHash(childPath)
  })
  const childrenHashes = await Promise.all(childrenHashPromises)

  const md5Sum = crypto.createHash('md5')
  md5Sum.update(childrenHashes.join(''))

  return md5Sum.digest('hex')
}

async function main() {
  const [_, __, dirPath] = process.argv

  console.info(await dirHash(dirPath))
}

main()
