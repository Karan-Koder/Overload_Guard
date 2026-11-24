import { createSeed } from '../data/seed';
import type { StoreState } from '../types';
export interface Store { read(): StoreState; update(change: (state: StoreState) => void): StoreState; reset(): StoreState }
export class MemoryStore implements Store {
  private state: StoreState;
  constructor(seed = createSeed()) { this.state = structuredClone(seed); }
  read() { return structuredClone(this.state); }
  update(change: (state: StoreState) => void) { const next = this.read(); change(next); this.state = next; return this.read(); }
  reset() { this.state = createSeed(); return this.read(); }
}
