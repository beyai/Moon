import Foundation
import UIKit
import Darwin
import ObfuscateMacro

struct DeviceSecurity {

    static let officialBundleID = #ObfuscatedString("com.fireeyecam.cam")

    /// 运行所有环境安全检测
    static func runAllChecks() -> [String: Bool] {
        return [
            "isNotOfficial": isNotOfficial(),
            "isJailbroken": isJailbroken(),
            "isDebuggerAttached": isDebuggerAttached(),
            "isSimulator": isSimulator(),
            "isHooking": isHooking(),
        ]
    }
    
    /// 是否非官方包
    static func isNotOfficial() -> Bool {
        guard let currentBundleID = Bundle.main.bundleIdentifier else {
            return false
        }
        return currentBundleID != officialBundleID
    }

    /// 越狱检测
    static func isJailbroken() -> Bool {
        return hasSuspiciousFiles() || canWriteOutsideSandbox()
    }

    /// 反调试检测
    static func isDebuggerAttached() -> Bool {
        #if DEBUG
            return false
        #else
            var info = kinfo_proc()
            var mib : [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
            var size = MemoryLayout<kinfo_proc>.stride
            let junk = sysctl(&mib, UInt32(mib.count), &info, &size, nil, 0)
            if junk == 0 {
                return (info.kp_proc.p_flag & P_TRACED) != 0
            }
            return false
        #endif
    }

    /// 检测是否越狱环境
    private static func hasSuspiciousFiles() -> Bool {
        let suspiciousPaths = [
            #ObfuscatedString("/Applications/Cydia.app"),
            #ObfuscatedString("/Applications/Sileo.app"),
            #ObfuscatedString("/Applications/Zebra.app"),
            #ObfuscatedString("/Applications/Installer.app"),
            #ObfuscatedString("/Applications/blackra1n.app"),
            #ObfuscatedString("/Applications/Icy.app"),
            #ObfuscatedString("/Applications/FakeCarrier.app"),
            #ObfuscatedString("/Applications/Unc0ver.app"),
            #ObfuscatedString("/Applications/SBSettings.app"),
            #ObfuscatedString("/Applications/RockApp.app"),
            #ObfuscatedString("/Applications/IntelliScreen.app"),
            #ObfuscatedString("/Applications/Checkra1n.app"),
            #ObfuscatedString("/Applications/MxTube.app"),
            #ObfuscatedString("/Applications/WinterBoard.app"),
            #ObfuscatedString("/Library/MobileSubstrate/MobileSubstrate.dylib"),
            #ObfuscatedString("/usr/sbin/sshd"),
            #ObfuscatedString("/usr/bin/sshd"),
            #ObfuscatedString("/usr/libexec/sftp-server"),
            #ObfuscatedString("/etc/apt"),
            #ObfuscatedString("/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist"),
            #ObfuscatedString("/Library/MobileSubstrate/DynamicLibraries/Veency.plist"),
            #ObfuscatedString("/private/var/tmp/cydia.log"),
            #ObfuscatedString("/private/var/lib/apt"),
            #ObfuscatedString("/private/var/lib/apt/"),
            #ObfuscatedString("/private/var/mobile/Library/Cydia/"),
            #ObfuscatedString("/private/var/stash"),
            #ObfuscatedString("/private/var/db/stash"),
            #ObfuscatedString("/private/var/jailbreak"),
            #ObfuscatedString("/private/var/lib/cydia"),
            #ObfuscatedString("/var/mobile/Library/SBSettings/Themes"),
            #ObfuscatedString("/Library/MobileSubstrate/DynamicLibraries"),
            #ObfuscatedString("/var/jb"),
        ]
        for path in suspiciousPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }
       
        return false
    }
    
    
    /// 检测是否在模拟器环境
    private static func isSimulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }
    
    // 检查是否可以写入沙盒外的目录
    private static func canWriteOutsideSandbox() -> Bool {
        let path = #ObfuscatedString("/private/jailbreak_test.txt")
        do {
            try "Jailbreak Test".write(toFile: path, atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: path) // 清理测试文件
            return true
        } catch {
            return false
        }
    }
    
    // 检测Hook
    private static func isHooking() -> Bool {
        let hookFrameworks = [
            #ObfuscatedString("Substrate"),
            #ObfuscatedString("CydiaSubstrate"),
            #ObfuscatedString("libsubstrate.dylib"),
            #ObfuscatedString("MobileSubstrate"),
            #ObfuscatedString("FridaGadget"),
            #ObfuscatedString("frida-agent")
        ]
        
        for framework in hookFrameworks {
            if dlopen(framework, RTLD_NOW) != nil {
                return true
            }
        }
        
        return false
    }
}
