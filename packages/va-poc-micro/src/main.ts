import { createApp, defineCustomElement } from 'vue'
import './style.css'
import App from './App.vue'

// Import the ShapeStep custom element
import ShapeStepCE from './components/ShapeStep.ce.vue'

// Register the custom element globally (only once)
if (!customElements.get('shape-step')) {
  customElements.define('shape-step', defineCustomElement(ShapeStepCE))
}

// Create and mount your main Vue app
createApp(App).mount('#app')
