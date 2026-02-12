<template>
    <Dialog 
        v-model:visible="visible" 
        title="添加账号"
        :width="360" 
        :submit="onSubmit"

    >
        <a-form ref="formRef"
            :model="formData"
            :rules="rules"
            auto-label-width
            label-align="left"
        >
            <a-form-item label="账号" field="username">
                <a-input
                    v-model="formData.username"
                    placeholder="5~18位字母、数字或下划线"
                />
            </a-form-item>
            <a-form-item label="密码" field="password">
                <a-input-password
                    v-model="formData.password"
                    placeholder="5~18位字母、数字或特殊字符"
                />
            </a-form-item>
            <a-form-item label="备注" field="mark">
                <a-textarea
                    v-model="formData.mark"
                    :max-length="100"
                    show-word-limit
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
        type: { type: 'string', value: 'agent' },
        username: { type: 'string', value: '' },
        password: { type: 'string', value: '' },
        mark: { type: 'string', value: '' }
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
        username: [
            { type: 'string', required: true, message: '请输入账号' },
            { minLength: 5, message: '最少 5 个字符' },
            { maxLength: 18, message: '最多 18 个字符' },
            { 
                validator(value, next) {
                    next(!/^\w+$/.test(value) ? '必须为字母、数字或下划线' : null)
                }
            }
        ],
        password: [
            { type: 'string', required: true, message: '请输入密码' },
            { minLength: 5, message: '最少 5 个字符' },
            { maxLength: 18, message: '最多 18 个字符' },
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
            const { message } = await Api.Admin.create(formData)
            Message.success(message)
            emit('success')
            FormModel.reset();
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }

    
    
</script>