export function parseBuffer(value: any) {
    if (Buffer.isBuffer(value)) {
        return value
    }
    try {
        return Buffer.from(value, 'base64')
    } catch {
        throw new TypeError(`Invalid base64String or Buffer format`)
    }
}