#import "NitroMoonBridge.h"
#import "MoonFilePack.h"
#import <NitroMoon/NitroMoon-Swift-Cxx-Bridge.hpp>

#if __has_include(<NitroMoon/NitroMoon-Swift.h>)
#import <NitroMoon/NitroMoon-Swift.h>
#else
#import "NitroMoon-Swift.h"
#endif


@implementation NitroMoonBridge

/**
 * 完整安全校验（核心接口）
 * 包含：砸壳检测 + 越狱检测 + 反调试 + 防注入
 * 核心逻辑：调用 C++ 层的完整校验
 */
+ (BOOL)isAppLegitimate {
    return NitroMoon::Internal::MoonFilePack::getInstance()->isAppLegitimate();
}

/**
 * 静默退出App
 */
+ (void)silentQuit {
    return NitroMoon::Internal::MoonFilePack::getInstance()->silentQuit();
}

/**
 * 获取混淆存储的服务器公钥 (P256 x963 格式)
 */
+ (NSData *)getServerIdentityKey {
    return NitroMoon::Internal::MoonFilePack::getInstance()->getSecureServerKey();
}

/**
 * 获取真实的App唯一标识
 */
+ (NSString *)getBundleIdentifier {
    return NitroMoon::Internal::MoonFilePack::getInstance()->getBundleIdentifier();
}

/**
 * 获取真实的团队ID
 */
+ (NSString *)getTeamIdentifier {
    return NitroMoon::Internal::MoonFilePack::getInstance()->getTeamIdentifier();
}

/**
 * 获取真实版本号
 */
+ (NSString *)getVersion {
    return NitroMoon::Internal::MoonFilePack::getInstance()->getVersion();
}

/**
 * 获取真实包名
 */
+ (NSString *)getBundleName {
    return NitroMoon::Internal::MoonFilePack::getInstance()->getBundleName();
}

/**
 * App启动时初始化
 */
+ (void)viewDidAppearWithCompletion: (void (^)(NSURL * _Nullable url, NSString * _Nullable errorMsg))completion {

    [NitroMoonController handleViewDidAppearWithCompletionHandler:^(NSURL * _Nullable url, NSError * _Nullable error) {
        if (error) {
            completion(nil, error.localizedDescription);
        } else {
            completion(url, nil);
        }
    }];
}

@end


