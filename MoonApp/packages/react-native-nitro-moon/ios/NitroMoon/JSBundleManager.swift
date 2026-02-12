import Foundation
import CryptoKit
import UIKit

final class JSBundleManager {
    
    static let shared = JSBundleManager()
    
    private init() {}

    // 加密文件包
    private let mainBundleFile = Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    
    // 临时文件包
    private let bundleFileURL = URL(fileURLWithPath: NSTemporaryDirectory() ).appendingPathComponent("bundle.bin")
    
    // 解密文件
    @inline(__always)
    private func decrypt(data: Data, forSecretKey secretKey: Data ) throws -> Data {
        let key = SymmetricKey(data: secretKey)
        let nonce = data.prefix(12)
        let tag = data.dropFirst(12).prefix(16)
        let ciphertextData = data.dropFirst(12 + 16)
        
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
    
    /// 删除临时文件
    /// - 3秒后删除临时文件
    @inline(__always)
    private func removeTempBundleFile() {
        DispatchQueue.global().asyncAfter(deadline: .now() + 3) {
            try? FileManager.default.removeItem(at: self.bundleFileURL)
        }
    }

    /// 升级App
    func update(downloadURL: String) {
        // 更新按键
        let UpdateBtn = AlertButton(
            title: "去更新",
            style: .default,
            handler: {
                if let url = URL(string: downloadURL), UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url,
                        options: [:],
                        completionHandler: { res in
                            // 关闭App
                            NitroMoonBridge.silentQuit()
                        }
                    )
                }
            }
        )
        Alert(title: "提示",
            message: "检测到新版本，请前往 App Store 更新",
            buttons: [ UpdateBtn ]
        )
    }
    
    /// 解密文件
    @inline(__always)
    func decryptFile(secretKey: Data) throws -> URL {
        
        #if !DEBUG
        guard let bundleFile = mainBundleFile else {
            throw CreateError(code: 500, message: "App已损坏")
        }
        
        let encryptedData = try Data(contentsOf: bundleFile)
        let decryptedData = try decrypt(data: encryptedData, forSecretKey: secretKey)
        try decryptedData.write(to: bundleFileURL, options: .atomic)
        removeTempBundleFile()
        #endif
        
        return bundleFileURL
        
    }
    
}
