/** Demo records remain available in inventory, but are opt-in in operational counts. */
export function operationalInventory<T extends { demo?: boolean }>(records: T[], includeDemo = false): T[] {
  return includeDemo ? records : records.filter(record => record.demo !== true);
}
