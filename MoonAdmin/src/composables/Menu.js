import { 
    IconBookmark, IconBug, IconCalendarClock, IconCommand, IconDice, IconHome, IconMobile,
    IconRobot, IconSafe, IconTranslate, IconUser, IconUserGroup 
} from '@arco-design/web-vue/lib/icon/arco-vue-icon'

export const SystemMenu = [
    { name: '控制台', icon: IconHome, path: '/' },
    { name: '激活', icon: IconSafe, path: '/active' },
    { name: '设备', icon: IconRobot, path: '/device' },
    { name: '激活记录', icon: IconBookmark, path: '/activeRecord' },
    { name: '移机记录', icon: IconTranslate, path: '/moveRecord' },
    { name: '结算', icon: IconCalendarClock, path: '/paymentRecord' },
    { name: '用户', icon: IconUser, path: '/user' },
    { name: '代理商', icon: IconUserGroup, path: '/admin' },
    { name: '游戏', icon: IconBug, path: '/game' },
    { name: '游戏玩法', icon: IconDice, path: '/gamePlay' },
    { name: 'App客户端', icon: IconMobile, path: '/session' },
    { name: 'App版本管理', icon: IconCommand, path: '/application' },
]

export const AgentMenu = [
    { name: '控制台', icon: IconHome, path: '/' },
    { name: '激活', icon: IconSafe, path: '/active' },
    { name: '设备', icon: IconRobot, path: '/device' },
    { name: '激活记录', icon: IconBookmark, path: '/activeRecord' },
    { name: '移机记录', icon: IconTranslate, path: '/moveRecord' },
    { name: '结算', icon: IconCommand, path: '/paymentRecord' },
]