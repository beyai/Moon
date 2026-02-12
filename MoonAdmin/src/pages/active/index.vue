<template>
    <Page @resize="onResize">
        <template #header>
            <PageHeader title="激活设备">
            </PageHeader>
        </template>

        <div class="Active" :style="{ height: pageHeight + 'px' }">
            <a-form ref="formRef"
                :model="formData"
                :rules="rules"
                class="Active-Form"
                layout="vertical"
                size="large"
                @submit="onSubmit"
            >
                <a-form-item field="adminId" label="代理" v-if="store.isSystem">
                    <a-select v-model="formData.adminId" style="width: 100%;" placeholder="请选择">
                        <a-option v-for="item in store.agents" :value="item.adminId" :label="item.username" />
                    </a-select>
                </a-form-item>
                <a-form-item field="deviceCode" label="设备码">
                    <a-input v-model="formData.deviceCode" placeholder="请输入设备码" />
                </a-form-item>
                <a-form-item field="level" label="级别">
                    <a-radio-group type="button" v-model="formData.level">
                        <a-radio v-for="item in ACTIVE_TYPES" :value="item.value">{{ item.label }}</a-radio>
                    </a-radio-group>
                </a-form-item>

                <a-form-item field="days" label="激活天数" extra="天数为 0 时采用系统默认设置"  v-if="store.isSystem">
                    <a-input-number v-model="formData.days" :min="0" :max="1000" :step="1" />
                </a-form-item>

                <br />
                <a-form-item>
                    <a-button type="primary" :loading="isLoading" html-type="submit" long>激活</a-button>
                </a-form-item>
            </a-form>
        </div>
    </Page>
</template>

<script setup>
    const store = useStore();
    const route = useRoute()
    const formRef = ref()
    const isLoading = ref(false)

    const { data: formData, ...FormModel } = useFormModel({
        deviceCode: { type: 'string', value: '' },
        adminId: { type: 'string', value: '' },
        days: { type: 'number', value: 0 },
        level: { type: 'string', value: ACTIVE_TYPES.medium.value },
    })
    FormModel.update(route.query)

    const rules = reactive({
        deviceCode: [
            { type: 'string', required: true, message: '请填写设备码' }
        ],
        adminId: [
            { type: 'string', required: store.isSystem, message: '请选择代理商' }
        ],
        level: [
            { type: 'string', required: true, message: '请选择级别' }
        ]
    })

    const pageHeight = ref(0)
    function onResize({ height }) {
        pageHeight.value = height
    }

    async function onSubmit() {
        if (await formRef.value.validate()) return;
        isLoading.value = true;
        try {
            await Api.Active.active(formData)
            Message.success('激活成功')
            FormModel.reset();
        } catch(err) {
            Message.error(err.message)
        } finally {
            isLoading.value = false;
        }
    }

    


</script>

<style lang="less" scoped>
    .Active {
        background-color: var(--color-bg-1);
        &-Form {
            width: 400px;
            margin: 0 auto;
            padding: @size-10;

        }
        .arco-radio-group-button {
            width: 100%;
        }
        .arco-radio-button {
            flex: 1;
            text-align: center;
        }
    }
</style>