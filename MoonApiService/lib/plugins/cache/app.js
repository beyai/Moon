'use strict';
module.exports = app => {
    if (app.config.cache.app===true) {
       require('./lib')(app)
    }
}
