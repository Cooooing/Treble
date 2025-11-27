import { clientOnly } from 'vike-vue/clientOnly';

const ClientOnly = clientOnly(() => import("./src/ClientOnly.vue"));

export { ClientOnly };
export default ClientOnly;
