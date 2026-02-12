export default defineNuxtRouteMiddleware(async (to) => {
    const store = useStore();
    // 未登录
    if (!store.refreshToken && to.path == '/login') return;

    // 刷新 Token不存在，且非登录界面，跳转到登录页
    if (!store.refreshToken && to.path !== '/login') {
        return navigateTo('/login')
    }
    // 已登录，未初始化
    if (store.refreshToken && !store.userInfo) {
        await store.init()
    }

    if (to.path == '/login') {
        return navigateTo('/')
    }
})