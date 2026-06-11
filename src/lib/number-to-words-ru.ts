const onesMale = [
  '',
  'один',
  'два',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
  'десять',
  'одиннадцать',
  'двенадцать',
  'тринадцать',
  'четырнадцать',
  'пятнадцать',
  'шестнадцать',
  'семнадцать',
  'восемнадцать',
  'девятнадцать',
]
const onesFemale = [
  '',
  'одна',
  'две',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
  'десять',
  'одиннадцать',
  'двенадцать',
  'тринадцать',
  'четырнадцать',
  'пятнадцать',
  'шестнадцать',
  'семнадцать',
  'восемнадцать',
  'девятнадцать',
]
const tens = [
  '',
  '',
  'двадцать',
  'тридцать',
  'сорок',
  'пятьдесят',
  'шестьдесят',
  'семьдесят',
  'восемьдесят',
  'девяносто',
]
const hundreds = [
  '',
  'сто',
  'двести',
  'триста',
  'четыреста',
  'пятьсот',
  'шестьсот',
  'семьсот',
  'восемьсот',
  'девятьсот',
]

function pluralForm(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

function triadToWords(n: number, female: boolean): string {
  if (n === 0) return ''
  const h = Math.floor(n / 100)
  const t = Math.floor((n % 100) / 10)
  const o = n % 10
  const parts: string[] = []
  if (h > 0) parts.push(hundreds[h])
  const lastTwo = n % 100
  if (lastTwo > 0 && lastTwo < 20) {
    parts.push((female ? onesFemale : onesMale)[lastTwo])
  } else {
    if (t > 0) parts.push(tens[t])
    if (o > 0) parts.push((female ? onesFemale : onesMale)[o])
  }
  return parts.join(' ')
}

function numberToWordsInt(n: number, female = false): string {
  if (n === 0) return 'ноль'
  const parts: string[] = []
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000

  if (millions > 0) {
    parts.push(triadToWords(millions, false))
    parts.push(pluralForm(millions, 'миллион', 'миллиона', 'миллионов'))
  }
  if (thousands > 0) {
    parts.push(triadToWords(thousands, true))
    parts.push(pluralForm(thousands, 'тысяча', 'тысячи', 'тысяч'))
  }
  if (rest > 0) {
    parts.push(triadToWords(rest, female))
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function capitalizeFirst(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** 24980.5 → «Двадцать четыре тысячи девятьсот восемьдесят рублей 50 копеек» */
export function rublesToWords(amount: number): string {
  const rubles = Math.floor(Math.abs(amount))
  const kopecks = Math.round((Math.abs(amount) - rubles) * 100)
  const rublesText = numberToWordsInt(rubles, false)
  const rubWord = pluralForm(rubles, 'рубль', 'рубля', 'рублей')
  const kopWord = pluralForm(kopecks, 'копейка', 'копейки', 'копеек')
  return capitalizeFirst(
    `${rublesText} ${rubWord} ${String(kopecks).padStart(2, '0')} ${kopWord}`
  )
}

/** Краткая подпись: «Иванов Иван Иванович» → «Иванов И.И.» */
export function directorShortName(fullName?: string | null): string {
  if (!fullName?.trim()) return ''
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  const surname = parts[0]
  const initials = parts
    .slice(1)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join('')
  return `${surname} ${initials}`
}
