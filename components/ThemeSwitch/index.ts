import { clientOnly } from 'vike-vue/clientOnly';

const ThemeSwitchClientOnly = clientOnly(() => import("./src/ThemeSwitch.vue"));
export { ThemeSwitchClientOnly as ThemeSwitch };
export default ThemeSwitchClientOnly;