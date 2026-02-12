import CoreML

class ThresholdProvider: MLFeatureProvider {
    var values: [String: MLFeatureValue]

    var featureNames: Set<String> {
        return Set(values.keys)
    }

    init(iouThreshold: Double = 0.45, confidenceThreshold: Double = 0.25) {
        values = [
            "iouThreshold": MLFeatureValue(double: iouThreshold),
            "confidenceThreshold": MLFeatureValue(double: confidenceThreshold),
        ]
    }
    
    func featureValue(for featureName: String) -> MLFeatureValue? {
        return values[featureName]
    }
}
