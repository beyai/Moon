<template>
    <div class="Panel">
        <div class="Panel-Header">
            <span class="title">{{ title }}</span>
            <div class="extra">
                <slot name="extra" />
            </div>
        </div>
        <div class="Panel-Container">
            <slot />
        </div>
    </div>
</template>

<script setup>
    const { title } = defineProps({
        title: String
    })
</script>


<style lang="less" scoped>
    .Panel {
        background-color: var(--color-bg-1);
        margin-bottom: @size-3;
        .clearfix();

        &-Header {
            display: flex;
            align-items: center;
            margin: @size-4;
            .title {
                flex: 1;
                color: @color-text-1;
                font-size: @font-size-body-3;
                font-weight: 600;
            }
            .extra {
                flex-shrink: 0;
            }
        }

        &-Container {
            margin: @size-4;
        }
    }
</style>