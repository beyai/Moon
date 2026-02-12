import Foundation
import SwiftCBOR

extension CBOR {
    
    // 编码
    static func encodeData(_ from: Any?) -> Data {
        let cbor = encodeToCBOR(from)
        let encoded = cbor.encode()
        return Data(encoded)
    }
    
    // 解码
    static func decodeData(_ data: Data) -> Any? {
        guard let decoded = try? CBOR.decode([UInt8](data)) else {
            return nil
        }
        return decodeFromCBOR(decoded)
    }
    
    /// 转换任意类型到CBOR
    private static func encodeToCBOR(_ value: Any?) -> CBOR {
        guard let value = value else {
            return CBOR.null
        }
        
        switch value {
            case let val as String:
                return CBOR.utf8String(val)
            
            case let val as any BinaryInteger:
                let i64 = Int64(val)
                return i64 >= 0 ? CBOR.unsignedInt(UInt64(i64)) : CBOR.negativeInt(UInt64(-(i64 + 1)))
            
            case let val as UInt:
                return CBOR.unsignedInt(UInt64(val))
            
            case let val as Double:
                return CBOR.double(val)
                
            case let val as Float:
                return CBOR.float(val)
            
            case let val as Bool:
                return CBOR.boolean(val)
            
            case let val as Data:
                return CBOR.byteString(Array(val))
            
            case let val as [UInt8]:
                return CBOR.byteString(val)
            
            case let dict as [String: Any?]:
                var map: [CBOR: CBOR] = [:]
                for (k, v) in dict {
                    map[.utf8String(k)] = encodeToCBOR(v)
                }
                return CBOR.map(map)
            
            case let arr as [Any]:
                return CBOR.array( arr.map { encodeToCBOR($0) } )
            
            case let val as Date:
                let formatter = DateFormatter()
                formatter.timeZone = TimeZone.current
                formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
                return CBOR.utf8String(formatter.string(from: val))
            
            default:
                return CBOR.undefined
        }
    }
    
    
    /// 解码CBOR转任意类型
    private static func decodeFromCBOR(_ cbor: CBOR) -> Any {
        switch cbor {
            case let CBOR.utf8String(val):
                return val
            
            case let CBOR.unsignedInt(val):
                return Int(val)
            
            case let CBOR.negativeInt(val):
                return -(Int(val) + 1)
            
            case let CBOR.boolean(val):
                return val
            
            case let CBOR.double(val):
                return val
            
            case let CBOR.float(val):
                return val
            
            case let CBOR.half(val):
                return Double(val)
            
            case let CBOR.date(val):
                let formatter = DateFormatter()
                formatter.timeZone = TimeZone.current
                formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
                return formatter.string(from: val)
            
            case let CBOR.byteString(val):
                return Data(val)
            
            case let CBOR.array(arr):
                return arr.map { decodeFromCBOR($0) }
            
            case let CBOR.map(map):
                var dict: [String: Any] = [:]
                for (key, value) in map {
                    let keyString: String
                    switch key {
                        case let CBOR.utf8String(k):
                            keyString = k
                        default:
                            keyString = String(describing: key)
                    }
                    dict[keyString] = decodeFromCBOR(value)
                }
                return dict
            
            case .null:
                return NSNull()
            
            default:
                return NSNull()
        }
    }
}
