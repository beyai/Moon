<template>
    <a-range-picker
        style="width: 100%"
        :allowClear="true"
        :modelValue="currentValue"
        :disabledDate="disabledDate"
        @change="onChange"
    >
        <template #prefix v-if="$slots.prefix">
            <slot name="prefix" />
        </template>
    </a-range-picker>
</template>

<script setup>
    import dayjs from 'dayjs'
    const props = defineProps({
        start: { 
            type: String, 
            default: '' 
        },
        end: { 
            type: String, 
            default: '' 
        },
        disabledDate: {
            type: Function,
            default(value) {
                return !dayjs().isAfter(value);
            }
        }
    })
    const currentValue = computed(() => {
        if (props.start && props.end) {
            return [ props.start, props.end ]
        } else {
            return []
        }
    })

    const emit = defineEmits(['update:start', 'update:end'])
    function onChange(value) {
        const [ start = '', end = '' ] = value ?? [];
        emit('update:start', start);
        emit('update:end', end);
    }
</script>