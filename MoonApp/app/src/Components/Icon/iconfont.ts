import iconfont from './data.json'

const fontMap = iconfont.glyphs.reduce((obj, item) => {
    const name = item.font_class
    obj[name] = String.fromCharCode(item.unicode_decimal)
    return obj
}, {} as Record<string, string>)

export function getFontIcon(name: string): string {
    name = name.toLowerCase()
    return fontMap[name]
}