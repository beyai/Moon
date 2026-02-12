const fs = require("fs")
const path = require('path')
const { randomBytes, createCipheriv } = require('crypto')

const { CONFIGURATION = '', CODESIGNING_FOLDER_PATH = '', BUNDLE_NAME = 'main' } = process.env
const BUILD_FILE        = path.join(CODESIGNING_FOLDER_PATH, BUNDLE_NAME + '.jsbundle')

// 每次更新版本时，请更新密钥
const OBFUSCATED_KEY    = "DXvsiyHvzILwLmYfIFg5SINUId8aLnBe1pPy/w8//WU=";

function encryptFile(data) {
    const iv = randomBytes(12);
    const key = Buffer.from(OBFUSCATED_KEY, 'base64')
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([ cipher.update(data), cipher.final() ]);
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv,tag, encrypted]);
}

if (!fs.existsSync(BUILD_FILE)) {
    console.log("文件不存在", BUILD_FILE )
}

console.log('运行环境', CONFIGURATION)
// if (CONFIGURATION == 'Release') {
    console.log('开始读取文件....', BUILD_FILE)
    let buffer = fs.readFileSync(BUILD_FILE)
    console.log('开始加密并覆盖文件')
    fs.writeFileSync(BUILD_FILE, encryptFile(buffer))
    console.log('文件覆盖成功')
// }
