import Detecter from "..";
import {  DetectLabel } from "../Constraint";

export class BaseProcessor {

    ctx: Detecter

    constructor(ctx: Detecter) {
        this.ctx = ctx
    }
    
    enter() {
    }

    /**
     * 处理数据
     * @param labels 标签
     * @param timestamp 时间
     */
    process(labels: DetectLabel[], timestamp?: number ) {
    }

}