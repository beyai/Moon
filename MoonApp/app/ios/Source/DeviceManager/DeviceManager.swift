import Foundation
import UIKit

final class DeviceManager {
    
    static let shared = DeviceManager()
    
    // 是否为新设备
    var isNewDevice: Bool = false
    // 当前设备唯一标识
    var deviceUID: String
    // 是否已登录
    var isCheckIn: Bool = false
    // 设备码
    var deviceCode: String? {
        return KeyChainStore.get(forKey: "deviceCode")
    }
    
    init() {
        
        // 是否已登记
        if KeyChainStore.get(forKey: "isCheckIn") == "true" {
            self.isCheckIn = true
        }
        
        // 是否新设备(区分老版本App)
        if KeyChainStore.get(forKey: "isNew") == "true" {
            self.isNewDevice = true
        }
        
        // 获取设备唯一标识
        if let deviceUID = KeyChainStore.get(forKey: "deviceUID") {
            self.deviceUID  = deviceUID
            return
        }
        
        // 初始化设备唯一标识
        let deviceUID = Utils.randomUUID()
        _ = KeyChainStore.save(value: deviceUID, forKey: "deviceUID")
        _ = KeyChainStore.save(value: "true", forKey: "isNew")
        
        self.isNewDevice = true
        self.deviceUID  = deviceUID
    }
    
    /// 登记设备
    /// - App 首次启动必须验证是否为正版
    /// - 验证通过后才可以协商密钥
    func checkIn() async throws {
        if isCheckIn {
            return
        }
        // 获取临时访问token
        let challenge = try ApiService.challenge()
        // 生成设备认证数据
        let attestationData = try await AttestManager.shared.generateAttestation(challenge)
        // 登记设备
        try ApiService.checkin(attestationData)
        if !KeyChainStore.save(value: "true", forKey: "isCheckIn") {
            throw CreateError(code: 500, message: "设备验证失败")
        }
    }
    
    /// 协商密钥通信共享密钥
    /// - App启动时必须重新协商密钥
    /// - 后续所有请求使用协商的共享密钥对数据进行加密钥
    func negotiatePubKey() async throws {
        
        let payload = [
            "deviceUID": deviceUID,
            "devicePublicKey": CryptoManager.shared.exportPublicKey()
        ]
        
        // 生成认证数据
        let assertionData = try await AttestManager.shared.generateAssertion(payload)
        // 协商密钥
        let result = try ApiService.negotiate(assertionData)
        
        guard let pubkey = result["data"] as? String else {
            throw CreateError(code: 403, message: "无法获取服务端公钥")
        }
        
        // 设置服务端公钥
        do {
            try CryptoManager.shared.setServerPublicKey(serverPublicKey: pubkey)
        } catch {
            throw CreateError(code: 403, message: "密钥协商失败")
        }
    }
    
    /// 注册设备
    /// - 设备首次启动时必须调用些方法获取设备码
    func regiserDevice() throws {
        if deviceCode != nil {
            return
        }
        
        // 请求参数
        let params = [
            "deviceUID": deviceUID,
            "deviceCode": isNewDevice ? "" : Utils.generateDeviceCode(deviceUID: deviceUID)
        ]
        
        let result = try ApiService.registerDevice(params)
        let resData = result["data"]
        
        guard let deviceCode = resData["deviceCode"].string else {
            throw CreateError(code: 500, message: "设备码错误")
        }
        
        // 保存设备码
        if !KeyChainStore.save(value: deviceCode, forKey: "deviceCode") {
            throw CreateError(code: 500, message: "设备码保存失败")
        }
    }
    
    
    
    
    
}
