<template>
    <Dialog 
        v-model:visible="visible" 
        title="移机"
        :width="320" 
        :submit="onSubmit"

    >
        <a-form ref="formRef"
            :model="formData"
            :rules="rules"
            auto-label-width
            layout="vertical"
        >
            <a-form-item label="旧设备码" field="oldDeviceCode">
                <a-input :modelValue="formData.oldDeviceCode" disabled />
            </a-form-item>
            <a-form-item label="新设备码" field="newDeviceCode">
                <a-input v-model="formData.newDeviceCode"  placeholder="请输入" />
            </a-form-item>
        </a-form>
    </Dialog>
</template>

<script setup>
    const formRef = ref(null)
    const visible = ref(false)

    /** 表单数据 */
    const { data: formData, ...FormModel } = useFormModel({
        oldDeviceCode: { type: 'string', value: '' },
        newDeviceCode: { type: 'string', value: '' },
    })

    /** 暴露方法 */
    defineExpose({
        open(data) {
            FormModel.update('oldDeviceCode', data.deviceCode);
            FormModel.update('newDeviceCode', '');
            visible.value = true
        }
    })

    /** 暴露事件 */
    const emit = defineEmits(['success'])

    /** 验证规则 */
    const rules = reactive({
        newDeviceCode: [
            { type: 'string', required: true, message: '请填写新设备码' },
        ]
    })

    /** 提交表单 */
    async function onSubmit() {
        if (await formRef.value.validate()) return false;
        try {
            const { message } = await Api.Move.move(formData)
            Message.success(message)
            emit('success')
            FormModel.reset();
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }
</script>