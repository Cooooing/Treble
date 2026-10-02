export interface UserCardController {
  open(name: string, trigger: HTMLElement, focusCard?: boolean): void;
  close(): void;
}

let controller: UserCardController | undefined;

export function registerUserCardController(next?: UserCardController) {
  controller = next;
}

export function openUserCard(name: string, trigger: HTMLElement, focusCard = false) {
  controller?.open(name, trigger, focusCard);
}

export function closeUserCard() {
  controller?.close();
}
