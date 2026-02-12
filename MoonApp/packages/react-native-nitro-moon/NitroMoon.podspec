require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
    s.name         = "NitroMoon"
    s.version      = package["version"]
    s.summary      = package["description"]
    s.homepage     = package["homepage"]
    s.license      = package["license"]
    s.authors      = package["author"]

    s.platforms    = { :ios => min_ios_version_supported, :visionos => 15.0 }
    s.source       = { :git => "https://github.com/beyai/react-native-nitro-moon.git", :tag => "#{s.version}" }

    s.source_files = [
        # Implementation (Swift)
        "ios/**/*.{swift}",
        # Autolinking/Registration (Objective-C++)
        "ios/**/*.{h,m,mm,cpp}",
        # Implementation (C++ objects)
        "cpp/**/*.{hpp,cpp}",
    ]
    
    s.resources = "ios/**/*.metal"
    
    s.public_header_files = "ios/NitroMoon/NitroMoonBridge.h"
    
    load 'nitrogen/generated/ios/NitroMoon+autolinking.rb'
    add_nitrogen_files(s)

    s.dependency 'React-jsi'
    s.dependency 'React-callinvoker'

    s.dependency 'TrustKit', '~> 3.0.7'
    s.dependency 'Starscream', '~> 4.0.4'
    s.dependency 'SwiftCBOR', '~> 0.5.0'
    s.dependency 'SwiftyJSON', '~> 4.0'
    s.dependency 'WebRTC'

    install_modules_dependencies(s)
    
    current_config = s.attributes_hash['pod_target_xcconfig'] || {}

    s.pod_target_xcconfig = current_config.merge({
        # 1. 开启全模块优化 (WMO)，这是 @inline(__always) 跨文件生效的必要条件
        "SWIFT_COMPILATION_MODE" => "wholemodule",
        # 2. 隐藏 C++ 和 C 的符号，防止被 dlsym 等工具搜索
        "GCC_SYMBOLS_PRIVATE_EXTERN" => "YES",
        # 3. 剥离本地符号 (Release 模式下生效)
        "STRIP_INSTALLED_PRODUCT" => "YES",
        "DEPLOYMENT_POSTPROCESSING" => "YES",
        "STRIP_STYLE" => "non-global",
        # 4. 禁用反射元数据：减少二进制中关于类和方法的描述，增加逆向难度
        # 同时保留 Nitrogen 所需的必要配置
        "OTHER_SWIFT_FLAGS" => "$(inherited) -Xfrontend -disable-reflection-metadata",
        # 5. 极致优化 C++ 代码（Nitro 核心）
        "OTHER_CPLUSPLUSFLAGS" => "$(inherited) -Ofast -fvisibility=hidden -fvisibility-inlines-hidden"
    })

    s.xcconfig = {
        'MTL_COMPILER_FLAGS' => '-ffast-math'
    }
  
end
