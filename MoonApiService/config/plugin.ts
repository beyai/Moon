import { EggPlugin } from "egg";

const plugin: EggPlugin =  {
    view: {
        enable: false
    },
    session: {
        enable: false
    },
    static: {
        enable: true,
    },
    multipart: {
        enable: false,
    },
    jsonp: {
        enable: false
    },
    i18n: {
        enable: false
    },
    tegg: {
        enable: true,
        package: '@eggjs/tegg-plugin',
    },
    teggConfig: {
        enable: true,
        package: '@eggjs/tegg-config',
    },
    teggController: {
        enable: true,
        package: '@eggjs/tegg-controller-plugin',
    },
    sequelize: {
        enable: true,
        package: 'egg-sequelize-typescript'
    },
}

export default plugin