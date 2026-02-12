import { Poker } from "@/Constraint";
import { groupByLabel, sortByTimestamp, calculateStableInterval } from "./Utils";
import type { DetecterLabel } from "../Constraint";


/**
 * 降噪算法
 * @param records 记录
 * @param avgInterval 平均帧间隔
 */

function filterNoise(records: DetecterLabel[], avgInterval = 5): DetecterLabel[] {
    if (records.length < 2 ) return records;

    const diffThreshold = avgInterval * 5;
    // 分组（按时间连续性）
    const groups = [];
    let currentGroup = [records[0]];

    for (let i = 1; i < records.length; i++) {
        const prev = records[i - 1];
        const curr = records[i];
        if (curr.timestamp - prev.timestamp <= diffThreshold) {
            currentGroup.push(curr);
        } else {
            groups.push(currentGroup);
            currentGroup = [curr];
        }
    }
    groups.push(currentGroup)
    
    if (groups.length === 1) return groups[0];

    // 多组且每组只有一帧
    const allSingleFrame = groups.every(group => group.length === 1);
    if (allSingleFrame) {
        return groups.reduce((best, curr) => curr[0].confidence > best[0].confidence ? curr : best );
    }
    // 否则：按平均置信度选
    return groups.reduce((bestGroup, currGroup) => {
        const avg = currGroup.reduce((sum, f) => sum + f.confidence, 0) / currGroup.length;
        const bestAvg = bestGroup.reduce((sum, f) => sum + f.confidence, 0) / bestGroup.length;
        return avg > bestAvg ? currGroup : bestGroup;
    });
}

/**
 * 获取同时消失的标签组
 */
function getLastTimestampDuplicates(lastRecords: DetecterLabel[]): Poker.Name[][]  {
    // 按时间戳分组统计
    const timeMap = new Map<number, Poker.Name[]>();
    lastRecords.forEach(record => {
        const ts = record.timestamp;
        if (!timeMap.has(ts)) timeMap.set(ts, []);
        timeMap.get(ts)?.push(record.label);
    });

    // 筛选出时间戳重复的数据
    const duplicates: Poker.Name[][] = [];
    timeMap.forEach((names, ts) => {
        if (names.length > 1) {
            duplicates.push(names)
        }
    });
    return duplicates
}

/**
 * 获取形变值
 */
function getDeformation(frame1: DetecterLabel, frame2: DetecterLabel) {
    const { width: w1, height: h1, centerX: x1, centerY: y1 } = frame1;
    const { width: w2, height: h2, centerX: x2, centerY: y2 } = frame2;

    // 尺寸变化率 (宽高比例的变化)
    const wChange = Math.abs(w2 - w1) / w1;
    const hChange = Math.abs(h2 - h1) / h1;
    const sizeChange = (wChange + hChange) / 2;

    // 中心点偏移率
    const xOffset = Math.abs(x2 - x1) / w1;
    const yOffset = Math.abs(y2 - y1) / h1;
    const centerOffset = (xOffset + yOffset) / 2;

    // 综合形变指标
    return sizeChange * 0.7 + centerOffset * 0.3;
}

/**
 * 交叉洗牌的检测数据，计算合并后的牌序
 * @param records 检测记录
 */
export function calculateShuffleOrder(records: DetecterLabel[]): Poker.Name[] {
    if (records.length === 0 ) return []

    // 1. 预处理
    records = sortByTimestamp(records, 'asc') // 按时间从小到大排序
    const avgInterval = calculateStableInterval(records) // 获取平均时间差(ms)
    const labelGroups = groupByLabel(records) // 按标签分组

    // 2. 去噪提纯
    let lastRecords: DetecterLabel[] = []
    const cleanedGroups:  Record<string, DetecterLabel[]> = {}; // 提纯后的分组数据

    for (const [ key, groupRecords ] of Object.entries(labelGroups)) {
        let label = key as Poker.Name
        const cleaned = filterNoise(groupRecords, avgInterval)
        const lastIndex = cleaned.length - 1
        const lastItem  = cleaned[lastIndex]
        cleanedGroups[label] = cleaned
        lastRecords.push(lastItem)
    }

    // 3. 初始排序（最后消失的在最前）
    lastRecords = sortByTimestamp(lastRecords, 'desc')
    let result = lastRecords.map(item => item.label) // 获取所有标签
    
    // console.log("原始顺序", result.join(', '))

    // 4. 处理时间戳冲突（局部微调）
    let together = getLastTimestampDuplicates(lastRecords) // 获取时间重复的标签
    together.forEach(labels => {
        
        let items = labels.map(label => {
            let frames = cleanedGroups[label]?.slice(-2)
            let originalIndex = result.indexOf(label)
            let weight = (frames?.length === 2) ? getDeformation(frames[0], frames[1]) : 0
            return { originalIndex, label, weight }
        })
        // console.log("同时消失", items)

        // 按权重交换位置，值大的在后面，小的在前面
        let orderWeight = [...items].sort((a,b) => a.weight - b.weight)

        // 回填数据
        items.forEach((item, i) => {
            result[item.originalIndex] = orderWeight[i].label
        })
    })
    
    return result
}