<template>
    <Dialog 
        v-model:visible="visible" 
        :title="formData.gameId ? '编辑游戏' : '添加游戏' "
        :width="640" 
        :submit="onSubmit"
    >
        <a-form ref="formRef"
            :model="formData"
            :rules="rules"
            layout="vertical"
        >
            <a-grid :cols="2" :colGap="12" :rowGap="12">
                <a-grid-item>
                    <a-form-item label="游戏类型" field="type">
                        <a-select v-model="formData.type" placeholder="请选择" @change="onChangeType">
                            <a-option v-for="item in store.getGameDict('type')" :value="item.value" :label="item.label" />
                        </a-select>
                    </a-form-item>
                </a-grid-item>

                <a-grid-item>
                    <a-form-item label="游戏名称" field="name">
                        <a-input v-model="formData.name" placeholder="最多16个字符" />
                    </a-form-item>
                </a-grid-item>

                <a-grid-item>
                    <a-form-item label="手牌张数" field="handCards">
                        <a-input-number v-model="formData.handCards" :min="2" :step="1">
                            <template #suffix>张</template>
                        </a-input-number>
                    </a-form-item>
                </a-grid-item>

                <a-grid-item>
                    <a-form-item label="游戏图标" field="icon">
                        <a-input v-model="formData.icon" placeholder="http://" />
                    </a-form-item>
                </a-grid-item>

                <a-grid-item :span="3">
                    <a-form-item label="用牌定制" field="useCards">
                        <Poker v-model="formData.useCards"/>
                    </a-form-item>
                </a-grid-item>
            </a-grid>
            
        </a-form>
    </Dialog>
</template>

<script setup>
    const store = useStore()
    const formRef = ref(null)
    const visible = ref(false)

    /** 表单数据 */
    const { data: formData, ...FormModel } = useFormModel({
        gameId: { type: 'number', value: '' },
        name: { type: 'string', value: '' },
        type: { type: 'string', value: '' },
        icon: { type: 'string', value: '' },
        handCards: { type: 'number', value: 3 },
        useCards: { type: 'array', value: [ 255, 255, 255, 255, 255, 255, 15 ] },
    })

    /** 暴露方法 */
    defineExpose({
        open(data) {
            if (data) {
                FormModel.update(data)
            } else {
                FormModel.reset();
            }
            visible.value = true
        }
    })

    /** 暴露事件 */
    const emit = defineEmits(['success'])

    /** 验证规则 */
    const rules = reactive({
        type: [
            { type: 'string', required: true, message: '请选择游戏类型' },
        ],
        name: [
            { type: 'string', required: true, message: '请填写游戏名称' },
        ]
    })

    /** 监听类型变化 */
    function onChangeType(value) {
        formData.name = store.getGameDictLabel('type', value)
    }

    /** 提交表单 */
    async function onSubmit() {
        if (await formRef.value.validate()) return false;
        const isEdit = !!formData.gameId
        try {
            if (isEdit) {
                const { message } = await Api.Game.update(formData)
                Message.success(message)
            } else {
                const { message } = await Api.Game.create(formData)
                Message.success(message)
            }
            emit('success')
        } catch(err) {
            Message.error(err.message)
            return false;
        }
    }
</script>