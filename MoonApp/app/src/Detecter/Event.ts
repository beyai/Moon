import { DetecterEventType } from "./Constraint";
import type { DetecterEventMap } from "./Constraint";

type RemoveListener = () => void

export class DetecterEvent {
    
    private listeners:  Partial< Record< DetecterEventType, Set<Function> > > = {}
    
    constructor() {}

    /**
     * 添加监听器
     * @param type 事件类型
     * @param listener 监听器
     */
    addListener<K extends DetecterEventType>(
        type: K, 
        listener: DetecterEventMap[K]
    ): RemoveListener {
        if (!this.listeners[type]) {
            this.listeners[type] = new Set()
        }

        const current = this.listeners[type]!;
        current.add(listener)
        return () => {
            current.delete(listener)
            if (current.size === 0) {
                delete this.listeners[type]
            }
        }
    }

    /**
     * 删除全部监听器
     */
    removeAllListener(type?: DetecterEventType) {
        if (type) {
            this.listeners[type]?.clear()
            delete this.listeners[type]
        } else {
            Object.values(this.listeners).forEach(set => set?.clear())
            this.listeners = {}
        }
    }

    /**
     * 事件处罚
     */
    emit<K extends DetecterEventType>(
        type: K,
        ...args: Parameters<DetecterEventMap[K]>
    ) {
        this.listeners[type]?.forEach(listener => {
            (listener as (...args: Parameters<DetecterEventMap[K]>) => void)(...args)
        })
    }

}