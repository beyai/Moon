<template>
    <Dialog 
        v-model:visible="visible" 
        title="创建新版本"
        :width="360" 
        :submit="onSubmit"
    >
        <a-form ref="formRef"
            :model="formData"
            :rules="rules"
            auto-label-width
            label-align="left"
        >
            <a-form-item label="版本号" field="version">
                <a-input v-model="formData.version" placeholder="0.0.0" />
            </a-form-item>
        </a-form>
    </Dialog>
</template>

<script setup>
    const formRef = ref(null)
    const visible = ref(false)

    /** 表单数据 */
    const { data: formData, ...FormModel } = useFormModel({
        version: { type: 'string', value: '' },
    })

    /** 暴露方法 */
    defineExpose({
        open(data) {
            FormModel.reset();
            visible.value = true
        }
    })

    /** 暴露事件 */
    const emit = defineEmits(['success'])

    /** 验证规则 */
    const rules = reactive({
        version: [
            { type: 'string', required: true, message: '请输入版本号' }
        ]
    })

    /** 提交表单 */
    async function onSubmit() {
        if (await formRef.value.validate()) return false;
        try {
            const { message } = await Api.App.create(formData)
            Message.success(message)
            emit('success')
            FormModel.reset();
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }
</script>