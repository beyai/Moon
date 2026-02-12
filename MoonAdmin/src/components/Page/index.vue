<template>
    <div class="Page">
        <slot name="header" />
        <div class="Page-Container" ref="pageRef">
            <slot />
        </div>
        <div class="Page-Footer" v-if="$slots.footer">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup>
    const pageRef = ref(null)
    const emit = defineEmits(['resize'])
    function handlerResize() {
        const { offsetWidth, offsetHeight } = pageRef.value
        emit('resize', {
            width: offsetWidth,
            height: offsetHeight
        })
    }
    onMounted(() => {
        window.addEventListener('resize', handlerResize)
        handlerResize();
    })
    onBeforeUnmount(() => {
        window.removeEventListener('resize', handlerResize)
    })
</script>

<style lang="less">
    .Page {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;

        &-Header, &-Footer {
            flex-shrink: 0;
            background-color: @color-bg-1;
            padding: @size-3 @size-4;
        }

        &-Header {
            border-bottom: 1px solid @color-border-2;
        }

        &-Footer {
            display: flex;
            justify-content: center;
            border-top: 1px solid @color-border-2;
        }

        &-Container {
            flex: 1;
            height: auto;
            overflow: auto;
        }

    }
</style>