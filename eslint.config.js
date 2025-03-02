import eslintPluginAstro from "eslint-plugin-astro";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      "astro/no-set-text-directive": "error",
      "astro/no-unused-css-selector": "error",
      "astro/valid-compile": "error",
      "astro/no-conflict-set-directives": "error",
      "astro/no-unused-define-vars-in-style": "error",
      "astro/jsx-a11y/alt-text": "error",
      "astro/jsx-a11y/anchor-is-valid": "error",
      "astro/sort-attributes": "error",
      "astro/prefer-class-list-directive": "error",
      "astro/jsx-a11y/interactive-supports-focus": "error",
      "astro/jsx-a11y/control-has-associated-label": "error",
      "astro/jsx-a11y/no-static-element-interactions": "error",
      
    },
  },
];
