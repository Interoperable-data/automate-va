import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          /*
           * Treat all tags with a dash '-' as custom elements,
           * so Vue won’t try to process them as normal Vue components.
           * You can refine this logic as needed.
           */
          isCustomElement: (tag) => tag.includes('-'),
        },
      },
    }),
  ],
})
