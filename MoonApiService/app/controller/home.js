'use strict';
const cbor = require('cbor')
const Controller = require('egg').Controller;

class HomeController extends Controller {
    
    async index() {
        let ctx = this.ctx
        let data = ctx.all
        data.tag = Buffer.from(data.tag, 'base64')
        data.nonce = Buffer.from(data.nonce, 'base64')
        data.body = Buffer.from(data.body, 'base64')
        if ( 'payload' in data ) {
            data.payload = Buffer.from(data.payload, 'base64')
        }
        console.log(data)
        
        console.log(cbor.decode( data.payload ))
        this.ctx.body = "hello"
    }
}

module.exports = HomeController;
