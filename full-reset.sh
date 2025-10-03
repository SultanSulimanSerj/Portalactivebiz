#!/bin/bash

cd "/Users/sergeykopyl/Desktop/portal BIZ"

echo ""
echo "⚠️  ПОЛНЫЙ ОТКАТ К ПОСЛЕДНЕМУ КОММИТУ"
echo ""
echo "Это удалит ВСЕ несохраненные изменения!"
echo ""

# Показываем что будет удалено
echo "📋 Файлы, которые будут изменены/удалены:"
echo ""
git status --short
echo ""

# Выполняем откат
echo "🔄 Выполняю откат..."
git reset --hard HEAD
git clean -fd

echo ""
echo "✅ ГОТОВО! Проект восстановлен к последнему коммиту"
echo ""

# Показываем итоговый статус
echo "📊 Текущий статус:"
git status
echo ""

# Показываем последний коммит
echo "📌 Последний коммит:"
git log -1 --oneline
echo ""

