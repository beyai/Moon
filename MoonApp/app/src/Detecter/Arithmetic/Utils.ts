import { Poker } from "@/Constraint";
import type { DetecterLabel } from "../Constraint";

// 排序类型
type OrderType =  'desc' | 'asc'
// 标签分组列表
export type LabelGroupMap = {
    [key in Poker.Name]? : DetecterLabel[]
}

/**
 * 按时间排序
 */
export function sortByTimestamp( records: DetecterLabel[], order: OrderType = 'desc' ): DetecterLabel[] {
    if (records.length <= 1) return records
    const factor = order === 'asc' ? 1 : -1
    return [...records].sort( (a, b) => {
        return (a.timestamp - b.timestamp) * factor
    })
}

/**
 * 按标签分组
 * @param records 检测记录
 */
export function groupByLabel( records: DetecterLabel[] ): LabelGroupMap {
    const grouped: LabelGroupMap = {}
    for (const record of records) {
        const key = record.label as Poker.Name
        if (!grouped[key]) {
            grouped[key] = []
        }
        grouped[key]!.push(record)
    }
    return grouped
}

/**
 * 稳健的平均采样间隔计算
 * 逻辑：去重时间戳 -> 截取中间 40% 的时间点 -> 计算平均间隔
 * @param records 原始记录（已按时间排序）
 * @returns 平均时间间隔（毫秒）
 */
export function calculateStableInterval(records: DetecterLabel[]): number {
    // 记录太少无法计算间隔
    if (!records || records.length < 2) return 4.16

    // 时间戳去重 (提取唯一的物理采样时间点)
    // 线性去重，时间复杂度 O(N)
    const uniqueTimestamps: number[] = [];
    for (let i = 0; i < records.length; i++) {
        const ts = records[i].timestamp;
        if (uniqueTimestamps.length === 0 || ts !== uniqueTimestamps[uniqueTimestamps.length - 1]) {
            uniqueTimestamps.push(ts);
        }
    }

    // 检查去重后的数据量
    const len = uniqueTimestamps.length;
    if (len < 2) return 4.16;
    
    // 截取数据序列中间的 40% 记录
    // 剔除前 30% (开始阶段) 和 后 30% (结束阶段)
    const startIndex = Math.floor(len * 0.3);
    const endIndex = Math.floor(len * 0.7);
    
    // 提取中间段（例如 100 帧取 index 30 到 69，共 40 帧）
    const middlePart = uniqueTimestamps.slice(startIndex, Math.max(endIndex, startIndex + 2));

    // 计算这段稳定记录的平均间差
    // 间差数量 = 记录数 - 1
    const gapCount = middlePart.length - 1;
    const totalGapTime = middlePart[gapCount] - middlePart[0];
    const avgInterval = totalGapTime / gapCount;

    // 返回结果（保留 4 位小数）
    return Number(avgInterval.toFixed(4));
}