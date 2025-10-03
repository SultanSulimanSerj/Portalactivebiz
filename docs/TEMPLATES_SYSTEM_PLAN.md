# План реализации системы шаблонов документов для Manexa

## 1. Текущее состояние системы

### Уже реализовано:
- ✅ Базовая модель `DocumentTemplate` в Prisma схеме
- ✅ Страница `/templates` с UI для управления шаблонами
- ✅ CRUD операции для шаблонов (создание, редактирование, удаление)
- ✅ Простая система переменных в JSON формате
- ✅ Связь шаблонов с компанией
- ✅ Скачивание шаблонов

### Текущие ограничения:
- ⚠️ Хранение только текстового содержимого (без поддержки DOCX/XLSX)
- ⚠️ Нет системы категорий и типов документов
- ⚠️ Нет автоматической генерации документов из шаблонов
- ⚠️ Нет интеграции с проектами и финансами
- ⚠️ Нет системы нумерации документов

---

## 2. Предлагаемая архитектура системы шаблонов

### 2.1. Категории шаблонов

#### **Группа 1: Коммерческие документы**
```typescript
enum CommercialDocumentType {
  CONTRACT_SUPPLY      // Договор поставки
  CONTRACT_WORK        // Договор подряда
  CONTRACT_SERVICE     // Договор услуг
  COMMERCIAL_OFFER     // Коммерческое предложение
  INVOICE              // Счет
  ACT_OF_WORK          // Акт выполненных работ (АВР)
  SPECIFICATION        // Спецификация
  TECHNICAL_TASK       // Техническое задание
}
```

#### **Группа 2: Финансовые документы**
```typescript
enum FinancialDocumentType {
  TAX_INVOICE          // Счет-фактура
  WAYBILL              // Накладная
  UPD                  // Универсальный передаточный документ
  KS2                  // Акт о приемке выполненных работ (КС-2)
  KS3                  // Справка о стоимости выполненных работ (КС-3)
  PAYMENT_ORDER        // Платежное поручение
  RECEIPT              // Квитанция
}
```

#### **Группа 3: Отчетные документы**
```typescript
enum ReportDocumentType {
  WORK_REPORT          // Отчет о выполнении работ
  PROJECT_REPORT       // Отчет по проекту
  FINANCIAL_REPORT     // Финансовый отчет
  CLIENT_PRESENTATION  // Презентация для клиента
  MONTHLY_REPORT       // Ежемесячный отчет
  QUARTERLY_REPORT     // Квартальный отчет
}
```

#### **Группа 4: HR документы**
```typescript
enum HRDocumentType {
  EMPLOYMENT_CONTRACT  // Трудовой договор
  JOB_DESCRIPTION     // Должностная инструкция
  ORDER               // Приказ
  BUSINESS_TRIP       // Отчет о командировке
  EVALUATION_SHEET    // Оценочный лист
  VACATION_ORDER      // Приказ об отпуске
  DISMISSAL_ORDER     // Приказ об увольнении
}
```

### 2.2. Обновленная схема базы данных

```prisma
model DocumentTemplate {
  id           String                @id @default(cuid())
  name         String
  description  String?
  category     DocumentCategory      // Категория документа
  type         String                // Подтип документа
  content      String                @db.Text  // HTML/Markdown содержимое
  filePath     String?               // Путь к файлу шаблона (DOCX/XLSX)
  fileType     TemplateFileType      @default(HTML)
  variables    Json?                 // Переменные шаблона
  isActive     Boolean               @default(true)
  isPublic     Boolean               @default(false)
  version      Int                   @default(1)
  
  // Настройки генерации
  autoNumber   Boolean               @default(false)  // Автоматическая нумерация
  numberFormat String?               // Формат нумерации: "DOC-{YYYY}-{###}"
  
  // Интеграция
  requiresApproval Boolean           @default(false)  // Требуется согласование
  
  createdAt    DateTime              @default(now())
  updatedAt    DateTime              @updatedAt
  
  // Relations
  companyId    String
  company      Company               @relation(fields: [companyId], references: [id])
  creatorId    String
  creator      User                  @relation("TemplateCreator", fields: [creatorId], references: [id])
  documents    Document[]
  
  @@index([companyId])
  @@index([category])
  @@index([type])
  @@index([createdAt])
}

model NumberingRule {
  id           String   @id @default(cuid())
  category     DocumentCategory
  prefix       String?                // Префикс: "DOG-", "SF-"
  format       String                 // Формат: "{PREFIX}{YYYY}-{MM}-{###}"
  lastNumber   Int      @default(0)   // Последний использованный номер
  resetPeriod  ResetPeriod @default(YEAR) // Период сброса счетчика
  
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id])
  
  @@unique([companyId, category])
}

enum DocumentCategory {
  COMMERCIAL   // Коммерческие
  FINANCIAL    // Финансовые
  REPORT       // Отчетные
  HR           // Кадровые
  TECHNICAL    // Технические
  LEGAL        // Юридические
  OTHER        // Прочие
}

enum TemplateFileType {
  HTML         // HTML шаблон
  DOCX         // Word документ
  XLSX         // Excel таблица
  PDF          // PDF (только для просмотра)
  MARKDOWN     // Markdown
}

enum ResetPeriod {
  NEVER        // Никогда не сбрасывать
  YEAR         // Каждый год
  MONTH        // Каждый месяц
  QUARTER      // Каждый квартал
}
```

---

## 3. Система переменных шаблонов

### 3.1. Базовые переменные (доступны везде)
```json
{
  "company": {
    "name": "Название компании",
    "inn": "ИНН компании",
    "kpp": "КПП компании",
    "address": "Юридический адрес",
    "phone": "Телефон",
    "email": "Email",
    "director": "ФИО директора",
    "accountant": "ФИО главного бухгалтера"
  },
  "current": {
    "date": "Текущая дата",
    "year": "Текущий год",
    "month": "Текущий месяц",
    "user": "Текущий пользователь"
  },
  "document": {
    "number": "Номер документа",
    "date": "Дата документа"
  }
}
```

### 3.2. Переменные для коммерческих документов
```json
{
  "project": {
    "id": "ID проекта",
    "name": "Название проекта",
    "code": "Код проекта",
    "budget": "Бюджет проекта",
    "startDate": "Дата начала",
    "endDate": "Дата окончания",
    "manager": "Менеджер проекта"
  },
  "client": {
    "name": "Название клиента",
    "inn": "ИНН клиента",
    "kpp": "КПП клиента",
    "address": "Адрес клиента",
    "contact": "Контактное лицо",
    "phone": "Телефон",
    "email": "Email"
  },
  "contract": {
    "number": "Номер договора",
    "date": "Дата договора",
    "amount": "Сумма договора",
    "currency": "Валюта",
    "paymentTerms": "Условия оплаты",
    "deliveryTerms": "Условия поставки"
  }
}
```

### 3.3. Переменные для финансовых документов
```json
{
  "finance": {
    "items": [
      {
        "name": "Наименование",
        "quantity": "Количество",
        "unit": "Единица измерения",
        "price": "Цена",
        "total": "Сумма",
        "vat": "НДС"
      }
    ],
    "subtotal": "Итого без НДС",
    "vat": "НДС",
    "total": "Итого с НДС",
    "totalInWords": "Сумма прописью"
  },
  "period": {
    "start": "Начало периода",
    "end": "Конец периода",
    "month": "Месяц",
    "quarter": "Квартал",
    "year": "Год"
  }
}
```

### 3.4. Переменные для HR документов
```json
{
  "employee": {
    "fullName": "ФИО полностью",
    "position": "Должность",
    "department": "Отдел",
    "salary": "Оклад",
    "hireDate": "Дата приема",
    "passportSeries": "Серия паспорта",
    "passportNumber": "Номер паспорта",
    "inn": "ИНН",
    "snils": "СНИЛС",
    "address": "Адрес регистрации"
  },
  "order": {
    "number": "Номер приказа",
    "date": "Дата приказа",
    "reason": "Основание",
    "signedBy": "Подписал"
  }
}
```

---

## 4. Технологический стек для генерации документов

### 4.1. Рекомендуемые библиотеки

#### Для DOCX (Word):
```bash
npm install docxtemplater pizzip
npm install jszip-utils
```
- **docxtemplater**: Заполнение шаблонов DOCX переменными
- **pizzip**: Работа с ZIP архивами (DOCX это ZIP)

#### Для XLSX (Excel):
```bash
npm install exceljs
```
- **exceljs**: Создание и редактирование Excel файлов

#### Для PDF:
```bash
npm install @react-pdf/renderer
# или
npm install pdfkit
```
- **@react-pdf/renderer**: Генерация PDF из React компонентов
- **pdfkit**: Низкоуровневая генерация PDF

#### Для HTML/Markdown:
```bash
npm install handlebars marked
```
- **handlebars**: Шаблонизатор для HTML
- **marked**: Конвертация Markdown в HTML

### 4.2. Пример реализации генератора документов

```typescript
// lib/document-generator.ts
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import ExcelJS from 'exceljs'
import Handlebars from 'handlebars'

export class DocumentGenerator {
  // Генерация DOCX документа
  static async generateDocx(
    templatePath: string,
    variables: Record<string, any>
  ): Promise<Buffer> {
    const content = await fs.readFile(templatePath, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })
    
    doc.render(variables)
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    })
    
    return buf
  }
  
  // Генерация XLSX документа
  static async generateXlsx(
    templatePath: string,
    variables: Record<string, any>
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    
    // Заполнение ячеек значениями
    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (typeof cell.value === 'string') {
            cell.value = this.replaceVariables(cell.value, variables)
          }
        })
      })
    })
    
    return await workbook.xlsx.writeBuffer() as Buffer
  }
  
  // Генерация HTML документа
  static generateHtml(
    template: string,
    variables: Record<string, any>
  ): string {
    const compiled = Handlebars.compile(template)
    return compiled(variables)
  }
  
  // Замена переменных вида {{variable}}
  private static replaceVariables(
    text: string,
    variables: Record<string, any>
  ): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(variables, key)
      return value !== undefined ? String(value) : match
    })
  }
  
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj)
  }
}
```

---

## 5. API Endpoints

### 5.1. Управление шаблонами

```typescript
// GET /api/templates - Получить список шаблонов
// GET /api/templates/:id - Получить конкретный шаблон
// POST /api/templates - Создать новый шаблон
// PUT /api/templates/:id - Обновить шаблон
// DELETE /api/templates/:id - Удалить шаблон
// POST /api/templates/upload - Загрузить файл шаблона (DOCX/XLSX)
```

### 5.2. Генерация документов

```typescript
// POST /api/documents/generate
{
  "templateId": "template_id",
  "projectId": "project_id",  // опционально
  "variables": {
    "client": {
      "name": "ООО Рога и Копыта",
      "inn": "1234567890"
    },
    "contract": {
      "number": "123/2025",
      "date": "2025-10-01",
      "amount": 1000000
    }
  },
  "generateNumber": true  // автоматически генерировать номер
}

// Ответ:
{
  "documentId": "doc_id",
  "number": "DOG-2025-001",
  "downloadUrl": "/api/documents/doc_id/download"
}
```

### 5.3. Автоматическая нумерация

```typescript
// GET /api/numbering/:category - Получить следующий номер
// POST /api/numbering/rules - Создать правило нумерации
// PUT /api/numbering/rules/:id - Обновить правило
```

---

## 6. Какие шаблоны нужно предоставить

### 6.1. Формат шаблонов

#### Для DOCX:
- Создайте документ в Microsoft Word или LibreOffice
- Используйте переменные в формате: `{{company.name}}`, `{{contract.number}}`
- Для таблиц используйте циклы: `{{#items}} {{name}} - {{price}} {{/items}}`
- Сохраните как `.docx`

#### Для XLSX:
- Создайте таблицу в Excel
- Используйте переменные в ячейках: `{{company.name}}`
- Формулы Excel будут работать после заполнения
- Сохраните как `.xlsx`

#### Для HTML:
- Создайте HTML файл с переменными Handlebars
- Можно использовать CSS для стилизации
- Сохраните как `.html`

### 6.2. Приоритетные шаблоны для начала

#### Коммерческие (высокий приоритет):
1. **Коммерческое предложение**
   - Формат: DOCX
   - Переменные: company, client, project, items
   
2. **Договор подряда**
   - Формат: DOCX
   - Переменные: company, client, contract, project
   
3. **Спецификация**
   - Формат: XLSX
   - Переменные: project, items, totals

#### Финансовые (высокий приоритет):
4. **Счет**
   - Формат: DOCX или XLSX
   - Переменные: company, client, finance, items
   
5. **Акт выполненных работ (АВР)**
   - Формат: DOCX
   - Переменные: company, client, project, period, items
   
6. **Счет-фактура**
   - Формат: XLSX (строгая форма)
   - Переменные: company, client, finance, items

#### Отчетные (средний приоритет):
7. **Отчет о выполнении работ**
   - Формат: DOCX
   - Переменные: project, period, tasks, results
   
8. **Презентация для клиента**
   - Формат: HTML или DOCX
   - Переменные: project, company, client, achievements

#### HR (низкий приоритет):
9. **Трудовой договор**
   - Формат: DOCX
   - Переменные: company, employee, contract
   
10. **Приказ о приеме на работу**
    - Формат: DOCX
    - Переменные: company, employee, order

### 6.3. Структура шаблона (пример)

```
📁 templates/
├── 📁 commercial/
│   ├── commercial_offer.docx
│   ├── contract_work.docx
│   └── specification.xlsx
├── 📁 financial/
│   ├── invoice.xlsx
│   ├── act_of_work.docx
│   └── tax_invoice.xlsx
├── 📁 reports/
│   ├── work_report.docx
│   └── client_presentation.html
└── 📁 hr/
    ├── employment_contract.docx
    └── order_hire.docx
```

---

## 7. План поэтапной реализации

### Этап 1: Обновление схемы БД (1-2 дня)
- [ ] Обновить модель `DocumentTemplate` в Prisma
- [ ] Добавить модель `NumberingRule`
- [ ] Добавить enum для категорий и типов
- [ ] Создать миграцию
- [ ] Обновить seed данные

### Этап 2: Библиотеки и генератор (2-3 дня)
- [ ] Установить необходимые пакеты
- [ ] Создать класс `DocumentGenerator`
- [ ] Реализовать генерацию DOCX
- [ ] Реализовать генерацию XLSX
- [ ] Реализовать генерацию HTML/PDF
- [ ] Написать тесты

### Этап 3: API endpoints (2 дня)
- [ ] Обновить `/api/templates` для новой схемы
- [ ] Добавить `/api/templates/upload` для загрузки файлов
- [ ] Создать `/api/documents/generate`
- [ ] Создать `/api/numbering` для автоматической нумерации
- [ ] Интегрировать с MinIO для хранения файлов

### Этап 4: Frontend (3-4 дня)
- [ ] Обновить страницу `/templates`
- [ ] Добавить выбор категории и типа
- [ ] Добавить загрузку файлов шаблонов
- [ ] Создать редактор переменных
- [ ] Добавить предпросмотр шаблона
- [ ] Создать форму генерации документа
- [ ] Интегрировать в проекты и финансы

### Этап 5: Интеграция и тестирование (2-3 дня)
- [ ] Интегрировать генерацию в карточку проекта
- [ ] Добавить кнопки "Создать документ" в нужные места
- [ ] Тестировать все типы шаблонов
- [ ] Проверить автоматическую нумерацию
- [ ] Провести end-to-end тесты

### Этап 6: Документация (1 день)
- [ ] Написать инструкции для пользователей
- [ ] Создать примеры шаблонов
- [ ] Описать формат переменных
- [ ] Создать видео-инструкцию (опционально)

**Общее время реализации: 11-15 рабочих дней**

---

## 8. Примеры использования

### 8.1. Создание коммерческого предложения

```typescript
// В карточке проекта
const handleCreateCommercialOffer = async () => {
  const response = await fetch('/api/documents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateId: 'commercial_offer_template_id',
      projectId: project.id,
      variables: {
        client: {
          name: project.client.name,
          inn: project.client.inn,
          address: project.client.address
        },
        project: {
          name: project.name,
          budget: project.budget,
          startDate: project.startDate,
          endDate: project.endDate
        },
        items: project.workItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.quantity * item.price
        }))
      },
      generateNumber: true
    })
  })
  
  const { documentId, downloadUrl } = await response.json()
  // Скачать или открыть документ
  window.open(downloadUrl, '_blank')
}
```

### 8.2. Автоматическое создание акта при завершении проекта

```typescript
// При изменении статуса проекта на COMPLETED
if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
  // Автоматически создать АВР
  await generateDocument({
    templateId: 'act_of_work_template_id',
    projectId: project.id,
    autoAttach: true  // Автоматически прикрепить к проекту
  })
}
```

---

## 9. Рекомендации по безопасности

1. **Валидация переменных**: Проверять все входные данные перед подстановкой
2. **Ограничение доступа**: Использовать RBAC для контроля доступа к шаблонам
3. **Защита файлов**: Хранить файлы шаблонов в MinIO с ограниченным доступом
4. **Аудит**: Логировать все генерации документов
5. **Защита от инъекций**: Экранировать специальные символы в переменных

---

## 10. Метрики успеха

После внедрения системы шаблонов должны быть достигнуты:

- ⏱️ Сокращение времени на создание документа с 30-60 минут до 2-5 минут
- 📄 Увеличение количества созданных документов на 300-500%
- ✅ Снижение ошибок в документах на 80-90%
- 🔄 Автоматизация 70-80% рутинных документов
- 👥 Улучшение UX: оценка пользователей 8+/10

---

## Вывод

Система шаблонов документов значительно улучшит производительность и качество работы с документами в Manexa. Рекомендуется начать с реализации базовых коммерческих и финансовых шаблонов, а затем постепенно расширять функционал.

После предоставления файлов шаблонов можно начать реализацию в течение 2-3 недель с полным тестированием и документацией.

