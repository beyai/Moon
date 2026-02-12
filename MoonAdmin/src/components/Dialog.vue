<template>
    <a-modal
        modal-class="Dialog"
        title-align="start"
        modal-animation-name="fade-slide"
        cancel-text="取消"
        :mask-closable="false"
        :esc-to-close="!isLoading"
        :closable="false"
        :footer="true"
        :cancel-button-props="{ disabled: isLoading }"
        @before-ok="onBeforeOk"
    >
        <slot />
    </a-modal>
</template>

<script setup>
    const isLoading = ref(false)

    const props = defineProps({
        submit: Function
    })

    async function onBeforeOk(event) {
        if ( !Helper.isAsyncFunction(props.submit) ) {
            return true;
        }
        isLoading.value = true;
        try {
            return await props.submit();
        } catch(err) {
            console.error(err)
            return false;
        } finally {
            isLoading.value = false;
        }
    }
</script>
