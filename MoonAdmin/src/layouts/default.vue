<template>
    <div class="Layout" :class="{ isMobile: !store.isDesktop }">
        <Aside />
        <div class="Layout-Container">
            <NuxtPage />
        </div>
    </div>
</template>

<script setup>
    import Aside from './components/Aside.vue';
    const store = useStore();
</script>

<style lang="less">
    .Layout {
        display: flex;
        flex-direction: row;
        width: 100vw;
        height: 100vh;
        overflow: hidden;

        

        &-Container {
            display: flex;
            flex: 1;
            width: auto;
            background-color: @color-fill-2;
            overflow: hidden;
        }

        &-Aside {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            width: 220px;
            border-right: 1px solid @color-border-2;

            &-Header, &-Footer {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                padding: @size-1;
            }

            &-Header {
                border-bottom: 1px solid @color-border-2;
                min-height: 57px;
            }

            &-Footer {
                border-top: 1px solid @color-border-2;
            }

            &-Container {
                flex: 1;
            }
        }

        &.isMobile {
            flex-direction: column;
        }
        &.isMobile &-Aside {
            width: auto;
            flex-direction: row;
            border-right: 0;
            justify-content: space-between;
            border-bottom: 1px solid @color-border-2;
            &-Header, &-Footer {
                border: 0;
            }
            &-Header {
                min-height: 44px;
            }
        }


    }
</style>