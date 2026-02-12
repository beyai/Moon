import Foundation
import CryptoKit
import UIKit
import ObfuscateMacro

final class JSBundleManager {
    
    static let shared = JSBundleManager()
    // 加密随机密钥长度
    private let nonceLen: Int = 12
    // 加密标签长度
    private let tagLen: Int = 16
    // 加密文件包
    private let mainBundleFile = Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    // 临时文件包
    let tempBundleFile = URL(fileURLWithPath: NSTemporaryDirectory() ).appendingPathComponent(#ObfuscatedString("bundle.bin"))
    
    // 解密文件
    private func decrypt(data: Data, forSecretKey secretKey: String ) throws -> Data {
        guard let keyData = Data(base64Encoded: secretKey) else {
            throw CreateError(code: 500, message: "密钥格式不正确")
        }
        let key = SymmetricKey(data: keyData)
        let nonce = data.prefix(nonceLen)
        let tag = data.dropFirst(nonceLen).prefix(tagLen)
        let ciphertextData = data.dropFirst(nonceLen + tagLen)
        
        do {
            let sealedBox = try AES.GCM.SealedBox(
                nonce: try AES.GCM.Nonce(data: nonce),
                ciphertext: ciphertextData,
                tag: tag
            )
            let decrypted = try AES.GCM.open(sealedBox, using: key)
            return decrypted
        } catch {
            throw CreateError(code: 500, message: "文件解密失败")
        }
    }
    
    /// 获取 JSBundle 文件密钥
    /// - 每次启动App调用该方法获了以解密密钥
    /// - 检测是否需要升级App
    func getJSBundleKey() throws -> (status: Bool, downloadURL: String, secretKey: String) {
        guard let version = Utils.version else {
            throw CreateError(code: 500, message: "无法获取App版本号")
        }
        let result = try ApiService.checkVersion([ "version": version ])
        let resData = result["data"]
        
        guard let secretKey = resData["secretKey"].string else {
            throw CreateError(code: 500, message: "无法获取App文件包密钥")
        }
        
        guard let downloadURL = resData["downloadURL"].string else {
            throw CreateError(code: 500, message: "无法获取App下载地址")
        }
        
        let status = resData["status"].boolValue
        
        return ( status: status, downloadURL: downloadURL, secretKey: secretKey )
    }
    
    /// 升级App
    func update(downloadURL: String) {
        Alert(title: "提示",
              message: "检测到新版本，请前往 App Store 更新",
              buttons: [
                (
                    title: "去更新",
                    style: .default,
                    handler: {
                        // 检测是否能打开当前 URL
                        if let url = URL(string: downloadURL), UIApplication.shared.canOpenURL(url) {
                            UIApplication.shared.open(url,
                                options: [:],
                                completionHandler: { res in
                                    RunTimeOutput.terminate()
                                }
                            )
                        }
                    }
                )
              ]
        )
    }
    
    /// 删除临时文件
    /// - 3秒后删除临时文件
    func removeTempBundleFile() {
        DispatchQueue.global().asyncAfter(deadline: .now() + 3) {
            try? FileManager.default.removeItem(at: self.tempBundleFile)
        }
    }
    
    /// 解密文件
    func decryptFile(secretKey: String) throws {
        guard let bundleFile = mainBundleFile else {
            throw CreateError(code: 500, message: "main.jsbundle 文件不存在")
        }
        let encryptedData = try Data(contentsOf: bundleFile)
        let decryptedData = try decrypt(data: encryptedData, forSecretKey: secretKey)
        try decryptedData.write(to: tempBundleFile, options: .atomic)
    }
    
}
