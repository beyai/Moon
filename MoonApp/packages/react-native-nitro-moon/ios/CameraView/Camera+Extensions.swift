import AVFoundation

extension CameraFilter: Equatable {
    public static func == (lhs: CameraFilter, rhs: CameraFilter) -> Bool {
        return lhs.width == rhs.width &&
               lhs.height == rhs.height &&
               lhs.maxFps == rhs.maxFps &&
               lhs.position == rhs.position
    }
}

extension CameraOrientation {
    var videoOrientation: AVCaptureVideoOrientation {
        switch self {
        case .up:
            return .portrait
        case .down:
            return .portraitUpsideDown
        case .left:
            return .landscapeLeft
        case .right:
            return .landscapeRight
        default:
            return .portrait
        }
    }
}


extension AVCaptureDevice {
    
    // 查找相机设备
    static func findDevice(for position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        //if position == .front {
        //    return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
        //        ?? AVCaptureDevice.default(.builtInTrueDepthCamera, for: .video, position: .front)
        //} else {
        //    return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
        //        ?? AVCaptureDevice.default(.builtInUltraWideCamera, for: .video, position: .back)
        //}
        // 优先使用三摄/双摄，降级到广角
        if position == .front {
            return AVCaptureDevice.default(.builtInTrueDepthCamera, for: .video, position: .front)
                ?? AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
        } else {
            let deviceTypes: [AVCaptureDevice.DeviceType] = [
                .builtInTripleCamera,      // 优先：三摄 (支持 0.5x, 1x, 2x/3x...)
                //.builtInDualWideCamera,    // 次选：广角+超广角 (支持 0.5x, 1x)
                .builtInWideAngleCamera    // 保底：单摄 (仅支持 1x)
            ]
            let session = AVCaptureDevice.DiscoverySession( deviceTypes: deviceTypes, mediaType: .video, position: .back )
            return session.devices.first
        }
        
    }

    var minExposureDuration: Double {
        let duration = activeFormat.videoSupportedFrameRateRanges.first?.minFrameDuration
        return Double(duration?.timescale ?? 1)
    }

    var maxExposureDuration: Double {
        let duration = activeFormat.videoSupportedFrameRateRanges.first?.maxFrameDuration
        return Double(duration?.timescale ?? 1)
    }

    var minZoom: Double {
        return Double(minAvailableVideoZoomFactor)
    }

    var maxZoom: Double {
        return Double(activeFormat.videoMaxZoomFactor)
    }
    
    // 当前格式描述信息
    func currentFormatDescription() -> CameraFormat {
        let format = self.activeFormat
        return CameraFormat(
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
            minExposureTargetBias: Double(self.minExposureTargetBias),
            maxExposureTargetBias: Double(self.maxExposureTargetBias),
            minZoom: self.minZoom,
            maxZoom: self.maxZoom,
            minISO: Double(format.minISO),
            maxISO: Double(format.maxISO)
        )
    }
    
    // 筛选格式
    func filterFormat(_ filterFormat: CameraFilter ) -> AVCaptureDevice.Format? {
        let matchFormats = self.formats.filter { format in
            return format.width == Double(filterFormat.width)
            && format.height == Double(filterFormat.height)
            && format.maxFps == Double(filterFormat.maxFps)
        }
        return matchFormats.first
    }
}


extension AVCaptureDevice.Format {

    var width: Double {
        let dims = CMVideoFormatDescriptionGetDimensions(formatDescription)
        return Double(dims.width)
    }

    var height: Double {
        let dims = CMVideoFormatDescriptionGetDimensions(formatDescription)
        return Double(dims.height)
    }

    var minFps: Double {
        let minRange = videoSupportedFrameRateRanges.min { l, r in
            return l.minFrameRate < r.minFrameRate
        }
        return Double(minRange?.minFrameRate ?? 0)
    }

    var maxFps: Double {
        let maxRange = videoSupportedFrameRateRanges.max { l, r in
            return l.maxFrameRate < r.maxFrameRate
        }
        return Double(maxRange?.maxFrameRate ?? 0)
    }

    var supportsDepthCapture: Bool {
        return !supportedDepthDataFormats.isEmpty
    }
    
    var isWideColorSupported: Bool {
        return self.supportedColorSpaces.contains(.P3_D65)
    }

}
