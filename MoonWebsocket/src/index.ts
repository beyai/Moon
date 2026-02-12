import config from './config'
import Application from './application'

let app = new Application(config.app)
app.start()
