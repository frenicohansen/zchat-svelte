import type { AsPlainObject, MatchInfo } from 'minisearch'
import { db } from '$lib/db/dexie'
import { z } from '$lib/zero'
import MiniSearch from 'minisearch'
import removeMd from 'remove-markdown'

interface MatchSegment {
  id: string
  text: string
  isMatch: boolean
  start: number
  end: number
}

type SearchFields = Record<string, string | string[]>

interface BaseSearch {
  id: string
  match: MatchInfo
}

type SearchResult<T extends SearchFields> = BaseSearch & T

type ProcessedFields<T extends SearchFields> = {
  [K in keyof T]: T[K] extends (string | string[])
    ? T[K] extends string[]
      ? MatchSegment[][]
      : MatchSegment[]
    : never
}

type ProcessedResult<T extends SearchFields> = Omit<BaseSearch, 'match'> & ProcessedFields<T>

function highlightFirstMatch(
  text: string,
  matchInfo: MatchInfo,
  fieldName: string,
  contextSize: number = 20,
): MatchSegment[] {
  const matches = Object.entries(matchInfo)
    .filter(([, fields]) => fields.includes(fieldName))
    .flatMap(([matchWord]) => findMatchPositions(text, matchWord))
    .sort((a, b) => a.start - b.start)

  if (matches.length === 0)
    return [createSegment(text, 0, text.length, false)]

  const firstMatch = matches[0]
  const start = Math.max(0, firstMatch.start - contextSize)
  const end = Math.min(text.length, firstMatch.end + contextSize)

  const segments: MatchSegment[] = []

  if (start >= 0 && start < firstMatch.start)
    segments.push(createSegment(text, start, firstMatch.start, false))

  segments.push(createSegment(text, firstMatch.start, firstMatch.end, true))

  if (end <= text.length && firstMatch.end < end)
    segments.push(createSegment(text, firstMatch.end, end, false))

  return segments
}

function processField(
  field: string | string[],
  match: MatchInfo,
  fieldName: string,
  contextSize: number,
): MatchSegment[] | MatchSegment[][] {
  return Array.isArray(field)
    ? field.map(item => highlightFirstMatch(item, match, fieldName, contextSize))
    : highlightFirstMatch(field, match, fieldName, contextSize)
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findMatchPositions(text: string, matchWord: string): { start: number, end: number }[] {
  const positions: { start: number, end: number }[] = []
  const escapedWord = escapeRegExp(matchWord)
  const regex = new RegExp(escapedWord, 'gi')
  let match: RegExpExecArray | null = regex.exec(text)

  while (match !== null) {
    positions.push({
      start: match.index,
      end: match.index + match[0].length,
    })
    match = regex.exec(text)
  }

  return positions
}

function createSegment(text: string, start: number, end: number, isMatch: boolean): MatchSegment {
  const segment = text.substring(start, end)
  return {
    id: `${segment}-${start}-${end}`,
    text: segment,
    isMatch,
    start,
    end,
  }
}

export function splitMatchedSearch<T extends SearchFields>(
  searchResult: SearchResult<T>,
  contextSize: number = 20,
): ProcessedResult<T> {
  const { id, match: matchInfo, ...fields } = searchResult

  const processedFields = Object.entries(fields).reduce((acc, [fieldName, value]) => ({
    ...acc,
    [fieldName]: processField(value as string | string[], matchInfo, fieldName, contextSize),
  }), {} as ProcessedFields<T>)

  return {
    id,
    ...processedFields,
  }
}

export function getMiniSearchOptions() {
  return {
    fields: ['title', 'allMessages'],
    storeFields: ['title', 'allMessages'],
    searchOptions: {
      boost: { title: 1.5 },
      fuzzy: true,
      prefix: true,
    },
    extractField: (document: any, fieldName: string) => {
      if (fieldName === 'allMessages') {
        const messages = document.messages
        return messages
          .map((message: any) => removeMd(message.finalText))
          .join(' ')
      }
      const value = document[fieldName as keyof typeof document]
      return value ? String(value) : ''
    },
  }
}

let saveTimeout: NodeJS.Timeout
export function scheduleSaveIndex(miniSearchJson: AsPlainObject, delay = 30000) {
  if (saveTimeout)
    clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    await db.searchIndex.put({ userId: z.current.userID, indexObj: miniSearchJson })
  }, delay)
}

export async function loadSearchIndex() {
  const data = await db.searchIndex.where('userId').equals(z.current.userID).first()
  try {
    if (data) {
      return MiniSearch.loadJSONAsync(JSON.stringify(data.indexObj), getMiniSearchOptions())
    }
    else {
      return new MiniSearch(getMiniSearchOptions())
    }
  }
  catch (error) {
    console.error('Failed to load search index:', error)
    db.searchIndex.delete(z.current.userID) // destroy the corrupted index
    return new MiniSearch(getMiniSearchOptions())
  }
}
