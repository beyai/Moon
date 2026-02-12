#import <React/RCTViewManager.h>
@interface RCT_EXTERN_REMAP_MODULE(QRScannerView, QRScannerViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onQRScan, RCTDirectEventBlock)
@end
