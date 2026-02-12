enum ThemeMode {
    // 跟随系统
    system = "system",
    // 普通模式
    light = 'light',
    // 深色模式
    dark = 'dark',
}

namespace ThemeMode {

    export interface ThemeModeData {
        label: string,
        value: ThemeMode
    }

    export const values: ThemeModeData[] = [
        { label: '跟随系统', value: ThemeMode.system  },
        { label: '普通模式', value: ThemeMode.light  },
        { label: '深色模式', value: ThemeMode.dark  },
    ]

    export function getLabel(mode: ThemeMode): string {
        for (const item of values) {
            if (item.value == mode) {
                return item.label
            }
        }
        return ''
    }
}

export {
    ThemeMode
}

