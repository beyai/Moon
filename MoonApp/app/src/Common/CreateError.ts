export class CreateError extends Error {
    code: number;
    constructor(code: number, message: string) {
        super(message)
        this.name = "CreateError"
        this.code = code
    }
}