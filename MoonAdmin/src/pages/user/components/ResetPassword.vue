<template>
    <Dialog 
        v-model:visible="visible" 
        title="重置密码"
        okText="重置"
        :width="360" 
        :submit="onSubmit"

    >
        <a-form ref="formRef"
            :model="formData"
            :rules="rules"
            auto-label-width
            label-align="left"
        >
            <a-form-item label="用户" field="username">
                <a-input :modelValue="formData.username" disabled />
            </a-form-item>
            <a-form-item label="密码" field="password">
                <a-input-password
                    v-model="formData.password"
                    placeholder="5~18位字母、数字或特殊字符"
                />
            </a-form-item>
        </a-form>
    </Dialog>
</template>

<script setup>
    const formRef = ref(null)
    const visible = ref(false)

    /** 表单数据 */
    const { data: formData, ...FormModel } = useFormModel({
        username: { type: 'string', value: '' },
        userId: { type: 'string', value: '' },
        password: { type: 'string', value: '' },
    })

    /** 暴露方法 */
    defineExpose({
        open(data) {
            FormModel.update('userId', data.userId);
            FormModel.update('username', data.username);
            FormModel.update('password', '');
            visible.value = true
        }
    })

    /** 暴露事件 */
    const emit = defineEmits(['success'])

    /** 验证规则 */
    const rules = reactive({
        password: [
            { type: 'string', required: true, message: '请输入密码' },
            { minLength: 5, maxLength: 18, message: '长度必须是 5~18 个字符' },
            { 
                validator(value, next) {
                    next(/\s/.test(value) ? '必须为字母、数字或特殊字符' : null)
                }
            }
        ]
    })

    /** 提交表单 */
    async function onSubmit() {
        if (await formRef.value.validate()) return false;
        try {
            const { message } = await Api.User.setPassword(formData)
            Message.success(message)
            FormModel.reset();
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }

    
    
</script>