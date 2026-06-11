/** Нормализует ИНН: только цифры. */
export function normalizeInn(value: string): string {
  return value.replace(/\D/g, '')
}

function validateInn10(inn: string): boolean {
  const coeffs = [2, 4, 10, 3, 5, 9, 4, 6, 8]
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number(inn[i]) * coeffs[i]
  }
  const check = (sum % 11) % 10
  return check === Number(inn[9])
}

function validateInn12(inn: string): boolean {
  const coeffs11 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
  const coeffs12 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]

  let sum11 = 0
  for (let i = 0; i < 10; i++) {
    sum11 += Number(inn[i]) * coeffs11[i]
  }
  const check11 = (sum11 % 11) % 10
  if (check11 !== Number(inn[10])) return false

  let sum12 = 0
  for (let i = 0; i < 11; i++) {
    sum12 += Number(inn[i]) * coeffs12[i]
  }
  const check12 = (sum12 % 11) % 10
  return check12 === Number(inn[11])
}

export function isValidInnFormat(inn: string): boolean {
  if (!/^\d{10}$/.test(inn) && !/^\d{12}$/.test(inn)) {
    return false
  }
  if (inn.length === 10) return validateInn10(inn)
  return validateInn12(inn)
}

export function getInnValidationError(inn: string): string | null {
  const normalized = normalizeInn(inn)
  if (!normalized) return 'Введите ИНН'
  if (!/^\d{10}$|^\d{12}$/.test(normalized)) {
    return 'ИНН должен содержать 10 цифр (юрлицо) или 12 цифр (ИП)'
  }
  if (!isValidInnFormat(normalized)) {
    return 'Некорректный ИНН (ошибка контрольной суммы)'
  }
  return null
}
