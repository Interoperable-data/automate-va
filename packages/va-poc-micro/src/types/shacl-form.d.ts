export interface ShaclFormElement extends HTMLElement {
  serialize: (format?: string) => string;
  validate: (ignoreEmptyValues?: boolean) => Promise<boolean | { conforms?: boolean }>;
  setClassInstanceProvider?: (provider: (className: string) => Promise<string>) => void;
  config?: {
    theme?: {
      stylesheet: CSSStyleSheet;
      setDense: (dense: boolean) => void;
    };
  };
}

declare module '@ulb-darmstadt/shacl-form/form-default.js';
