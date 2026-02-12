<template>
    <div class="Page-Header">
        <div class="Page-Header_head">
            <span class="Page-Header_head_icon">
                <slot name="icon" />
            </span>
            <h2 class="Page-Header_head_title">
                {{ title }}
            </h2>
            <div class="Page-Header_head_meta">
                <slot name="meta" />
            </div>
            <div class="Page-Header_head_extra">
                <slot name="extra" />
            </div>
        </div>
        <div class="Page-Header_body" v-if="$slots.default">
            <slot />
        </div>
    </div>
</template>

<script setup>
    const props = defineProps({
        title: String
    })
</script>

<style lang="less" scoped>
    .Page-Header {
        &_head {
            display: flex;
            align-items: center;
            min-height: 32px;

            &_icon, &_title, &_extra {
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }

            &_icon:not(:empty) {
                margin-right: @size-2;
            }

            &_title {
                margin: 0;
                font-weight: 600;
                font-size: @font-size-title-1;
            }

            &_meta {
                flex: 1;
                padding: 0 @size-2;
            }
        }

        &_body {
            padding-top: @size-3;
        }
    }
</style>