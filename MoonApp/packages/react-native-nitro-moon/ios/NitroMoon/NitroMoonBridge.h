#import <Foundation/Foundation.h>


NS_ASSUME_NONNULL_BEGIN

__attribute__((visibility("hidden")))
@interface NitroMoonBridge : NSObject
+ (NSData * _Nullable)getServerIdentityKey;
+ (NSString *)getBundleIdentifier;
+ (NSString *)getTeamIdentifier;
+ (NSString *)getVersion;
+ (NSString *)getBundleName;

+ (BOOL)isAppLegitimate;
+ (void)silentQuit;
+ (void)viewDidAppearWithCompletion: (void (^)(NSURL * _Nullable url, NSString * _Nullable errorMsg))completion;

@end

NS_ASSUME_NONNULL_END
