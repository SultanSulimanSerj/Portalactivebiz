#!/bin/bash

echo ""
echo "🔍 ДИАГНОСТИКА СЕРВЕРА"
echo ""

# Проверяем процессы Next.js
echo "1. Проверка процессов Next.js:"
ps aux | grep "next dev" | grep -v grep
if [ $? -eq 0 ]; then
    echo "   ✅ Next.js запущен"
else
    echo "   ❌ Next.js НЕ запущен"
fi

echo ""

# Проверяем порты 3000-3003
echo "2. Проверка занятых портов:"
for port in 3000 3001 3002 3003; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   Port $port: ✅ ЗАНЯТ"
        lsof -Pi :$port -sTCP:LISTEN | grep -v COMMAND
    else
        echo "   Port $port: ⚪ Свободен"
    fi
done

echo ""

# Проверяем Prisma Studio
echo "3. Проверка Prisma Studio:"
if lsof -Pi :5555 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ Prisma Studio запущен на порту 5555"
else
    echo "   ❌ Prisma Studio НЕ запущен"
fi

echo ""
echo "💡 РЕКОМЕНДАЦИИ:"
echo ""

if ! ps aux | grep "next dev" | grep -v grep > /dev/null; then
    echo "   Запустите сервер:"
    echo "   cd '/Users/sergeykopyl/Desktop/portal BIZ'"
    echo "   npm run dev"
fi

echo ""

