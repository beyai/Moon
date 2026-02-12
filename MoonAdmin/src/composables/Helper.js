import dayjs from 'dayjs'
const opt = Object.prototype.toString;

const Helper = {
    
    sleep(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },

    debounce(fn, delay) {
        let timer = null;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    },

    formatDate(date, format="YYYY-MM-DD") {
        if (!date) return
        return dayjs(date).format(format)
    },

    isArray(obj) {
        return opt.call(obj) === '[object Array]';
    },

    isObject(obj) {
        return opt.call(obj) === '[object Object]';
    },

    isString(obj) {
        return opt.call(obj) === '[object String]';
    },

    isNumber(obj) {
        return opt.call(obj) === '[object Number]' && obj === obj;
    },

    isBoolean(obj) {
        return opt.call(obj) === '[object Boolean]';
    },

    isEmptyValue(obj) {
        return obj === undefined || obj === null || obj === '';
    },

    isFunction(fn) {
        return opt.call(fn) === '[object Function]';
    },

    isAsyncFunction(fn) {
        return opt.call(fn) === '[object AsyncFunction]';
    },


    toString(val) {
        return String(val);
    },

    toNumber(val) {
        return Number(val) || 0;
    },

    toBoolean(val) {
        if (Helper.isBoolean(val)) return val;
        if (Helper.isNumber(val)) return val > 0;
        if (Helper.isString(val)) return val === 'true' || val == '1';
        return false
    },

    toAsyncFunction(fn) {
        if (Helper.isAsyncFunction(fn)) return fn;
        return async function () {
            return fn();
        }
    },
}

export default Helper

