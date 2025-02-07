import { reactive } from 'vue';
import { type TypeRegistration, type TaskRegistration } from '@va-automate/lws-manager';

export const processStore = reactive({
    typeIndexContainers: {} as Record<string, URL[]>,
    typeRegistrations: {} as Record<string, TypeRegistration[]>,
    processProviders: [] as string[], // Comunica can query several process sources
    processRegistrations: {} as Record<string, URL[]>, // Update the type to match the new function
    taskRegistrations: {} as Record<string, Record<string, TaskRegistration>>, // Use updated TaskRegistration type
    canProcessData() {
        return this.processProviders.length > 0;
    },
    reset() {
        this.typeIndexContainers = {};
        this.typeRegistrations = {};
        this.processProviders = [];
        this.processRegistrations = {};
        this.taskRegistrations = {};
    },
});
