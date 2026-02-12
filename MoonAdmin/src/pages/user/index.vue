<template>
    <Page @resize="onResize">
        <template #header>
            <PageHeader title="用户管理">
                <template #extra>
                    <a-button type="primary" @click="AddRef.open()">
                        <template #icon><a-icon-plus /></template>
                        创建账号
                    </a-button>
                </template>
                <QueryForm @submit="onQuerySubmit" @reset="onQueryReset">
                    <a-input v-model="queryForm.username" placeholder="关键字">
                        <template #prefix>账号</template>
                    </a-input>
                    
                    <a-select v-model="queryForm.isOnline" v-if="store.isDesktop">
                        <template #prefix>是否在线</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in ONLINE_TYPES" :value="item.value" :label="item.label" />
                    </a-select>

                    <a-select v-model="queryForm.status" v-if="store.isDesktop">
                        <template #prefix>状态</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in STATUS_TYEPS" :value="item.value" :label="item.label" />
                    </a-select>
                </QueryForm>
            </PageHeader>
        </template>

        <a-table 
            :columns="columns"
            :data="data.rows"
            :scroll="{ minWidth: 1100, height: pageRect.height - 54 }"
            :scrollbar="false"
            :bordered="false"
            :pagination="false"
        >
            <template #index="{ rowIndex }">
                {{ ( data.page - 1) * data.limit + ( rowIndex + 1 ) }}
            </template>

            <template #online="{ record }">
                <a-tag :color="ONLINE_TYPES[record.isOnline]['color']">{{ ONLINE_TYPES[record.isOnline]['label'] }}</a-tag>
            </template>

            <template #status="{ record }">
                <a-switch size="small"
                    :modelValue="record.status"
                    :checked-value="1"
                    :unchecked-value="0"
                    checkedColor="rgb(var(--success-6))"
                    uncheckedColor="rgb(var(--danger-6))"
                    @change="onChangeStatus(record)"
                />
            </template>

            <template #operate="{ record }">
                <a-link @click="() => ResetPasswordRef.open(record)">重置密码</a-link>
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

        <ResetPassword ref="ResetPasswordRef" />
        <Add ref="AddRef" @success="refresh" />
    </Page>
</template>

<script setup>
    import ResetPassword from './components/ResetPassword.vue';
    import Add from './components/Add.vue';
    
    const store = useStore();
    const route = useRoute();
    const router = useRouter();

    const AddRef = ref(null)
    const ResetPasswordRef = ref(null)
    const pageRect = ref({ width: 0, height: 0 })
    
    /** 查询表单 */
    const { data: queryForm, ...QueryModel } = useFormModel({
        username: { type: 'string', value: '' },
        isOnline: { type: 'boolean', value: '' },
        status: { type: 'number', value: '' },
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 15 }
    })
    QueryModel.update(route.query)

    /** 表格列 */
    const columns = reactive([
        { title: '#', width: 70, fixed: 'left', align: 'center', slotName: 'index' },
        { title: '账号', width: 150, dataIndex: 'username', ellipsis: true, },
        { title: '是否在线', width: 100, align: 'center', slotName: 'online' },
        { title: '登录时间', width: 180, dataIndex: 'loginAt' },
        { title: 'IP', dataIndex: 'loginIp' },
        { title: '状态',  width: 80, align: 'center', slotName: 'status' },
        { title: '注册时间', width: 180, dataIndex: 'createdAt' },
        { title: '操作', width: 120, align: 'center', slotName: 'operate' }
    ])

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const query = QueryModel.filterEmpty();
        const { data } = await Api.User.list(query)
        return data
    }, {
        watch: [ route ]
    })

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

    /** 切换状态 */
    async function onChangeStatus(record) {
        const params = {
            userId: record.userId,
            status: record.status ? 0 : 1
        }
        try {
            await Api.User.setStatus(params)
            record.status = params.status
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }
</script>