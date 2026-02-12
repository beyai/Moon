
/**
 * 计时耗时时长
 * @param timestamp 时间戳（毫秒）
 * @returns 
 */
export function durationTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    // 毫秒
    if (diff < 1000) {
        return `${ diff }ms`
    }
    // 秒
    else if (diff < 60 * 1000) {
        return `${ Math.floor( diff / 1000) }s`
    }
    // 分钟
    return `${ Math.floor( diff / (60 * 1000 )) }m`
}