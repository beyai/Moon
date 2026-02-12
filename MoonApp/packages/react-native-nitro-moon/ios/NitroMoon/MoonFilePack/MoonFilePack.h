#ifndef MoonFilePack_h
#define MoonFilePack_h

#include <string>
#include <vector>
#include <cstdint>
#include <mach-o/loader.h>

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#endif

namespace NitroMoon {
    namespace Internal {
        
        class MoonFilePack {
        public:
            // 单例获取
            static MoonFilePack* getInstance();
            
            // 核心校验：环境合法性检查
            bool isAppLegitimate();
            // 静默退出
            void silentQuit();
            
#ifdef __OBJC__
            // 获取还原后的安全服务器公钥
            NSData* getSecureServerKey();
            // 获取真实的App唯一标识
            NSString* getBundleIdentifier();
            // 获取团队ID
            NSString* getTeamIdentifier();
            // 获取版本号
            NSString* getVersion();
            // 获取包名
            NSString* getBundleName();
            
#endif

        private:
            MoonFilePack() {}
            // 禁止拷贝构造
            MoonFilePack(const MoonFilePack&) = delete;
            MoonFilePack& operator=(const MoonFilePack&) = delete;
            
            uint32_t _getLinkEditFileOffset(const struct mach_header_64* header);
            NSString* _getTeamIDFromProvisioningProfile();
            NSString* _getTeamIDFromMachO();
            NSDictionary* _readMetadataFromMemory();
            
            
            // 底层检测私有方法
            bool _isBinaryEncrypted();
            bool _isJailbroken();
            bool _isSimulator();
            bool _checkCryptid();
            bool _isSandboxBreached();
            bool _hasDangerousFiles();
            bool _hasDangerousURLSchemes();
            bool _canExecuteFork();
            bool _hasSuspiciousLibraries();
            bool _hasDangerousDirectories();
            bool _isBeingDebugged();
            bool _isInjected();
            bool _fileExists(const std::string& path);
            
            
        };
    }
}

#endif
