import { clientOnly } from 'vike-vue/clientOnly';

const EditorClientOnly = clientOnly(() => import("./src/Editor.vue"));
export { EditorClientOnly as Editor };
export default EditorClientOnly;