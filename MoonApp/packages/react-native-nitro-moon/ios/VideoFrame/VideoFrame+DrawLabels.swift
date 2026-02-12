import Accelerate
import AVFoundation
import UIKit

/// 绘制检测框数据
struct DrawLabelData {
    let rect: CGRect
    let text: String
    let lineWidth: CGFloat
    let textColor: UIColor
    let bgColor: UIColor

    init(
        rect: CGRect,
        text: String,
        lineWidth: CGFloat = 2,
        textColor: UIColor = .white,
        bgColor: UIColor = .red
    ) {
        self.rect = rect
        self.text = text
        self.lineWidth = lineWidth
        self.textColor = textColor
        self.bgColor = bgColor
    }
}


extension VideoFrame {
    
    /// 绘制目标检测框
    func drawLabels(overlays: [DrawLabelData]) {
        guard !overlays.isEmpty else { return }
        
        let pixelBuffer = self.pixelBuffer
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
            return
        }
        
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
        
        // 创建上下文
        guard let context = CGContext(
            data: baseAddress,
            width: self.width,
            height: self.height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else { return }

        // 性能优化设置
        context.setShouldAntialias(false)
        context.interpolationQuality = .none

        for overlay in overlays {
            
            let rect = CGRect(
                x: overlay.rect.origin.x,
                y: CGFloat(height) - overlay.rect.origin.y - overlay.rect.height,
                width: overlay.rect.width,
                height: overlay.rect.height
            )

            // 绘制矩形框
            context.setStrokeColor(overlay.bgColor.cgColor)
            context.setLineWidth(overlay.lineWidth)
            context.stroke(rect)

            guard !overlay.text.isEmpty else { continue }

            // 绘制文字
            let fontSize = max(14, CGFloat(height) / 40)
            let font = CTFontCreateWithName("Helvetica-Bold" as CFString, fontSize, nil)
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: overlay.textColor.cgColor,
                .backgroundColor: overlay.bgColor.withAlphaComponent(1.0).cgColor
            ]
            let text = NSAttributedString(string: overlay.text, attributes: attributes)
            let line = CTLineCreateWithAttributedString(text)

            let textHeight = fontSize + 4
            var textY = rect.maxY + 2
            if textY + textHeight > CGFloat(height) {
                textY = rect.minY + 2
            }

            context.saveGState()
            context.setShouldAntialias(true)
            context.interpolationQuality = .high
            context.textMatrix = .identity
            context.textPosition = CGPoint(x: rect.minX, y: textY)
            CTLineDraw(line, context)
            context.restoreGState()
        }
    }
}
