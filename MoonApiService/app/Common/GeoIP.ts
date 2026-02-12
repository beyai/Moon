import { readFileSync } from "fs";
import { Reader, CityResponse } from "mmdb-lib";

interface GeoCity {
    ip: string;
    countryCode: string;
    countryName: string;
    regionName: string;
    cityName: string;
}

export class GeoIP {

    static instance: GeoIP;

    static getInstance(db: string) {
        if (!this.instance) {
            this.instance = new GeoIP(db)
        }
        return this.instance
    }

    private reader: Reader<CityResponse>

    constructor(filePath: string) {
        const  db = readFileSync(filePath)
        this.reader = new Reader(db)
    }

    get(ip): GeoCity {
        const result = this.reader.get(ip)
        const data: GeoCity = {
            ip: ip,
            countryCode: 'NONE',
            countryName: '未知',
            regionName: '未知',
            cityName: '未知',
        }
        
        if (!result) return data;

        const country = result.country
        const region = result.subdivisions?.[0]
        const city = result.city

        if (country) {
            data.countryCode = country.iso_code
            data.countryName = country.names?.['zh-CN'] || country.names?.en || '未知'
        }

        if (region) {
            data.regionName = region.names?.['zh-CN'] || region.names?.en || '未知'
        }

        if (city) {
            data.cityName = city.names?.['zh-CN'] || city.names?.en || '未知'
        }
        return data;
    }

    /**
     * 获取ip归属地文本信息
     * @returns 未知(127.0.0.1)
     */
    getText(ip: string): string {
        const { regionName } = this.get(ip)
        return `${regionName}(${ip})`
    }
}