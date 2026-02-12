import {  Modal } from '@arco-design/web-vue';

const ModelConfig = {
    title: '提示',
    messageType: '',
    content: ``,
    titleAlign: 'start',
    cancelText: '关闭',
    okText: '确定',
    simple: false,
    width: 360,
    unmountOnClose: true,
    closable: false,
    escToClose: false,
    maskClosable: false,
    hideCancel: false,
    modalAnimationName: 'fade-slide'
}

/**
 * 操作提示
 * @param {ModelConfig} options 配置选项
 * @param {AsyncGeneratorFunction} callback 回调方法
 * @returns {Model}
 */
export function useOptionalDialog(options, callback) {
    if (!Helper.isAsyncFunction(callback)) {
        throw new TypeError('useOptional: `callback` argument must be an async function')
    }
    const opts = {
        ...ModelConfig,
        ...(options || {}),
        async onBeforeOk() {
            try {
                // 禁用取消按键
                modal.update({ cancelButtonProps: { disabled: true } })
                // 执行回调
                return await callback();
            } finally {
                // 打开取消按键
                modal.update({
                    cancelButtonProps: { disabled: false }
                })
            }
        }
    }
    const modal = Modal.open(opts);
    return modal;
}