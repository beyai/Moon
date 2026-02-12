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

func RejectError(_ error: Error) -> (code: String, message: String) {
    if let nsError = error as NSError?, nsError.domain == Bundle.main.bundleIdentifier {
        return (code: "\(nsError.code)", message: nsError.localizedDescription)
    } else {
        return (code: "500", message: error.localizedDescription)
    }
}
