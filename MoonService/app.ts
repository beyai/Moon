import type { Application } from 'egg';

export default class AppBootHook {

    private readonly app: Application

    constructor(app: Application) {
        this.app = app
    }

    async didLoad() {
        // this.app.model.DeviceSession.sync()
        // const [ result ] = await this.app.model.User.findAll({
        //     attributes: [
        //         [ fn('COUNT', literal('CASE WHEN isOnline THEN 1 END')), 'online' ],
        //         [ fn('COUNT', col('userId')), 'total']
        //     ],
        //     raw: true
        // })

        // console.log(result)
    }
}

