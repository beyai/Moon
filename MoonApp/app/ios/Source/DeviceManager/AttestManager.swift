import Foundation
import DeviceCheck
import CryptoKit
import SwiftCBOR


final class AttestManager {
    
    /// 共享实例
    static let shared = AttestManager()
    
    /// App 认证服务
    private let service = DCAppAttestService.shared
    
    // 获取密钥ID
    private func getKeyId() async throws -> String {
        if let keyId = KeyChainStore.get(forKey: "keyId") {
            return keyId
        }
        
        do {
            let result = try await service.generateKey()
            print(result)
            _  = KeyChainStore.save(value: result, forKey: "keyId")
            return result
        } catch {
            throw CreateError(code: 500, message: "设备密钥ID生成失败")
        }
     
    }
    
    // 生成设备认证数据
    func generateAttestation(_ challenge: String ) async throws -> [String: Any] {
        let keyId           = try await getKeyId()
        let clientDataHash  = SHA256.hash(data: Data(challenge.utf8))
        do {
            let attestationData = try await service.attestKey(keyId, clientDataHash: Data(clientDataHash))
            return [
                "keyId": keyId,
                "deviceUID": DeviceManager.shared.deviceUID,
                "challenge": challenge,
                "attestation": attestationData.base64EncodedString()
            ]
        } catch {
            throw CreateError(code: 500, message: "设备认证数据生成失败")
        }
    }
    
    // 生成设备负载认证数据
    func generateAssertion(_ payload: [String: Any]) async throws -> [String: Any] {
        let keyId           = try await getKeyId()
        let payloadData     = CBOR.encodeData(payload)
        let clientDataHash  = SHA256.hash(data: payloadData)
        do {
            let assertionData = try await service.generateAssertion(keyId, clientDataHash: Data(clientDataHash))
            return [
                "keyId": keyId,
                "deviceUID": DeviceManager.shared.deviceUID,
                "assertion": assertionData.base64EncodedString(),
                "payload": payloadData.base64EncodedString(),
            ]
        } catch {
            throw CreateError(code: 500, message: "生成负载认证数据失败")
        }
        
    }
    
}
