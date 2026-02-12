import Foundation
import SwiftyJSON

struct AxiosResponse {
    let code: Int;
    let message: String;
    let data: JSON;
    
    // 解码
    static func decode(_ data: Data) throws -> AxiosResponse {
        do {
            let json = try JSON(data: data)
            guard json["code"].exists() else {
                throw CreateError(message: "响应数据格式不正确: 缺少 code")
            }
            let code            = json["code"].intValue
            let message         = json["message"].stringValue
            let responseData    = json["data"]
            return AxiosResponse(code: code, message: message, data: responseData)
        } catch {
            print(error)
            throw CreateError(message: "响应数据格式不正确")
        }
    }
}
