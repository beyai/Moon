import CoreGraphics


enum OBJECT_DETECTION_TYPES: String {
    // 模型
    case model
    // 结果
    case result
}

enum OBJECT_DETECTION_MODEL_STATES: String {
    case loading
    case ready
    case close
}


// 模型状态消息
struct ModelStateMessage {
    let state: OBJECT_DETECTION_MODEL_STATES
    
    func toDict() -> [String: Any] {
        return [
            "type": OBJECT_DETECTION_TYPES.model.rawValue,
            "state": state.rawValue
        ]
    }
}


// 检测结果
struct DetectionLabel {
    let label: String
    let confidence: Float
    let rect: CGRect
    
    func toDict() -> [String: Any] {
        return [
            "label": label,
            "confidence": confidence,
            "rect": rect.toDict()
        ]
    }
}


// 检测结果
struct DetectionResult {
    var data: [DetectionLabel]
    var timestamp: Int?
    
    func toDict() -> [String: Any] {
        return [
            "type": OBJECT_DETECTION_TYPES.result.rawValue,
            "timestamp": timestamp ?? 0,
            "data": data.map{ $0.toDict() }
        ]
    }
    
}


extension CGRect {
    func toDict() -> [String: Double] {
        return [
            "x": origin.x,
            "y": origin.y,
            "w": size.width,
            "h": size.height,
        ]
    }
}

