<template>
    <Page @resize="onResize">
        <template #header>
            <PageHeader title="移机记录">
                <QueryForm :model="queryForm" @submit="onQuerySubmit" @reset="onQueryReset">

                    <a-input v-model="queryForm.deviceCode" placeholder="关键字">
                        <template #prefix>设备码</template>
                    </a-input>

                    <a-input v-model="queryForm.username" placeholder="关键字" v-if="store.isDesktop">
                        <template #prefix>用户</template>
                    </a-input>

                    <a-select v-model="queryForm.adminId" v-if="store.isDesktop && store.isSystem">
                        <template #prefix>代理</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in store.agents" :value="item.adminId" :label="item.username" />
                    </a-select>

                    <DateFilter v-model:start="queryForm.startTime" v-model:end="queryForm.endTime" v-if="store.isDesktop">
                        <template #prefix>移机时间</template>
                    </DateFilter>
                </QueryForm>
            </PageHeader>
        </template>

        <a-table 
            :columns="columns"
            :data="data.rows"
            :scroll="{ minWidth: 1000, height: pageRect.height - 54 }"
            :scrollbar="false"
            :bordered="false"
            :pagination="false"
        >
            <template #index="{ rowIndex }">
                {{ ( data.page - 1) * data.limit + ( rowIndex + 1 ) }}
            </template>

            <template #level="{ record }">
                <a-tag :color="ACTIVE_TYPES[record.level]['color']">{{ ACTIVE_TYPES[record.level]['label'] }}</a-tag>
            </template>

            <template #agent="{ record }">
                {{ store.getAgentName(record.adminId) }}
            </template>

            <template #operate="{ record }">
                <a-link :disabled="!!record.payment" @click="onClickDelete(record)">撤销</a-link>
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
        username: { type: 'string', value: '' },
        adminId: { type: 'string', value: '' },
        startTime: { type: 'string', value: '' },
        endTime: { type: 'string', value: '' },
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 15 }
    })
    QueryModel.update(route.query)

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const query = QueryModel.filterEmpty();
        const { data } = await Api.Move.list(query)
        return data
    }, {
        watch: [ route ]
    })

    /** 表格列 */
    const columns = reactive([
        { title: '#', width: 70, fixed: 'left', align: 'center', slotName: 'index' },
        { title: '旧设备码', width: 120, dataIndex: 'oldDeviceCode' },
        { title: '新设备码', width: 120, dataIndex: 'newDeviceCode' },
        { title: '旧用户', width: 140, dataIndex: 'oldUsername', ellipsis: true,  },
        { title: '新用户', width: 140, dataIndex: 'newUsername', ellipsis: true },
        { title: '移机时间',  dataIndex: 'createdAt' },
    ])

    if (store.isSystem) {
        columns.push({ title: '代理', width: 100, slotName: 'agent',  ellipsis: true  } )
        columns.push({ title: '操作', width: 80, align: 'center', slotName: 'operate' } )
    }

    /** 撤销记录 */
    function onClickDelete(data) {
        const params = {
            moveId: data.moveId,
        }
        useOptionalDialog({
            messageType: 'warning',
            content: `撤销后无法恢复，确定是否撤销该记录？`,
            okText: '撤销',
        }, async () => {
            try {
                await Api.Move.unMove(params)
                data.isActive = false;
                data.activeAt = null
                Message.success(`撤销移机记录成功！`)
                refresh();
            } catch(err) {
                Message.error(err.message)
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