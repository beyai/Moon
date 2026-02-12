import chokidar from 'chokidar'
import { readFileSync } from 'node:fs'
import { parse, TomlTable  } from 'smol-toml'

const TOML_FILE_DATA = Symbol("Toml.data")

export class Toml {

    private [TOML_FILE_DATA]: TomlTable
    private filepath: string

    /**
     * Toml 
     * - 自动监听文件变化重新加载
     * @param filepath 文件路径
     */
    constructor(filepath: string) {
        this.filepath = filepath
    }

    /**
     * 加载文件
     */
    private load(): TomlTable {
        const content = readFileSync(this.filepath, 'utf8')
        return parse(content)
    }

    /**
     * 文件数据
     */
    get data(): TomlTable {
        if (!this[TOML_FILE_DATA]) {
            this[TOML_FILE_DATA] = this.load()
            // 监听文件变化，重新加载
            chokidar.watch(this.filepath).on('change', (filePath) => {
                this[TOML_FILE_DATA] = this.load()
            })
        }
        return this[TOML_FILE_DATA]
    }

}