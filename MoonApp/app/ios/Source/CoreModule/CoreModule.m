#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CoreModule, RCTEventEmitter)

// 获取设备码
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getDeviceCode)

// 获取相机权限
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getCameraPermissionStatus)

// 获取屏幕亮度
RCT_EXTERN_METHOD(getBrightness:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 恢复屏幕亮度
RCT_EXTERN_METHOD(restoreBrightness)

// 设置屏幕亮度
RCT_EXTERN_METHOD(setBrightness:(NSNumber *)value)

// 开启或关闭熄屏
RCT_EXTERN_METHOD(setIdleTimeDisabled:(BOOL *)value)

// 请求相机权限
RCT_EXTERN_METHOD(requestCameraPermission:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 获取电池电量
RCT_EXTERN_METHOD(getBattery:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

// 获取屏幕捕获状态
RCT_EXTERN_METHOD(getScreenCaptureState:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
