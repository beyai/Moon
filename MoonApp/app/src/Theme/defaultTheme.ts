import { Dimensions } from 'react-native'
const { scale } = Dimensions.get('screen')

export const defaultTheme = {

    colorPrimary        : '#00ADD4',

    colorSuccess        : "#009A29",

    colorWarning        : "#F7BA1E",
    
    colorError          : "#f53f3f",
    
    /** 文字大小 */
    // 常规
    fontSize            : 15,
    // 提示
    fontSizeSmall       : 13,
    // 标题
    fontSizeMedium      : 17,
    // 超大
    fontSizeLarge       : 20,
    
    // 粗细
    borderSize          : Math.floor( 1 / scale * 100 ) / 100,

    /** 圆角 */
    borderRadius        : 12,
    borderRadiusSmall   : 8,
    borderRadiusMedium  : 16,
    borderRadiuslarge   : 30,

    /** 组件大小 */
    sizeBase            : 44,
    sizeSmall           : 32,
    sizeMedium          : 56,
    sizeLarge           : 64,

    /** 留白大小 */
    space1              : 4,
    space2              : 8,
    space3              : 12,
    space4              : 16,
    space5              : 20,
    space6              : 24,
    space7              : 28,
    space8              : 32,
    space9              : 36,
    space10             : 40,
}