import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeVue from "vike-vue/config";

export default {
  title: "摸鱼派",
  description: "摸鱼派社区",

  extends: [vikeVue, vikePhoton],

  photon: {
    server: "../server/entry.ts",
  },

  ssr: true,

  passToClient: ["user"],
} as Config;
