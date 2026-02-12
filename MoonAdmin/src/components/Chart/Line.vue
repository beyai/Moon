<template>
    <div ref="ChartRef" class="Chart"></div>
</template>

<script setup>
    import dayjs from 'dayjs'
    import * as echarts from 'echarts'
    const ChartRef = ref();
    let echart;

    const props = defineProps({
        data: Object,
        title: String,
    })

    const catData = computed(() => {
        if (!props.data) return [];
        return Object.keys(props.data).map(item => {
            return dayjs(item).format('MM月DD日')
        })
    })

    const lineData = computed(() => {
        if (!props.data) return [];
        return Object.values(props.data)
    })

    watch(() => props.data, initChart)

    function initChart() {
        if (echart) {
            echart.dispose()
        }
        echart = echarts.init(ChartRef.value)
        echart.setOption({
            grid: { top: '10', left: '50', right: '30', bottom: '40' },
            tooltip: {
                show: true,
                trigger: 'axis',
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: catData.value,
            },
            yAxis: {
                type: 'value',
                minInterval: 1,
                splitNumber: 5
            },
            series: {
                name: props.title,
                type: 'line',
                smooth: true,
                showSymbol: false,
                symbol: 'circle',
                data: lineData.value,
                areaStyle: {
                    opacity: 0.2,
                }
            }
        })
    }

    function handlerResize() {
        echart && echart.resize()
    }

    onMounted(() => {
        window.addEventListener('resize', handlerResize)
        initChart()
    })

    onBeforeUnmount(() => {
        echart && echart.dispose();
        window.removeEventListener('resize', handlerResize)
    })
</script>

<style lang="css" scoped>
    .Chart {
        width: 100%;
        height: 360px;
    }
</style>