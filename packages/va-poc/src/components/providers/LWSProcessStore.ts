import { reactive } from 'vue';
import { type TypeRegistration } from './LWSHost.d';

export const processStore = reactive({
  typeIndexContainers: {} as Record<string, URL[]>,
  typeRegistrations: {} as Record<string, TypeRegistration[]>,
  processProviders: [], // Comunica can query several process sources
  taskBeingEdited: '',
  taskURI: '', // pod URI of the process/task which is being selected for execution
  canProcessData() {
    return this.processProviders.length > 0;
  },
});