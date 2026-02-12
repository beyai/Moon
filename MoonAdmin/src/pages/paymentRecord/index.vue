<template>
    <Page @resize="onResize">
        <template #header>
            <PageHeader title="结算记录">

                <template #extra v-if="store.isSystem">
                    <a-button type="primary" @click="() => paymentRef.open()">结算</a-button>
                </template>


                <QueryForm :model="queryForm" @submit="onQuerySubmit" @reset="onQueryReset">
                    
                    <a-select v-model="queryForm.type">
                        <template #prefix>类型</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in PAYMENT_TYEPS" :value="item.value" :label="item.label" />
                    </a-select>

                    <a-select v-model="queryForm.adminId" v-if="store.isDesktop && store.isSystem">
                        <template #prefix>代理</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in store.agents" :value="item.adminId" :label="item.username" />
                    </a-select>
                </QueryForm>
            </PageHeader>
        </template>

        <a-table 
            :columns="columns"
            :data="data.rows"
            :scroll="{ minWidth: 1200, height: pageRect.height - 54 }"
            :scrollbar="false"
            :bordered="false"
            :pagination="false"
        >
            <template #index="{ rowIndex }">
                {{ ( data.page - 1) * data.limit + ( rowIndex + 1 ) }}
            </template>

            <template #payload="{ record }">
                <a-space v-if="record.type == 'active'">
                    <a-tag v-for="(item, key) in ACTIVE_TYPES" :color="item.color">
                        {{ item.label }}：{{ record.payload[key] ?? 0 }}
                    </a-tag>
                </a-space>
            </template>

            <template #type="{ record }">
                <a-tag :color="PAYMENT_TYEPS[record.type]['color']">{{ PAYMENT_TYEPS[record.type]['label'] }}</a-tag>
            </template>

            <template #agent="{ record }">
                {{ store.getAgentName(record.adminId) }}
            </template>
        </a-table>

        <template #footer>
            <a-pagination 
                show-total
                show-page-size
                size="small"
                :total="data.count"
                :current="data.page"
                :default-page-size="data.limit"
                :showTotal="store.isDesktop"
                :showPageSize="store.isDesktop"
                :page-size-options="[10, 15, 20, 30, 50]"
                @change="onChangePage('page', $event)"
                @page-size-change="onChangePage('limit', $event)"
            />
        </template>

        <Payment ref="paymentRef" @success="refresh" />
    </Page>
</template>

<script setup>

    import Payment from './components/Payment.vue'

    const store = useStore();
    const route = useRoute();
    const router = useRouter();

    const paymentRef = ref();
    const pageRect = ref({ width: 0, height: 0 })

    const { data: queryForm, ...QueryModel } = useFormModel({
        type: { type: 'string', value: '' },
        adminId: { type: 'string', value: '' },
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 15 }
    })
    QueryModel.update(route.query)

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const query = QueryModel.filterEmpty();
        const { data } = await Api.Payment.list(query)
        return data
    }, {
        watch: [ route ]
    })

    /** 表格列 */
    const columns = reactive([
        { title: '#', width: 70, fixed: 'left', align: 'center', slotName: 'index' },
        { title: '类型',  align: 'center',width: 60, slotName: 'type' },
        { title: '本次结算', align: 'center', width: 90, dataIndex: 'count' },
        { title: '详情', width: 280, slotName: 'payload' },
        { title: '总结算', width: 80, dataIndex: 'total' },
        { title: '结算截止时间', width: 190, dataIndex: 'endTime' },
        { title: '结算时间', dataIndex: 'paymentAt' },
    ])

    if (store.isSystem) {
        columns.splice(1, 0, { title: '代理', fixed: 'left',  width: 100, slotName: 'agent',  ellipsis: true, })
    }

    /** 更新路由查询参数 */
    const updateRouteQuery = Helper.debounce(() => {
        router.push({ query: QueryModel.filterEmpty() })
    }, 50);

    /** 分页查询 */
    const onChangePage = function(key, value) {
        QueryModel.update(key, value)
        updateRouteQuery();
    }
    
    /** 查询 */
    function onQuerySubmit() {
        QueryModel.update({ page: 1, limit: 15 }) // 重置当前分页
        updateRouteQuery();
    }

    /** 重置查询 */
    function onQueryReset() {
        QueryModel.reset()
        updateRouteQuery();
    }

    /** 监听页面大小变化 */
    function onResize(rect) {
        pageRect.value = rect
    }

</script>