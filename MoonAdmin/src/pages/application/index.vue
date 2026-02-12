<template>
    <Page @resize="onResize">
        <PageHeader title="App版本管理">
                <template #extra>
                    <a-button type="primary" @click="AddRef.open()">
                        <template #icon><a-icon-plus /></template>
                        创建新版本
                    </a-button>
                </template>
            </PageHeader>

            <a-table 
                :columns="columns"
                :data="data.rows"
                :scroll="{ minWidth: 900, height: pageRect.height - 54 }"
                :scrollbar="false"
                :bordered="false"
                :pagination="false"
            >
                <template #index="{ rowIndex }">
                    {{ rowIndex + 1 }}
                </template>

                <template #secretKey="{ record }">
                    <a-typography-paragraph copyable ellipsis>{{ record.secretKey }}</a-typography-paragraph>
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
                    <a-link @click="onClickDelete(record)">删除</a-link>
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

            <AddVersion ref="AddRef" @success="refresh" />
    </Page>
</template>


<script setup>
    import AddVersion from './components/Add.vue'

    const store = useStore();
    const AddRef = ref()
    const route = useRoute();
    const router = useRouter();
    const pageRect = ref({ width: 0, height: 0 })


    const { data: queryForm, ...QueryModel } = useFormModel({
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 15 }
    })
    QueryModel.update(route.query)

    /** 表格列 */
    const columns = reactive([
        { title: '#', width: 70, fixed: 'left', align: 'center', slotName: 'index' },
        { title: '版本号',  width: 100,  dataIndex: 'version' },
        { title: 'JSBundle 加密密钥', slotName: 'secretKey' },
        { title: '开启状态', width: 100, align: 'center', slotName: 'status' },
        { title: '创建时间', width: 180, dataIndex: 'createdAt' },
        { title: '操作', width: 80, align: 'center', slotName: 'operate' }
    ])

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const { data } = await Api.App.list()
        return data
    }, {
        watch: [ route ]
    })

    
    /** 切换状态 */
    async function onChangeStatus(record) {
        const params = {
            id: record.id,
            status: record.status ? 0 : 1
        }
        try {
            await Api.App.setStatus(params)
            record.status = params.status
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }

    /** 撤销记录 */
    function onClickDelete(data) {
        const params = { id: data.id }
        useOptionalDialog({
            messageType: 'warning',
            content: `删除后无法恢复，确定是否删除该记录？`,
            okText: '删除',
        }, async () => {
            try {
                await Api.App.remove(params)
                Message.success(`删除成功！`)
                refresh();
            } catch(err) {
                Message.error(err.message)
                return false;
            }
        })
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
    
    /** 监听页面大小变化 */
    function onResize(rect) {
        pageRect.value = rect
    }

</script>