<template>
    <Page @resize="onResize">
        <template #header>
            <PageHeader title="设备">
                <QueryForm :model="queryForm" @submit="onQuerySubmit" @reset="onQueryReset">

                    <a-input v-model="queryForm.keyword" placeholder="关键字">
                        <template #prefix>设备或用户</template>
                    </a-input>

                    <a-select v-model="queryForm.isOnline" v-if="store.isDesktop">
                        <template #prefix>设备在线</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in ONLINE_TYPES" :value="item.value" :label="item.label" />
                    </a-select>

                    <a-select v-model="queryForm.clientIsOnline" v-if="store.isDesktop">
                        <template #prefix>客户端在线</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in ONLINE_TYPES" :value="item.value" :label="item.label" />
                    </a-select>

                    <a-select v-model="queryForm.isActive" v-if="store.isDesktop && store.isSystem">
                        <template #prefix>激活状态</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in ACTIVE_STATUS" :value="item.value" :label="item.label" />
                    </a-select>

                    <a-select v-model="queryForm.status" v-if="store.isDesktop">
                        <template #prefix>状态</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in STATUS_TYEPS" :value="item.value" :label="item.label" />
                    </a-select>

                    <a-select v-model="queryForm.adminId" v-if="store.isDesktop && store.isSystem">
                        <template #prefix>代理</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in store.agents" :value="item.adminId" :label="item.username" />
                    </a-select>

                    <DateFilter v-model:start="queryForm.startTime" v-model:end="queryForm.endTime" v-if="store.isDesktop">
                        <template #prefix>激活时间</template>
                    </DateFilter>

                    <a-input v-model="queryForm.connectedIp" placeholder="连接IP" v-if="store.isDesktop && store.isSystem">
                        <template #prefix>连接IP</template>
                    </a-input>
                </QueryForm>
            </PageHeader>
        </template>

        <List :data="data.rows" v-slot="{ item }">
            <Item :data="item" @select="onItemSelect($event, item)" @success="refresh" />
        </List>

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
                :page-size-options="[12, 24, 48]"
                @change="onChangePage('page', $event)"
                @page-size-change="onChangePage('limit', $event)"
            />
        </template>

        <SetUser ref="userRef" @success="refresh" />
        <MoveDevice ref="moveRef" @success="refresh" />
        <ResetUserPassword ref="passwordRef" />
    </Page>
</template>

<script setup>
    import List from './components/List.vue'
    import Item from './components/Item.vue'
    import SetUser from './components/SetUser.vue'
    import MoveDevice from './components/MoveDevice.vue'
    import ResetUserPassword from "../user/components/ResetPassword.vue"

    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const pageRect = ref({ width: 0, height: 0 })
    const userRef = ref()
    const moveRef = ref()
    const passwordRef = ref()

    const { data: queryForm, ...QueryModel } = useFormModel({
        keyword: { type: 'string', value: '' },
        connectedIp: { type: 'string', value: '' },
        level: { type: 'string', value: '' },
        isOnline: { type: 'boolean', value: '' },
        clientIsOnline: { type: 'boolean', value: '' },
        isActive: { type: 'boolean', value: '' },
        status: { type: 'number', value: '' },
        adminId: { type: 'string', value: '' },
        startTime: { type: 'string', value: '' },
        endTime: { type: 'string', value: '' },
        page: { type: 'number', value: 1 },
        limit: { type: 'number', value: 24 }
    })
    QueryModel.update(route.query)

    /** 请求列表数据 */
    const { data, refresh } = await useHttpRequest(async (to) => {
        const query = QueryModel.filterEmpty();
        const { data } = await Api.Device.list(query)
        return data
    }, {
        watch: [ route ]
    })

    /** 设备操作 */
    function onItemSelect(type, data) {
        switch(type) {
            case 'active':
                return router.push({ path: '/active', query: { deviceCode: data.deviceCode }})
            case 'move':
                return moveRef.value.open(data)
            case 'user':
                return userRef.value.open(data)
            case 'password':
                return passwordRef.value.open({
                    userId: data.userId,
                    username: data.user.username
                })
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
        QueryModel.update({ page: 1, limit: queryForm.limit }) // 重置当前分页
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