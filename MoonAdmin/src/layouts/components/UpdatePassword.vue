<template>
    <Dialog 
        v-model:visible="visible" 
        title="修改密码"
        okText="修改"
        :width="360" 
        :submit="onSubmit"

    >
        <a-form ref="formRef"
            :model="formData"
            :rules="rules"
            auto-label-width
            label-align="left"
        >
            <a-form-item label="旧密码" field="oldPassword">
                <a-input-password v-model="formData.oldPassword" placeholder="请输入" />
            </a-form-item>
            <a-form-item label="新密码" field="newPassword">
                <a-input-password v-model="formData.newPassword" placeholder="5~18位字母、数字或下划线" />
            </a-form-item>
        </a-form>
    </Dialog>
</template>

<script setup>

    const store = useStore();
    const formRef = ref(null)
    const visible = ref(false)

    /** 表单数据 */
    const { data: formData, ...FormModel } = useFormModel({
        oldPassword: { type: 'string', value: '' },
        newPassword: { type: 'string', value: '' },
    })

    /** 暴露方法 */
    defineExpose({
        open(data) {
            visible.value = true
        }
    })

    /** 暴露事件 */
    const emit = defineEmits(['success'])

    /** 验证规则 */
    const rules = reactive({
        oldPassword: [
            { type: 'string', required: true, message: '请输入新密码' },
        ],
        newPassword: [
            { type: 'string', required: true, message: '请输入新密码' },
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
            await Api.Common.updatePassword(formData)
            Message.success(`密码修改成功，请重新登录`)
            store.Logout();
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }

    
    
</script>