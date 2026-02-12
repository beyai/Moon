
export const useStore = defineStore('appStore', {
    state() {
        return {
            isDesktop: true,
            accessToken: Storage.get("accessToken") || null,
            refreshToken: Storage.get("refreshToken") || null,
            userInfo: null,
            agents: [],
            gameDict: null
        }
    },

    getters: {

        // 是否为系统管理员
        isSystem() {
            if (!this.userInfo) {
                return false
            }
            return this.userInfo.type == 'system'
        },

        /** 菜单 */
        menuList() {
            return this.isSystem ? SystemMenu : AgentMenu
        },
        
    },

    actions: {

        /**
         * 登录
         * @param {{ username: string, password: string, key: Base64URLString }} params - 请求参数
         * - username 登录账号
         * - password 登录密码
         * - key 操作验证 key
         * @returns {void}
         */
        async Login(params) {
            const { data } = await Api.Common.login(params)
            Storage.set('accessToken', data.accessToken);
            Storage.set('refreshToken', data.refreshToken);
            this.accessToken = data.accessToken
            this.refreshToken = data.refreshToken
            navigateTo('/')
        },

        /**
         * 登出
         * @returns {void}
         */
        async Logout() {
            if (this.refreshToken) {
                await Api.Common.logout({ 
                    headers: {
                        Authorization: this.refreshToken 
                    }
                }).catch(err => console.log(err.message))
            }
            this.Reset()
        },

        /**
         * 重置
         */
        Reset() {
            this.accessToken = null;
            this.refreshToken = null;
            this.userInfo = null;
            this.agents = [];
            Storage.clear();
            setTimeout(() => {
                navigateTo('/login')
            }, 0)
        },


        /**
         * 刷新访问token
         */
        async refreshAccessToken() {
            this.accessToken = null
            Storage.remove('accessToken');
            const { data } = await Api.Common.refreshToken({
                headers: {
                    "Authorization": this.refreshToken
                }
            })
            Storage.set('accessToken', data.accessToken);
            this.accessToken = data.accessToken
            if (data.refreshToken) {
                Storage.set('refreshToken', data.refreshToken);
                this.refreshToken = data.refreshToken
            }
        },

        /**
         * 初始化账号信息
         */
        async init() {
            const { data } = await Api.Common.init()
            this.userInfo = data;
            // 系统账号加载代理商
            if (this.isSystem) {
                Api.Admin.agent().then(({ data }) => {
                    this.agents = data;
                }).catch(err => {
                    console.error(err)
                })
            }
            // 获取游戏字典
            if (!this.gameDict) {
                Api.Game.dict().then(({ data }) => {
                    this.gameDict = data
                }).catch(err => {
                    console.error(err)
                })
            }
        },
        
        /**
         * 获取代理名称
         */
        getAgentName(adminId) {
            for (const item of this.agents) {
                if (item.adminId == adminId) return item.username
            }
            return ''
        },

        /**
         * 字段名
         * @param {string} key 字段
         * @returns { { label: string; value: any }[] }
         */
        getGameDict(key) {
            if (this.gameDict && this.gameDict[key]) {
                return this.gameDict[key]
            }
            return []
        },

        /**
         * 获取游戏字典值标签
         */
        getGameDictLabel(key, value) {
            for (const item of this.getGameDict(key)) {
                if (item.value == value) return item.label
            }
            return ''
        }

    }

})

