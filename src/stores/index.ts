// src/store/index.ts
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

// You can also define a root store here if needed
// import { defineStore } from 'pinia';
// export const useRootStore = defineStore('root', {
//   state: () => ({
//     // global state properties
//   }),
//   actions: {
//     // global actions
//   },
//   getters: {
//     // global getters
//   },
// });

// Re-export stores for easier access if preferred, though direct import is also fine
export * from './modules/user'
// export * from './modules/knowledge'; // Uncomment when knowledge store is created and used
