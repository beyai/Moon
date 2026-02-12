<template>
    <div class="DeviceList" ref="wrapper">
        <a-grid :cols="cols" :colGap="gutter" :rowGap="gutter">
            <a-grid-item v-for="(item, index) in data" :key="index">
                <slot :item="item" :index="index" />
            </a-grid-item>
        </a-grid>
    </div>
</template>

<script setup lang="jsx">
    import {  onBeforeUnmount, onMounted, ref } from 'vue';
    const store = useStore();
    const slots = defineSlots();
    const props = defineProps({
        data: Array,
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
        if (currCols == 5) {
            currCols = 4
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

</script>

<style lang="less" scoped>
    .DeviceList {
        padding: @size-4;
    }
</style>