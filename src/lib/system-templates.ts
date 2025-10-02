/**
 * Системные шаблоны документов
 * Встроенные шаблоны, которые доступны всем пользователям
 */

export interface SystemTemplate {
  id: string
  name: string
  description: string
  category: string
  type: string
  fileType: 'HTML' | 'DOCX' | 'XLSX' | 'PDF' | 'MARKDOWN'
  content: string
  variables: Record<string, any>
  autoNumber: boolean
  numberFormat?: string
  autoFillSources?: Record<string, string>
}

/**
 * Получить все системные шаблоны
 */
export function getAllSystemTemplates(): SystemTemplate[] {
  return [
    {
      id: 'contract-work-001',
      name: 'Договор подряда (строительно-монтажные работы)',
      description: 'Стандартный договор подряда для строительно-монтажных работ с автоматическим заполнением реквизитов',
      category: 'LEGAL',
      type: 'contract',
      fileType: 'HTML',
      content: getContractWorkTemplate(),
      variables: {
        projectName: { type: 'string', required: true, description: 'Название проекта' },
        clientName: { type: 'string', required: true, description: 'Наименование заказчика' },
        clientLegalName: { type: 'string', required: true, description: 'Юридическое наименование заказчика' },
        clientInn: { type: 'string', required: true, description: 'ИНН заказчика' },
        clientKpp: { type: 'string', required: false, description: 'КПП заказчика' },
        clientOgrn: { type: 'string', required: false, description: 'ОГРН заказчика' },
        clientLegalAddress: { type: 'string', required: true, description: 'Юридический адрес заказчика' },
        clientActualAddress: { type: 'string', required: false, description: 'Фактический адрес заказчика' },
        clientDirectorName: { type: 'string', required: true, description: 'ФИО директора заказчика' },
        clientContactPhone: { type: 'string', required: false, description: 'Контактный телефон заказчика' },
        clientContactEmail: { type: 'string', required: false, description: 'Контактный email заказчика' },
        clientBankAccount: { type: 'string', required: false, description: 'Расчетный счет заказчика' },
        clientBankName: { type: 'string', required: false, description: 'Наименование банка заказчика' },
        clientBankBik: { type: 'string', required: false, description: 'БИК банка заказчика' },
        clientCorrespondentAccount: { type: 'string', required: false, description: 'Корреспондентский счет' },
        contractorName: { type: 'string', required: true, description: 'Наименование подрядчика' },
        contractorLegalName: { type: 'string', required: true, description: 'Юридическое наименование подрядчика' },
        contractorInn: { type: 'string', required: true, description: 'ИНН подрядчика' },
        contractorKpp: { type: 'string', required: false, description: 'КПП подрядчика' },
        contractorOgrn: { type: 'string', required: false, description: 'ОГРН подрядчика' },
        contractorLegalAddress: { type: 'string', required: true, description: 'Юридический адрес подрядчика' },
        contractorActualAddress: { type: 'string', required: false, description: 'Фактический адрес подрядчика' },
        contractorDirectorName: { type: 'string', required: true, description: 'ФИО директора подрядчика' },
        contractorContactPhone: { type: 'string', required: false, description: 'Контактный телефон подрядчика' },
        contractorContactEmail: { type: 'string', required: false, description: 'Контактный email подрядчика' },
        contractorBankAccount: { type: 'string', required: false, description: 'Расчетный счет подрядчика' },
        contractorBankName: { type: 'string', required: false, description: 'Наименование банка подрядчика' },
        contractorBankBik: { type: 'string', required: false, description: 'БИК банка подрядчика' },
        contractorCorrespondentAccount: { type: 'string', required: false, description: 'Корреспондентский счет подрядчика' },
        workDescription: { type: 'string', required: true, description: 'Описание работ' },
        workLocation: { type: 'string', required: true, description: 'Место выполнения работ' },
        contractAmount: { type: 'number', required: true, description: 'Сумма договора' },
        contractStartDate: { type: 'date', required: true, description: 'Дата начала работ' },
        contractEndDate: { type: 'date', required: true, description: 'Дата окончания работ' },
        paymentTerms: { type: 'string', required: false, description: 'Условия оплаты' },
        warrantyPeriod: { type: 'string', required: false, description: 'Гарантийный период' },
        contractDate: { type: 'date', required: true, description: 'Дата заключения договора' },
        contractPlace: { type: 'string', required: true, description: 'Место заключения договора' }
      },
      autoNumber: true,
      numberFormat: 'ДП-{YYYY}-{MM}-{####}',
      autoFillSources: {
        projectName: 'project.name',
        clientName: 'project.clientName',
        clientLegalName: 'project.clientLegalName',
        clientInn: 'project.clientInn',
        clientKpp: 'project.clientKpp',
        clientOgrn: 'project.clientOgrn',
        clientLegalAddress: 'project.clientLegalAddress',
        clientActualAddress: 'project.clientActualAddress',
        clientDirectorName: 'project.clientDirectorName',
        clientContactPhone: 'project.clientContactPhone',
        clientContactEmail: 'project.clientContactEmail',
        clientBankAccount: 'project.clientBankAccount',
        clientBankName: 'project.clientBankName',
        clientBankBik: 'project.clientBankBik',
        clientCorrespondentAccount: 'project.clientCorrespondentAccount',
        contractorName: 'company.name',
        contractorLegalName: 'company.legalName',
        contractorInn: 'company.inn',
        contractorKpp: 'company.kpp',
        contractorOgrn: 'company.ogrn',
        contractorLegalAddress: 'company.legalAddress',
        contractorActualAddress: 'company.actualAddress',
        contractorDirectorName: 'company.directorName',
        contractorContactPhone: 'company.contactPhone',
        contractorContactEmail: 'company.contactEmail',
        contractorBankAccount: 'company.bankAccount',
        contractorBankName: 'company.bankName',
        contractorBankBik: 'company.bankBik',
        contractorCorrespondentAccount: 'company.correspondentAccount'
      }
    }
  ]
}

/**
 * Получить системные шаблоны по категории
 */
export function getSystemTemplatesByCategory(category: string): SystemTemplate[] {
  return getAllSystemTemplates().filter(template => template.category === category)
}

/**
 * Получить системный шаблон по ID
 */
export function getSystemTemplateById(id: string): SystemTemplate | null {
  return getAllSystemTemplates().find(template => template.id === id) || null
}

/**
 * Шаблон договора подряда
 */
function getContractWorkTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Договор подряда</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
        }
        .parties {
            margin-bottom: 20px;
        }
        .party {
            margin-bottom: 15px;
        }
        .party-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .content {
            margin-bottom: 20px;
        }
        .clause {
            margin-bottom: 15px;
        }
        .clause-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-block {
            width: 45%;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            height: 20px;
        }
        .signature-label {
            font-size: 12px;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        td {
            padding: 5px;
            border: 1px solid #000;
            vertical-align: top;
        }
        .amount {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Договор подряда № {{contractNumber}}</div>
        <div>г. {{contractPlace}}, {{contractDate}}</div>
    </div>

    <div class="parties">
        <div class="party">
            <div class="party-title">ЗАКАЗЧИК:</div>
            <div>{{clientLegalName}}</div>
            <div>ИНН: {{clientInn}}{{#if clientKpp}}, КПП: {{clientKpp}}{{/if}}</div>
            <div>ОГРН: {{clientOgrn}}</div>
            <div>Юридический адрес: {{clientLegalAddress}}</div>
            {{#if clientActualAddress}}<div>Фактический адрес: {{clientActualAddress}}</div>{{/if}}
            <div>Директор: {{clientDirectorName}}</div>
            {{#if clientContactPhone}}<div>Телефон: {{clientContactPhone}}</div>{{/if}}
            {{#if clientContactEmail}}<div>Email: {{clientContactEmail}}</div>{{/if}}
            {{#if clientBankAccount}}
            <div>Банковские реквизиты:</div>
            <div>Р/с: {{clientBankAccount}}</div>
            <div>Банк: {{clientBankName}}</div>
            <div>БИК: {{clientBankBik}}</div>
            {{#if clientCorrespondentAccount}}<div>К/с: {{clientCorrespondentAccount}}</div>{{/if}}
            {{/if}}
        </div>

        <div class="party">
            <div class="party-title">ПОДРЯДЧИК:</div>
            <div>{{contractorLegalName}}</div>
            <div>ИНН: {{contractorInn}}{{#if contractorKpp}}, КПП: {{contractorKpp}}{{/if}}</div>
            <div>ОГРН: {{contractorOgrn}}</div>
            <div>Юридический адрес: {{contractorLegalAddress}}</div>
            {{#if contractorActualAddress}}<div>Фактический адрес: {{contractorActualAddress}}</div>{{/if}}
            <div>Директор: {{contractorDirectorName}}</div>
            {{#if contractorContactPhone}}<div>Телефон: {{contractorContactPhone}}</div>{{/if}}
            {{#if contractorContactEmail}}<div>Email: {{contractorContactEmail}}</div>{{/if}}
            {{#if contractorBankAccount}}
            <div>Банковские реквизиты:</div>
            <div>Р/с: {{contractorBankAccount}}</div>
            <div>Банк: {{contractorBankName}}</div>
            <div>БИК: {{contractorBankBik}}</div>
            {{#if contractorCorrespondentAccount}}<div>К/с: {{contractorCorrespondentAccount}}</div>{{/if}}
            {{/if}}
        </div>
    </div>

    <div class="content">
        <div class="clause">
            <div class="clause-title">1. ПРЕДМЕТ ДОГОВОРА</div>
            <div>1.1. Заказчик поручает, а Подрядчик принимает на себя обязательство выполнить следующие работы: {{workDescription}}</div>
            <div>1.2. Место выполнения работ: {{workLocation}}</div>
            <div>1.3. Сроки выполнения работ: с {{contractStartDate}} по {{contractEndDate}}</div>
        </div>

        <div class="clause">
            <div class="clause-title">2. СТОИМОСТЬ РАБОТ И ПОРЯДОК РАСЧЕТОВ</div>
            <div>2.1. Общая стоимость работ по настоящему договору составляет: <span class="amount">{{contractAmount}} рублей</span></div>
            {{#if paymentTerms}}
            <div>2.2. Условия оплаты: {{paymentTerms}}</div>
            {{else}}
            <div>2.2. Оплата производится в течение 5 банковских дней после подписания акта выполненных работ.</div>
            {{/if}}
        </div>

        <div class="clause">
            <div class="clause-title">3. ОБЯЗАННОСТИ СТОРОН</div>
            <div>3.1. Подрядчик обязуется:</div>
            <div>- Выполнить работы в полном объеме и в установленные сроки</div>
            <div>- Обеспечить качество выполняемых работ</div>
            <div>- Соблюдать требования техники безопасности</div>
            <div>- Предоставить необходимые материалы и оборудование</div>
            
            <div>3.2. Заказчик обязуется:</div>
            <div>- Обеспечить доступ к месту выполнения работ</div>
            <div>- Произвести оплату в установленные сроки</div>
            <div>- Принять выполненные работы</div>
        </div>

        <div class="clause">
            <div class="clause-title">4. КАЧЕСТВО РАБОТ</div>
            <div>4.1. Качество выполненных работ должно соответствовать требованиям технических регламентов и стандартов.</div>
            {{#if warrantyPeriod}}
            <div>4.2. Гарантийный срок на выполненные работы составляет: {{warrantyPeriod}}</div>
            {{else}}
            <div>4.2. Гарантийный срок на выполненные работы составляет 12 месяцев с момента подписания акта выполненных работ.</div>
            {{/if}}
        </div>

        <div class="clause">
            <div class="clause-title">5. ОТВЕТСТВЕННОСТЬ СТОРОН</div>
            <div>5.1. За нарушение сроков выполнения работ Подрядчик уплачивает Заказчику пеню в размере 0,1% от стоимости договора за каждый день просрочки.</div>
            <div>5.2. За нарушение сроков оплаты Заказчик уплачивает Подрядчику пеню в размере 0,1% от суммы задолженности за каждый день просрочки.</div>
        </div>

        <div class="clause">
            <div class="clause-title">6. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</div>
            <div>6.1. Настоящий договор вступает в силу с момента подписания и действует до полного исполнения сторонами своих обязательств.</div>
            <div>6.2. Все споры решаются путем переговоров, а при недостижении согласия - в судебном порядке.</div>
            <div>6.3. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой стороны.</div>
        </div>
    </div>

    <div class="signatures">
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">ЗАКАЗЧИК</div>
            <div class="signature-label">{{clientDirectorName}}</div>
        </div>
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">ПОДРЯДЧИК</div>
            <div class="signature-label">{{contractorDirectorName}}</div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

