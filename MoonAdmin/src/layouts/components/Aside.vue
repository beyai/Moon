<template>
    <div class="Layout-Aside">

        <div class="Layout-Aside-Header">
            <a-dropdown trigger="hover" @select="onClickMenuItem"  v-if="!store.isDesktop" content-class="AsideDropMenu">
                <a-button type="text" size="large" long>
                    <template #icon><icon-menu :size="20" /></template>
                </a-button>

                <template #content>
                    <a-doption v-for="item in store.menuList" :value="item.path">
                        <template #icon><component :is="item.icon" :size="16" /></template>
                        {{ item.name }}
                    </a-doption>
                </template>
            </a-dropdown>
        </div>

        <div class="Layout-Aside-Container" v-if="store.isDesktop">
            <a-menu :selectedKeys="selectedKeys" @menu-item-click="onClickMenuItem" >
                <a-menu-item v-for="item in store.menuList" :key="item.path">
                    <template #icon><component :is="item.icon" :size="18" /></template>
                    {{ item.name }}
                </a-menu-item>
            </a-menu>
        </div>

        <div class="Layout-Aside-Footer">
            <a-space :size="0" v-if="store.isDesktop">
                <template #split>
                    <a-divider direction="vertical" />
                </template>
                <a-button type="text" @click="onClickMenuItem('password')">修改密码</a-button>
                <a-button type="text" @click="onClickMenuItem('logout')">退出登录</a-button>
            </a-space>

            <a-dropdown trigger="hover" @select="onClickMenuItem"  content-class="AsideDropMenu" v-else>
                <a-button type="text" size="large" long>
                    <template #icon><icon-user :size="20" /></template>
                </a-button>
                <template #content>
                    <a-doption value="password">
                        <template #icon><icon-safe /></template>
                        修改密码
                    </a-doption>
                    <a-doption value="logout">
                        <template #icon><icon-export /></template>
                        退出登录
                    </a-doption>
                </template>
            </a-dropdown>
        </div>
        <UpdatePassword ref="passwordRef" />
    </div>
</template>

<script setup>
    import UpdatePassword from './UpdatePassword.vue'
    const route = useRoute();
    const store = useStore();

    const passwordRef = ref()
    
    const selectedKeys = computed(() => {
        return [ route.path ]
    })

    function onClickMenuItem(key) {
        switch(key) {
            case 'logout':
                return store.Logout()
            case 'password':
                return passwordRef.value.open();
            default:
                return navigateTo(key)
        }
    }

</script>

<style lang="less">
    .AsideDropMenu {
        width: 150px;
        .arco-dropdown-list-wrapper {
            max-height: 500px;
        }
        .arco-dropdown-option {
            font-size: 16px;
            line-height: 44px;
        }
    }
</style>