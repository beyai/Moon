<template>
    <div class="Login">
        <div class="Login-Container">
            <a-form ref="formRef"
                layout="vertical"
                size="large" 
                :label-col-props="{ span: 0}" 
                :model="formData"
                :rules="rules"
                @submit="onSubmit"
            >
                <a-form-item field="username">
                    <a-input v-model="formData.username" placeholder="账号">
                        <template #prefix><icon-user /></template>
                    </a-input>
                </a-form-item>

                <a-form-item field="password">
                    <a-input-password v-model="formData.password" placeholder="密码">
                        <template #prefix><icon-unlock /></template>
                    </a-input-password>
                </a-form-item>

                <a-form-item field="key">
                    <SliderCaptcha v-model="formData.key" />
                </a-form-item>
                
                <br>
                <a-form-item>
                    <a-button :loading="isLoading" htmlType="submit" type="primary" long>登录</a-button>
                </a-form-item>
            </a-form>
        </div>
    </div>
</template>

<script setup>
    definePageMeta({
        layout: ''
    })
    const store = useStore();
    const formRef = ref(null)
    const isLoading = ref(false)
    const formData = reactive({
        username: '',
        password: '',
        key: ''   
    })

    const rules = reactive({
        username: [
            { type: 'string', required: true, message: '请输入登录账号' }
        ],
        password: [
            { type: 'string', required: true, message: '请输入登录密码' }
        ],
        key: [
            { type: 'string', required: true, message: '请拖动滑块到最右边' }
        ]
    })

    async function onSubmit() {
        if (await formRef.value.validate()) return;
        isLoading.value = true;
        try {
            await store.Login(formData)
        } catch(err) {
            Message.error(err.message)
        } finally {
            isLoading.value = false
        }
    }


</script>

<style lang="less">
    .Login {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        background-color: @color-fill-2;

        &-Container {
            width: 300px;
        }
    }
</style>