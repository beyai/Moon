'use strict';
const Validator = require('./lib')

class AppBootHook {
    constructor(app) {
        this.app = app;
    }

    configDidLoad() {
        Validator.loader(this.app)
    }
}

module.exports = AppBootHook;