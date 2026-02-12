<template>
    <Page>
        <template #header>
            <PageHeader title="控制台">
                <template #icon><icon-home :size="20" /></template>
                <template #extra v-if="store.isSystem">
                    <a-select v-model="adminId" style="width: 180px;">
                        <template #prefix>代理</template>
                        <a-option value="" label="全部" />
                        <a-option v-for="item in store.agents" :value="item.adminId" :label="item.username" />
                    </a-select>
                </template>
            </PageHeader>
        </template>

        <div class="Home">
            <a-grid :col-gap="12" :row-gap="0" :cols="store.isDesktop ? 2 : 1" v-if="store.isSystem">
                <Panel title="设备">
                    <div class="TotalGroup">
                        <div class="item">
                            <span class="title">总数</span>
                            <span class="value">{{ CountData.device.total }}</span>
                        </div>
                        <div class="item">
                            <span class="title">已激活</span>
                            <span class="value">{{ CountData.device.active }}</span>
                        </div>
                        <div class="item">
                            <span class="title">设备在线</span>
                            <span class="value">{{ CountData.device.online }}</span>
                        </div>
                        
                    </div>
                </Panel>
                <Panel title="用户">
                    <div class="TotalGroup">
                        <div class="item">
                            <span class="title">总数</span>
                            <span class="value">{{ CountData.user.total }}</span>
                        </div>
                         <div class="item">
                            <span class="title">客户端在线</span>
                            <span class="value">{{ CountData.device.clientOnline }}</span>
                        </div>
                    </div>
                </Panel>
            </a-grid>

            <a-grid :col-gap="12" :row-gap="0" :cols="store.isDesktop ? 2 : 1">
                <a-grid-item>
                    <Panel title="激活记录">
                        <div class="TotalGroup">
                            <div class="item">
                                <span class="title">总记录</span>
                                <span class="value">{{ CountData.active.total }}</span>
                            </div>
                            <template v-if="store.isSystem">
                                <div class="item">
                                    <span class="title">未结算</span>
                                    <span class="value">{{ CountData.active.unpayment }}</span>
                                </div>
                                <div class="item">
                                    <span class="title">已结算</span>
                                    <span class="value">{{ CountData.active.payment }}</span>
                                </div>
                            </template>
                        </div>
                    </Panel>
                </a-grid-item>

                <a-grid-item>
                    <Panel title="移机记录">
                        <div class="TotalGroup">
                            <div class="item">
                                <span class="title">总记录</span>
                                <span class="value">{{ CountData.move.total }}</span>
                            </div>
                            <template v-if="store.isSystem">
                                <div class="item">
                                    <span class="title">未结算</span>
                                    <span class="value">{{ CountData.move.unpayment }}</span>
                                </div>
                                <div class="item">
                                    <span class="title">已结算</span>
                                    <span class="value">{{ CountData.move.payment }}</span>
                                </div>
                            </template>
                        </div>
                    </Panel>
                </a-grid-item>
            </a-grid>

            <a-grid :col-gap="12" :row-gap="0" :cols="store.isDesktop ? 2 : 1">
                <a-grid-item>
                    <ActiveChart :adminId="adminId" />
                </a-grid-item>

                <a-grid-item>
                    
                    <MoveChart :adminId="adminId" />
                </a-grid-item>

            </a-grid>
        </div>

    </Page>
</template>

<script setup>
    const store = useStore();
    import ActiveChart from './components/ActiveChart.vue';
    import MoveChart from './components/moveChart.vue';

    const adminId = ref('')

    const { data: CountData } = await useHttpRequest(async () => {
        const { data }  = await Api.Statistc.all({
            adminId: adminId.value
        })
        return data
    }, {
        watch: [ adminId ]
    })

</script>

<style lang="less" scoped>
    .Home {
        padding: @size-4;
    }

    .TotalGroup {
        display: flex;
        .item {
            flex: 0 0 33.3%;
            display: flex;
            flex-direction: column;
            padding-right: @size-4;
            &+.item {
                padding-left: @size-4;
                border-left: 1px solid @color-border-2;
            }
        }
        .title {
            font-size: @font-size-body-2;
            color: @color-text-3;
        }
        .value {
            margin-top: @size-1;
            font-size: @font-size-title-3
        }
    }
</style>