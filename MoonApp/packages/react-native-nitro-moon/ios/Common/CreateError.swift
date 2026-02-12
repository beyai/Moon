import Foundation

func CreateError(code: Int = 400, message: String) -> NSError {
    return NSError(
        domain: Bundle.main.bundleIdentifier ?? "Error",
        code: code,
        userInfo: [
            NSLocalizedDescriptionKey: message
        ]
    )
}

extension NSError {
    func toJSONString() -> String {
        let dict: [String: Any] = [
            "domain": self.domain,
            "code": self.code,
            "message": self.localizedDescription
        ]
        
        if let data = try? JSONSerialization.data(withJSONObject: dict, options: []) {
            return String(data: data, encoding: .utf8) ?? "{}"
        } else {
            return "{}"
        }
    }
}
