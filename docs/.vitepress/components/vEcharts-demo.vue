<template>
  <div class="demo-container" :class="{ 'full-screen-container': isFullScreen }">
    <div class="demo">
      <!--操作菜单-->
      <div class="menu">
        <i
          class="icon"
          v-for="icon in iconColorArr"
          :key="icon.color"
          :style="{ backgroundColor: icon.color }"
        >
          <el-icon
            v-if="icon.name === 'scale'"
            class="d-caret"
            @click="handleToggleFullScreen"
            ><DCaret
          /></el-icon>
        </i>
      </div>
       <!--demo展示组件，使用 iframe 内嵌组件-->
      <iframe
        class="elp-iframe"
        :class="{ 'full-screen-iframe': isFullScreen }"
        :src="`${baseUrl[props.libType]}#/${props.iframeSrc}`"
        :style="{ height: demoHeight }"
      />
    </div>
    <div class="options">
      <el-tooltip content="全屏预览" placement="bottom">
        <el-icon class="option-item" @click="handleToggleFullScreen"
          ><FullScreen
        /></el-icon>
      </el-tooltip>
      <el-tooltip content="复制代码" placement="bottom">
        <el-icon class="option-item" @click="copyCode"><CopyDocument /></el-icon>
      </el-tooltip>
      <el-tooltip content="查看源码" placement="bottom">
        <span class="option-item code-btn" @click="handleToggleCode">&lt;/&gt;</span>
      </el-tooltip>
    </div>
    <El-collapse-transition>
      <div class="source-code" v-if="isShowCode">
        <!--demo 源码内嵌显示-->
        <div class="decode" v-html="decoded" />
        <div class="hide-code-btn">
          <el-button type="info" link :icon="CaretTop" @click="handleToggleCode"
            >隐藏源代码</el-button
          >
        </div>
      </div>
    </El-collapse-transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  ElIcon,
  ElTooltip,
  ElCollapseTransition,
  ElButton,
  ElMessage,
} from "element-plus";
import { FullScreen, DCaret, CaretTop, CopyDocument } from "@element-plus/icons-vue";
import { useClipboard } from "@vueuse/core";
import "prismjs/themes/prism-tomorrow.css";

const props = defineProps({
  libType: { // 组件库名称
    type: String,
    default: "element-plus",
  },
  iframeSrc: {
    type: String,
    default: "",
  },
  demoHeight: {
    type: String,
    default: "320px",
  },
  sourceCode: {
    type: String,
    default: "",
  },
  rawSource: {
    type: String,
    default: "",
  },
});

const decoded = computed(() => {
  return decodeURIComponent(props.sourceCode);
});
// 组件库 demo 构建地址
const baseUrl = {
  "common-charts": import.meta.env.VITE_COMMON_DEV_BASE,
};

const iconColorArr = [
  { name: "", color: "#646cff" },
  { name: "", color: "#9499ff" },
  { name: "scale", color: "#bcc0ff" },
];

const isFullScreen = ref(false);
const isShowCode = ref(false);
//全屏预览
const handleToggleFullScreen = () => (isFullScreen.value = !isFullScreen.value);
//查看源码
const handleToggleCode = () => (isShowCode.value = !isShowCode.value);
//复制源码
const { copy, isSupported } = useClipboard({
  source: decodeURIComponent(props.rawSource),
  read: false,
});

const copyCode = async () => {
  if (!isSupported) {
    ElMessage.error("不支持复制");
  }
  try {
    await copy();
    ElMessage.success("复制成功");
  } catch (e) {
    ElMessage.error(e.message);
  }
};

onMounted(() => {
  // 监听键盘 esc键，退出全屏
  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape" || e.key === "Esc") isFullScreen.value = false;
  });
});
</script>
<script>
export default {
  name: "vEchartsDemo",
};
</script>

<style scoped lang="less">
@menu-height: 32px;

.demo-container {
  border: 1px solid #dcdfe6b2;
  border-radius: var(--ve-border-radius-base);
}
.full-screen-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: #fff;
  z-index: 10000;
}
.demo {
  .menu {
    border-radius: var(--ve-border-radius-base) var(--ve-border-radius-base) 0 0;
    height: @menu-height;
    line-height: @menu-height;
    background-color: var(--ve-custom-block-details-bg);
    padding: 0 16px;
    .icon {
      position: relative;
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-right: 5px;
      &:hover {
        .d-caret {
          display: block;
          cursor: pointer;
        }
      }
      .d-caret {
        display: none;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        color: var(--ve-c-text-2);
        font-size: 13px;
      }
    }
  }
  .elp-iframe {
    width: 100%;
    padding: 15px;
    border: 0;
  }
  .full-screen-iframe {
    width: 100vw;
    height: calc(100vh - @menu-height) !important;
  }
}
.options {
  border-top: 1px solid #dcdfe6b2;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  .option-item {
    margin-right: 8px;
    cursor: pointer;
    color: var(--ve-c-text-2);
    font-size: 12px;
    &:hover {
      color: var(--ve-c-text-1);
    }
  }
}
.source-code {
  background-color: #f6f8fa;
  position: relative;
  border-top: 1px solid #dcdfe6b2;
  .decode {
    padding: 0 16px;
  }
  .hide-code-btn {
    border-top: 1px solid #dcdfe6b2;
    border-radius: 0 0 var(--ve-border-radius-base) var(--ve-border-radius-base);
    position: sticky;
    bottom: 0;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    background-color: var(--vp-code-block-bg);
    z-index: 10;
    .icon {
      margin-right: 8px;
    }
    &::hover{
      color: black;
    }
  }
}
::v-deep code{
    max-width: 688px;
    white-space:break-spaces;
}
</style>
