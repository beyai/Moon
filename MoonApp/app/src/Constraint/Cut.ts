enum Cut {
    // 不切牌
    not = 'not',
    // 连续切牌
    continue = 'continue',
    // 看底
    seeBottom = 'seeBottom',
    // 看顶
    seeTop = 'seeTop',
    // 看手牌
    seeHand = 'seeHand',
}

interface CutCardDataItem {
    label: string;
    value: Cut
}

namespace Cut {

    // 首次切牌等待时长，单位毫秒
    export const firstTimeout = 10 * 1000

    // 后续切牌最大等待时长，单位毫秒
    export const maxTimeout = 3 * 1000

    // 切牌数据
    export const data: CutCardDataItem[] = [
        { label: '不切牌', value: Cut.not },
        { label: '连续切牌', value: Cut.continue },
        // { label: '看底', value: Cut.seeBottom },
        // { label: '看顶', value: Cut.seeTop },
        // { label: '看手牌', value: Cut.seeHand },
    ]

    // 获取当前切换类型标签
    export function getLabel(type: Cut): string {
        for (const item of data) {
            if (type == item.value) {
                return item.label
            }
        }
        return ''
    }

    /**
     * 是否需要切牌
     * @param type 切牌类型
     * @returns 
     */
    export function isNeedCutCard(type: Cut) {
        return type != Cut.not
    }
}

export {
    Cut
}