import { Room } from "./room";


class Manager {

    private rooms = new Map<string, Room>()

    private timer: Timer | null = null

    /** 开始监控 */
    private startMonitor(): void {
        if (!this.timer)  {
            this.timer = setInterval(() => {
                this.rooms.forEach(room => {
                    if (room.count === 0) room.destroy()
                })
            }, 30 * 1000);
        }
    }

    /** 停止监控 */
    private stopMonitor(): void {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
    }

    /**
     * 创建房间
     * @param name 房间名
     */
    create(name: string): Room {
        const room = new Room(name)
        this.rooms.set(name, room)
        setImmediate(() => {
            if (!this.timer) this.startMonitor();
        })
        return room
    }

    /**
     * 获取房间
     * @param name 房间名
     */
    get(name: string): Room | undefined {
        return this.rooms.get(name)
    }

    /** 
     * 删除房间
     * @param name 房间名
     */
    remove(name: string): boolean {
        const success = this.rooms.delete(name)
        if (this.rooms.size === 0 && this.timer != null) {
            this.stopMonitor()
        }
        return success
    }

    
}

export const RoomManager = new Manager()