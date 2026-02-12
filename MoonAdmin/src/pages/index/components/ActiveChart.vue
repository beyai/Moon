<template>
    <Panel title="激活统计">
        <template #extra>
            <a-radio-group type="button" v-model="day">
                <a-radio :value="7">7天</a-radio>
                <a-radio :value="15">15天</a-radio>
                <a-radio :value="30">30天</a-radio>
            </a-radio-group>
        </template>
        <ChartLine title="激活" :data="chartData" />
    </Panel>
    
</template>

<script setup>
    const { adminId } = defineProps({
        adminId: String
    })
    const day = ref(7)
    const { data: chartData } = await useHttpRequest(async () => {
        const { data } = await Api.Statistc.active({
            adminId,
            days: day.value
        })
        return data;
    }, {
        watch: [
            day,
            () => adminId
        ]
    })
</script>