#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RTCModule, RCTEventEmitter)

RCT_EXTERN_METHOD(setLiveStream: (NSDictionary *)liveStream)
RCT_EXTERN_METHOD(setIceServers: (NSDictionary *)iceServers)

RCT_EXTERN_METHOD(createPeerConnection)
RCT_EXTERN_METHOD(closePeerConnection)
RCT_EXTERN_METHOD(addRemoteDescription: (NSDictionary *)desc)
RCT_EXTERN_METHOD(addIceCandidate: (NSDictionary *)candidate)
RCT_EXTERN_METHOD(sendActionMessage: (NSDictionary *)message)


@end
