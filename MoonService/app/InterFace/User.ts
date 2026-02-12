import { FindQuery } from "./Common";

export enum UserStatus {
    NORMAL = 1, // 正常
    DISABLE = 0, // 禁用
}

export namespace UserStatus {
    export function values(): UserStatus[] {
        return Object.values(UserStatus).filter(v => typeof v === 'number') as UserStatus[]
    }
}

/**
 * 用户数据
 */
export interface UserData {
    userId?:    string;
    username?:  string;
    password?:  string;
    status?:    UserStatus;
    isOnline?:  boolean;
    loginAt?:   Date;
    loginIp?:   string;
}

/**
 * 用户查询
 */
export interface UserQuery extends Pick<UserData, "username" | 'isOnline' | 'status'>, FindQuery {
}
