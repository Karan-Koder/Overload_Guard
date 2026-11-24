import type { Store } from './memory';
export const TABLES = {
  items: 'og_items',
  suggestions: 'og_suggestions',
  audit: 'og_audit',
} as const;
// A future async store interface will be required for DynamoDB network I/O.
// Deliberately fail explicitly instead of silently claiming persistent storage.
export class DynamoDbStore implements Store {
  read(): never {
    throw new Error('DynamoDB is a Phase B scaffold. Use STORE=memory.');
  }
  update(): never {
    throw new Error('DynamoDB is a Phase B scaffold. Use STORE=memory.');
  }
  reset(): never {
    throw new Error('DynamoDB is a Phase B scaffold. Use STORE=memory.');
  }
}
