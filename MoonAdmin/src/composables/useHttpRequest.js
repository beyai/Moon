
export default async function useHttpRequest(asyncCallback, options) {
    if (!Helper.isFunction(asyncCallback) && !Helper.isAsyncFunction(asyncCallback)) {
        throw new TypeError('useHttpRequest: first argument must be an function')
    }
    const fetchCallback = Helper.toAsyncFunction(asyncCallback);
    const route = useRoute()

    const opts = {
        deep: true,
        immediate: true,
        watch: [],
        ...(options || {})
    }

    const asyncData = opts.deep ? ref(null) : shallowRef(null);
    const { start, finish } = useLoadingIndicator();
    
    const result = {

        // 当前数据
        data: asyncData,

        // 刷新数据
        async refresh() {
            return result.execute();
        },

        // 执行
        async execute() {
            try {
                start({ force: true });
                const res = await fetchCallback(route);
                asyncData.value = res;
            } catch (err) {
                throw err
            } finally {
                finish();
            }
        },
    }

    // 监听
    if (opts.watch.length) {
        watch(opts.watch, async () => result.execute())
    }

    // 立即执行
    if (opts.immediate) {
        await result.execute();
    }

    return result;
}