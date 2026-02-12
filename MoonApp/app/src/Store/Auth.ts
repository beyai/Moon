import { Service } from "@/Service";
import type { LoginRequest, RegisterRequest, TokenResponse, UpdatePasswordRequest } from "@/Service/interface";
import { createStore } from "./BaseStore";

export const {
    state: AuthState,
    actions: AuthActions,
    useStore: useAuthStore,
    useSnapshot: useAuthSnapshot,
} = createStore({
    
    name: 'authStore',

    persistKeys: [
        'username', 'password', 
        'accessToken', 'refreshToken',
    ],

    state: {
        username: '',
        password: '',
        accessToken: '',
        refreshToken: '',
        userInfo: null as Record<string, any> | null
    },

    getters: {

        isLogin(): boolean {
            return this.refreshToken != ''
        }
        
    },

    actions: {

        /**
         * 设置 Token
         */
        setTokens(tokens: TokenResponse) {
            this.accessToken    = tokens.accessToken;
            this.refreshToken   = tokens.refreshToken
        },

        /**
         * 清空登录令牌
         * - 清空后自动返回登录界面, 无需调用路由切换
         */
        clearTokens() {
            this.accessToken = ''
            this.refreshToken = ''
            this.userInfo = null
        },

        // 用户登录
        async userLogin(formData: LoginRequest) {
            const { data } = await Service.userLogin(formData)
            this.username = formData.username
            this.password = formData.password
            AuthActions.setTokens(data)
            console.log(this)
        },

        // 注册
        async userRegister(formData: RegisterRequest) {
            await Service.userRegister(formData)
            this.username = formData.username
            this.password = formData.password
        },

        // 修改密码
        async updatePassword(formData: UpdatePasswordRequest) {
            await Service.updatePassword(formData)
            this.password = ''
            AuthActions.clearTokens()
        },

        // 退出登录
        async userLogout() {
            await Service.userLogout().catch(err => {
                console.log(err.message)
            })
            AuthActions.clearTokens()
        },

        // 初始化账号信息
        async userInit() {
            const { data } = await Service.userInit()
            this.userInfo = data
        },

    }
})