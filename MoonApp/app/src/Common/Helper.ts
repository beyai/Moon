import { useCallback, useRef } from "react";

export function useDebounseCallback<T extends (...args: any[]) => void> ( callback: T, delay: number ) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debounced = useCallback((...args: Parameters<T>) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null
        }
        timerRef.current = setTimeout(() => {
            callback(...args) 
        }, delay) 
    }, [callback, delay] );
    return debounced;
}

const Helper = {
    /**
     * 睡眠
     * @param timeout 时间
     * @returns 
     */
    sleep(timeout: number): Promise<void> {
        return new Promise((resolve ) => {
            setTimeout(resolve, timeout)
        })
    },
    
    /**
     * 防抖
     * @param {Function} func 
     * @param {Number} delay 
     * @returns 
     */
    debounce<T extends (...args: any[]) => any>( func: T, delay: number ): (...args: Parameters<T>) => void {
        let timer: ReturnType<typeof setTimeout> | undefined;
        return function (this: any, ...args: Parameters<T>) {
            const context = this;
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                func.apply(context, args);
            }, delay);
        };
        
    },
    
}

export default Helper

