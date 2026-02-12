type Base64String = string

export interface SessionRequestBody {
    // 设备唯一标识
    deviceUID: string;
    // AES-GCM IV 或 SharedKey Slat
    nonce: Base64String | Buffer;
    // AES-GCM Tag
    tag: Base64String | Buffer;
    // 加密数据
    body: Base64String | Buffer;
    // 负载数据
    payload?: Base64String | Buffer;
}


// 设备元数据
export interface DeviceMeta {
    // 团队唯一标识
    teamIdentifier: string;
    // 应用唯一标识
    bundleIdentifier: string;
    // 应用包名
    bundleName: string;
    // 型号
    model: string;
    // 挑战因子
    challenge: string;
    // App版本号
    version: string;
}

// 设置认证响应结果
export interface DeviceSessionResponseData {
    // 设备码
    deviceCode: string;
    // App 版本号
    version: string;
    // 版本号状态
    status: boolean;
    // App 下载地址
    downloadURL: string;
    // JSBundle 解码密钥
    secretKey: string;
}

// 客户端元数据
export interface ClientMeta {
    // 应用唯一标识
    bundleIdentifier: string;
    // 应用包名
    bundleName: string;
    // 型号
    model: string;
    // 挑战因子
    challenge: string;
    // App版本号
    version: string;
}

// 客户认证响应结果
export interface ClientSessionResponseData {
    // App 版本号
    version: string;
    // App 下载地址
    downloadURL: string;
}