import { ref } from "vue";

export const workCountdownSettingsOpen = ref(false);

export function openWorkCountdownSettings(): void {
  workCountdownSettingsOpen.value = true;
}

export function closeWorkCountdownSettings(): void {
  workCountdownSettingsOpen.value = false;
}
