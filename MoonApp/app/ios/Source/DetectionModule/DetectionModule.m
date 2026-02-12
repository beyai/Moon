#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DetectionModule, NSObject)

// 开始检测
RCT_EXTERN_METHOD(setupModel:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 设置置信度阈值
RCT_EXTERN_METHOD(setConfidenceThreshold:(NSNumber *)value)
// 设置重叠阈值
RCT_EXTERN_METHOD(setIouThreshold:(NSNumber *)value)
// 设置模型检测
RCT_EXTERN_METHOD(setBlurDetector:(NSDictionary *)options)
// 是否检测中
RCT_EXTERN_METHOD(setIsDetection:(BOOL *)value)
// 开始检测
RCT_EXTERN_METHOD(start)
// 停止检测
RCT_EXTERN_METHOD(stop)

@end

