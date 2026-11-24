import { MemoryStore } from './memory';
const globalStore = globalThis as typeof globalThis & { overloadGuardStore?: MemoryStore };
export const store = (globalStore.overloadGuardStore ??= new MemoryStore());
export type { Store } from './memory';
