<template>
    <div class="Device" :key="data.deviceId">
        <div class="Device-Header">
            <a-avatar :size="32"  :style="{ backgroundColor: data.status ? 'rgb(var(--primary-5))' : 'rgb(var(--danger-5))' }">
                <icon-robot />
            </a-avatar>
            <div class="title">
                <a-typography-paragraph copyable>{{ data.deviceCode }}</a-typography-paragraph>
            </div>
            
        </div>

        <div class="Device-Meta">
            <div class="item">
                <span class="label">状态</span>
                <span class="value">
                    <a-tag v-if="data.isActive" :color="ACTIVE_TYPES[data.activeLevel]['color']">
                        {{ ACTIVE_TYPES[data.activeLevel]['label'] }}
                    </a-tag>
                    <a-tag color="gray" v-else>未激活</a-tag>
                </span>
            </div>
            <div class="item">
                <span class="label">剩余</span>
                <span class="value" v-if="data.isActive">
                    <span>
                        {{ data.countDays }} <small>天</small>
                    </span>
                </span>
                <span class="value" v-else>
                    --
                </span>
            </div>
            <div class="item">
                <span class="label">设备</span>
                <span class="value">
                    <a-badge :color="ONLINE_TYPES[data.isOnline]['color']" :text="ONLINE_TYPES[data.isOnline]['label']" />
                </span>
            </div>
            <div class="item">
                <span class="label">客户端</span>
                <span class="value">
                    <a-badge :color="ONLINE_TYPES[data.clientIsOnline]['color']" :text="ONLINE_TYPES[data.clientIsOnline]['label']" />
                </span>
            </div>
        </div>

        <ul class="Device-Container">
            <li>
                <label>用户：</label>
                <span class="content">
                    <a-typography-paragraph class="content" copyable ellipsis>
                        {{  data.user ? data.user.username : '--' }}
                    </a-typography-paragraph>
                </span>
            </li>
            <li>
                <label>激活时间：</label>
                <span class="content">{{ data.activeAt || '--' }}</span>
            </li>
            <li v-if="store.isSystem">
                <label>连接IP：</label>
                <span class="content">{{ data.connectedIp || '--' }}</span>
            </li>
            <li>
                <label>连接时间：</label>
                <span class="content">{{ data.connectedAt || '--' }}</span>
            </li>
            <li v-if="store.isSystem">
                <label>注册时间：</label>
                <span class="content">{{ data.createdAt || '--' }}</span>
            </li>
            <li>
                <label>App版本：</label>
                <span class="content">{{ data.version || '0.0.0' }}</span>
            </li>
            <li>
                <label>客户端版本：</label>
                <span class="content">{{ data.clientVersion || '0.0.0' }}</span>
            </li>
            
            <li v-if="store.isSystem">
                <label>代理：</label>
                <span class="content">{{ data.adminId ? store.getAgentName(data.adminId) : '--' }}</span>
            </li>
        </ul>

        <div class="Device-Footer">
            <a-space>
                <a-button type="text" shape="round" size="mini" @click="onSelect('active')" v-if="!data.isActive">
                    激活
                </a-button>
                <a-dropdown @select="onSelect">
                    <a-button  type="text" shape="round" size="mini" :disabled="isDisabledMore">更多</a-button>
                    <template #content>
                        <a-doption value="move" :disabled="!data.isActive">
                            <template #icon><icon-swap /></template>移机
                        </a-doption>
                        <a-doption value="user" :disabled="!data.isActive">
                            <template #icon><icon-user /></template>过户
                        </a-doption>
                        <a-doption value="unactive" :disabled="!data.isActive">
                            <template #icon><icon-sync /></template>取消激活
                        </a-doption>
                        <a-doption value="password">
                            <template #icon><icon-lock /></template>重置账号密码
                        </a-doption>
                        <template v-if="store.isSystem">
                            <a-doption value="status">
                                <template #icon>
                                    <icon-stop v-if="data.status" />
                                    <icon-check-circle v-else />
                                </template>
                                {{ data.status ? '禁用' : '启动' }}
                            </a-doption>
                            <a-doption value="delete" :disabled="data.isActive">
                                <template #icon><icon-delete /></template>删除
                            </a-doption>
                        </template>
                    </template>
                </a-dropdown>
            </a-space>
        </div>
    </div>
</template>

<script setup>
    const store = useStore();
    const { data } = defineProps({
        data: Object,
    })

    const isDisabledMore = computed(() => {
        return (!store.isSystem && store.userInfo.adminId !== data.adminId)
    })

    /** 设置状态 */
    function setStatus() {
        const params = {
            deviceCode: data.deviceCode,
            status: data.status ? 0 : 1
        }
        const statusText = data.status ? '禁用' : '启用';
        useOptionalDialog({
            messageType: 'warning',
            content: `是否${ statusText }当前设备(${ data.deviceCode })？`,
            okText: statusText + '设备'
        }, async () => {
            try {
                await Api.Device.setStatus(params)
                data.status = params.status
                Message.success(`${ statusText }成功！`)
            } catch(err) {
                Message.error(err.message)
                return false;
            }
        })
    }

    /** 取消激活 */
    function unActive() {
        const params = {
            deviceCode: data.deviceCode,
        }
        useOptionalDialog({
            messageType: 'warning',
            content: `取消激活后无法恢复，确定是否取消激活该设备(${ data.deviceCode })？`,
            okText: '取消激活',
        }, async () => {
            try {
                await Api.Active.unActive(params)
                data.isActive = false;
                data.activeAt = null
                Message.success(`取消激活成功！`)
            } catch(err) {
                Message.error(err.message)
                return false;
            }
        })
    }

    /** 删除 */
    function deleteDevice() {
        const params = {
            deviceCode: data.deviceCode,
        }
        useOptionalDialog({
            messageType: 'warning',
            content: `确定删除该设备(${ data.deviceCode })？`,
            okText: '删除',
        }, async () => {
            try {
                await Api.Device.remove(params)
                Message.success(`删除成功！`)
                emit('success')
            } catch(err) {
                Message.error(err.data?.message || err.message)
                return false;
            }
        })
    }

    const emit = defineEmits(['select', 'success'])

    /** 菜单选项 */
    function onSelect(type) {
        switch(type) {
            case 'active':
            case 'move':
            case 'password':
            case 'user':
                return emit('select', type)
            case 'status':
                return setStatus();
            case 'unactive':
                return unActive();
            case 'delete':
                return deleteDevice();
        }
    }
</script>

<style lang="less" scoped>
    .Device {
        background-color: var(--color-bg-1);
        border-radius: @border-radius-small;
        overflow: hidden;
        .clearfix();

        &:hover {
            box-shadow: @shadow3-center;
        }

        &-Header, &-Meta, &-Container, &-Footer {
            margin: @size-4;
            display: flex;
            flex-direction: row;
        }

        &-Header {
            align-items: center;
            .title {
                font-weight: 600;
                font-size: @font-size-title-1;
                margin: 0 0 0 @size-2;
            }
        }

        &-Meta {
            padding-bottom: @size-4;
            border-bottom: 1px solid @color-border-2;

            .item {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding-right: @size-1;
                font-size: @font-size-body-3;
                & + .item {
                    padding-left: @size-1;
                    border-left: 1px solid @color-border-2;
                }
            }
            .label {
                text-align: center;
                flex-shrink: 0;
                font-size: @font-size-body-1;
                color: @color-text-3;
            }
            .value {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                font-size: 16px;
                margin-top: @size-1;
                small {
                    font-size: 70%;
                }
            }
        }

        &-Container {
            flex-direction: column;
            list-style: none;
            padding: 0;
            li {
                display: flex;
                font-size: @font-size-body-2;
                line-height: 1.8;
            }
            label {
                flex-shrink: 0;
                width: 90px;
                color: @color-text-3;
                text-align: right;
            }
            .content {
                flex: 1;
                margin: 0;
            }
        }

        &-Footer {
            justify-content: flex-end;
        }
    }
</style>