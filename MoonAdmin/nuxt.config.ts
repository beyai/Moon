// https://nuxt.com/docs/api/configuration/nuxt-config
import { vitePluginForArco } from '@arco-plugins/vite-vue'

export default defineNuxtConfig({

    compatibilityDate: '2025-04-28',

    ssr: false,

    devtools: { 
        enabled: false 
    },
    
    srcDir: 'src/',

    app: {
        baseURL: '/',
        buildAssetsDir: '/assets/',
        rootId: 'app'
    },

    pages: {
        pattern:[
            '**\/*.vue', 
            '!**\/components\/**\/*.vue'
        ]
    },

    
    ignore: [
        // 指定 pages 文件夹下的 这些文件夹不生成路由
        // "src/layouts/**/components/**",
        // "src/pages/**/components/**"
    ],

    nitro: {
        preset: 'static',
        prerender: {
            crawlLinks: false,
        }
    },

    modules: [
        '@pinia/nuxt'
    ],

    devServer: {
        host: '0.0.0.0',
        port: 3000,
    },

    vite: {
        plugins: [
            vitePluginForArco({
                theme: '@arco-themes/vue-chandre-line',
                style: 'css'
            }),
        ],
        server: {
            proxy: {
                '^(/api|/public|/io)': {
                    target: 'http://127.0.0.1:7001',
                    // target: 'https://api.fireeyecam.com',
                    changeOrigin: true,
                    ws: true,
                    rewrite(path) {
                        return path.replace('/api', '')
                    }
                }
            }
        },
        css: {
            preprocessorOptions: {
                less: {
                    javascriptEnabled: true,
                    additionalData: `
                        @import "@arco-themes/vue-chandre-line/theme.less";
                        @import "~/less/mixins.less";
                        @import "~/less/var.less";
                    `
                }
            }
        }, 

    }
})