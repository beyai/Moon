<template>
    <NuxtLoadingIndicator :height="5" />
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup> 
    useHead({
        title: '管理系统',
        htmlAttrs: { lang: 'zh-CN' },
        meta: [
            { name: 'viewport', content: 'width=device-width, initial-scale=0.95, maximum-scale=0.95, user-scalable=no'  }
        ]
    })

    const store = useStore();
    function handlerWindowResize(event) {
        store.isDesktop = document.body.offsetWidth > 960
    }

    onBeforeMount(handlerWindowResize)
    onMounted(() => {
        window.addEventListener('resize', handlerWindowResize)
    })
    onBeforeUnmount(() => {
        window.removeEventListener('resize', handlerWindowResize)
    })



</script>

<style lang="less">
    @import url('@arco-design/web-vue/dist/arco.css');
    @import url('@/less/app.less');
</style>