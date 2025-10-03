// Простой движок для подстановки переменных в шаблон
export function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template
  
  // Рекурсивная функция для получения вложенных значений
  const getValue = (obj: any, path: string): any => {
    const keys = path.split('.')
    let value = obj
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return ''
      }
      value = value[key]
    }
    
    return value !== null && value !== undefined ? value : ''
  }
  
  // Заменяем все переменные вида {{variable}} или {{object.property}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim()
    const value = getValue(data, trimmedKey)
    return String(value)
  })
  
  return result
}

// Получение данных для шаблона из проекта
export function getTemplateData(project: any, company: any, estimate: any) {
  const today = new Date()
  
  return {
    // Номер и дата договора
    contract: {
      number: `DOG-${Date.now()}`,
      date: today.toLocaleDateString('ru-RU'),
      day: today.getDate().toString().padStart(2, '0'),
      month: (today.getMonth() + 1).toString().padStart(2, '0'),
      year: today.getFullYear().toString()
    },
    
    // Город
    city: company?.city || 'Екатеринбург',
    
    // Исполнитель (наша компания)
    executor: {
      name: company?.name || '',
      legalName: company?.legalName || company?.name || '',
      director: company?.directorName || '',
      directorPosition: company?.directorPosition || 'Генеральный директор',
      inn: company?.inn || '',
      kpp: company?.kpp || '',
      ogrn: company?.ogrn || '',
      ogrnip: company?.ogrn || '',
      address: company?.legalAddress || company?.address || '',
      legalAddress: company?.legalAddress || '',
      actualAddress: company?.actualAddress || company?.address || '',
      phone: company?.phone || company?.contactPhone || '',
      email: company?.contactEmail || '',
      bankAccount: company?.bankAccount || '',
      bankName: company?.bankName || '',
      bankBik: company?.bankBik || '',
      correspondentAccount: company?.correspondentAccount || ''
    },
    
    // Заказчик (клиент)
    client: {
      name: project?.clientName || '',
      legalName: project?.clientLegalName || project?.clientName || '',
      director: project?.clientDirectorName || '',
      inn: project?.clientInn || '',
      kpp: project?.clientKpp || '',
      ogrn: project?.clientOgrn || '',
      address: project?.clientLegalAddress || '',
      legalAddress: project?.clientLegalAddress || '',
      actualAddress: project?.clientActualAddress || '',
      phone: project?.clientContactPhone || '',
      email: project?.clientContactEmail || '',
      bankAccount: project?.clientBankAccount || '',
      bankName: project?.clientBankName || '',
      bankBik: project?.clientBankBik || '',
      correspondentAccount: project?.clientCorrespondentAccount || ''
    },
    
    // Проект
    project: {
      name: project?.name || '',
      description: project?.description || '',
      address: project?.clientActualAddress || project?.clientLegalAddress || '',
      startDate: project?.startDate ? new Date(project.startDate).toLocaleDateString('ru-RU') : '',
      endDate: project?.endDate ? new Date(project.endDate).toLocaleDateString('ru-RU') : '',
      budget: project?.budget ? Number(project.budget).toLocaleString('ru-RU') : ''
    },
    
    // Смета
    estimate: {
      name: estimate?.name || '',
      total: estimate?.total ? Number(estimate.total).toLocaleString('ru-RU') : '',
      totalWithVat: estimate?.totalWithVat ? Number(estimate.totalWithVat).toLocaleString('ru-RU') : '',
      vatAmount: estimate?.vatAmount ? Number(estimate.vatAmount).toLocaleString('ru-RU') : '',
      vatRate: estimate?.vatRate ? Number(estimate.vatRate) : '20',
      vatEnabled: estimate?.vatEnabled ? 'включая НДС' : 'НДС не облагается согласно п. 3 ст. 346.11 гл. 26.2 НК РФ'
    }
  }
}

