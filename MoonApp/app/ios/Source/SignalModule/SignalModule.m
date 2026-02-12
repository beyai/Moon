#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(SignalModule, RCTEventEmitter)

// 连接
RCT_EXTERN_METHOD(connect)
// 发送
RCT_EXTERN_METHOD(send:(NSDictionary *)message)
// 关闭
RCT_EXTERN_METHOD(close)

@end

