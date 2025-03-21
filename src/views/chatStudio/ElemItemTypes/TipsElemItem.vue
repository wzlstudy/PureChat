<template>
  <div @click="onClick()" class="message-view_withdraw">
    <span class="withdraw">
      <span>
        {{ getChangeType() }}
      </span>
      <FontIcon
        class="close"
        iconName="CircleCloseFilled"
        @click.stop="onClose()"
        v-show="!isReEdit && message.type !== 'TIMCustomElem'"
      />
    </span>
    <span @click.stop="onEdit()" v-if="isReEdit" class="edit">重新编辑</span>
  </div>
</template>

<script>
import { deleteMessage } from "@/api/im-sdk-api/index";
import { localStg } from "@/utils/storage";
import { useChatStore } from "@/stores/modules/chat/index";
import emitter from "@/utils/mitt-bus";

export default {
  name: "TipsElemItem",
  props: {
    message: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    // 消息的流向 in 为收到的消息 | out 为发出的消息
    isMine() {
      return this.message.flow === "out";
    },
    isReEdit() {
      return useChatStore().revokeMsgMap.get(this.message.ID);
    },
    userProfile() {
      return localStg.get("timProxy")?.userProfile;
    },
  },
  methods: {
    async onClose(data = this.message) {
      try {
        const { code } = await deleteMessage([data]);
        if (code !== 0) return;
        this.$store.commit("deleteMessage", {
          convId: data.conversationID,
          messageIdArray: [data.ID],
        });
      } catch (error) {
        console.log(error);
      }
    },
    onClick() {
      console.log(this.revokeMsgMap);
    },
    onEdit(data = this.message) {
      console.log("[edit]:", data);
      emitter.emit("handleSetHtml", data?.payload?.text);
      useChatStore().updateRevokeMsg( { data, type: "delete" })
    },
    getChangeType(message = this.message) {
      const { conversationType: type, nick, from, revokerInfo, payload } = message;
      if (payload?.description === "dithering") {
        return "[窗口抖动]";
      }
      const isGroup = type === "GROUP";
      const isC2C = type === "C2C";
      // 自己的消息
      if (this.isMine) {
        if (isGroup) {
          // 自己的消息 被管理员撤回
          if (from !== revokerInfo?.userID) {
            return `${revokerInfo?.nick} 撤回了一条成员消息`;
          }
        }
        return "你撤回了一条消息";
      } else {
        if (isC2C) {
          return "对方撤回了一条消息";
        }
        if (isGroup) {
          // 不是自己的消息 被管理员撤回
          if (from !== revokerInfo?.userID) {
            const name = this.userProfile.nick == revokerInfo?.nick ? "你" : revokerInfo?.nick;
            return `${name} 撤回了成员 ${nick} 的一条消息`;
          }
          return `${nick} 撤回了一条消息`;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.message-view_withdraw {
  font-size: 12px;
  vertical-align: middle;
  word-wrap: normal;
  word-break: break-all;
  margin-top: 5px;
  line-height: 16px;
  display: flex;
  align-items: center;
  .withdraw {
    display: flex;
    align-items: center;
    color: var(--color-time-divider);
    padding: 4px 6px;
    .close {
      margin-left: 4px;
      cursor: pointer;
    }
  }
  .edit {
    user-select: none;
    color: #337ecc;
    cursor: pointer;
  }
}
</style>
