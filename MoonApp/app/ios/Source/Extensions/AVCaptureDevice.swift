import AVFoundation

struct CameraFormatInfo {
    let name: String
    let uniqueID: String
    let deviceType: String
    let position: String
    let width: Int32
    let height: Int32
    let minFps: Int32
    let maxFps: Int32
    let isWideColorSupported: Bool
    let isVideoHDRSupported: Bool
    let supportsDepthCapture: Bool
    let minExposureDuration: Int32
    let maxExposureDuration: Int32
    let minExposureTargetBias: Float
    let maxExposureTargetBias: Float
    let minZoom: CGFloat
    let maxZoom: CGFloat
    let minISO: Float
    let maxISO: Float
    
    func toDictionary() -> [String: Any] {
        return [
            "name": name,
            "uniqueID": uniqueID,
            "deviceType": deviceType,
            "position": position,
            "width": width,
            "height": height,
            "minFps": minFps,
            "maxFps": maxFps,
            "minZoom": minZoom,
            "maxZoom": maxZoom,
            "minISO": minISO,
            "maxISO": maxISO,
            "isWideColorSupported": isWideColorSupported,
            "isVideoHDRSupported": isVideoHDRSupported,
            "supportsDepthCapture": supportsDepthCapture,
            "minExposureDuration": minExposureDuration,
            "maxExposureDuration": maxExposureDuration,
            "minExposureTargetBias": minExposureTargetBias,
            "maxExposureTargetBias": maxExposureTargetBias,
        ]
    }
}

struct FilterFormat {
    let position: String
    let width: Int32
    let height: Int32
    let maxFps: Int32
}

extension AVCaptureDevice {

    var minExposureDuration: Int32 {
        let duration = activeFormat.videoSupportedFrameRateRanges.first?.minFrameDuration
        return duration?.timescale ?? 1
    }

    var maxExposureDuration: Int32 {
        let duration = activeFormat.videoSupportedFrameRateRanges.first?.maxFrameDuration
        return duration?.timescale ?? 1
    }

    var minZoom: CGFloat {
        return minAvailableVideoZoomFactor
    }

    var maxZoom: CGFloat {
        return activeFormat.videoMaxZoomFactor
    }
    
    // 当前格式描述信息
    func currentFormatDescription() -> CameraFormatInfo {
        let format = self.activeFormat
        return CameraFormatInfo(
            name: self.localizedName,
            uniqueID: self.uniqueID,
            deviceType: String(describing: self.deviceType.rawValue),
            position: {
                switch position {
                    case .front: return "front"
                    case .back: return "back"
                    case .unspecified: return "unspecified"
                    @unknown default: return "@unknown"
                }
            }(),
            width: format.width,
            height: format.height,
            minFps: format.minFps,
            maxFps: format.maxFps,
            isWideColorSupported: format.isWideColorSupported,
            isVideoHDRSupported: format.isVideoHDRSupported,
            supportsDepthCapture: format.supportsDepthCapture,
            minExposureDuration: self.minExposureDuration,
            maxExposureDuration: self.maxExposureDuration,
            minExposureTargetBias: self.minExposureTargetBias,
            maxExposureTargetBias: self.maxExposureTargetBias,
            minZoom: self.minZoom,
            maxZoom: self.maxZoom,
            minISO: format.minISO,
            maxISO: format.maxISO
        )
    }
    
    // 筛选格式
    func filterFormat(_ filterFormat: FilterFormat ) -> AVCaptureDevice.Format? {
        let matchFormats = self.formats.filter { format in
            return format.width == filterFormat.width && format.height == filterFormat.height && format.maxFps == filterFormat.maxFps
        }
        return matchFormats.first
    }
    
}


extension AVCaptureDevice.Format {

    var width: Int32 {
        let dims = CMVideoFormatDescriptionGetDimensions(formatDescription)
        return dims.width
    }

    var height: Int32 {
        let dims = CMVideoFormatDescriptionGetDimensions(formatDescription)
        return dims.height
    }

    var minFps: Int32 {
        let minRange = videoSupportedFrameRateRanges.min { l, r in
            return l.minFrameRate < r.minFrameRate
        }
        return Int32(minRange?.minFrameRate ?? 0)
    }

    var maxFps: Int32 {
        let maxRange = videoSupportedFrameRateRanges.max { l, r in
            return l.maxFrameRate < r.maxFrameRate
        }
        return Int32(maxRange?.maxFrameRate ?? 0)
    }

    var supportsDepthCapture: Bool {
        return !supportedDepthDataFormats.isEmpty
    }
    
    var isWideColorSupported: Bool {
        return self.supportedColorSpaces.contains(.P3_D65)
    }

}
