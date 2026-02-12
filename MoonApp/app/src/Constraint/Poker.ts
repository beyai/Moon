// 工具函数：将数组切分成指定长度
function chunkGroup<T>(arr: T[], size: number) {
    const result: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size))
    }
    return result
}

namespace Poker {
    // 总数
    const count: number = 54

    // 卡片数据
    export const data = {
        "AS": 1,  "2S": 2,  "3S": 3,  "4S": 4,  "5S": 5,  "6S": 6,  "7S": 7,  "8S": 8,  "9S": 9,  "10S": 10, "JS": 11, "QS": 12, "KS": 13,
        "AH": 14, "2H": 15, "3H": 16, "4H": 17, "5H": 18, "6H": 19, "7H": 20, "8H": 21, "9H": 22, "10H": 23, "JH": 24, "QH": 25, "KH": 26,
        "AC": 27, "2C": 28, "3C": 29, "4C": 30, "5C": 31, "6C": 32, "7C": 33, "8C": 34, "9C": 35, "10C": 36, "JC": 37, "QC": 38, "KC": 39,
        "AD": 40, "2D": 41, "3D": 42, "4D": 43, "5D": 44, "6D": 45, "7D": 46, "8D": 47, "9D": 48, "10D": 49, "JD": 50, "QD": 51, "KD": 52,
        "BIGJOKER": 53, "LITTLEJOKER": 54, "POKER": 55
    }
    
    export type Name = keyof typeof data

    export type Weight = typeof data[Name]

    // 所有 keys 
    export const keys = Object.keys(data) as  Name[]

    // 反向映射 value -> key
    export const weightMap: Partial<Record<Weight, Name> > = {};
    for (const key of keys ) {
        weightMap[ data[key] ] = key;
    }

    // 分组大小
    export const groupSize = 8;

    // 分组数据
    export const group = [
        {
            title: '♠️ 黑桃',
            data: chunkGroup(keys.filter(name => name.endsWith('S')), groupSize)
        },
        {
            title: '♥️ 红桃',
            data: chunkGroup(keys.filter(name => name.endsWith('H')), groupSize)
        },
        {
            title: '♦️ 方片',
            data: chunkGroup(keys.filter(name => name.endsWith('D')), groupSize)
        },
        {
            title: '♣️ 梅花',
            data: chunkGroup(keys.filter(name => name.endsWith('C')), groupSize)
        },
        {
            title: '🃏 大小王',
            data: [ keys.filter(name => name.endsWith('JOKER')) ]
        }
    ]

    /**
     * 获取权重值
     */
    export function getWeightValues(keys: Name[] ): number[] {
        const arr = new Array(7).fill(0)
        keys.forEach((key) => {
            const id = data[ key ];
            if( id > 0 && id <= count ) {
                const bit = id - 1;
                const byteIndex = bit >> 3;
                const bitIndex = bit & 7;
                arr[byteIndex] |= (1 << bitIndex);
            }
        });
        return arr;
    }

    /**
     * 根据权重获取数据
     */
    export function getWeightKeys(weights: number[]): Name[] {
        const keys: Name[] = [];
        for (let bit = 0; bit < count; bit++) {
            const byteIndex = bit >> 3;
            const bitIndex = bit & 7;
            if ((weights[byteIndex] & (1 << bitIndex)) !== 0) {
                let value = bit + 1 as Weight
                const key = weightMap[value];
                if (key) keys.push(key);
            }
        }
        return keys;
    }

    /**
     * 权重值是否相同
     */
    export function equalWeight(a: number[], b: number[]) {
        if (a.length !== 7 || b.length !== 7) return false
        for (let i = 0; i < 7; i++) {
            if (a[i] !== b[i]) return false
        }
        return true
    }

    /**
     * 去重
     */
    export function uniq(pokers: Poker.Name[]) {
        return Array.from(new Set(pokers))
    }
}


export {
    Poker
}