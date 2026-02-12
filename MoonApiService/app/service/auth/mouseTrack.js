'use strict';

const dayjs = require('dayjs')
const _ = require('lodash')
const Service = require('egg').Service;

class MouseTrackService extends Service {

    /**
     * 请求 key 过期时间
     * @returns {number} 过期时间, 单位: 秒
     */
    get #ttl() {
        return 180
    }

    /**
     * 解码轨迹数据
     * @param {string} encryptedStr - 加密轨迹数据字符串
     * @returns {Array<[x: number, y:number, t: timestamp]>} - 解码后的轨迹数组，每个元素为 [x, y, timestamp]
     */
    #decrypt(encryptedStr) {
        const charSet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-~".split("");
        const result = [];
        let index = 0;

        // 解析第一个点（无符号位，长度3+4+7）
        const firstVal1 = this.#parseSt(encryptedStr.substring(index, index + 3), charSet);
        index += 3;
        const firstVal2 = this.#parseSt(encryptedStr.substring(index, index + 4), charSet);
        index += 4;
        const firstVal3 = this.#parseSt(encryptedStr.substring(index, index + 7), charSet);
        index += 7;
        result.push([firstVal1, firstVal2, firstVal3]);

        // 解析后续差值点（每个点长度3+3+4=10）
        while (index < encryptedStr.length) {
            const prev = result[result.length - 1];

            // 解析第一个差值（3位：1符号+2数值）
            const diff1Str = encryptedStr.substring(index, index + 3);
            index += 3;
            const sign1 = diff1Str[0] === "1" ? 1 : -1;
            const num1 = this.#parseSt(diff1Str.substring(1), charSet);
            const diff1 = sign1 * num1;

            // 解析第二个差值（3位：1符号+2数值）
            const diff2Str = encryptedStr.substring(index, index + 3);
            index += 3;
            const sign2 = diff2Str[0] === "1" ? 1 : -1;
            const num2 = this.#parseSt(diff2Str.substring(1), charSet);
            const diff2 = sign2 * num2;

            // 解析第三个差值（4位：无符号）
            const diff3 = this.#parseSt(encryptedStr.substring(index, index + 4), charSet);
            index += 4;

            result.push([
                prev[0] + diff1,
                prev[1] + diff2,
                prev[2] + diff3
            ]);
        }

        return result;
    }
    
    /**
     * 解析字符串为数字
     * @param {string} str - 待解析的字符串
     * @param {Array<string>} charSet - 字符集
     * @returns {number} - 解析后的数字
     */
    #parseSt(str, charSet) {
        let value = 0;
        const base = charSet.length;
        for (const char of str) {
            const index = charSet.indexOf(char);
            if (index === -1) throw new Error(`无效字符: ${char}`);
            value = value * base + index;
        }
        return value;
    }

    /**
     * 分析轨迹
     * @param {Array<[x: number, y:number, t: timestamp]>} track - 轨迹数组，每个元素为 [x, y, timestamp]
     * @return {{ isHuman: boolean, score: number }} - 分析结果
     *   - isHuman: boolean, 是否为人类轨迹
     *   - score: number, 分析得分
     */
    #analyzeTrack(track) {
        if (!track || track.length < 2) {
            return { isHuman: false, score: 0 };
        }
    
        let totalDistanceX = 0; // 只计算X轴总距离
        let totalTime = 0;
        let speedVariationsX = []; // X轴速度变化
        let angleChanges = []; // 整体角度变化
        let yFluctuations = []; // Y轴波动
    
        for (let i = 0; i < track.length - 1; i++) {
            const [x1, y1, t1] = track[i];
            const [x2, y2, t2] = track[i + 1];
    
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dt = t2 - t1;
    
            // 计算X轴距离和速度
            const distanceX = Math.abs(dx);
            const speedX = dt > 0 ? distanceX / dt : 0; // X轴速度
    
            totalDistanceX += distanceX;
            totalTime += dt;
    
            if (dt > 0) {
                speedVariationsX.push(speedX);
            }
    
            // 记录Y轴的波动
            yFluctuations.push(Math.abs(dy));
    
            // 计算角度变化，判断平滑度
            // 对于水平滑块，即使是微小的Y轴变化也会导致角度明显，所以这里依然保留
            if (i > 0) {
                const [px, py] = [track[i - 1][0], track[i - 1][1]];
                const vec1 = [x1 - px, y1 - py];
                const vec2 = [x2 - x1, y2 - y1];
    
                const dotProduct = vec1[0] * vec2[0] + vec1[1] * vec2[1];
                const magnitude1 = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1]);
                const magnitude2 = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
    
                if (magnitude1 > 0 && magnitude2 > 0) {
                    const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
                    angleChanges.push(angleRad * (180 / Math.PI)); // 转换为度
                }
            }
        }
    
        const averageSpeedX = totalDistanceX / totalTime;
        const maxSpeedX = speedVariationsX.length > 0 ? Math.max(...speedVariationsX) : 0;
        const minSpeedX = speedVariationsX.length > 0 ? Math.min(...speedVariationsX) : 0;
        const speedRangeX = maxSpeedX - minSpeedX;
    
        // Y轴波动分析
        const maxYFluctuation = yFluctuations.length > 0 ? Math.max(...yFluctuations) : 0;
        const avgYFluctuation = yFluctuations.length > 0 ? yFluctuations.reduce((sum, val) => sum + val, 0) / yFluctuations.length : 0;
    
        // 启发式规则判断
        let humanScore = 0;
    
        // 1. X轴速度变化（非线性）- **高优先级**
        if (speedRangeX > 0.03 && speedVariationsX.length > 5) { // X轴速度范围大于0.03像素/毫秒
            humanScore += 1.5; // 提高权重
            const sumOfSquaresX = speedVariationsX.reduce((sum, speed) => sum + Math.pow(speed - averageSpeedX, 2), 0);
            const standardDeviationX = Math.sqrt(sumOfSquaresX / speedVariationsX.length);
            if (standardDeviationX > 0.008) { // X轴速度标准差
                humanScore += 0.8;
            }
        }
    
        // 2. Y轴微小波动或平滑度 - **低优先级，但异常跳变要警惕**
        // 即使是水平滑动，人手也会有轻微的Y轴抖动
        if (maxYFluctuation < 5 && avgYFluctuation < 1) { // Y轴波动很小，符合水平滑动
            humanScore += 0.5; // 加分，因为符合预期
        } else if (maxYFluctuation > 10) { // Y轴出现较大跳变，可能异常
            humanScore -= 1; // 扣分
        }
    
        // 3. 轨迹整体角度变化 (依然重要，因为X轴上的抖动也会体现在角度上)
        const maxAngleChange = angleChanges.length > 0 ? Math.max(...angleChanges) : 0;
        // 对于水平滑动，我们期望角度变化不要过大（比如不希望出现垂直移动），但也不应该为0 (直线)
        if (maxAngleChange > 5 && maxAngleChange < 90) { // 角度变化在5-90度之间，排除完美直线和垂直移动
            humanScore += 1;
        }
    
        // 4. 停顿时间（非均匀）- **重要**
        const timeIntervals = track.slice(0, -1).map((point, i) => track[i + 1][2] - point[2]);
        const sumOfTimeIntervals = timeIntervals.reduce((sum, interval) => sum + interval, 0);
        const avgTimeInterval = sumOfTimeIntervals / timeIntervals.length;
    
        const timeIntervalVariance = timeIntervals.reduce((sum, interval) => sum + Math.pow(interval - avgTimeInterval, 2), 0) / timeIntervals.length;
    
        if (timeIntervalVariance > 80) { // 调整阈值，时间间隔方差较大
            humanScore += 0.8;
        }
    
        // 5. 整体X轴速度范围（符合人类极限）- **高优先级**
        // 假设正常人X轴移动速度在一定范围内
        // 0.01 像素/毫秒 (10 像素/秒) - 1 像素/毫秒 (1000 像素/秒)
        if (averageSpeedX > 0.01 && averageSpeedX < 1.5) { // 允许X轴速度稍快
            humanScore += 1.2;
        }
    
        return {
            isHuman: humanScore >= 3,
            score: Math.floor(humanScore * 100) / 100,
        };
    }

    /**
     * 生成 Key
     */
    #generateKey() {
        const encrypted = this.ctx.encryptData({
            exp: dayjs().add(this.#ttl, 'seconds').valueOf()
        });
        return encrypted.toString('base64url');
    }
    
    /**
     * 验证轨迹
     * @param {string} encryptedStr - 加密轨迹数据字符串
     * @returns {boolean} - 验证结果
     */
    check(encryptedStr) {
        if (_.isEmpty(encryptedStr)) {
            this.ctx.throw(400, '验证失败')
        }
        const trackData = this.#decrypt(encryptedStr);
        const result = this.#analyzeTrack(trackData);
        return result.isHuman;
    }

    /**
     * 生成请求key
     */
    generateKey() {
        const exp = dayjs().add(this.#ttl, 'seconds').valueOf();
        const encrypted = this.ctx.encrypt(exp);
        return {
            key: encrypted,
            ttl: this.#ttl
        }
    }

    /**
     * 验证请求key
     * @param {string} key - 请求key
     * @returns {boolean} - 验证结果
     */
    verify(key) {
        if (_.isEmpty(key)) {
            this.ctx.throw(400, '验证失败')
        }
        try {
            const decrypted = this.ctx.decrypt(key);
            
            if (Number(decrypted) < Date.now()) {
                throw new Error('验证失败')
            }

        } catch(err) {
            this.ctx.throw(400, err.message)
        }
    }
}

module.exports = MouseTrackService;
