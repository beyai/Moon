<template>
    <Page @resize="onResize">
        <template #header>
            <PageHeader title="游戏玩法">
                <QueryForm :model="queryForm" @submit="onQuerySubmit" @reset="onQueryReset">

                    <a-input v-model="queryForm.deviceCode" placeholder="关键字">
                        <template #prefix>设备码</template>
                    </a-input>

                    <a-select v-model="queryForm.type">
                        <template #prefix>游戏类型</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in store.getGameDict('type')" :value="item.value" :label="item.label" />
                    </a-select>

                </QueryForm>
            </PageHeader>
        </template>

        <a-table 
            :columns="columns"
            :data="data.rows"
            :scroll="{ minWidth: 960, height: pageRect.height - 54 }"
            :scrollbar="false"
            :bordered="false"
            :pagination="false"
        >
            <template #index="{ rowIndex }">
                {{ ( data.page - 1) * data.limit + ( rowIndex + 1 ) }}
            </template>

            <template #trick="{ record }">
                {{ store.getGameDictLabel('trick', record.trick) }}
            </template>

            <template #cutCard="{ record }">
                {{ store.getGameDictLabel('cutCard', record.cutCard) }}
            </template>

            <template #isShuffleFull="{ record }">
                {{ record.isShuffleFull ? 'Yes' : 'No' }}
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

    </Page>
</template>

<script setup>
    
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const pageRect = ref({ width: 0, height: 0 })

    const { data: queryForm, ...QueryModel } = useFormModel({
        deviceCode: { type: 'string', value: '' },
        type: { type: 'string', value: '' },
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 15 }
    })
    QueryModel.update(route.query)

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const query = QueryModel.filterEmpty();
        const { data } = await Api.GamePlay.list(query)
        return data
    }, {
        watch: [ route ]
    })

    /** 表格列 */
    const columns = reactive([
        { title: '#', width: 70, fixed: 'left', align: 'center', slotName: 'index' },
        { title: '设备码', width: 130, dataIndex: 'deviceCode' },
        { title: '玩法名称', width: 150, dataIndex: 'name' },
        { title: '游戏类型',  width: 120,   align: 'center', dataIndex: 'game.name' },
        { title: '手法',  width: 150,  align: 'center', slotName: 'trick' },
        { title: '切牌方式',  width: 150,  align: 'center', slotName: 'cutCard' },
        { title: '对牌张数',  width: 100,  align: 'center', dataIndex: 'focusNum' },
        { title: '手牌张数',  width: 100,  align: 'center', dataIndex: 'handCards' },
        { title: '玩家人数',  width: 100,  align: 'center', dataIndex: 'people' },
        { title: '是否洗全',  width: 100,  align: 'center', slotName: 'isShuffleFull' },
        { title: '最少检测',  width: 100,  align: 'center', dataIndex: 'minCards' },
        { title: '用牌定制',  dataIndex: 'useCards' },
        { title: '创建时间',  width: 180, dataIndex: 'createdAt' },
    ])

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