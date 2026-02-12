import { proxy, subscribe, useSnapshot as useValtioSnapshot, snapshot } from 'valtio'
import { createMMKV } from 'react-native-mmkv'
import Helper from '@/Common/Helper';


type ExtractGetters<G> = {
    [K in keyof G]: G[K] extends (...args: any[]) => infer R ? R : never
}
type StoreInstance<S, G, A> = S & ExtractGetters<G> & A

interface CreateStoreOptions<
    S extends object,
    G extends Record<string, any>,
    A extends Record<string, any>
> {
    name: string;
    persistKeys?: (Extract<keyof S, string>)[];
    state: S;
    getters?: G & ThisType<S & ExtractGetters<G>>;
    actions?: A & ThisType<StoreInstance<S, G, A>>;
}

// 缓存实例
const Storage = createMMKV({
    id: 'moon',
    encryptionKey: '+MwSdts^Wj7|_1hg@i=?mL$54#PTH/DU'
})
// 缓存数据
const CacheData = Helper.debounce((name: string, data: object) => {
    Storage.set(name, JSON.stringify(data));
}, 100)

// 获取缓存数据
function getCacheState<T extends object>(name: string): Partial<T> {
    try {
        const result = Storage.getString(name) || "{}"
        return JSON.parse(result)
    } catch (err) {
        return {}
    }
}

/**
 * 从对象中提取指定属性
 * @param obj 源对象
 * @param keys 要提取的属性名数组
 */
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

// 创建状态管理
export function createStore<
    S extends object,
    G extends Record<string, any>,
    A extends Record<string, any>
>(options: CreateStoreOptions<S, G, A>) {

    const {
        name,
        persistKeys = [],
        state,
        getters = {} as G,
        actions = {} as A
    } = options;

    if (!name || typeof name != 'string') {
        throw new Error(`name must be a string!`)
    }

    // 状态管理对象
    const objectToProxy = {
        ...state,
        ...getCacheState<S>(name),
    }

    // 生成计算属性方法
    for (const key in getters) {
        const getterFn = getters[key]
        if (typeof getterFn == 'function') {
            Object.defineProperty(objectToProxy, key, {
                get: getterFn, 
                enumerable: true
            })
        }
    }

    // 创建状态管理代理
    const storeState = proxy(objectToProxy) as StoreInstance<S, G, A>;

    // 持久化存储
    if (persistKeys.length > 0) {
        subscribe(storeState, () => {
            const data = pick(storeState, persistKeys as string[]);
            CacheData(name, data)
        });
    }

    // 创建绑定 actions，但不放到 objectToProxy 上
    const boundActions = {} as A;
    for (const key in actions) {
        const actionFn = actions[key];
        if (typeof actionFn === "function") {
            boundActions[key] = actionFn.bind(storeState);
        }
    }
 
    return {
        state: storeState,
        actions: boundActions,
        useStore: () => useValtioSnapshot(storeState),
        useSnapshot: () => snapshot(storeState)
    }
}