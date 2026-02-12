<template>
    <div class="Poker">
        <template v-for="cards in group">
            <div class="Poker-List">
                <img  v-for="key in cards.data"
                    :key="key"
                    :src=" selected.includes(key) ? `/images/${ key }.png` : '/images/POKER.png'" 
                    class="Poker-Img" 
                    @click="onClickItem(key)" 
                />
            </div>
        </template>
    </div>
</template>

<style lang="less">
    .Poker {
        width: 100%;

        &-List {
            display: flex;
            list-style: none;
            margin-left: 0;
            margin-top: @size-3;
        }

        &-Img {
            cursor: pointer;
            width: 30px;
            height: 40px;
            background-color: @color-fill-2;
            margin-right: @size-4;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid @color-border-2
        }
    }
</style>

<script setup>

// 卡片数据
const data = {
    "AS": 1,  "2S": 2,  "3S": 3,  "4S": 4,  "5S": 5,  "6S": 6,  "7S": 7,  "8S": 8,  "9S": 9,  "10S": 10, "JS": 11, "QS": 12, "KS": 13,
    "AH": 14, "2H": 15, "3H": 16, "4H": 17, "5H": 18, "6H": 19, "7H": 20, "8H": 21, "9H": 22, "10H": 23, "JH": 24, "QH": 25, "KH": 26,
    "AC": 27, "2C": 28, "3C": 29, "4C": 30, "5C": 31, "6C": 32, "7C": 33, "8C": 34, "9C": 35, "10C": 36, "JC": 37, "QC": 38, "KC": 39,
    "AD": 40, "2D": 41, "3D": 42, "4D": 43, "5D": 44, "6D": 45, "7D": 46, "8D": 47, "9D": 48, "10D": 49, "JD": 50, "QD": 51, "KD": 52,
    "BIGJOKER": 53, "LITTLEJOKER": 54, "POKER": 55
}

const count = 54
const keys = Object.keys(data)
const weightMap = {}
for (const key of keys ) {
    weightMap[ data[key] ] = key;
}

// 分组数据
const group = [
    {
        title: '♠️ 黑桃', data: keys.filter(name => name.endsWith('S'))
    },
    {
        title: '♥️ 红桃', data: keys.filter(name => name.endsWith('H'))
    },
    {
        title: '♦️ 方片', data: keys.filter(name => name.endsWith('D'))
    },
    {
        title: '♣️ 梅花', data: keys.filter(name => name.endsWith('C'))
    },
    {
        title: '🃏 大小王', data: keys.filter(name => name.endsWith('JOKER'))
    }
]

/**
 * 获取权重值
 */
function getWeightValues(keys) {
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
function getWeightKeys(weights) {
    const keys = [];
    for (let bit = 0; bit < count; bit++) {
        const byteIndex = bit >> 3;
        const bitIndex = bit & 7;
        if ((weights[byteIndex] & (1 << bitIndex)) !== 0) {
            let value = bit + 1
            const key = weightMap[value];
            if (key) keys.push(key);
        }
    }
    return keys;
}

const props = defineProps({
    modelValue: Array
})

const selected = computed(() => {
    return getWeightKeys(props.modelValue)
})

const emit = defineEmits(['update:modelValue'])

function onClickItem(key) {
    let keys = selected.value.slice(0)
    const index = keys.indexOf(key)
    if (index === -1 ) {
        keys.push(key)
    } else {
        keys.splice(index, 1)
    }
    emit('update:modelValue', getWeightValues(keys))
}

</script>