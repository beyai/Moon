

enum SecurityConst {
    
    static let SilentTips   = "5分钟试用已结束, 请重新启动！"
    
    // MARK: - 日志标签
    enum LogTag {
        static let Crypto               = "Crypto"
        static let EphemeralSession     = "EphemeralSession"
        static let PersistentSession    = "PersistentSession"
    }
    
    // MARK: - 缓存主键
    enum StoreKey {
        static let ServiceName        = "service"
        static let DeviceKey          = "deviceUID"
        static let RegisterStatusKey  = "isRegister"
        static let DeviceCode         = "deviceCode"
    }
    
    // MARK: - 临时会话错误消息
    enum EphemeralError {
        static var LoadFail:String  { "密钥加载失败" }
        static let RemoteKeyLost    = "远端会话密钥不存在"
        static let RemoteKeyFail    = "远程会话密钥失败"
        static let SharedKeyFail    = "共享密钥生成失败"
    }
    
    // MARK: - 持久会话错误消息
    enum PersistentError {
        static let LoadFail         = "密钥加载失败"
        static let ServerKeyLost    = "远端身份验证公钥不存在"
        static let DeviceKeyLost    = "设备身份验证密钥不存在"
        static let SharedKeyFail    = "共享密钥生成失败"
    }
    
    // MARK: - 加解密错误消息
    enum CryptoError {
        static let EncryptFail      = "加密失败"
        static let DecryptFail      = "解密失败"
        static let DataParseFail    = "数据解析失败"
        static let CBORParseFail    = "内容解析失败"
    }
    
    // MARK: - 网络请求错误
    enum AxiosError {
        static let InvalidURL       = "Invalid URL"
        static let ConnectionFail   = "连接失败，请稍后再试"
        static let NoNetwork        = "没有网络连接"
        static let Timeout          = "请求超时"
        static let CanNotConnection = "无法连接到服务器"
        static let ConnectionLost   = "网络连接丢失"
    }
    
    // MARK: - 网络请求
    enum Request {
        #if DEBUG
         static let BaseURL          = "http://192.168.3.100:7001/v1"
        #else
        static let BaseURL          = "https://api.beeeye.com.cn/api/v1"
        #endif
        
        static let SyncTime         = "/time"
        static let Challenge        = "/challenge"
        static let CheckIn          = "/device/checkIn"
        static let Negotiate        = "/device/negotiate"
        
    }
    
    // MRRK: - 信令服务
    enum Signal {
        #if DEBUG
        static let BaseURL          = "ws://192.168.3.100:3001/io"
        #else
        static let BaseURL          = "wss://api.beeeye.com.cn/io"
        #endif
    }
    
    
    enum Trust {
        static let Domain           = "api.beeeye.com.cn"
        static let MainPin          = "W920d6Bg8HjO8RXYlqhUubJQUUBt5v5RmZgCtp7F9LA="
        static let BackPin          = "92oK29/qv5N8xocT/H9kxxVqihg3OD2rlooJW9f7L3Y="
    }
}
