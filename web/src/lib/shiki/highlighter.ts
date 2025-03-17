import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine-javascript.mjs'

let _highlighter: HighlighterCore | null = null

export const highlighter = {
  get current() {
    if (!_highlighter) {
      throw new Error('Highlighter instance not initialized. Call initHighlighter() first')
    }
    return _highlighter
  },
  loadLanguage,
  init: initHighlighter,
  close: closeHighlighter,
}

async function initHighlighter() {
  if (!_highlighter) {
    _highlighter = await createHighlighterCore({
      langs: [],
      themes: [
        import('@shikijs/themes/github-dark'),
      ],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return _highlighter
}

function closeHighlighter() {
  if (_highlighter) {
    _highlighter.dispose()
    _highlighter = null
  }
}

async function loadLanguage(language: string, languageModule: any) {
  if (!_highlighter)
    return
  if (!_highlighter.getLoadedLanguages().includes(language)) {
    await _highlighter.loadLanguage(await languageModule())
  }
}
