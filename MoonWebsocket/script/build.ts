import path from 'node:path'

const baseDir = process.cwd()

await Bun.build({
    entrypoints: [ path.join(baseDir, './src/index.ts') ],
    outdir: path.join(baseDir, 'dist'),
    target: 'bun',
    sourcemap: 'none',
    compile: {
        outfile: 'BunWebsocket'
    },
    bytecode: true,
    minify: {
        whitespace: true,
        identifiers: true,
        syntax: true
    },
    
    // 生产环境移除日志
    drop: ['console', 'debugger'],

    define: {
        'process.env.NODE_ENV': `"production"`
    },
})