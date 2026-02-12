#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(CameraView, CameraViewManager, RCTViewManager)

// 相机筛选
RCT_EXPORT_VIEW_PROPERTY(filter, NSDictionary)

// 相机帧率
RCT_EXPORT_VIEW_PROPERTY(fps, NSNumber)

// 相机缩放
RCT_EXPORT_VIEW_PROPERTY(zoom, NSNumber)

// 相机对焦
RCT_EXPORT_VIEW_PROPERTY(focus, NSNumber)

// 相机曝光
RCT_EXPORT_VIEW_PROPERTY(exposure, NSNumber)

// 亮度
RCT_EXPORT_VIEW_PROPERTY(brightness, NSNumber)

// 画面方向
RCT_EXPORT_VIEW_PROPERTY(orientation, NSString)

// 相机预览
RCT_EXPORT_VIEW_PROPERTY(preview, BOOL)

// 回调：初始化完成
RCT_EXPORT_VIEW_PROPERTY(onInitialized, RCTDirectEventBlock)

// 回调：切换相机
RCT_EXPORT_VIEW_PROPERTY(onChangeDevice, RCTDirectEventBlock)

@end

