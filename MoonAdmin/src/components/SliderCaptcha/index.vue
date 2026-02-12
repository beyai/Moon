<template>
    <div class="SliderCaptcha" ref="wrapRef">
        <div 
            class="SliderCaptcha-Mask"
            :class="{
                error: isError,
                success: isSuccess,
                transition: isReady,
            }"
            :style="{ width: offsetX + 'px'}" 
        />

        <div class="SliderCaptcha-Tips"
            :class="{
                ready: isReady || isPending
            }"
        >
            <span v-if="isChecking">验证中...</span>
            <span v-else-if="isSuccess">验证成功</span>
            <span v-else-if="isError">验证失败</span>
            <span v-else>请按住滑块，拖动到最右边</span>
        </div>

        <div ref="btnRef" 
            class="SliderCaptcha-Btn" 
            :class="{
                transition: isReady,
                checking: isChecking,
                error: isError,
                success: isSuccess,
                
            }"
            :style="{ left: offsetX + 'px'}"
            @mousedown="onDown" 
            @touchstart="onDown" 
        >
            <icon-loading v-if="isChecking" />
            <icon-check-circle-fill v-else-if="isSuccess" />
            <icon-close-circle-fill v-else-if="isError" />
            <icon-double-right v-else />
        </div>
    </div>
</template>

<script setup>
    import TrackCrypt from './trackCrypt'

    const props = defineProps({
        modelValue: {
            type: String
        }
    })
    const emit = defineEmits(['update:modelValue'])

    const STATUS_TYPES = {
        READY: 1,
        PENDING: 2,
        CHECKING: 3,
        SUCCESS: 4,
        ERROR: 5
    }
    
    const wrapRef = ref(null)
    const btnRef = ref(null)
    const offsetX = ref(0) // 移动偏移位置
    const status = ref(STATUS_TYPES.READY)

    let maxWidth = 0 // 最大移动宽度
    let startX = 0 // 按键时开始位置
    let lastTime = 0 // 最后一次操作时间
    let trackRecord = []; // 操作轨迹记录
    let timer = null; // 验证成功超时计时器

    /** 是否准备验证 */
    const isReady = computed(() => status.value === STATUS_TYPES.READY )
    
    /** 是否等待验证 */
    const isPending= computed(() => status.value === STATUS_TYPES.PENDING )

    /** 是否验证中 */
    const isChecking = computed(() => status.value === STATUS_TYPES.CHECKING )

    /** 是否验证成功 */
    const isSuccess = computed(() => status.value === STATUS_TYPES.SUCCESS )

    /** 是否验证失败 */
    const isError = computed(() => status.value === STATUS_TYPES.ERROR )

    /** 添加操作 */
    function addTrack(x, y) {
        let now = Date.now()
        if (now - lastTime > 16) {
            trackRecord.push([ x, y, now])
            lastTime = now;
        }
    }

    /** 恢复 */
    function reset() {
        status.value = STATUS_TYPES.READY
        offsetX.value = 0;
        startX = 0;
        lastTime = 0;
        trackRecord = [];
        emit('update:modelValue', '')
    }

    /** 开始验证 */
    async function startCheck() {
        status.value = STATUS_TYPES.CHECKING
        try {
            const tracks = TrackCrypt.encrypt(trackRecord)
            const { data } = await Api.Common.captchaTeack({ tracks })
            status.value = STATUS_TYPES.SUCCESS
            emit('update:modelValue', data.key)
            timer = setTimeout(reset, data.ttl * 999)
        } catch(err) {
            status.value = STATUS_TYPES.ERROR
            await Helper.sleep(1000)
            reset();
        } finally {

        }
    }

    /** 按下 */
    function onDown(event) {
        if (!isReady.value) return;
        status.value = STATUS_TYPES.PENDING;
        const type = event.type;
        const { clientX, clientY } = type =='touchstart' ?  event.changedTouches[0] : event
        startX = clientX
        addTrack(Math.floor(clientX), Math.floor(clientY))
    }

    /** 移动 */
    function onMove(event) {
        if (!isPending.value) return;
        const type = event.type;
        const { clientX, clientY } = type =='touchmove' ?  event.changedTouches[0] : event
        const moveX = Math.max(0, Math.min(maxWidth, clientX - startX ))
        if (moveX > offsetX.value ) {
            addTrack(Math.floor(clientX), Math.floor(clientY))
        }
        offsetX.value = moveX;
    }

    /** 抬起 */
    function onEnd(event) {
        if (!isPending.value) return;
        const type = event.type;
        const { clientX, clientY } = type == 'touchend' ?  event.changedTouches[0] : event
        addTrack(Math.floor(clientX), Math.floor(clientY))
        // 未移动到最右边
        if (offsetX.value < maxWidth || trackRecord.length < 8) {
            return reset();
        }
        // 开始验证
        startCheck();
    }

    /** 组件开挂载完成 */
    onMounted(() => {
        document.addEventListener('mousemove', onMove)
        document.addEventListener('touchmove', onMove)
        document.addEventListener('mouseup', onEnd)
        document.addEventListener('touchend', onEnd)

        maxWidth = wrapRef.value.offsetWidth - btnRef.value.offsetWidth;
    })

    /** 组件开始卸载 */
    onBeforeUnmount(() => {
        clearTimeout(timer)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('mouseup', onEnd)
        document.removeEventListener('touchend', onEnd)
    })

</script>

<style lang="less" scoped>
    .SliderCaptcha {
        position: relative;
        width: 100%;
        height: 36px;
        user-select: none;
        background-color: @color-fill-3;

        &-Mask, &-Btn, &-Tips {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .transition {
            transition: all .3s
        }


        &-Tips {
            right: 0;
            font-size: 13px;
            color: @color-fill-1;
            &.ready {
                animation: slidetounlock 3s infinite;
                background: -webkit-gradient(linear, left top, right top, color-stop(0, @color-text-2), color-stop(.4, @color-text-2), color-stop(.5, #fff), color-stop(.6, @color-text-2), color-stop(1, @color-text-2));
                background-clip: text;
                -webkit-text-fill-color: transparent;
            }
        }

        &-Btn {
            width: 36px;
            cursor: pointer;
            font-size: 14px;
            color: @color-text-3;
            background-color: @color-bg-1;
            border: 1px solid @color-border-2;
            &.error {
                color: @color-danger-6;
            }
            &.success {
                color: @color-success-6
            }
            &.checking, &.error, &.success {
                cursor: auto;
            }
        }

        &-Mask {
            width: 0;
            background-color: @color-success-5;
            &.error {
                background-color: @color-danger-5;
            }
            &.success {
                color: @color-success-5
            }
        }

        
    }

    @keyframes slidetounlock {
        0% {
            background-position:-200px 0
        }
        100% {
            background-position:200px 0
        }
    }
</style>