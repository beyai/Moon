const Storage =  {
    // 设置
    set(key, value) {
        window.localStorage.setItem(key, (typeof value === 'object') ? JSON.stringify(value) : value);
        return value;
    },

    // 获取
    get(key) {
        const value = window.localStorage.getItem(key);
        try {
            return JSON.parse(value);
        } catch(err) {
            return value;
        }
    },

    // 删除
    remove(key) {
        window.localStorage.removeItem(key);
    },

    // 清空
    clear() {
        window.localStorage.clear();
    }
}

export default Storage;