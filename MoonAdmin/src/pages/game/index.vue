<template>
    <Page @resize="onResize">
        <PageHeader title="游戏">
            <template #extra>
                <a-button type="primary" @click="editRef.open()">
                    <template #icon><a-icon-plus /></template>
                    创建游戏
                </a-button>
            </template>

            <QueryForm :model="queryForm" @submit="onQuerySubmit" @reset="onQueryReset">
                <a-select v-model="queryForm.type">
                    <template #prefix>游戏类型</template>
                    <a-option value="" label="全部" />
                    <a-option v-for="item in store.getGameDict('type')" :value="item.value" :label="item.label" />
                </a-select>

                <a-select v-model="queryForm.status" v-if="store.isDesktop">
                    <template #prefix>游戏状态</template>
                    <a-option value="" label="全部" />
                    <a-option v-for="item in STATUS_TYEPS" :value="item.value" :label="item.label" />
                </a-select>
            </QueryForm>
            
        </PageHeader>

        <a-table 
            :columns="columns"
            :data="data.rows"
            :scroll="{ minWidth: 1200, height: pageRect.height - 54 }"
            :scrollbar="false"
            :bordered="false"
            :pagination="false"
        >
            <template #index="{ rowIndex }">
                {{ rowIndex + 1 }}
            </template>

            <template #secretKey="{ record }">
                <a-typography-paragraph copyable>{{ record.secretKey }}</a-typography-paragraph>
            </template>

            <template #status="{ record }">
                <a-switch size="small"
                    :modelValue="record.status"
                    :checked-value="1"
                    :unchecked-value="0"
                    checkedColor="rgb(var(--success-6))"
                    @change="onChangeStatus(record)"
                />
            </template>

            <template #operate="{ record }">
                <a-space>
                    <a-link @click="editRef.open(record)">编辑</a-link>
                    <a-link @click="onClickDelete(record)">删除</a-link>
                </a-space>
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
        
        <EditGame ref="editRef" @success="refresh" />
    </Page>
</template>


<script setup>
import EditGame from './components/EditGame.vue';

    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const pageRect = ref({ width: 0, height: 0 });
    const editRef = ref()

    const { data: queryForm, ...QueryModel } = useFormModel({
        type: { type: 'string', value: '' },
        status: { type: 'number', value: '' },
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 15 }
    })
    QueryModel.update(route.query)

    /** 表格列 */
    const columns = reactive([
        { title: '#', width: 70, fixed: 'left', align: 'center', slotName: 'index' },
        { title: '游戏名',  width: 130,  dataIndex: 'name' },
        { title: '别名',  width: 130,  dataIndex: 'type' },
        { title: '手牌张数',  width: 100,  align: 'center', dataIndex: 'handCards' },
        { title: '用牌定制',  dataIndex: 'useCards' },
        { title: '状态',    width: 100, align: 'center', slotName: 'status' },
        { title: '更新时间', width: 180,  dataIndex: 'updatedAt' },
        { title: '创建时间', width: 180,  dataIndex: 'createdAt' },
        { title: '操作', width: 150, align: 'center', slotName: 'operate' }
    ])

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const query = QueryModel.filterEmpty();
        const { data } = await Api.Game.list(query)
        return data
    }, {
        watch: [ route ]
    })

    /** 删除 */
    function onClickDelete(data) {
        const params = { id: data.id }
        useOptionalDialog({
            messageType: 'warning',
            content: `删除后无法恢复，确定是否删除该记录？`,
            okText: '删除',
        }, async () => {
            try {
                await Api.Session.remove(params)
                Message.success(`删除成功！`)
                refresh();
            } catch(err) {
                Message.error(err.message)
                return false;
            }
        })
    }

    /** 切换状态 */
    async function onChangeStatus(record) {
        const params = {
            gameId: record.gameId,
            status: record.status ? 0 : 1
        }
        try {
            await Api.Game.setStatus(params)
            record.status = params.status
        } catch(err) {
            Message.error(err.message)
            return false;
        }
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