declare module "jest-axe" {
  export interface AxeResults {
    violations: Array<unknown>;
  }

  export function axe(container: Element | DocumentFragment): Promise<AxeResults>;
}
