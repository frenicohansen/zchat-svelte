import type { EntityTable } from 'dexie'
import type { AsPlainObject } from 'minisearch'
import Dexie from 'dexie'

interface SearchIndex {
  userId: string
  indexObj: AsPlainObject
}

const db = new Dexie('search_index') as Dexie & {
  searchIndex: EntityTable<
    SearchIndex,
    'userId'
  >
}

db.version(1).stores({
  searchIndex: '&userId',
})

export type { SearchIndex }
export { db }
