import Foundation

enum ImageUploader {
    
    private static let logger: RTCLogger = {
        return RTCLogger("ImageUploader")
    }()
    
    // 请求地址
    static public var uploadURL: URL?
    
    /// 上传
    static public func upload(_ videoFrame: VideoFrame ) {
        guard let imgData = videoFrame.toJPEG() else {
            return
        }
        sendRequest(imgData, fileName: String("\( videoFrame.timestamp )"))
    }
    
    /// 构建标准 multipart/form-data
    private static func createMultipartData(_ req: inout URLRequest, fileName: String, imageData: Data) -> Data {
        let boundary = "----WebKitFormBoundary\(UUID().uuidString)"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        let lineBreak = "\r\n"
        let fileField = "file" // 表单字段名
        
        body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fileField)\"; filename=\"\(fileName).jpg\"\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\(lineBreak)\(lineBreak)".data(using: .utf8)!)
        body.append(imageData)
        body.append(lineBreak.data(using: .utf8)!)
        body.append("--\(boundary)--\(lineBreak)".data(using: .utf8)!)

        return body
    }
    
    
    // 发送请求
    private static func sendRequest(_ imageData: Data, fileName: String ) {
        guard let uploadURL = uploadURL else { return }
        
        var req = URLRequest(url: uploadURL)
        req.httpMethod = "POST"
        
        let formData = createMultipartData(&req, fileName: fileName, imageData: imageData)
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        let session = URLSession(configuration: config)
        
        let task = session.uploadTask(with: req, from: formData) { data, response, error in
            if let error = error {
                logger.debug("Upload error: \(error.localizedDescription)")
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                logger.debug("Upload failed: invalid response")
                return
            }

            if httpResponse.statusCode == 200 {
                logger.debug("Upload successful: \(fileName)")
            } else {
                logger.debug("Upload HTTP error: \(httpResponse.statusCode)")
            }
        }
        
        task.resume()
    }
}
