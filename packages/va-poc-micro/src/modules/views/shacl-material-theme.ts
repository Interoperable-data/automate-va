const MATERIAL_STYLE_OVERRIDES = [
  ":host { font-family: 'Roboto', 'Segoe UI', system-ui, -apple-system, sans-serif; color: #202124; }",
  'form { background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 24px 28px 32px; box-shadow: 0 18px 40px rgba(60, 64, 67, 0.22); gap: 20px; border: 1px solid rgba(60, 64, 67, 0.1); }',
  'form.mode-edit { padding-left: 28px; }',
  '.collapsible { border-radius: 12px; background: rgba(95, 99, 104, 0.06); border: 1px solid rgba(95, 99, 104, 0.08); padding: 12px 18px; margin: 12px 0; }',
  '.collapsible::part(label) { font-weight: 600; font-size: 1rem; color: #1f1b16; }',
  '.property-instance { align-items: stretch; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(95, 99, 104, 0.12); }',
  '.property-instance:last-child { border-bottom: none; }',
  '.property-instance label { font-size: 0.95rem; text-transform: none; letter-spacing: 0.01em; color: #5f6368; font-weight: 500; padding-top: 0.55rem; }',
  '.property-instance label.required::before { color: #0b57d0; top: 0.2rem; font-size: 0.7rem; }',
  '.validation-error { left: auto; right: 0; transform: translateX(6px); color: #d93025; }',
  '.shacl-or-constraint { border-radius: 12px; border: 1px dashed rgba(95, 99, 104, 0.3); padding: 16px; background: rgba(245, 247, 250, 0.8); }',
  ".editor:not([type='checkbox']) { border-radius: 8px; border: 1px solid rgba(95, 99, 104, 0.3); padding: 12px 14px; min-height: 46px; font-size: 0.98rem; background-color: rgba(255, 255, 255, 0.95); transition: border-color 150ms ease, box-shadow 150ms ease; box-shadow: 0 1px 2px rgba(95, 99, 104, 0.08); }",
  ".editor:not([type='checkbox']):focus { outline: none; border-color: #0b57d0; box-shadow: 0 0 0 3px rgba(11, 87, 208, 0.16); }",
  ".editor:not([type='checkbox']):hover { border-color: rgba(11, 87, 208, 0.65); }",
  '.editor[disabled] { background: rgba(95, 99, 104, 0.08); color: rgba(32, 33, 36, 0.7); box-shadow: none; }',
  'textarea.editor { min-height: 120px; line-height: 1.5; }',
  'rokit-select.add-button { --rokit-control-background: rgba(11, 87, 208, 0.12); --rokit-control-border-color: rgba(11, 87, 208, 0.4); --rokit-control-color: #0b57d0; border-radius: 999px; font-weight: 600; padding: 4px 12px; margin-top: 12px; }',
  'rokit-select.add-button::part(input) { font-weight: 600; }',
  'rokit-select.add-button:hover { --rokit-control-background: rgba(11, 87, 208, 0.18); }',
  'rokit-button.remove-button { --rokit-button-color: #d93025; --rokit-button-background: rgba(217, 48, 37, 0.08); border-radius: 999px; margin-top: 8px; }',
  'rokit-button.remove-button:hover { --rokit-button-background: rgba(217, 48, 37, 0.16); }',
  '.mode-view .property-instance label { color: #3c4043; }',
  '.lang-chooser { border-radius: 20px; border: 1px solid rgba(95, 99, 104, 0.3); padding: 4px 10px; background: rgba(255, 255, 255, 0.85); }',
  'rokit-button.modal__button--submit { --rokit-button-color: #ffffff; --rokit-button-background: #0b57d0; }',
  '.node-id-display { background: rgba(95, 99, 104, 0.08); border-radius: 8px; padding: 4px 8px; margin-bottom: 8px; font-size: 0.75rem; letter-spacing: 0.04em; }',
  '.modal__status { color: #0b57d0; font-weight: 500; }',
  'form.mode-edit shacl-property > .property-instance.invalid { border-left: 4px solid #d93025; padding-left: 12px; background: rgba(217, 48, 37, 0.05); }',
  'form.mode-edit shacl-property > .property-instance.valid { border-left: 4px solid #188038; padding-left: 12px; background: rgba(24, 128, 56, 0.05); }',
];

const themedSheets = new WeakSet<CSSStyleSheet>();

interface ThemeAwareForm extends HTMLElement {
  config?: {
    theme?: {
      stylesheet: CSSStyleSheet;
      setDense: (dense: boolean) => void;
    };
  };
}

function injectOverrides(sheet: CSSStyleSheet) {
  for (const rule of MATERIAL_STYLE_OVERRIDES) {
    try {
      sheet.insertRule(rule);
    } catch {
      // Some browsers (or duplicate calls) may reject insertRule; ignore gracefully.
    }
  }
}

export function applyMaterialShaclTheme(form: ThemeAwareForm): void {
  const theme = form.config?.theme;
  if (!theme?.stylesheet || typeof theme.stylesheet.insertRule !== 'function') {
    return;
  }

  if (!themedSheets.has(theme.stylesheet)) {
    injectOverrides(theme.stylesheet);
    themedSheets.add(theme.stylesheet);
  }

  theme.setDense(false);
}
