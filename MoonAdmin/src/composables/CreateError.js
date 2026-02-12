
export class CreateError extends Error {
    constructor(code, message) {
        super(message)
        this.code = code || 502
        Error.captureStackTrace(this, CreateError);
    }

    get statusCode() {
        return this.code
    }

    toString() {
        return this.message
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message
        }
    }

}