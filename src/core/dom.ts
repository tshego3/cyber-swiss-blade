export type Child = Node | string | number | null | undefined | false;

type EventHandlers = {
  readonly [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void;
};

export interface ElementOptions {
  readonly class?: string;
  readonly text?: string;
  readonly attrs?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly on?: EventHandlers;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: readonly Child[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (options.class) element.className = options.class;
  if (options.text !== undefined) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    setAttribute(element, name, value);
  }
  for (const [type, handler] of Object.entries(options.on ?? {})) {
    element.addEventListener(type, handler as EventListener);
  }
  append(element, children);
  return element;
}

export function append(parent: Element | DocumentFragment, children: readonly Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(typeof child === 'number' ? String(child) : child);
  }
}

export function replaceChildren(parent: Element, children: readonly Child[]): void {
  parent.replaceChildren();
  append(parent, children);
}

function setAttribute(element: HTMLElement, name: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === false) return;
  element.setAttribute(name, value === true ? '' : String(value));
}
