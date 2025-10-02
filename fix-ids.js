#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Список файлов для исправления
const filesToFix = [
  'src/app/api/approvals/[id]/comments/route.ts',
  'src/app/api/approvals/[id]/attachments/route.ts',
  'src/app/api/approvals/[id]/attachments/[attachmentId]/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/tasks/[id]/route.ts',
  'src/app/api/tasks/[id]/comments/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/projects/[id]/route.ts',
  'src/app/api/projects/[id]/messages/route.ts',
  'src/app/api/projects/[id]/members/route.ts',
  'src/app/api/finance/route.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/auth/invite/route.ts',
  'src/app/api/approvals/route.ts',
  'src/app/api/approvals/[id]/respond/route.ts'
];

function fixFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ Файл не найден: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Заменяем импорт randomUUID на generateId
    if (content.includes("import { randomUUID } from 'crypto'")) {
      content = content.replace(
        "import { randomUUID } from 'crypto'",
        "import { generateId } from '@/lib/id-generator'"
      );
      modified = true;
    }

    // Заменяем все использования randomUUID() на generateId()
    if (content.includes('randomUUID()')) {
      content = content.replace(/randomUUID\(\)/g, 'generateId()');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Исправлен: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  Пропущен (нет изменений): ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка при исправлении ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Начинаем исправление ID в проекте...\n');

let fixedCount = 0;
let totalCount = filesToFix.length;

filesToFix.forEach(filePath => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n📊 Результат:`);
console.log(`✅ Исправлено файлов: ${fixedCount}`);
console.log(`📁 Всего файлов: ${totalCount}`);
console.log(`🎯 Процент успеха: ${Math.round((fixedCount / totalCount) * 100)}%`);

if (fixedCount === totalCount) {
  console.log('\n🎉 Все файлы успешно исправлены!');
} else {
  console.log('\n⚠️  Некоторые файлы не удалось исправить. Проверьте ошибки выше.');
}
