export * from './Admin'
export * from './User'
export * from './Device'
export * from './Application'
export * from './Payment'
export * from './Game'


type EnumValueType = number | string

interface EnumObject<T extends EnumValueType> {
    [key: string]: T | Function | object;
}

export const EnumUtils = {

    values<T extends EnumValueType>( enumObj: EnumObject<T> ): T[] {
        const keys = Object.keys(enumObj);
        return Object.values(enumObj).filter((v): v is T => {
            return typeof v !== 'function' && typeof v !== 'object' && (typeof v === 'string' || typeof v === 'number')
        });
    },

    includes<T extends EnumValueType>( enumObj: EnumObject<T>, target: unknown ): boolean {
        if (target == undefined || target == null ) return false;
        return EnumUtils.values(enumObj).some(v => (v === target))
    }
}
