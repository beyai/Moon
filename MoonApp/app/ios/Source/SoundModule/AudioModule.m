#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(SoundModule, RCTEventEmitter)

// 同步获取支持语音
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(voicesSync)
// 获取支持的语音
RCT_EXTERN_METHOD(voices:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 设置音量
RCT_EXTERN_METHOD(setVolume:(float)volume resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 设置语音速度
RCT_EXTERN_METHOD(setVoiceRate:(float)rate resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 设置语音
RCT_EXTERN_METHOD(setVoice:(NSString *)voiceId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 初始化配置
RCT_EXTERN_METHOD(initConfig:(NSDictionary *)config resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 加载音频文件
RCT_EXTERN_METHOD(loadAudioFile:(NSString *)fileName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 播放音频文件
RCT_EXTERN_METHOD(playAudio:(NSString *)fileName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 停止音频文件
RCT_EXTERN_METHOD(stopAudio:(NSString *)fileName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 朗读文本
RCT_EXTERN_METHOD(speakVoice:(NSString *)text voiceId:(NSString *)voiceId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

// 停止朗读文本
RCT_EXTERN_METHOD(stopVoice:(BOOL)onWordBoundary resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
