<template>
    <a-form :model="{}">
        <div ref="wrapper">
            <a-grid :cols="store.isDesktop ? cols : 5" :colGap="gutter" :rowGap="gutter">
                <QueryFormItem />
                <a-grid-item :span="1">
                    <a-space>
                        <a-button type="primary" html-type="submit">查询</a-button>
                        <a-button html-type="reset">重置</a-button>
                    </a-space>
                </a-grid-item>
            </a-grid>
        </div>
    </a-form>
</template>

<script setup lang="jsx">
    import { GridItem } from '@arco-design/web-vue';
import {  onBeforeUnmount, onMounted, ref } from 'vue';
    const store = useStore();
    const slots = defineSlots();
    const props = defineProps({
        gutter: {
            type: Number,
            default: 12
        },
        maxCols: {
            type: Number,
            default: 6
        },
        colWidth: {
            type: Number,
            default: 280
        }
    })

    const cols = ref(0)
    const wrapper = ref()
    function handlerResize() {
        const $el = wrapper.value;
        const offsetWidth = $el.offsetWidth;
        const { maxCols, colWidth, gutter } = props;
        let bodyWidth = 99999;
        let currCols = maxCols;
        // 计算每一列的宽度和间距的总和
        while(bodyWidth > offsetWidth && currCols > 1) {
            bodyWidth = currCols * colWidth + ( currCols - 1 ) * gutter;
            if (bodyWidth >= offsetWidth) {
                currCols--;
            }
        }
        cols.value = currCols;
    }

    
    onMounted(() => {
        window.addEventListener('resize', handlerResize, false);
        handlerResize()
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handlerResize, false);
    })

    function QueryFormItem() {
        return  slots.default &&  slots.default().map(item => {
            return item.shapeFlag != 8 && (
                <GridItem span={ store.isDesktop ? 1 : 3 }>{ item }</GridItem>
            )
        })
    }
</script>
