import { BaseContextClass } from 'egg';
import { validator } from './config/config.default';
type ValidatorConfig = typeof validator;

declare module 'egg' {

    interface EggAppConfig {
        validator: ValidatorConfig;
    }

    export class Validator extends BaseContextClass {
        validate(data: Record<string, any>, rules: Record<string, any>): void;
    }
}