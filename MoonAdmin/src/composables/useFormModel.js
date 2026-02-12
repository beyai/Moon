import { reactive } from 'vue'

/**
 * 转换类型
 * @param {Any} val
 * @param {string} type string | number | boolean | array
 * @param {boolean} allowEmptyString 是否允许空字符串，默认允许
 * @returns {Any}
 */
function transformType(val, type, allowEmptyString = true ) {
    if ( ![ 'string', 'number', 'boolean', 'array' ].includes(type)) {
        throw new TypeError(`不支持的类型: ${type}`);
    }

    if (type == 'array' && !Helper.isArray(val)) {
        return []
    } else if (allowEmptyString && Helper.isEmptyValue(val)) {
        return ''
    }

    switch (type) {
        case 'number':
            return Helper.toNumber(val);
        case 'boolean':
            return Helper.toBoolean(val);
        case 'string':
            return Helper.toString(val);
        default:
            return val
    }
}

/**
 * 设置模型数据
 * @param {object} data 
 * @param {Proxy} proxy 代理实例
 * @returns {Proxy}
 */
function setModelData(data, proxy) {
    for (const [key, item] of Object.entries(data)) {
        proxy[key] = transformType(item.value, item.type || 'string', item.allowEmpty ?? true );
    }
    return proxy;
}

/** 
 * 封装响应式数据模型，提供数据更新、重置和空值过滤功能
 * @template T - 模型数据类型约束（如 { name: string, age: number }）
 * @this {{ data: import('vue').Reactive<T>, update: Function, reset: Function, filterEmpty: Function }}
 * @param {{ 
 *   [key in keyof T]: { 
 *     type: 'string' | 'number' | 'boolean' | 'array', // 字段类型约束（必填）
 *     value: T[key], // 字段初始值（必填）
 *     allowEmpty?: boolean // 是否允许空值（可选，默认不允许）
 *   } 
 * }} modelData - 模型初始配置（定义各字段的类型、初始值和空值规则）
 * @returns {{ 
 *   data: import('vue').Reactive<T>, // Vue响应式数据对象（可直接用于模板）
 *   update: (key: keyof T | Partial<T>, value?: T[keyof T]) => this, // 更新数据（支持单个键值或部分对象更新，返回this以链式调用）
 *   reset: () => this, // 重置数据为初始值（返回this以链式调用）
 *   filterEmpty: () => import('vue').Reactive<T> // 过滤掉不允许为空的字段（根据modelData的allowEmpty配置）
 * }} 返回包含响应式数据和操作方法的模型对象
 */

export default function useFormModel(modelData) {
    if (!Helper.isObject(modelData)) {
        throw new TypeError(`模型数据结构必须是一个对象`)
    }

    const model = reactive({})
    const modelProxy = new Proxy(model, {
        set(target, key, value) {
            const item = modelData[key];
            if (item) {
                target[key] = transformType(value, item.type || 'string', item.allowEmpty ?? true);
                return true;
            }
            return false
        },
    })

    setModelData(modelData, modelProxy);
    
    return  {
        /** 模型数据 */
        get data() {
            return modelProxy
        },

        /**
         * 更新模型
         */
        update: function updateModel(key, value) {
      
            if (Helper.isString(key) && Object.hasOwn(modelProxy,key) ) {
                modelProxy[key] = value
            } else if (Helper.isObject(key)) {
                for (const [k, v] of Object.entries(key)) {
                    if (!Object.hasOwn(modelProxy, k)) continue;
                    if (Helper.isArray(v)) {
                        modelProxy[k] = [...v]
                    } else if (Helper.isObject(v)) {
                        modelProxy[k] = { ...v }
                    } else {
                        modelProxy[k] = v
                    }
                }
            }
            return this;
        },

        /** 过滤空值 */
        filterEmpty() {
            let result = {};
            for (const [key, value] of Object.entries(modelProxy)) {
                if (!Helper.isEmptyValue(value)) {
                    result[key] = value;
                }
            }
            return result
        },

        /** 重置模型数据 */
        reset: function() {
            setModelData(modelData, modelProxy)
            return this;
        },
    }
}