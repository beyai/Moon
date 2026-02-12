'use strict';
module.exports = app => {
    if (app.config.cache.agent===true) {
       require('./lib')(app)
    }
}
