# Дорожная карта реализации системы шаблонов документов

## ✅ ТЕКУЩИЙ ПРОГРЕСС (01.10.2025)

### Завершенные этапы:

**✅ Этап 1: Обновление базы данных (100%)**
- Обновлена модель `DocumentTemplate` с поддержкой категорий, типов файлов, автонумерации
- Создана модель `NumberingRule` для автоматической нумерации документов
- Добавлены enum'ы: `DocumentCategory`, `TemplateFileType`, `ResetPeriod`
- Обновлена модель `Document` с полем `generatedFrom` и связью с шаблонами
- Миграция успешно применена, seed данные обновлены

**✅ Этап 2: Установка библиотек (100%)**
- Установлены: `docxtemplater`, `pizzip`, `exceljs`, `handlebars`
- Библиотеки готовы к использованию

**✅ Этап 3: Создание утилит (100%)**
- Создан `DocumentGenerator` - генерация документов из HTML, Markdown, DOCX
- Создан `DocumentNumbering` - автоматическая нумерация документов
- Реализована валидация данных и форматирование
- Добавлены Handlebars helpers (formatDate, formatCurrency и др.)

**✅ Этап 4: API endpoints (100%)**
- `GET/POST /api/templates` - список и создание шаблонов
- `GET/PUT/DELETE /api/templates/[id]` - работа с конкретным шаблоном
- `POST /api/templates/[id]/generate` - генерация документа из шаблона
- `GET/POST /api/numbering-rules` - управление правилами нумерации

### В разработке:

**⏳ Этап 5-10: Фронтенд и интеграции (0%)**
- Ожидают реализации после предоставления шаблонов пользователем

---

## Обзор

Данный документ содержит пошаговый план устранения текущих ограничений системы шаблонов и превращения ее в полнофункциональное решение для автоматизации документооборота.

---

## Текущие ограничения (что нужно устранить)

### 🔴 Критические ограничения:
1. **Хранение только текстового содержимого** - нет поддержки DOCX/XLSX
2. **Нет автоматической генерации документов** - шаблоны нельзя заполнить данными
3. **Нет интеграции с проектами и финансами** - шаблоны изолированы от основной системы

### 🟡 Важные ограничения:
4. **Нет системы категорий и типов документов** - плохая навигация
5. **Нет системы нумерации документов** - нет автоматического присвоения номеров

---

## План реализации

### 📋 Этап 1: Расширение базы данных (1-2 дня)

#### Задача 1.1: Обновление модели DocumentTemplate
```prisma
model DocumentTemplate {
  id           String                @id @default(cuid())
  name         String
  description  String?
  
  // НОВОЕ: Категоризация
  category     DocumentCategory      
  type         String                // Подтип документа
  
  // НОВОЕ: Поддержка разных форматов
  content      String                @db.Text  // HTML/Markdown содержимое
  filePath     String?               // Путь к файлу шаблона (DOCX/XLSX) в MinIO
  fileType     TemplateFileType      @default(HTML)
  
  variables    Json?                 // Переменные шаблона
  isActive     Boolean               @default(true)
  isPublic     Boolean               @default(false)
  version      Int                   @default(1)
  
  // НОВОЕ: Настройки генерации
  autoNumber   Boolean               @default(false)  // Автоматическая нумерация
  numberFormat String?               // Формат: "DOC-{YYYY}-{###}"
  
  // НОВОЕ: Интеграция
  requiresApproval Boolean           @default(false)
  
  createdAt    DateTime              @default(now())
  updatedAt    DateTime              @updatedAt
  
  companyId    String
  company      Company               @relation(fields: [companyId], references: [id])
  creatorId    String?
  creator      User?                 @relation("TemplateCreator", fields: [creatorId], references: [id])
  documents    Document[]
  
  @@index([companyId])
  @@index([category])
  @@index([type])
  @@index([createdAt])
}
```

#### Задача 1.2: Новая модель для автонумерации
```prisma
model NumberingRule {
  id           String          @id @default(cuid())
  category     DocumentCategory
  prefix       String?         // Префикс: "DOG-", "SF-"
  format       String          // Формат: "{PREFIX}{YYYY}-{MM}-{###}"
  lastNumber   Int             @default(0)
  resetPeriod  ResetPeriod     @default(YEAR)
  
  companyId    String
  company      Company         @relation(fields: [companyId], references: [id])
  
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  @@unique([companyId, category])
  @@index([companyId])
}

enum DocumentCategory {
  COMMERCIAL   // Коммерческие (договоры, КП)
  FINANCIAL    // Финансовые (счета, АВР, КС-2)
  REPORT       // Отчетные (отчеты, презентации)
  HR           // Кадровые (трудовые договоры, приказы)
  TECHNICAL    // Технические (ТЗ, спецификации)
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
  YEAR         // Каждый год (01.01)
  MONTH        // Каждый месяц (01.XX)
  QUARTER      // Каждый квартал
}
```

#### Задача 1.3: Обновление модели Document
```prisma
model Document {
  id              String            @id @default(cuid())
  title           String
  description     String?
  
  // НОВОЕ: Связь с категорией
  category        DocumentCategory?
  
  // Существующие поля
  fileName        String
  filePath        String
  fileSize        Int
  mimeType        String
  documentNumber  String?
  isLatest        Boolean           @default(true)
  
  // НОВОЕ: Переменные, использованные при генерации
  generatedFrom   Json?             // Сохраненные переменные
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  projectId       String?
  project         Project?          @relation(fields: [projectId], references: [id])
  creatorId       String
  creator         User              @relation("DocumentCreator", fields: [creatorId], references: [id])
  templateId      String?
  template        DocumentTemplate? @relation(fields: [templateId], references: [id])
  versions        DocumentVersion[]
  approvals       Approval[]
  
  @@index([projectId])
  @@index([creatorId])
  @@index([createdAt])
  @@index([category])
  @@index([documentNumber])
}
```

**Действия:**
- [ ] Обновить `prisma/schema.prisma`
- [ ] Создать миграцию: `npx prisma migrate dev --name add_template_categories_and_numbering`
- [ ] Обновить Prisma Client: `npx prisma generate`

---

### 📦 Этап 2: Установка библиотек (30 минут)

#### Задача 2.1: Установить пакеты для работы с документами

```bash
# Для DOCX (Word)
npm install docxtemplater pizzip

# Для XLSX (Excel)
npm install exceljs

# Для HTML шаблонов
npm install handlebars

# Для преобразования чисел в слова (сумма прописью)
npm install number-to-words-ru
```

**Действия:**
- [ ] Установить пакеты
- [ ] Проверить совместимость версий
- [ ] Обновить `package.json`

---

### 🔧 Этап 3: Создание генератора документов (2-3 дня)

#### Задача 3.1: Создать класс DocumentGenerator

**Файл:** `src/lib/document-generator.ts`

```typescript
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import ExcelJS from 'exceljs'
import Handlebars from 'handlebars'
import { promises as fs } from 'fs'
import path from 'path'
import { storage } from './storage'

export interface DocumentVariables {
  company?: {
    name: string
    inn?: string
    kpp?: string
    address?: string
    phone?: string
    email?: string
    director?: string
  }
  client?: {
    name: string
    inn?: string
    kpp?: string
    address?: string
    contact?: string
    phone?: string
    email?: string
  }
  project?: {
    id: string
    name: string
    code?: string
    budget?: number
    startDate?: Date
    endDate?: Date
    manager?: string
  }
  contract?: {
    number: string
    date: Date
    amount: number
    currency?: string
  }
  finance?: {
    items: Array<{
      name: string
      quantity: number
      unit: string
      price: number
      total: number
      vat?: number
    }>
    subtotal: number
    vat: number
    total: number
    totalInWords?: string
  }
  current?: {
    date: Date
    year: number
    month: number
    user: string
  }
  document?: {
    number: string
    date: Date
  }
  [key: string]: any
}

export class DocumentGenerator {
  /**
   * Генерация DOCX документа из шаблона
   */
  static async generateDocx(
    templatePath: string,
    variables: DocumentVariables
  ): Promise<Buffer> {
    try {
      // Скачиваем шаблон из MinIO
      const content = await storage.getFile(templatePath)
      
      const zip = new PizZip(content)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      })
      
      // Подготавливаем переменные
      const preparedVars = this.prepareVariables(variables)
      
      // Заполняем шаблон
      doc.render(preparedVars)
      
      // Генерируем итоговый файл
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      })
      
      return buffer
    } catch (error) {
      console.error('Error generating DOCX:', error)
      throw new Error(`Ошибка генерации DOCX: ${error.message}`)
    }
  }
  
  /**
   * Генерация XLSX документа из шаблона
   */
  static async generateXlsx(
    templatePath: string,
    variables: DocumentVariables
  ): Promise<Buffer> {
    try {
      // Скачиваем шаблон из MinIO
      const content = await storage.getFile(templatePath)
      
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(content)
      
      // Подготавливаем переменные
      const preparedVars = this.prepareVariables(variables)
      
      // Заполняем ячейки
      workbook.eachSheet((worksheet) => {
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            if (typeof cell.value === 'string') {
              cell.value = this.replaceVariables(cell.value, preparedVars)
            }
          })
        })
      })
      
      const buffer = await workbook.xlsx.writeBuffer()
      return buffer as Buffer
    } catch (error) {
      console.error('Error generating XLSX:', error)
      throw new Error(`Ошибка генерации XLSX: ${error.message}`)
    }
  }
  
  /**
   * Генерация HTML документа из шаблона
   */
  static generateHtml(
    template: string,
    variables: DocumentVariables
  ): string {
    try {
      // Подготавливаем переменные
      const preparedVars = this.prepareVariables(variables)
      
      // Компилируем шаблон
      const compiled = Handlebars.compile(template)
      return compiled(preparedVars)
    } catch (error) {
      console.error('Error generating HTML:', error)
      throw new Error(`Ошибка генерации HTML: ${error.message}`)
    }
  }
  
  /**
   * Подготовка переменных: форматирование дат, чисел и т.д.
   */
  private static prepareVariables(variables: DocumentVariables): Record<string, any> {
    const prepared = { ...variables }
    
    // Форматируем даты
    if (prepared.contract?.date) {
      prepared.contract.dateFormatted = this.formatDate(prepared.contract.date)
    }
    if (prepared.project?.startDate) {
      prepared.project.startDateFormatted = this.formatDate(prepared.project.startDate)
    }
    if (prepared.project?.endDate) {
      prepared.project.endDateFormatted = this.formatDate(prepared.project.endDate)
    }
    if (prepared.current?.date) {
      prepared.current.dateFormatted = this.formatDate(prepared.current.date)
    }
    if (prepared.document?.date) {
      prepared.document.dateFormatted = this.formatDate(prepared.document.date)
    }
    
    // Форматируем числа
    if (prepared.contract?.amount) {
      prepared.contract.amountFormatted = this.formatNumber(prepared.contract.amount)
    }
    if (prepared.project?.budget) {
      prepared.project.budgetFormatted = this.formatNumber(prepared.project.budget)
    }
    if (prepared.finance) {
      if (prepared.finance.subtotal) {
        prepared.finance.subtotalFormatted = this.formatNumber(prepared.finance.subtotal)
      }
      if (prepared.finance.total) {
        prepared.finance.totalFormatted = this.formatNumber(prepared.finance.total)
      }
      if (prepared.finance.vat) {
        prepared.finance.vatFormatted = this.formatNumber(prepared.finance.vat)
      }
    }
    
    return prepared
  }
  
  /**
   * Замена переменных вида {{variable.field}}
   */
  private static replaceVariables(
    text: string,
    variables: Record<string, any>
  ): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(variables, key)
      return value !== undefined ? String(value) : match
    })
  }
  
  /**
   * Получение вложенного значения по пути (company.name)
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj)
  }
  
  /**
   * Форматирование даты в русский формат
   */
  private static formatDate(date: Date): string {
    const d = new Date(date)
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
  
  /**
   * Форматирование числа с разделителями
   */
  private static formatNumber(num: number): string {
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
}
```

**Действия:**
- [ ] Создать `src/lib/document-generator.ts`
- [ ] Реализовать методы генерации DOCX, XLSX, HTML
- [ ] Добавить обработку ошибок
- [ ] Написать unit-тесты

#### Задача 3.2: Создать систему автонумерации

**Файл:** `src/lib/document-numbering.ts`

```typescript
import { prisma } from './prisma'
import { DocumentCategory, ResetPeriod } from '@prisma/client'

export class DocumentNumbering {
  /**
   * Получить следующий номер документа
   */
  static async getNextNumber(
    companyId: string,
    category: DocumentCategory
  ): Promise<string> {
    // Получаем правило нумерации
    let rule = await prisma.numberingRule.findUnique({
      where: {
        companyId_category: {
          companyId,
          category
        }
      }
    })
    
    // Если правила нет, создаем дефолтное
    if (!rule) {
      rule = await prisma.numberingRule.create({
        data: {
          companyId,
          category,
          format: this.getDefaultFormat(category),
          lastNumber: 0,
          resetPeriod: 'YEAR'
        }
      })
    }
    
    // Проверяем, нужно ли сбросить счетчик
    const shouldReset = this.shouldResetCounter(rule.updatedAt, rule.resetPeriod)
    const nextNumber = shouldReset ? 1 : rule.lastNumber + 1
    
    // Обновляем счетчик
    await prisma.numberingRule.update({
      where: { id: rule.id },
      data: { lastNumber: nextNumber }
    })
    
    // Генерируем номер по формату
    return this.formatNumber(rule.format, nextNumber, rule.prefix)
  }
  
  /**
   * Проверка, нужно ли сбросить счетчик
   */
  private static shouldResetCounter(lastUpdate: Date, period: ResetPeriod): boolean {
    const now = new Date()
    const last = new Date(lastUpdate)
    
    switch (period) {
      case 'NEVER':
        return false
      case 'YEAR':
        return now.getFullYear() > last.getFullYear()
      case 'MONTH':
        return now.getFullYear() > last.getFullYear() || 
               now.getMonth() > last.getMonth()
      case 'QUARTER':
        return Math.floor(now.getMonth() / 3) > Math.floor(last.getMonth() / 3) ||
               now.getFullYear() > last.getFullYear()
      default:
        return false
    }
  }
  
  /**
   * Форматирование номера по шаблону
   * Пример: "{PREFIX}{YYYY}-{MM}-{###}" -> "DOG-2025-10-001"
   */
  private static formatNumber(
    format: string,
    number: number,
    prefix?: string
  ): string {
    const now = new Date()
    
    let result = format
      .replace('{PREFIX}', prefix || '')
      .replace('{YYYY}', now.getFullYear().toString())
      .replace('{YY}', now.getFullYear().toString().slice(-2))
      .replace('{MM}', (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace('{DD}', now.getDate().toString().padStart(2, '0'))
    
    // Заменяем ### на номер с нужным количеством нулей
    const match = result.match(/\{(#+)\}/)
    if (match) {
      const digits = match[1].length
      result = result.replace(match[0], number.toString().padStart(digits, '0'))
    }
    
    return result
  }
  
  /**
   * Получить формат по умолчанию для категории
   */
  private static getDefaultFormat(category: DocumentCategory): string {
    const formats: Record<DocumentCategory, string> = {
      COMMERCIAL: '{PREFIX}{YYYY}-{###}',
      FINANCIAL: 'СФ-{YYYY}-{###}',
      REPORT: 'ОТ-{YYYY}-{MM}-{###}',
      HR: 'ПР-{YYYY}-{###}',
      TECHNICAL: 'ТЗ-{YYYY}-{###}',
      LEGAL: 'ЮР-{YYYY}-{###}',
      OTHER: 'ДОК-{YYYY}-{###}'
    }
    
    return formats[category]
  }
}
```

**Действия:**
- [ ] Создать `src/lib/document-numbering.ts`
- [ ] Реализовать логику автонумерации
- [ ] Добавить поддержку разных форматов
- [ ] Написать unit-тесты

---

### 🌐 Этап 4: API Endpoints (2-3 дня)

#### Задача 4.1: Обновить API шаблонов

**Файл:** `src/app/api/templates/route.ts`

Добавить поддержку:
- Фильтрации по категории и типу
- Загрузки файлов шаблонов (DOCX/XLSX)
- Возврата списка переменных шаблона

#### Задача 4.2: Создать API генерации документов

**Файл:** `src/app/api/documents/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { DocumentGenerator } from '@/lib/document-generator'
import { DocumentNumbering } from '@/lib/document-numbering'
import { prisma } from '@/lib/prisma'
import { storage } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateDocuments')
    
    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { templateId, projectId, variables, generateNumber } = body

    // Получаем шаблон
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json({ error: 'Шаблон не найден' }, { status: 404 })
    }

    // Генерируем номер документа (если нужно)
    let documentNumber: string | undefined
    if (generateNumber && template.autoNumber && template.category) {
      documentNumber = await DocumentNumbering.getNextNumber(
        user.companyId,
        template.category
      )
    }

    // Добавляем номер в переменные
    const allVariables = {
      ...variables,
      document: {
        ...variables.document,
        number: documentNumber || variables.document?.number,
        date: new Date()
      },
      current: {
        date: new Date(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        user: user.name
      }
    }

    // Генерируем документ
    let buffer: Buffer
    let mimeType: string
    let fileName: string

    switch (template.fileType) {
      case 'DOCX':
        buffer = await DocumentGenerator.generateDocx(template.filePath!, allVariables)
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        fileName = `${template.name}-${documentNumber || Date.now()}.docx`
        break
        
      case 'XLSX':
        buffer = await DocumentGenerator.generateXlsx(template.filePath!, allVariables)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileName = `${template.name}-${documentNumber || Date.now()}.xlsx`
        break
        
      case 'HTML':
        const html = DocumentGenerator.generateHtml(template.content, allVariables)
        buffer = Buffer.from(html, 'utf-8')
        mimeType = 'text/html'
        fileName = `${template.name}-${documentNumber || Date.now()}.html`
        break
        
      default:
        return NextResponse.json({ error: 'Неподдерживаемый тип шаблона' }, { status: 400 })
    }

    // Сохраняем файл в MinIO
    const filePath = `documents/${user.companyId}/${Date.now()}-${fileName}`
    await storage.uploadFile(filePath, buffer, mimeType)

    // Создаем запись в БД
    const document = await prisma.document.create({
      data: {
        title: template.name,
        description: `Создан из шаблона "${template.name}"`,
        category: template.category,
        fileName,
        filePath,
        fileSize: buffer.length,
        mimeType,
        documentNumber,
        generatedFrom: allVariables,
        templateId: template.id,
        projectId,
        creatorId: user.id
      }
    })

    return NextResponse.json({
      documentId: document.id,
      number: documentNumber,
      downloadUrl: `/api/documents/${document.id}/download`
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Действия:**
- [ ] Создать `/api/documents/generate/route.ts`
- [ ] Добавить обработку всех типов файлов
- [ ] Интегрировать с MinIO
- [ ] Добавить валидацию переменных
- [ ] Написать API тесты

#### Задача 4.3: Создать API загрузки шаблонов

**Файл:** `src/app/api/templates/upload/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Загрузка DOCX/XLSX файлов шаблонов в MinIO
  // Сохранение пути в БД
}
```

#### Задача 4.4: Создать API нумерации

**Файл:** `src/app/api/numbering/route.ts`

```typescript
// GET /api/numbering/:category - Получить следующий номер
// POST /api/numbering/rules - Создать правило
// PUT /api/numbering/rules/:id - Обновить правило
```

**Действия:**
- [ ] Создать все API endpoints
- [ ] Добавить проверку прав доступа
- [ ] Написать документацию API

---

### 🎨 Этап 5: Frontend (3-4 дня)

#### Задача 5.1: Обновить страницу шаблонов

**Файл:** `src/app/templates/page.tsx`

Добавить:
- Фильтрацию по категориям
- Загрузку файлов шаблонов
- Редактор переменных
- Предпросмотр переменных

#### Задача 5.2: Создать форму генерации документа

**Компонент:** `src/components/document-generator-form.tsx`

```typescript
interface DocumentGeneratorFormProps {
  templateId: string
  projectId?: string
  onSuccess?: (documentId: string) => void
}

export function DocumentGeneratorForm({ 
  templateId, 
  projectId,
  onSuccess 
}: DocumentGeneratorFormProps) {
  // Форма для заполнения переменных и генерации документа
}
```

#### Задача 5.3: Интегрировать в карточку проекта

**Файл:** `src/app/projects/[id]/page.tsx`

Добавить:
- Вкладку "Документы"
- Кнопку "Создать документ из шаблона"
- Список сгенерированных документов

**Действия:**
- [ ] Обновить UI шаблонов
- [ ] Создать форму генерации
- [ ] Интегрировать в проекты
- [ ] Добавить в финансы
- [ ] Протестировать UX

---

### 🧪 Этап 6: Тестирование (2-3 дня)

#### Задача 6.1: Unit-тесты

```typescript
// Тесты для DocumentGenerator
// Тесты для DocumentNumbering
// Тесты для API endpoints
```

#### Задача 6.2: Integration-тесты

```typescript
// Тест полного цикла: загрузка шаблона → генерация → скачивание
// Тест автонумерации
// Тест интеграции с проектами
```

#### Задача 6.3: E2E-тесты

```typescript
// Playwright тесты для UI
```

**Действия:**
- [ ] Написать unit-тесты (покрытие 80%+)
- [ ] Написать integration-тесты
- [ ] Написать E2E-тесты
- [ ] Протестировать на реальных данных

---

### 📚 Этап 7: Документация (1 день)

#### Задача 7.1: Инструкции для пользователей

**Файл:** `docs/USER_GUIDE_TEMPLATES.md`

- Как создать шаблон
- Как использовать переменные
- Как сгенерировать документ
- Примеры шаблонов

#### Задача 7.2: Техническая документация

**Файл:** `docs/DEVELOPER_GUIDE_TEMPLATES.md`

- Архитектура системы
- API документация
- Примеры кода

**Действия:**
- [ ] Написать пользовательскую документацию
- [ ] Написать техническую документацию
- [ ] Создать видео-инструкцию (опционально)

---

## Резюме: Полный чеклист

### ✅ Этап 1: База данных (1-2 дня)
- [ ] Обновить модель `DocumentTemplate`
- [ ] Создать модель `NumberingRule`
- [ ] Добавить enum для категорий
- [ ] Создать миграцию
- [ ] Обновить seed данные

### ✅ Этап 2: Библиотеки (30 мин)
- [ ] Установить `docxtemplater`, `pizzip`
- [ ] Установить `exceljs`
- [ ] Установить `handlebars`
- [ ] Проверить совместимость

### ✅ Этап 3: Генератор (2-3 дня)
- [ ] Создать `DocumentGenerator` класс
- [ ] Реализовать генерацию DOCX
- [ ] Реализовать генерацию XLSX
- [ ] Реализовать генерацию HTML
- [ ] Создать `DocumentNumbering` класс
- [ ] Написать тесты

### ✅ Этап 4: API (2-3 дня)
- [ ] Обновить `/api/templates`
- [ ] Создать `/api/templates/upload`
- [ ] Создать `/api/documents/generate`
- [ ] Создать `/api/numbering`
- [ ] Добавить валидацию
- [ ] Написать тесты

### ✅ Этап 5: Frontend (3-4 дня)
- [ ] Обновить страницу шаблонов
- [ ] Создать форму генерации
- [ ] Интегрировать в проекты
- [ ] Интегрировать в финансы
- [ ] Протестировать UX

### ✅ Этап 6: Тестирование (2-3 дня)
- [ ] Unit-тесты (80%+ покрытие)
- [ ] Integration-тесты
- [ ] E2E-тесты
- [ ] Тестирование на реальных данных

### ✅ Этап 7: Документация (1 день)
- [ ] Пользовательская документация
- [ ] Техническая документация
- [ ] Видео-инструкция (опционально)

---

## Общее время реализации

**Оптимистичный сценарий:** 11-12 рабочих дней  
**Реалистичный сценарий:** 14-16 рабочих дней  
**Пессимистичный сценарий:** 18-20 рабочих дней

---

## Рекомендации по приоритизации

### Высокий приоритет (MVP):
1. ✅ Поддержка DOCX шаблонов
2. ✅ Генерация документов из шаблонов
3. ✅ Интеграция с проектами
4. ✅ Автоматическая нумерация

### Средний приоритет:
5. Поддержка XLSX шаблонов
6. Интеграция с финансами
7. Категоризация шаблонов

### Низкий приоритет:
8. HTML/PDF шаблоны
9. Расширенные переменные
10. Видео-инструкции

---

## Что нужно от вас

### Для начала реализации:
1. **Шаблоны документов** (DOCX файлы):
   - Коммерческое предложение
   - Договор подряда
   - Счет
   - Акт выполненных работ (АВР)
   - Спецификация (XLSX)

2. **Примеры данных клиентов**:
   - Название компании, ИНН, КПП, адрес
   - Контактные лица

3. **Формат нумерации**:
   - Какой формат номеров вы хотите для каждого типа документа?
   - Например: "DOG-2025-001" для договоров

### Следующие шаги:
1. Предоставьте шаблоны документов
2. Я начну реализацию с Этапа 1 (база данных)
3. Затем перейду к Этапу 3 (генератор документов)
4. После этого - API и Frontend

Готовы начать? Предоставьте мне первый шаблон договора (DOCX), и я покажу, как его правильно подготовить с переменными!

