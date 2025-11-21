import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeVue from "vike-vue/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: process.env.VITE_GLOB_APP_TITLE || "Treble",
  description: "Fishpi",

  extends: [vikeVue, vikePhoton],

  // https://vike.dev/vike-photon
  photon: {
    server: "../server/entry.ts",
  },

  passToClient: ["user"],
} as Config;
