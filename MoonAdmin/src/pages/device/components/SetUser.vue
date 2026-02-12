<template>
    <Dialog 
        v-model:visible="visible" 
        title="过户"
        :width="320" 
        :submit="onSubmit"

    >
        <a-form ref="formRef"
            :model="formData"
            :rules="rules"
            layout="vertical"
        >
            <a-form-item label="设备码">
                <a-input :modelValue="formData.deviceCode" disabled />
            </a-form-item>
            <a-form-item label="旧用户">
                <a-input :modelValue="username" disabled />
            </a-form-item>
            <a-form-item label="新用户" field="userId">
                <a-select 
                    v-model="formData.userId"
                    allow-search
                    placeholder="请输入关键字"
                    @search="onSearchUser"
                >
                    <a-option v-for="item in userList" :value="item.userId" :label="item.username" />
                </a-select>
            </a-form-item>
        </a-form>
    </Dialog>
</template>

<script setup>
    const formRef = ref(null)
    const visible = ref(false)

    const username = ref('')
    const userList = ref([])

    /** 表单数据 */
    const { data: formData, ...FormModel } = useFormModel({
        deviceCode: { type: 'string', value: '' },
        userId: { type: 'string', value: '' },
    })

    /** 暴露方法 */
    defineExpose({
        open(data) {
            username.value = data.user.username;
            userList.value = [];
            FormModel.update('deviceCode', data.deviceCode);
            FormModel.update('userId', '');
            visible.value = true
        }
    })

    /** 暴露事件 */
    const emit = defineEmits(['success'])

    /** 验证规则 */
    const rules = reactive({
        userId: [
            { type: 'string', required: true, message: '请填写新用户' },
        ]
    })

    /** 搜索用户 */
    async function onSearchUser(username) {
        try {
            const { data } = await Api.User.search({ username })
            userList.value = data;
        } catch(err) {
            Message.error(err.message)
        }
    }

    /** 提交表单 */
    async function onSubmit() {
        if (await formRef.value.validate()) return false;
        try {
            const { message } = await Api.Device.setUser(formData)
            Message.success(message)
            emit('success')
            FormModel.reset();
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }
</script>