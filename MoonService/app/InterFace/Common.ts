
/**
 * 查询请求
 */
export interface FindQuery {
    page?:number;
    limit?:number
}

/**
 * 查询列表
 */
export interface FindList<T> {
    count: number;
    page: number;
    limit: number;
    rows: T[]
}
