import Foundation
import AVFoundation
import CommonCrypto

class Helper {
    
    // 限制取值
    static func valueInRange<T: Comparable>( value: T, minValue: T, maxValue: T ) -> T {
        return min(max(value, minValue), maxValue)
    }
    
    // 归一化值还原
    static func denormalize<T:FloatingPoint>(value: T, minValue: T, maxValue: T) -> T {
        return value * ( maxValue - minValue ) + minValue
    }
  
    // MARK: - base64URL 转Data
    static func base64URLDecode(_ base64url: String) -> Data? {
        var base64 =
            base64url
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        let padding = 4 - base64.count % 4
        if padding < 4 {
            base64 += String(repeating: "=", count: padding)
        }

        return Data(base64Encoded: base64)
    }

    // MARK: - base64URL 编码
    static func base64URLEncode(_ data: Data) -> String {
        return data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    // MARK: - AES-256-CBC 解密
    static func aes256CBCDecrypt(data: Data, key: Data, iv: Data) -> Data? {
        // 确保密钥和IV的长度是正确的
        guard key.count == kCCKeySizeAES256 else {
            return nil
        }
        guard iv.count == kCCBlockSizeAES128 else {
            return nil
        }

        var decryptedBytes = [UInt8](repeating: 0, count: data.count + kCCBlockSizeAES128)
        var decryptedLength = 0

        let status = data.withUnsafeBytes { encryptedBytes in
            key.withUnsafeBytes { keyBytes in
                iv.withUnsafeBytes { ivBytes in
                    CCCrypt(
                        CCOperation(kCCDecrypt),  // 操作：解密
                        CCAlgorithm(kCCAlgorithmAES),  // 算法：AES
                        CCOptions(kCCOptionPKCS7Padding),  // 选项：PKCS7 填充
                        keyBytes.baseAddress,  // 密钥
                        key.count,  // 密钥长度
                        ivBytes.baseAddress,  // 初始化向量 (IV)
                        encryptedBytes.baseAddress,  // 要解密的数据
                        data.count,  // 数据长度
                        &decryptedBytes,  // 输出缓冲区
                        decryptedBytes.count,  // 缓冲区大小
                        &decryptedLength  // 解密后的数据长度
                    )
                }
            }
        }

        guard status == kCCSuccess else {
            return nil
        }

        return Data(decryptedBytes.prefix(decryptedLength))
    }

    // MARK: - AES-256-CBC 加密
    static func aes256CBCEncrypt(data: Data, key: Data, iv: Data) -> Data? {
        // 确保密钥和IV的长度是正确的
        guard key.count == kCCKeySizeAES256 else {
            return nil
        }
        guard iv.count == kCCBlockSizeAES128 else {
            return nil
        }

        var encryptedBytes = [UInt8](repeating: 0, count: data.count + kCCBlockSizeAES128)
        var encryptedLength = 0

        let status = data.withUnsafeBytes { dataBytes in
            key.withUnsafeBytes { keyBytes in
                iv.withUnsafeBytes { ivBytes in
                    CCCrypt(
                        CCOperation(kCCEncrypt),  // 操作：加密
                        CCAlgorithm(kCCAlgorithmAES),  // 算法：AES
                        CCOptions(kCCOptionPKCS7Padding),  // 选项：PKCS7 填充
                        keyBytes.baseAddress,  // 密钥
                        key.count,  // 密钥长度
                        ivBytes.baseAddress,  // 初始化向量 (IV)
                        dataBytes.baseAddress,  // 要加密的数据
                        data.count,  // 数据长度
                        &encryptedBytes,  // 输出缓冲区
                        encryptedBytes.count,  // 缓冲区大小
                        &encryptedLength  // 加密后的数据长度
                    )
                }
            }
        }

        guard status == kCCSuccess else {
            return nil
        }

        return Data(encryptedBytes.prefix(encryptedLength))
    }
    
    // MARK: - 锁定相机配置
    static func withLockedConfiguration(_ device: AVCaptureDevice, _ actions: () throws -> Void) {
        do {
            try device.lockForConfiguration()
            try actions()
            device.unlockForConfiguration()
        } catch {
            print("Configuration lock failed: \(error)")
        }
    }
    
    // MARK: 获取相机设备
    static func getCaptureDevice(for position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        switch position {
            case .front:
                return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
                    ?? AVCaptureDevice.default(.builtInTrueDepthCamera, for: .video, position: .front)
            case .back:
                return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
                    ?? AVCaptureDevice.default(.builtInUltraWideCamera, for: .video, position: .back)
            default:
                return nil
        }
    }
}
