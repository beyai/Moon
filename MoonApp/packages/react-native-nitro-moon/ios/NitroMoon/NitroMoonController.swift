import Foundation
import SwiftyJSON

@objc(NitroMoonController)
public class NitroMoonController: NSObject {
    
    private static var logger: MLogger = {
        MLogger("NitroMoonController")
    }()
    
    private static var JSBundle: JSBundleManager {
        return JSBundleManager.shared
    }
    
    /// 处理版本与更新逻辑
    @inline(__always)
    private static func handleVersion(_ info: AppVersionInfo) throws -> URL {
        
        guard let secretKey = info.secretKey else {
            logger.error("JSBundle 无法解包")
            throw CreateError(code: 400, message: "App 已损坏")
        }

        // 升级App
        if !info.status {
            logger.debug("检测到强制更新版本: \(info.version)，下载地址: \(info.downloadURL)")
            // Alert 更新提示
            JSBundle.update(downloadURL: info.downloadURL)
            throw CreateError(code: 500, message: "当前版本不支持，请更新到最新版本")
        }
        
        // 解密文件包
        return try JSBundle.decryptFile(secretKey: secretKey)
    }
    
    @objc
    public static func handleViewDidAppear() async throws -> URL {
        #if !DEBUG
        guard NitroMoonBridge.isAppLegitimate() else {
            logger.error("运行环境检测失败")
            throw CreateError(code: 500, message: "运行环境检测失败")
        }
        #endif
        
        let config = try await SessionService.shared.initialize()
        return try handleVersion(config)
    }
    
}
