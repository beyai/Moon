<template>
    <div class="Error">
        <h1 class="Title">{{ error.statusCode }}</h1>
        <hr>
        <p class="message">{{ error.message }}</p>
    </div>
</template>

<script setup>
    const props = defineProps({
        error: Object
    })
</script>

<style lang="less">
    .Error {
        width: 100%;
        height: 100%;
        .Title {
            font-size: 32px;
            text-align: center;
        }
        .message {
            text-align: center;
            font-size: 14px;
        }
    }
</style>