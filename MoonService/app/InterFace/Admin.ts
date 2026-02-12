export enum AdminStatus {
    NORMAL = 1, // 正常
    DISABLE = 0, // 禁用
}
export namespace AdminStatus {
    export function values(): AdminStatus[] {
        return Object.values(AdminStatus).filter(v => typeof v === 'number') as AdminStatus[]
    }
}

export enum AdminType {
    SYSTEM = 'system', // 系统管理员
    AGENT = "agent", // 代理
}

export namespace AdminType {
    export function values(): AdminType[] {
        return Object.values(AdminType).filter(v => typeof v === 'string') as AdminType[]
    }
}

export interface AdminData {
    adminId?    : string;
    username?   : string;
    password?   : string;
    type?       : AdminType;
    status?     : AdminStatus;
    mark?       : string;
    loginAt?    : Date;
    loginIp?    : string;
}

