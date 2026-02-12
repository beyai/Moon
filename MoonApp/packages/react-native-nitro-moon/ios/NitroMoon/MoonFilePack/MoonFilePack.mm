#include "MoonFilePack.h"
#include <mach-o/dyld.h>
#include <mach-o/loader.h>
#include <mach-o/getsect.h>
#include <sys/sysctl.h>
#include <dlfcn.h>
#include <fstream>
#include <cstring>
#include <sys/stat.h>
#include <CommonCrypto/CommonCrypto.h>
#include <Foundation/Foundation.h>
#include <UIKit/UIKit.h>
#include <arpa/inet.h>

#ifndef CS_MAGIC_EMBEDDED_SIGNATURE
#define CS_MAGIC_EMBEDDED_SIGNATURE 0xfade0cc0
#endif

#ifndef CS_MAGIC_CODEDIRECTORY
#define CS_MAGIC_CODEDIRECTORY 0xfade0c02
#endif

#ifndef CSSLOT_CODEDIRECTORY
#define CSSLOT_CODEDIRECTORY 0
#endif

// TeamID 在该结构体中的偏移量
struct CS_CodeDirectory {
    uint32_t magic;
    uint32_t length;
    uint32_t version;
    uint32_t flags;
    uint32_t hashOffset;
    uint32_t identOffset;
    uint32_t nSpecialSlots;
    uint32_t nCodeSlots;
    uint32_t codeLimit;
    uint8_t  hashSize;
    uint8_t  hashType;
    uint8_t  spare1;
    uint8_t  pageSize;
    uint32_t spare2;
    uint32_t scatterOffset;
    uint32_t teamOffset;
};

namespace {
    static const uint8_t kXorKey = 0x2D;
    static const uint8_t kSecretData[] = {
        0x29, 0x8A, 0x52, 0xE7, 0x4D, 0x74, 0xBF, 0x0F, 0xA4, 0x98, 0x49, 0xE9, 0x61,
        0xA6, 0xFB, 0xE3, 0x8E, 0x81, 0x7C, 0x37, 0xAE, 0x74, 0x44, 0x28, 0xEA, 0xB7,
        0x87, 0x5C, 0x6F, 0xFB, 0xD6, 0x9C, 0xB1, 0xAC, 0x50, 0x02, 0x68, 0x0B, 0xC4,
        0x44, 0x1F, 0x95, 0x0E, 0xEA, 0x36, 0x23, 0xF5, 0x5E, 0x1A, 0x67, 0x3E, 0xB7,
        0x75, 0x38, 0xC6, 0x08, 0x58, 0x40, 0xA2, 0x20, 0x02, 0xEE, 0xA6, 0x94, 0x10
    };

    __attribute__((always_inline))
    inline std::vector<uint8_t> _rebuild() {
        std::vector<uint8_t> buffer;
        buffer.reserve(65);
        for(int i = 0; i < 65; i++) {
            buffer.push_back(kSecretData[i] ^ kXorKey);
        }
        return buffer;
    }
    
    __attribute__((always_inline))
    inline void silent_quit() {
        // 使用系统调用直接退出，状态码 0 保证不留崩溃记录
        #ifdef SYS_exit
        syscall(SYS_exit, 0);
        #else
        _exit(0);
        #endif
    }
}

namespace NitroMoon {
    namespace Internal {

        // 单例实现
        MoonFilePack* MoonFilePack::getInstance() {
            static MoonFilePack instance;
            return &instance;
        }
        
        // 环境安装检测
        bool MoonFilePack::isAppLegitimate() {
            if (!_isBinaryEncrypted()) return false;
            if (_isJailbroken()) return false;
            if (_isInjected()) return false;
            return true;
        }
    
        // 静默退出
        void MoonFilePack::silentQuit() {
            silent_quit();
        }
        // 获取团队唯一标识
        NSString* MoonFilePack::getTeamIdentifier() {
            NSString* memoryID = _getTeamIDFromMachO();
            if (memoryID && memoryID.length > 0) {
                return memoryID;
            }
            return _getTeamIDFromProvisioningProfile();
        }
        // 获取 App 唯一标识
        NSString* MoonFilePack::getBundleIdentifier() {
            NSDictionary *plist = _readMetadataFromMemory();
            if (plist && plist[@"CFBundleIdentifier"]) {
                return plist[@"CFBundleIdentifier"];
            }
            return [[NSBundle mainBundle] bundleIdentifier] ?: @"";
        }
        
        // 获取 App 包名
        NSString* MoonFilePack::getBundleName() {
            NSDictionary *plist = _readMetadataFromMemory();
            if (plist && plist[@"CFBundleName"]) {
                return plist[@"CFBundleName"];
            }
            return [NSBundle mainBundle].infoDictionary[@"CFBundleName"] ?: @"";
        }
        
        // 获取 App 版本号
        NSString* MoonFilePack::getVersion() {
            NSDictionary *plist = _readMetadataFromMemory();
            if (plist && plist[@"CFBundleShortVersionString"]) {
                return plist[@"CFBundleShortVersionString"];
            }
            return [NSBundle mainBundle].infoDictionary[@"CFBundleShortVersionString"] ?: @"0.0.0";
        }
        
        // 获取服务端公钥
        NSData* MoonFilePack::getSecureServerKey() {
#if !DEBUG
            if (!isAppLegitimate()) {
                return nil;
            }
#endif
            auto raw = _rebuild();
            NSData* data = [NSData dataWithBytes:raw.data() length:raw.size()];
            
            std::fill(raw.begin(), raw.end(), 0);
            return data;
        }
        
    
        // ========== 核心接口实现 ==========
        bool MoonFilePack::_isBinaryEncrypted() {
            NSString *path = [[NSBundle mainBundle] executablePath];
            NSData *data = [NSData dataWithContentsOfFile:path];
            if (!data) return false;

            const uint8_t *bytes = (const uint8_t *)[data bytes];
            const struct mach_header_64 *header = (const struct mach_header_64 *)bytes;

            if (header->magic != MH_MAGIC_64) return false;

            uintptr_t cur = (uintptr_t)bytes + sizeof(struct mach_header_64);

            for (uint32_t i = 0; i < header->ncmds; i++) {
                struct load_command* lc = (struct load_command*)cur;

                if (lc->cmd == LC_ENCRYPTION_INFO_64) {
                    struct encryption_info_command_64* crypt =
                    (struct encryption_info_command_64*)lc;
                    return crypt->cryptid != 0;
                }

                cur += lc->cmdsize;
            }

            return false;
        }

        bool MoonFilePack::_isJailbroken() {
            if (_isSimulator()) {
                return false;
            }
            
            // 反调试：检测到调试器直接判定为越狱
            if (_isBeingDebugged()) {
                return true;
            }
            
            // 多维度越狱检测（任意一项为 true 则判定）
            bool checks[] = {
                _isSandboxBreached(),
                _hasDangerousFiles(),
                _hasDangerousURLSchemes(),
                _canExecuteFork(),
                _hasSuspiciousLibraries(),
                _hasDangerousDirectories()
            };
            
            // 多次校验（防动态 Hook 篡改）
            for (int i = 0; i < 3; i++) {
                for (bool check : checks) {
                    if (check) {
                        return true;
                    }
                }
            }
            return false;
        }

        bool MoonFilePack::_isSimulator() {
            // 运行时检测模拟器环境变量
            const char* simulatorEnv = getenv("SIMULATOR_DEVICE_NAME");
            if (simulatorEnv != nullptr && strlen(simulatorEnv) > 0) {
                return true;
            }
            
            // 编译期检测 x86/x86_64 架构（模拟器特征）
#ifdef __i386__
            return true;
#endif
#ifdef __x86_64__
            return true;
#endif
            
            return false;
        }


        // ========== 底层检测实现 ==========
        bool MoonFilePack::_checkCryptid() {
            // 获取主二进制 Mach-O 头
            const struct mach_header* header32 = _dyld_get_image_header(0);
            if (header32 == nullptr) {
                return false;
            }
            
            uintptr_t cur = (uintptr_t)header32 + sizeof(struct mach_header);
            uint32_t ncmds = header32->ncmds;
            
            // 兼容 64 位 Mach-O 头
            if (header32->magic == MH_MAGIC_64 || header32->magic == MH_CIGAM_64) {
                cur = (uintptr_t)header32 + sizeof(struct mach_header_64);
                const struct mach_header_64* header64 = (const struct mach_header_64*)header32;
                ncmds = header64->ncmds;
            }
            
            // 遍历 Load Command 查找加密指令
            for (uint32_t i = 0; i < ncmds; i++) {
                struct load_command* lc = (struct load_command*)cur;
                if (!lc) break;
                
                // 64 位加密指令
                if (lc->cmd == LC_ENCRYPTION_INFO_64) {
                    struct encryption_info_command_64* crypt_cmd = (struct encryption_info_command_64*)lc;
                    return crypt_cmd->cryptid != 0;
                }
                // 32 位加密指令（兼容低版本 iOS）
                else if (lc->cmd == LC_ENCRYPTION_INFO) {
                    struct encryption_info_command* crypt_cmd = (struct encryption_info_command*)lc;
                    return crypt_cmd->cryptid != 0;
                }
                
                cur += lc->cmdsize;
            }
            
            // 未找到加密指令 = 未加密（砸壳/debug 包）
            return false;
        }

        bool MoonFilePack::_isSandboxBreached() {
            // 尝试写入沙箱外路径，能写入则沙箱被突破（越狱特征）
            const char* testPaths[] = {
                "/private/debug.txt",
                "/var/root/test.txt",
                "/bin/test.txt"
            };
            const char* testContent = "sandbox_test";
            
            for (const char* path : testPaths) {
                std::ofstream file(path);
                if (file.is_open()) {
                    file << testContent;
                    file.close();
                    // 清理测试文件
                    unlink(path);
                    return true;
                }
            }
            return false;
        }

        bool MoonFilePack::_hasDangerousFiles() {
            // 越狱相关危险文件/路径列表
            const char* dangerousPaths[] = {
                "/usr/sbin/frida-server", // frida
                "/etc/apt/sources.list.d/electra.list", // electra
                "/etc/apt/sources.list.d/sileo.sources", // electra
                "/.bootstrapped_electra", // electra
                "/usr/lib/libjailbreak.dylib", // electra
                "/jb/lzma", // electra
                "/.cydia_no_stash", // unc0ver
                "/.installed_unc0ver", // unc0ver
                "/jb/offsets.plist", // unc0ver
                "/usr/share/jailbreak/injectme.plist", // unc0ver
                "/etc/apt/undecimus/undecimus.list", // unc0ver
                "/var/lib/dpkg/info/mobilesubstrate.md5sums", // unc0ver
                "/Library/MobileSubstrate/MobileSubstrate.dylib",
                "/jb/jailbreakd.plist", // unc0ver
                "/jb/amfid_payload.dylib", // unc0ver
                "/jb/libjailbreak.dylib", // unc0ver
                "/usr/libexec/cydia/firmware.sh",
                "/Applications/Cydia.app",
                "/Applications/FakeCarrier.app",
                "/Applications/Icy.app",
                "/Applications/IntelliScreen.app",
                "/Applications/MxTube.app",
                "/Applications/RockApp.app",
                "/Applications/SBSettings.app",
                "/Applications/WinterBoard.app",
                "/Applications/blackra1n.app",
                "/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist",
                "/Library/MobileSubstrate/DynamicLibraries/Veency.plist",
                "/Library/MobileSubstrate/MobileSubstrate.dylib",
                "/Library/MobileSubstrate/CydiaSubstrate.dylib",
                "/System/Library/LaunchDaemons/com.ikey.bbot.plist",
                "/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist",
                "/bin/bash",
                "/bin/sh",
                "/etc/apt",
                "/etc/ssh/sshd_config",
                "/var/log/apt",
                "/private/var/lib/apt/",
                "/private/var/lib/cydia",
                "/private/var/Users/",
                "/private/var/lib/apt",
                "/private/var/mobile/Library/SBSettings/Themes",
                "/private/var/stash",
                "/private/var/tmp/cydia.log",
                "/private/var/cache/apt/",
                "/private/var/log/syslog",
                "/var/tmp/cydia.log",
                "/usr/bin/sshd",
                "/usr/libexec/sftp-server",
                "/usr/libexec/ssh-keysign",
                "/usr/sbin/sshd",
                "/var/cache/apt",
                "/var/lib/apt",
                "/var/lib/cydia",
                "/usr/sbin/frida-server",
                "/usr/bin/cycript",
                "/usr/local/bin/cycript",
                "/usr/lib/libcycript.dylib",
                "/var/log/syslog",
            };
            
            for (const char* path : dangerousPaths) {
                if (_fileExists(path)) {
                    return true;
                }
            }
            return false;
        }

        bool MoonFilePack::_hasDangerousURLSchemes() {
            @autoreleasepool {
                const char* schemes[] = {
                    "undecimus://",
                    "cydia://",
                    "sileo://",
                    "zbra://"
                };
                int hitCount = 0; // 统计命中的 Scheme 数量
                for (const char* scheme : schemes) {
                    NSString* schemeStr = [NSString stringWithUTF8String:scheme];
                    NSURL* url = [NSURL URLWithString:schemeStr];
                    if (!url) continue;
                    
                    if ([[UIApplication sharedApplication] canOpenURL:url]) {
                        hitCount++;
                    }
                }
                return hitCount > 0;
            }
        }

        bool MoonFilePack::_canExecuteFork() {
            // 调用 fork() 系统调用，越狱设备可执行，正版设备被限制
            pid_t forkResult = fork();
            if (forkResult >= 0) {
                if (forkResult > 0) {
                    kill(forkResult, SIGTERM); // 终止子进程
                }
                return true;
            }
            return false;
        }

        bool MoonFilePack::_hasSuspiciousLibraries() {
            // 检测加载的可疑动态库
            const char* suspiciousLibs[] = {
                "MobileSubstrate",
                "CydiaSubstrate",
                "frida",
                "SubstrateLoader",
                "cycript"
            };
            
            for (uint32_t i = 0; i < _dyld_image_count(); i++) {
                const char* libName = _dyld_get_image_name(i);
                if (!libName) continue;
                
                std::string libStr(libName);
                for (const char* suspicious : suspiciousLibs) {
                    if (libStr.find(suspicious) != std::string::npos) {
                        return true;
                    }
                }
            }
            return false;
        }

        bool MoonFilePack::_hasDangerousDirectories() {
            // 越狱相关目录/符号链接
            const char* paths[] = {
                "/Applications",
                "/Library/Ringtones",
                "/usr/libexec"
            };

            struct stat st;
                for (const char* path : paths) {
                    if (lstat(path, &st) == 0) {
                        if (S_ISLNK(st.st_mode)) {
                            return true;
                        }
                    }
                }
                return false;
        }

        bool MoonFilePack::_isBeingDebugged() {
            // 检测是否被调试（lldb/Frida 等）
            struct kinfo_proc info;
            size_t infoSize = sizeof(info);
            int mib[4] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()};
            
            int result = sysctl(mib, 4, &info, &infoSize, nullptr, 0);
            if (result == 0 && (info.kp_proc.p_flag & P_TRACED) != 0) {
                return true;
            }
            return false;
        }

        bool MoonFilePack::_isInjected() {
            // 检测可疑注入库
            const char* injectLibs[] = {"libfrida", "libsubstrate", "libcycript"};
            
            for (const char* lib : injectLibs) {
                void* handle = dlopen(lib, RTLD_NOLOAD);
                if (handle) {
                    dlclose(handle);
                    return true;
                }
            }
            return false;
        }

        bool MoonFilePack::_fileExists(const std::string& path) {
            struct stat buffer;
            return (stat(path.c_str(), &buffer) == 0);
        }
    
        
        uint32_t MoonFilePack::_getLinkEditFileOffset(const struct mach_header_64* header) {
            uintptr_t cur = (uintptr_t)header + sizeof(struct mach_header_64);
            for (uint32_t i = 0; i < header->ncmds; i++) {
                struct load_command* lc = (struct load_command*)cur;
                if (lc->cmd == LC_SEGMENT_64) {
                    struct segment_command_64* seg = (struct segment_command_64*)lc;
                    if (strcmp(seg->segname, "__LINKEDIT") == 0) {
                        return (uint32_t)seg->fileoff;
                    }
                }
                cur += lc->cmdsize;
            }
            return 0;
        }
        
        NSString* MoonFilePack::_getTeamIDFromMachO() {
            const struct mach_header_64* header = (const struct mach_header_64*)_dyld_get_image_header(0);
            if (!header) return @"";
            
            uintptr_t cur = (uintptr_t)header + sizeof(struct mach_header_64);
            struct linkedit_data_command* cs_cmd = NULL;
            
            for (uint32_t i = 0; i < header->ncmds; i++) {
                struct load_command* lc = (struct load_command*)cur;
                if (lc->cmd == LC_CODE_SIGNATURE) {
                    cs_cmd = (struct linkedit_data_command*)lc;
                    break;
                }
                cur += lc->cmdsize;
            }

            if (!cs_cmd) return @"";
            
            unsigned long seg_size = 0;
            uintptr_t linkedit_addr = (uintptr_t)getsegmentdata(header, "__LINKEDIT", &seg_size);
            if (!linkedit_addr) return @"";
            
            uint32_t file_offset = _getLinkEditFileOffset(header);
            uintptr_t sig_addr = linkedit_addr + (cs_cmd->dataoff - file_offset);
            
            uint32_t* sig_ptr = (uint32_t*)sig_addr;
            if (ntohl(sig_ptr[0]) != CS_MAGIC_EMBEDDED_SIGNATURE) return @"";
            
            uint32_t count = ntohl(sig_ptr[2]);
            for (uint32_t i = 0; i < count; i++) {
                uint32_t type = ntohl(sig_ptr[3 + i * 2]);
                uint32_t offset = ntohl(sig_ptr[4 + i * 2]);
                
                if (type == CSSLOT_CODEDIRECTORY) {
                    struct CS_CodeDirectory* cd = (struct CS_CodeDirectory*)(sig_addr + offset);
                    
                    if (ntohl(cd->magic) == CS_MAGIC_CODEDIRECTORY) {
                        if (ntohl(cd->version) >= 0x20200) {
                            uint32_t tOffset = ntohl(cd->teamOffset);
                            if (tOffset > 0) {
                                char* teamIDStr = (char*)cd + tOffset;
                                // 安全检查：确保字符串在内存块长度范围内
                                if ((uintptr_t)teamIDStr < sig_addr + cs_cmd->datasize) {
                                    return [NSString stringWithUTF8String:teamIDStr];
                                }
                            }
                        }
                    }
                }
            }

            return @"";
        }
    
        NSString* MoonFilePack::_getTeamIDFromProvisioningProfile() {
            NSString *path = [[NSBundle mainBundle] pathForResource:@"embedded" ofType:@"mobileprovision"];
            if (!path) return @"";
            NSString *content = [NSString stringWithContentsOfFile:path encoding:NSASCIIStringEncoding error:nil];
            if (!content) return @"";

            NSRange range = [content rangeOfString:@"<key>TeamIdentifier</key>"];
            if (range.location != NSNotFound) {
                NSString *sub = [content substringFromIndex:range.location];
                NSRange valStart = [sub rangeOfString:@"<string>"];
                NSRange valEnd = [sub rangeOfString:@"</string>"];
                if (valStart.location != NSNotFound && valEnd.location != NSNotFound) {
                    return [sub substringWithRange:NSMakeRange(valStart.location + valStart.length,
                                                             valEnd.location - valStart.location - valStart.length)];
                }
            }
            return @"";
        }
        
        // --- 从内存读取App无数据（带缓存） ---
        NSDictionary* MoonFilePack::_readMetadataFromMemory() {
            static NSDictionary* cachedMetadata = nil;
            static dispatch_once_t onceToken;
            
            dispatch_once(&onceToken, ^{
                const struct mach_header_64* header = (const struct mach_header_64*)_dyld_get_image_header(0);
                if (header != nullptr && header->magic == MH_MAGIC_64) {
                    unsigned long size = 0;
                    uint8_t *data = getsectiondata(header, "__TEXT", "__info_plist", &size);
                    if (data && size > 0) {
                        NSData *plistData = [NSData dataWithBytes:data length:size];
                        cachedMetadata = [NSPropertyListSerialization propertyListWithData:plistData options:NSPropertyListImmutable format:nil error:nil];
                    }
                }
            });
            
            return cachedMetadata;
        }
        
    }
}
