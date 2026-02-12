'use strict';
const ALPHA_DASH_RE     = /^\w+$/;
const DATETIME_TYPE_RE  = /^\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}:\d{2}$/;
const ID_RE             = /^\d+$/;
const MOBILE_RE         = /^1[3-9][0-9]{9}$/;
const TEL_RE            = /^([0-9]{3,4}-?)?[0-9]{7,8}$/;
const UUID_RE           = /^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i;
const PASSWORD_RE       = /\s/;


module.exports = {

    uuid(rule, value) {
        if (typeof value !== 'string' || !UUID_RE.test(value)) {
            return 'uuid 格式不正确';
        }
    },

    username(rule, value) {
        if (typeof value !== 'string' || !ALPHA_DASH_RE.test(value)) {
            return '必须为字母、数字或下划线';
        }
    },

    password(rule, value) {
        if (typeof value !== 'string' || PASSWORD_RE.test(value)) {
            return '必须为字母、数字或特殊字符';
        }
    }
    

}