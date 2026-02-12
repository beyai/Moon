import type { BunRequest, Server } from "bun"

const PROXY_IP_HEADERS = [
    "x-real-ip", "x-forwarded", "x-forwarded-for", "x-client-ip", "cf-connecting-ip", 
    "x-cluster-client-ip", "forwarded-for", "forwarded", "x-forwarded", "fastly-client-ip",
    "appengine-user-ip", "true-client-ip", "cf-pseudo-ipv4", "fly-client-ip", 
]

export function getRequestIP(req: BunRequest, server: Server<unknown>): string {
    const addr = server.requestIP(req)
    let ip = (addr != null) ? addr.address : '127.0.0.1'
    if (ip && ip.startsWith('::ffff:')) {
        ip = ip.substring(7)
    }
    for (const key of PROXY_IP_HEADERS) {
        let value = req.headers.get(key)
        if (value) return value
    }
    return ip
}