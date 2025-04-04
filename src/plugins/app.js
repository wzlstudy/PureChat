import { ElNotification, ElButton } from "element-plus";
import { setCookie, getCookie } from "@/utils/cookie";
import { isElectron } from "@/utils/common";
import { $t } from "@/locales/index";
import { h } from "vue";

let Notification = null;
const { DEV: isDev } = import.meta.env;

function setPageNotification() {
  !getCookie("onUpdate") && setCookie("onUpdate", true, 1);
}

function notify() {
  if (Notification) Notification.close();
  Notification = ElNotification({
    title: $t("system.updateContent"),
    dangerouslyUseHTMLString: true,
    message: h("div", [
      h(
        ElButton,
        {
          onClick() {
            Notification.close();
            setPageNotification();
          },
        },
        () => $t("system.updateCancel")
      ),
      h(
        ElButton,
        {
          type: "primary",
          onClick() {
            location.reload();
            setPageNotification();
          },
        },
        () => $t("system.updateConfirm")
      ),
    ]),
    duration: 6000,
  });
}

async function getHtmlBuildTime() {
  const baseURL = import.meta.env.VITE_BASE_URL;

  const res = await fetch(`${baseURL}index.html`);

  const html = await res.text();

  const match = html.match(/<meta name="buildTime" content="(.*)">/);

  const buildTime = match?.[1] || "";

  return buildTime;
}

export function setupAppVersionNotification() {
  if (isDev) return;
  if (isElectron) return;
  document.addEventListener("visibilitychange", async () => {
    if (getCookie("onUpdate")) return;
    const buildTime = await getHtmlBuildTime();
    const BUILD_TIME = __APP_INFO__.lastBuildTime;
    if (
      !isDev &&
      buildTime !== "undefined" &&
      buildTime !== BUILD_TIME &&
      document.visibilityState === "visible"
    ) {
      notify();
    }
  });
}
