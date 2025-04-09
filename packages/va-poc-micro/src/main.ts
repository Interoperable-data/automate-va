import { createApp, defineCustomElement } from 'vue';
import './style.css';
import App from './App.vue';
import { ShaclForm } from '@ulb-darmstadt/shacl-form'; // Corrected import for ShaclForm

// Import the ShapeStep custom element
import ShapeStepCE from './components/ShapeStep.ce.vue';
import ProcessTaskCE from './components/ProcessTask.ce.vue';
import TurtleViewerCE from './components/TurtleViewer.ce.vue';
import ProcessTaskViewerCE from './components/ProcessTaskViewer.ce.vue';

// Register the custom element globally (only once)
if (!customElements.get('shape-step')) {
  customElements.define('shape-step', defineCustomElement(ShapeStepCE));
}
if (!customElements.get('process-task')) {
  customElements.define('process-task', defineCustomElement(ProcessTaskCE));
}
if (!customElements.get('turtle-viewer')) {
  customElements.define('turtle-viewer', defineCustomElement(TurtleViewerCE));
}
if (!customElements.get('process-task-viewer')) {
  customElements.define('process-task-viewer', defineCustomElement(ProcessTaskViewerCE));
}

// Create and mount your main Vue app
const app = createApp(App);

// Register ShaclForm globally
app.component('ShaclForm', ShaclForm);

app.mount('#app');
