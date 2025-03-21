<template>
  <div class="toolbar">
    <!-- 表情包 -->
    <span
      v-show="!isFullscreenInputActive && !isRobot(toAccount)"
      :title="$t('chat.emoji')"
      class="emoticon"
      @click="sendEmojiClick"
    >
      <svg-icon local-icon="iconxiaolian" class="icon-hover" />
    </span>
    <!-- 选模型 -->
    <span v-show="isRobot(toAccount)" @click="selectModel">
      <svg-icon local-icon="model" class="icon-hover robot" />
    </span>
    <!-- 图片 -->
    <span
      v-if="isShowImage(toAccount)"
      :class="isVision ? '' : 'prohibit'"
      :title="$t('chat.picture')"
      @click="sendImageClick"
    >
      <svg-icon local-icon="icontupian" class="icon-hover" />
    </span>
    <!-- 文件 -->
    <span v-show="!isRobot(toAccount)" :title="$t('chat.file')" @click="sendFileClick">
      <svg-icon local-icon="iconwenjianjia" class="icon-hover" />
    </span>
    <!-- 截图 -->
    <span
      v-show="!isRobot(toAccount) && isElectron"
      :title="$t('chat.screenshot')"
      @click="clickCscreenshot"
    >
      <svg-icon local-icon="iconjietu" class="icon-hover" />
    </span>
    <!-- 机器人配置 -->
    <span v-if="isRobot(toAccount)" :title="$t('chat.configuration')" @click="openRobotBox">
      <svg-icon local-icon="robot" class="icon-hover robot" />
    </span>
    <!-- 插件 -->
    <span
      v-if="isFunctionCall && isShowPlugins(toAccount)"
      :class="isFunctionCall ? '' : 'prohibit'"
      @click="openPluginBox"
    >
      <svg-icon local-icon="plugin" class="icon-hover robot" />
    </span>
    <!-- 窗口抖动 -->
    <span
      v-show="currentType === 'C2C' && isElectron"
      :title="$t('chat.windowJitter')"
      @click="onShake"
    >
      <FontIcon class="icon-hover" iconName="Iphone" />
    </span>
    <!-- 自定义消息 -->
    <span v-if="false" @click="customMessage">
      <FontIcon class="icon-hover" iconName="Sunny" />
    </span>
    <!-- 滚动到底部 -->
    <span
      :title="$t('chat.scrollToTheBottom')"
      class="chat-top animate-chat-slide-in"
      @click="onTobBottom"
      v-show="tobottom"
    >
      <FontIcon class="svg-left icon-hover" iconName="DArrowLeft" />
    </span>
    <span
      :title="isFullscreenInputActive ? $t('chat.recover') : $t('chat.launch')"
      class="ml-auto"
      @click="toggleFullScreenInput"
    >
      <svg-icon :local-icon="isFullscreenInputActive ? 'narrow' : 'enlarge'" class="icon-hover" />
    </span>
    <input
      type="file"
      ref="imagePicker"
      accept=".jpg, .jpeg, .png, .gif, .bmp"
      @change="sendImage"
      hidden
    />
    <input type="file" ref="filePicker" @change="sendFile" hidden />
    <!-- <input
      type="file"
      ref="videoPicker"
      @change="sendVideo"
      accept=".mp4"
      hidden
    /> -->
    <template v-if="isRobot(toAccount)">
      <RobotModel />
      <RobotPlugin />
      <RobotOptions />
    </template>
    <EmotionPackBox v-if="!isRobot(toAccount) && flag" @onClose="setFlag(false)"  />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { createCustomMessage } from "@/api/im-sdk-api/index";
import { isRobot, screenshot } from "@/utils/chat/index";
import { isElectron } from "@/utils/common";
import { useGetters, useState } from "@/utils/hooks/useMapper";
import { useStore } from "vuex";
import { storeToRefs } from 'pinia';
import { useBoolean } from "@/utils/hooks/index";
import { useChatStore, useRobotStore } from "@/stores/index";
import EmotionPackBox from "./EmotionPackBox.vue";
import RobotOptions from "./RobotOptions.vue";
import RobotModel from "./RobotModel.vue";
import RobotPlugin from "./RobotPlugin.vue";
import emitter from "@/utils/mitt-bus";

const tobottom = ref();
const imagePicker = ref();
const filePicker = ref();

const [flag, setFlag] = useBoolean();
const robotStore = useRobotStore();
const chatStore = useChatStore();
const { isFullscreenInputActive } = storeToRefs(chatStore);
const { dispatch } = useStore();
const { toAccount, currentType } = useGetters(["toAccount", "currentType"]);
const { currentConversation } = useState({
  currentConversation: (state) => state.conversation.currentConversation,
});

const isVision = computed(() => {
  if (isRobot(toAccount.value)) {
    return robotStore.model?.vision;
  } else {
    return true;
  }
});

const isFunctionCall = computed(() => {
  if (isRobot(toAccount.value)) {
    return robotStore.model?.functionCall;
  } else {
    return false;
  }
});

const sendEmojiClick = () => {
  setFlag(true)
};
function openRobotBox() {
  emitter.emit("onRobotBox");
}
function openPluginBox() {
  emitter.emit("onPluginBox");
}
function selectModel() {
  emitter.emit("openModeList", true);
}
const sendImageClick = () => {
  let $el = imagePicker.value;
  $el.value = null;
  $el.click();
};
const sendFileClick = () => {
  let $el = filePicker.value;
  $el.value = null;
  $el.click();
};
// 截图
const clickCscreenshot = () => {
  screenshot(() => {});
};

const onShake = () => {};

const toggleFullScreenInput = () => {
  chatStore.$patch((state) => {
    state.isFullscreenInputActive = !state.isFullscreenInputActive;
  })
};

function customMessage() {
  const message = createCustomMessage({
    convId: toAccount.value,
    convType: currentType.value,
    customType: "loading",
  });
  dispatch("sendSessionMessage", {
    payload: {
      convId: currentConversation.value.conversationID,
      message,
    },
  });
}

function sendImage(e) {
  emitter.emit("handleToolbar", {
    key: "setPicture",
    data: { files: e.target.files[0] },
  });
}

function sendFile(e) {
  emitter.emit("handleToolbar", {
    key: "setParsefile",
    data: { files: e.target.files[0] },
  });
}

function isShowPlugins(val) {
  return false;
  if (__LOCAL_MODE__) {
    return true;
  } else {
    return false;
  }
}

function isShowImage(val) {
  if (__LOCAL_MODE__) {
    return false;
  } else {
    return !isRobot(val);
  }
}

const onTobBottom = () => {
  emitter.emit("updataScroll");
};

emitter.on("onisbot", (state) => {
  tobottom.value = !state;
});
</script>

<style lang="scss" scoped>
.toolbar {
  height: 40px;
  padding: 0 5px;
  display: flex;
  position: relative;
  .prohibit {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
  & > span {
    width: 42px;
    align-items: center;
    justify-content: center;
    display: flex;
    height: 40px;
    padding: 4px;
    position: relative;
    text-align: center;
    color: #808080;
  }
  .svg-icon {
    cursor: pointer;
  }
  .robot {
    stroke: unset;
    cursor: pointer;
  }
  & > .icon:hover:after {
    font-size: 13px;
    display: inline-block;
    content: attr(data-title);
    text-align: center;
    color: rgba(0, 0, 0, 0.75);
    position: absolute;
    left: 17px;
    top: 38px;
    border-radius: 3px;
    // border: 1px solid #e9e9e9;
    background-color: #eaeaea;
    white-space: nowrap;
    padding: 2px 5px;
    z-index: 9999;
  }
}
.chat-top {
  .svg-left {
    transform: rotate(-90deg);
  }
  .el-icon {
    cursor: pointer;
  }
}
</style>
