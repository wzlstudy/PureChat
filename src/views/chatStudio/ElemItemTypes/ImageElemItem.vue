<template>
  <div class="image-preview" @click="geiPic(url)">
    <el-image
      :src="url"
      @load="loadImg"
      :style="imgStyle"
      :preview-src-list="chatStore.showCheckbox ? null : chatStore.imgUrlList"
      :hide-on-click-modal="true"
      :initial-index="initialIndex"
      :infinite="false"
      :zoom-rate="1.2"
      :max-scale="5"
      :min-scale="0.3"
      :preview-teleported="true"
      loading="lazy"
      fit="cover"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { showIMPic } from "../utils/utils";
import { useChatStore } from "@/stores/index";
import { getImageSize } from "@/utils/common";

const props = defineProps({
  message: {
    type: Object,
    default: null,
  },
  self: {
    type: Boolean,
    default: false,
  },
});

const imgStyle = ref({});
const chatStore = useChatStore();

const initialIndex = computed(() => {
  return chatStore.imgUrlList.findIndex((item) => {
    return item == getImageProperties(0)?.url;
  });
});

function getImageProperties(num = 0) {
  try {
    const {
      payload: { imageInfoArray },
    } = props.message;
    const imageInfo = imageInfoArray[num];
    return imageInfo;
  } catch (error) {
    return null;
  }
}

const url = getImageProperties()?.url;

async function initImageSize() {
  try {
    let width = getImageProperties()?.width || 0;
    let height = getImageProperties()?.height || 0;
    if (width <= 0 || height <= 0) {
      const { width: newWidth, height: newHeight } = await getImageSize(url);
      width = newWidth;
      height = newHeight;
    }
    const { width: finalWidth, height: finalHeight } = showIMPic(width, height);
    imgStyle.value = { width: finalWidth, height: finalHeight };
  } catch (error) {
    const { width, height } = await getImageSize(url);
    imgStyle.value = { width: width + "px", height: height + "px" };
  }
}

initImageSize();

const geiPic = (url) => {
  console.log("pic:", url);
  // console.log("initialIndex:", initialIndex.value);
  // console.log("imgUrlList:", chatStore.imgUrlList);
};
const loadImg = (e) => {};
</script>

<style lang="scss" scoped>
.image-preview {
  user-select: none;
  width: fit-content;
  max-width: 142px;
  box-sizing: border-box;
  border-radius: 5px;
  border: 1px solid var(--color-border-default);
  :deep(.el-image) {
    border-radius: 5px;
    vertical-align: bottom;
    min-height: 82px;
  }
}
</style>
