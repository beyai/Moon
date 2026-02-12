export enum ApplicationStatus {
    NORMAL = 1, // 正常
    DISABLE = 0, // 禁用
}
export namespace ApplicationStatus {
    export function values(): ApplicationStatus[] {
        return Object.values(ApplicationStatus).filter(v => typeof v === 'number') as ApplicationStatus[]
    }
}
