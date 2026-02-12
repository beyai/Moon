import { BaseContextClass } from 'egg';
import { geoip as geoipConfig } from './config/config.default';
type GeoIPConfig = typeof geoipConfig;

interface GeoIPInfo {
    ip: string;
    countryCode: string;
    countryName: string;
    cityName: string;
}

interface GeoIPInstance {
    get(ip: string): GeoIPInfo;
}

declare module 'egg' {

    interface Application {
        GeoIP: GeoIPInstance;
    }

    interface EggAppConfig {
        geoip: GeoIPConfig;
    }

}