import {
  findFirstAvailableNumber,
  parseNumericDocumentNumber,
} from '../src/lib/document-numbering'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`OK: ${message}`)
}

assert(parseNumericDocumentNumber('4') === 4, 'parse 4')
assert(parseNumericDocumentNumber('004') === 4, 'parse 004')
assert(parseNumericDocumentNumber('DOG-1') === null, 'non-numeric returns null')
assert(parseNumericDocumentNumber('') === null, 'empty returns null')

assert(findFirstAvailableNumber(new Set()) === 1, 'empty set → 1')
assert(findFirstAvailableNumber(new Set([1, 2, 3])) === 4, '1-3 used → 4')
assert(findFirstAvailableNumber(new Set([1, 3, 4])) === 2, 'gap at 2')
assert(findFirstAvailableNumber(new Set([2, 3, 4])) === 1, 'gap at 1 after delete')

console.log('Все проверки нумерации пройдены')
