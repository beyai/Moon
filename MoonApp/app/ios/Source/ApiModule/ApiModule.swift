
import Foundation
import React

@objc(ApiModule)
final class ApiModule: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    // 初始化设备
    @objc
    func initDevice(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            
            let result = try ApiService.initDevice()
            let resData = result["data"]
            
            // 是否激活
            let isActive = resData["isActive"].bool ?? false
            
            if isActive {
                RunTimeOutput.shared.cancel()
            } else {
                RunTimeOutput.shared.start()
            }
            
            // 设置 IceServers
            if let iceServers = resData["iceServers"].array {
                Config.ICE_SERVERS = Utils.buildIceServers(iceServers: iceServers)
            }
            
            resolve(result.dictionaryObject)
        } catch {
            let err = RejectError(error)
            reject(err.code, err.message, error)
        }
    }
    
    // 绑定设备
    @objc
    func bindDevice(_ token: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            let result = try ApiService.bindDevice(token)
            resolve(result.dictionaryObject)
        } catch {
            let err = RejectError(error)
            reject(err.code, err.message, error)
        }
    }
}
