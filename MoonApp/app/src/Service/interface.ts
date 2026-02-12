import type {  MRTCIceServer, MRTCLiveStream  } from 'react-native-nitro-moon'

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

/** 登录请求 */
export interface LoginRequest {
    username: string;
    password: string;
    key?: string;
}

/** 注册请求 */
export interface RegisterRequest {
    username: string;
    password: string;
    key?: string;
}

/** 修改密码 */
export interface UpdatePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

/** 用户信息 */
export interface UserInfo {
    // 用户ID
    userId: string;
    // 用户名
    username: string;
    // 创建时间
    createdAt: string;
    // 登录时间
    loginAt: string;
}

// 设备采集格式
export interface DeviceFormat {
    width: number;
    height: number;
    maxFps: number;
}

// 设备初始化信息
export interface DeviceInfo {
    // 是否激活
    isActive: boolean;
    // 激活级别
    activeLevel: string;
    // 激活剩余天数
    countDays: number;
    // 设备码
    deviceCode: string;
    // 相机采集格式
    deviceFormat: DeviceFormat;
    // 直播流配置
    liveStream: MRTCLiveStream;
    // TURN 服务器
    iceServers: MRTCIceServer[];
    // 是否禁用
    isDisabled?: boolean;
}

/** 字典 */
export interface GameDictItem {
    // 标签
    label: string;
    // 值
    value: string
}

/** 游戏字典配置 */
export interface GameDictMap {
    [key: string]: GameDictItem[];
}

/** 游戏数据 */
export interface GameData {
    // 游戏ID
    gameId: number;
    // 游戏名称
    name: string;
    // 游戏类型
    type: string;
    // 手牌数量
    handCards: number;
    // 用牌配置
    useCards: number[]
}

/** 游戏玩法数据 */
export interface GamePlayData {
    // 玩法ID
    playId?: string;
    // 游戏ID
    gameId: number;
    // 玩法名称
    name: string;
    // 切牌类型
    cutCard: string;
    // 手法类型
    trick: string;
    // 是否洗全
    isShuffleFull: boolean;
    // 用牌配置
    useCards: number[];
    // 点数配置
    score: number[];
    // 玩家人数
    people: number;
    // 手牌数量
    handCards: number;
    // 游戏数据
    game?: {
        name: string;
        icon?: string;
    }
}