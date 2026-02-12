
enum Game {
    dezhou = 'dezhou',
    jinhua = 'jinhua',
    baijiale = 'baijiale',
    sangong = 'sangong',
}

interface GameData {
    label: string;
    value: Game
}


namespace Game {
    
    // 游戏分类数据
    export const data: GameData[] = [
        { label: '德州', value: Game.dezhou  },
        { label: '金花', value: Game.jinhua  },
        { label: '百家乐', value: Game.baijiale  },
        { label: '三公', value: Game.sangong  },
    ]

    // 获取当前游戏标签
    export function getLabel(type: Game): string {
        for (const item of data) {
            if (type == item.value) {
                return item.label
            }
        }
        return ''
    }
}


export {
    Game
}