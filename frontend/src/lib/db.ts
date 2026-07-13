import Dexie, { type Table } from 'dexie';

export class WikiDexie extends Dexie {
  bookmarks!: Table<any, string>;
  news!: Table<any, string>;
  contributors!: Table<any, string>;
  pendingpages!: Table<any, string>;
  updatedpages!: Table<any, string>;
  meta!: Table<any, string>;

  constructor() {
    super('WikiDB');
    this.version(1).stores({
      bookmarks: 'id',
      news: 'id',
      contributors: 'id',
      pendingpages: 'id',
      updatedpages: 'id',
      meta: 'key',
    });
  }
}

export const db = new WikiDexie();
