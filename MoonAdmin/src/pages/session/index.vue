<template>
    <Page @resize="onResize">
        <PageHeader title="App客户端">
            <QueryForm :model="queryForm" @submit="onQuerySubmit" @reset="onQueryReset">

                    <a-input v-model="queryForm.deviceCode" placeholder="关键字">
                        <template #prefix>设备码</template>
                    </a-input>

                    <a-input v-model="queryForm.model" placeholder="型号" v-if="store.isDesktop">
                        <template #prefix>型号</template>
                    </a-input>

                    <a-select v-model="queryForm.status" v-if="store.isDesktop">
                        <template #prefix>状态</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in SESSION_STSTUS" :value="item.value" :label="item.label" />
                    </a-select>

                </QueryForm>
        </PageHeader>

        <a-table 
            :columns="columns"
            :data="data.rows"
            :scroll="{ minWidth: 1000, height: pageRect.height - 54 }"
            :scrollbar="false"
            :bordered="false"
            :pagination="false"
        >
            <template #index="{ rowIndex }">
                {{ rowIndex + 1 }}
            </template>

            <template #deviceUID="{ record }">
                <a-typography-paragraph copyable  ellipsis>{{ record.deviceUID }}</a-typography-paragraph>
            </template>

            <template #status="{ record }">
                <a-badge
                    :color="SESSION_STSTUS[record.status]['color']"
                    :text="SESSION_STSTUS[record.status]['label']"
                />
            </template>

            <template #operate="{ record }">
                <a-space>
                    <a-link @click="onClickResetStatus(record)">重置状态</a-link>
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
    </Page>
</template>


<script setup>
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const pageRect = ref({ width: 0, height: 0 });

    const { data: queryForm, ...QueryModel } = useFormModel({
        deviceCode: { type: 'string', value: '' },
        model: { type: 'string', value: '' },
        status: { type: 'number', value: '' },
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 15 }
    })
    QueryModel.update(route.query)

    /** 表格列 */
    const columns = reactive([
        { title: '#', width: 70, fixed: 'left', align: 'center', slotName: 'index' },
        { title: '设备码',  width: 150,  dataIndex: 'deviceCode' },
        { title: '型号', width: 150,  dataIndex: 'model' },
        { title: '设备唯一标识',  slotName: 'deviceUID' },
        { title: '更新次数', width: 100, align: 'center',  dataIndex: 'updatedCount' },
        { title: '登记时间', width: 180, dataIndex: 'createdAt' },
        { title: '状态', width: 80, align: 'center', slotName: 'status' },
        { title: '操作', width: 150, align: 'center', slotName: 'operate' }
    ])

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const query = QueryModel.filterEmpty();
        const { data } = await Api.Session.list(query)
        return data
    }, {
        watch: [ route ]
    })

    /** 重置状态 */
    function onClickResetStatus(data) {
        const { deviceUID } = data
        useOptionalDialog({
            messageType: 'warning',
            content: `确定是否重置设备使用状态？`,
            okText: '重置',
        }, async () => {
            try {
                await Api.Session.reset({ deviceUID })
                Message.success(`重置成功！`)
                refresh();
            } catch(err) {
                Message.error(err.message)
                return false;
            }
        })
    }


    /** 删除 */
    function onClickDelete(data) {
        const { deviceUID } = data
        useOptionalDialog({
            messageType: 'warning',
            content: `删除后无法恢复，确定是否删除该记录？`,
            okText: '删除',
        }, async () => {
            try {
                await Api.Session.remove({ deviceUID })
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