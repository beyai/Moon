import path from 'node:path';
import dayjs from 'dayjs';
import fs from 'node:fs';
import type { Transport } from './Transport';
import type { LogLevel } from '../types';

export class FileTransport implements Transport {
    private readonly logPath: string;
    private readonly appName: string;
    private currentLogDate: string = ""
    private writeStream: fs.WriteStream | null = null
    // 消息缓冲队列
    private messageQueue: Array<String> = []
    // 计时器
    private timer: Timer | null = null
    // 批量写入阈值（防止内存无限积压）
    private readonly maxBatchSize = 100; 

    constructor(logPath: string, appName: string) {
        this.logPath = logPath;
        this.appName = appName;

        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }
        process.on('beforeExit', () => {
            this.close()
        });
        this.setupProcessHandlers()
    }

    /**
     * 绑定进程退出事件
     */
    private setupProcessHandlers() {
        //正常退出
        process.on('beforeExit', () => {
            this.flushSync()
        });

        // 显式退出
        process.on('exit', () => {
            this.flushSync(); 
        });
        // 信号中断 (Ctrl+C / Docker stop)
        ['SIGINT', 'SIGTERM'].forEach(signal => {
            process.on(signal, () => {
                this.flushSync();
                process.exit(0); // 必须手动退出
            });
        });

        // 程序崩溃
        process.on('uncaughtException', (err) => {
            // 记录崩溃原因到日志（可选，放入队列）
            this.messageQueue.push(`[FATAL] Uncaught Exception: ${err.message}\n${err.stack}`);
            this.flushSync();
            process.exit(1);
        });
    }

    /**
     * 获取当前日期
     */
    private getCurrentDate(): string {
        return dayjs().format('YYYY-MM-DD')
    }

    /**
     * 确保流存在
     */
    private ensureStream() {
        const currentDate = this.getCurrentDate();
        if (this.currentLogDate == currentDate && this.writeStream) {
            return;
        }
        // 日期已变化或流未初始化，关闭旧的流
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = null;
        }

        this.currentLogDate = currentDate;
            const logFilename = `${this.appName}-${this.currentLogDate}.log`;
            const logFilePath = path.join(this.logPath, logFilename);
            this.writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });
            this.writeStream.on('error', (err) => {
            console.error(`[Logger] FileTransport stream error: ${err.message}`, err);
            this.close();
        });
    }

    /**
     * 将队列内容刷入磁盘
     */
    private flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.messageQueue.length === 0) return;
        this.ensureStream();
        if (this.writeStream) {
            const chunk = this.messageQueue.join('\n') + '\n';
            this.messageQueue = []; // 清空队列
            this.writeStream.write(chunk);
        } else {
            console.error('[Logger] Stream unavailable, logs pending...');
        }
    }

    /**
     * 紧急同步刷新 (进程退出时专用)
     */
    private flushSync() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.messageQueue.length === 0) return;
        try {
            const currentDate = this.currentLogDate || this.getCurrentDate();
            const logFilename = `${this.appName}-${currentDate}.log`;
            const logFilePath = path.join(this.logPath, logFilename);
            const chunk = this.messageQueue.join('\n') + '\n';
            if (this.writeStream) {
                this.writeStream.end();
                this.writeStream = null;
            }
            fs.appendFileSync(logFilePath, chunk);
            this.messageQueue = [];
        } catch (error) {
            console.error('[Logger] Failed to sync flush logs on exit:', error);
        }
    }

    /**
     * 关闭流
     */
    public close(): void {
        this.flush()
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = null;
            this.currentLogDate = '';
        }
    }

    async log(level: LogLevel, message: string): Promise<void> {
        this.messageQueue.push(message);
        if (this.messageQueue.length >= this.maxBatchSize) {
            this.flush();
        } 
        else if (!this.timer) {
            this.timer = setTimeout(() => {
                this.flush();
            }, 1000);
            if (this.timer.unref) {
                this.timer.unref(); 
            }
        }

    }
}