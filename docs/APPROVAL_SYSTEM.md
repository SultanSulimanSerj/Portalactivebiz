# Улучшенная система согласований

## 📋 Обзор

Улучшенная система согласований предоставляет мощный и гибкий механизм для управления процессами согласования документов, бюджетов и других элементов проекта.

## 🎯 Основные возможности

### 1. Расширенная информация для согласования

- **Приоритеты**: LOW, MEDIUM, HIGH, URGENT
- **Сроки**: Установка deadline для согласования
- **Подробное описание**: Поддержка длинного текста
- **Вложения**: Прикрепление файлов к согласованию
- **Комментарии**: Обсуждение и обратная связь
- **История**: Полный аудит всех изменений

### 2. Управление участниками

- **Роли участников**:
  - `INITIATOR` - Инициатор согласования
  - `APPROVER` - Согласующий (принимает решение)
  - `REVIEWER` - Рецензент (дает рекомендации)
  - `OBSERVER` - Наблюдатель (только просмотр)

- **Порядок согласования**: Последовательное или параллельное согласование
- **Требование единогласия**: Опция "требуется согласие всех"

### 3. Интеграция с документами

- **Автоматическая публикация**: Документы публикуются автоматически после согласования
- **Контроль публикации**: Неодобренные документы остаются скрытыми
- **Версионирование**: Поддержка версий документов

## 🔧 Схема данных

### Enum'ы

```prisma
enum ApprovalPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ApprovalParticipantRole {
  INITIATOR
  APPROVER
  REVIEWER
  OBSERVER
}
```

### Модели

#### Approval (Согласование)

```prisma
model Approval {
  id          String        @id @default(cuid())
  title       String
  description String?       @db.Text
  status      ApprovalStatus @default(PENDING)
  type        ApprovalType
  priority    ApprovalPriority @default(MEDIUM)
  dueDate     DateTime?
  requireAllApprovals Boolean @default(false)
  autoPublishOnApproval Boolean @default(true)
  
  // Связи
  comments    ApprovalComment[]
  attachments ApprovalAttachment[]
  history     ApprovalHistory[]
  assignments ApprovalAssignment[]
}
```

#### ApprovalComment (Комментарий)

```prisma
model ApprovalComment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  approvalId String
  userId String
}
```

#### ApprovalAttachment (Вложение)

```prisma
model ApprovalAttachment {
  id        String   @id @default(cuid())
  fileName  String
  filePath  String
  fileSize  Int
  mimeType  String
  
  approvalId String
  uploadedById String
}
```

#### ApprovalHistory (История)

```prisma
model ApprovalHistory {
  id        String   @id @default(cuid())
  action    String
  changes   Json?
  createdAt DateTime @default(now())
  
  approvalId String
  userId String
}
```

#### ApprovalAssignment (Назначение)

```prisma
model ApprovalAssignment {
  id        String   @id @default(cuid())
  status    ApprovalStatus @default(PENDING)
  role      ApprovalParticipantRole @default(APPROVER)
  comment   String?  @db.Text
  order     Int      @default(0)
  respondedAt DateTime?
  
  approvalId String
  userId String
}
```

## 📡 API Endpoints

### Основные операции

#### `GET /api/approvals`
Получить список согласований с фильтрацией и пагинацией.

#### `POST /api/approvals`
Создать новое согласование.

**Body:**
```json
{
  "title": "Согласование проектной документации",
  "description": "Требуется согласовать ПД по объекту №123",
  "type": "DOCUMENT",
  "priority": "HIGH",
  "dueDate": "2025-10-15T12:00:00Z",
  "requireAllApprovals": true,
  "autoPublishOnApproval": true,
  "documentId": "doc-123",
  "projectId": "proj-456",
  "assigneeIds": ["user-1", "user-2"],
  "roles": {
    "user-1": "APPROVER",
    "user-2": "REVIEWER"
  }
}
```

#### `GET /api/approvals/[id]`
Получить детали согласования.

#### `PUT /api/approvals/[id]`
Обновить согласование.

#### `DELETE /api/approvals/[id]`
Удалить согласование.

### Комментарии

#### `GET /api/approvals/[id]/comments`
Получить все комментарии согласования.

#### `POST /api/approvals/[id]/comments`
Добавить комментарий.

**Body:**
```json
{
  "content": "Необходимо внести правки в раздел 3.2"
}
```

### Вложения

#### `GET /api/approvals/[id]/attachments`
Получить все вложения согласования.

#### `POST /api/approvals/[id]/attachments`
Загрузить вложение (multipart/form-data).

**FormData:**
- `file`: File

### История

#### `GET /api/approvals/[id]/history`
Получить историю изменений согласования.

### Ответ на согласование

#### `POST /api/approvals/[id]/respond`
Ответить на согласование (одобрить/отклонить).

**Body:**
```json
{
  "status": "APPROVED",  // или "REJECTED"
  "comment": "Одобрено с замечаниями"
}
```

**Логика:**
- Обновляет статус назначения (`ApprovalAssignment`)
- Проверяет статус всех назначений
- Обновляет общий статус согласования
- Если `requireAllApprovals = true`, требуется согласие всех
- Если `autoPublishOnApproval = true`, публикует документ при одобрении
- Добавляет запись в историю

## 🎨 Примеры использования

### Создание согласования с вложениями

```typescript
// 1. Создаем согласование
const approval = await fetch('/api/approvals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Согласование ПД',
    description: 'Требуется согласовать проектную документацию',
    type: 'DOCUMENT',
    priority: 'HIGH',
    dueDate: '2025-10-15T12:00:00Z',
    requireAllApprovals: true,
    documentId: 'doc-123',
    assigneeIds: ['user-1', 'user-2'],
    roles: {
      'user-1': 'APPROVER',
      'user-2': 'REVIEWER'
    }
  })
})

const { id } = await approval.json()

// 2. Загружаем вложения
const formData = new FormData()
formData.append('file', file)

await fetch(`/api/approvals/${id}/attachments`, {
  method: 'POST',
  body: formData
})
```

### Ответ на согласование

```typescript
// 1. Добавляем комментарий
await fetch(`/api/approvals/${id}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Необходимо внести правки в раздел 3.2'
  })
})

// 2. Одобряем с комментарием
await fetch(`/api/approvals/${id}/respond`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'APPROVED',
    comment: 'Одобрено с замечаниями'
  })
})
```

### Получение истории

```typescript
const response = await fetch(`/api/approvals/${id}/history`)
const { history } = await response.json()

history.forEach(entry => {
  console.log(`${entry.action} by ${entry.user.name} at ${entry.createdAt}`)
  console.log('Changes:', entry.changes)
})
```

## 🔒 Безопасность

- Все endpoints требуют аутентификации через NextAuth
- Доступ к согласованиям ограничен компанией пользователя
- Только участники согласования могут отвечать
- История изменений не может быть изменена

## 🚀 Следующие шаги

1. Интеграция фронтенда с новыми API
2. Настройка уведомлений участникам
3. Добавление шаблонов согласований
4. Интеграция с системой отчетов

## 📝 Примечания

- Документы не публикуются автоматически, если `approvalRequired = true` и нет одобренного согласования
- При отклонении согласования документ остается неопубликованным
- История изменений ведется автоматически для всех операций
