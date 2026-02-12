export class createError extends Error {
    /** 错误码 */
    code: number
    /**
     * @param code 错误码
     * @param message 错误消息
     */
    constructor(code: number, message: string) {
        super(message)
        this.code = code || 400
        Error.captureStackTrace(this, createError);
    }

    override toString(): string {
        return this.message
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message
        }
    }
}

