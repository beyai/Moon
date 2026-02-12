<template>
    <Dialog v-model:visible="visible" title="结算" :width="320" :submit="onSubmit" >
        <a-form ref="formRef" :model="formData" :rules="rules" auto-label-width layout="vertical">
            <a-form-item label="代理" field="adminId">
                <a-select v-model="formData.adminId" style="width: 100%;" placeholder="请选择">
                    <a-option v-for="item in store.agents" :value="item.adminId" :label="item.username" />
                </a-select>
            </a-form-item>

            <a-form-item label="结算类型" field="type">
                <a-select v-model="formData.type" style="width: 100%;" placeholder="请选择">
                    <a-option v-for="item in PAYMENT_TYEPS" :value="item.value" :label="item.label" />
                </a-select>
            </a-form-item>
            
            <a-form-item label="结算截止时间" field="endTime">
                <a-date-picker style="width: 100%;" v-model="formData.endTime"  placeholder="请选择" show-time />
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
        adminId: { type: 'string', value: '' },
        type: { type: 'string', value: '' },
        endTime: { type: 'string', value: ''},
    })

    /** 暴露方法 */
    defineExpose({
        open() {
            visible.value = true
        }
    })

    /** 暴露事件 */
    const emit = defineEmits(['success'])

    /** 验证规则 */
    const rules = reactive({
        adminId: [
            { type: 'string', required: true, message: '请选择代理' },
        ],
        type: [
            { type: 'string', required: true, message: '请选择结算类型' },
        ],
        endTime: [
            { type: 'string', required: true, message: '请选择截止日期' },
        ]
    })

    /** 提交表单 */
    async function onSubmit() {
        if (await formRef.value.validate()) return false;
        try {
            const { message } = await Api.Payment.payment(formData)
            Message.success(message)
            FormModel.reset();
            emit('success')
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }
</script>