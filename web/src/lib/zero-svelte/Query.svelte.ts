import type {
  Query as QueryDef,
  ReadonlyJSONValue,
  Schema,
  TTL,
  TypedView,
} from '@rocicorp/zero'
import type { AdvancedQuery, HumanReadable } from '@rocicorp/zero/advanced'
import type { Immutable } from './types'
import type { Z } from './Z.svelte'
import { getContext } from 'svelte'
import { createSubscriber } from 'svelte/reactivity'
import { deepClone } from './deep-clone'

export type ResultType = 'unknown' | 'complete'

export interface QueryResultDetails {
  type: ResultType
}

export type QueryResult<TReturn> = readonly [HumanReadable<TReturn>, QueryResultDetails]

const emptyArray: unknown[] = []
const defaultSnapshots = {
  singular: [undefined, { type: 'unknown' }] as const,
  plural: [emptyArray, { type: 'unknown' }] as const,
}

function getDefaultSnapshot<TReturn>(singular: boolean): QueryResult<TReturn> {
  return (singular ? defaultSnapshots.singular : defaultSnapshots.plural) as QueryResult<TReturn>
}

class ViewWrapper<
  TSchema extends Schema,
  TTable extends keyof TSchema['tables'] & string,
  TReturn,
> {
  #view: TypedView<HumanReadable<TReturn>> | undefined
  #snapshot: QueryResult<TReturn>
  #subscribe: () => void

  constructor(
    private query: AdvancedQuery<TSchema, TTable, TReturn>,
    private ttl: TTL,
    private onMaterialized: (view: ViewWrapper<TSchema, TTable, TReturn>) => void,
    private onDematerialized: () => void,
  ) {
    this.#snapshot = getDefaultSnapshot(query.format.singular)

    // Create a subscriber that manages view lifecycle
    this.#subscribe = createSubscriber((update) => {
      this.#materializeIfNeeded()

      if (this.#view) {
        // Pass the update function to onData so it can notify Svelte of changes
        this.#view.addListener((snap, resultType) => this.#onData(snap, resultType, update))
      }

      // Return cleanup function that will only be called
      // when all effects are destroyed
      return () => {
        this.#view?.destroy()
        this.#view = undefined
        this.onDematerialized()
      }
    })
  }

  #onData = (
    snap: Immutable<HumanReadable<TReturn>>,
    resultType: ResultType,
    update: () => void,
  ) => {
    const data = snap === undefined ? snap : (deepClone(snap as ReadonlyJSONValue) as HumanReadable<TReturn>)
    this.#snapshot = [data, { type: resultType }] as QueryResult<TReturn>
    update() // Notify Svelte that the data has changed
  }

  #materializeIfNeeded() {
    if (!this.#view) {
      this.#view = this.query.materialize(this.ttl)
      this.onMaterialized(this)
    }
  }

  // Used in Svelte components
  get current(): QueryResult<TReturn> {
    // This triggers the subscription tracking
    this.#subscribe()
    return this.#snapshot
  }

  updateTTL(ttl: TTL): void {
    this.ttl = ttl
    this.query.updateTTL(ttl)
  }
}

class ViewStore {
  #views = new Map<string, ViewWrapper<any, any, any>>()

  getView<TSchema extends Schema, TTable extends keyof TSchema['tables'] & string, TReturn>(
    clientID: string,
    query: AdvancedQuery<TSchema, TTable, TReturn>,
    enabled: boolean = true,
    ttl: TTL,
  ): ViewWrapper<TSchema, TTable, TReturn> {
    if (!enabled) {
      return new ViewWrapper(
        query,
        ttl,
        () => {},
        () => {},
      )
    }

    const hash = query.hash() + clientID
    let existing = this.#views.get(hash)

    if (!existing) {
      existing = new ViewWrapper(
        query,
        ttl,
        (view) => {
          const lastView = this.#views.get(hash)
          if (lastView && lastView !== view) {
            throw new Error('View already exists')
          }
          this.#views.set(hash, view)
        },
        () => this.#views.delete(hash),
      )
      this.#views.set(hash, existing)
    }
    else {
      existing.updateTTL(ttl)
    }

    return existing
  }
}

export const viewStore = new ViewStore()

export interface QueryOptions {
  enabled?: boolean | undefined
  /**
   * Time to live (TTL) in seconds. Controls how long query results are cached
   * after the query is removed. During this time, Zero continues to sync the query.
   * Default is 10 seconds.
   */
  ttl?: TTL | undefined
}

export class Query<
  TSchema extends Schema,
  TTable extends keyof TSchema['tables'] & string,
  TReturn,
> {
  current = $state<HumanReadable<TReturn>>(null!)
  details = $state<QueryResultDetails>(null!)
  #query_impl: AdvancedQuery<TSchema, TTable, TReturn>

  constructor(query: MaybeGetter<QueryDef<TSchema, TTable, TReturn>>, options?: QueryOptions) {
    const z = getContext('z') as Z<Schema>
    const id = z?.current?.userID ? z?.current.userID : 'anon'
    this.#query_impl = (typeof query === 'function' ? query() : query) as AdvancedQuery<TSchema, TTable, TReturn>
    const default_snapshot = getDefaultSnapshot(this.#query_impl.format.singular)
    this.current = default_snapshot[0] as HumanReadable<TReturn>
    this.details = default_snapshot[1]

    const enabled = options?.enabled ?? true
    const ttl = options?.ttl ?? 'none'
    const view = viewStore.getView(id, this.#query_impl, enabled, ttl)
    this.current = view.current[0]
    this.details = view.current[1]
    $effect(() => {
      this.current = view.current[0]
      this.details = view.current[1]
    })
  }
}
