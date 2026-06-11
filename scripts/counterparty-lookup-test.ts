import assert from 'node:assert/strict'
import { getInnValidationError, isValidInnFormat, normalizeInn } from '../src/lib/counterparty/inn'
import { mapDaDataPartyToRequisites } from '../src/lib/counterparty/dadata'
import { toClientRequisitesFields, toCompanyRegistrationFields } from '../src/lib/counterparty/map-fields'

assert.equal(normalizeInn('77 07 083893'), '7707083893')
assert.equal(isValidInnFormat('7707083893'), true)
assert.equal(getInnValidationError('123'), 'ИНН должен содержать 10 цифр (юрлицо) или 12 цифр (ИП)')

const mapped = mapDaDataPartyToRequisites({
  inn: '7707083893',
  kpp: '773601001',
  ogrn: '1027700132195',
  type: 'LEGAL',
  name: {
    short_with_opf: 'ПАО СБЕРБАНК',
    full_with_opf: 'ПАО СБЕРБАНК',
  },
  address: {
    value: 'г Москва, ул Вавилова, д 19',
  },
  management: {
    name: 'Греф Герман Оскарович',
    post: 'Президент',
  },
  state: { status: 'ACTIVE' },
})

assert.equal(mapped.name, 'ПАО СБЕРБАНК')
assert.equal(mapped.directorName, 'Греф Герман Оскарович')

const companyFields = toCompanyRegistrationFields(mapped)
assert.equal(companyFields.companyName, 'ПАО СБЕРБАНК')
assert.equal(companyFields.inn, '7707083893')

const clientFields = toClientRequisitesFields(mapped)
assert.equal(clientFields.clientName, 'ПАО СБЕРБАНК')
assert.equal(clientFields.clientInn, '7707083893')

console.log('counterparty-lookup-test: OK')
