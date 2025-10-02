#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class AutoGitSaver {
  constructor() {
    this.interval = 30 * 60 * 1000 // 30 минут
    this.workingDir = process.cwd()
    this.branch = 'main'
    this.intervalId = null
    this.isRunning = false
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Автосохранение уже запущено')
      return
    }

    console.log('🔄 Запуск автосохранения в Git каждые 30 минут')
    console.log(`📁 Рабочая директория: ${this.workingDir}`)
    
    this.isRunning = true
    this.intervalId = setInterval(() => {
      this.performAutoSave()
    }, this.interval)

    // Первое сохранение через 2 минуты
    setTimeout(() => {
      console.log('🔄 Первое автосохранение через 2 минуты...')
      this.performAutoSave()
    }, 120000)

    console.log('✅ Автосохранение запущено')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
      console.log('⏹️ Автосохранение остановлено')
    }
  }

  async performAutoSave() {
    try {
      console.log(`\n🔄 [${new Date().toLocaleString('ru-RU')}] Проверка изменений...`)
      
      // Проверяем статус Git
      const status = this.getGitStatus()
      
      if (status.hasChanges) {
        console.log(`📝 Найдены изменения: ${status.files.length} файлов`)
        console.log(`📋 Файлы: ${status.files.join(', ')}`)
        
        // Добавляем все изменения
        this.gitAddAll()
        
        // Создаем коммит
        const commitHash = this.gitCommit()
        
        // Пушим в удаленный репозиторий
        this.gitPush()
        
        console.log(`✅ Автосохранение завершено: ${commitHash}`)
      } else {
        console.log('📝 Изменений нет, пропускаем автосохранение')
      }
      
    } catch (error) {
      console.error('❌ Ошибка автосохранения:', error.message)
    }
  }

  getGitStatus() {
    try {
      const statusOutput = execSync('git status --porcelain', { 
        cwd: this.workingDir,
        encoding: 'utf8'
      })
      
      const files = statusOutput.trim().split('\n').filter(line => line.trim())
      
      return {
        hasChanges: files.length > 0,
        files: files
      }
    } catch (error) {
      console.error('Ошибка проверки статуса Git:', error.message)
      return { hasChanges: false, files: [] }
    }
  }

  gitAddAll() {
    try {
      execSync('git add .', { 
        cwd: this.workingDir,
        stdio: 'pipe'
      })
      console.log('📁 Файлы добавлены в индекс')
    } catch (error) {
      throw new Error(`Ошибка добавления файлов: ${error.message}`)
    }
  }

  gitCommit() {
    try {
      const timestamp = new Date().toLocaleString('ru-RU')
      const message = `Auto-save: автоматическое сохранение (${timestamp})`
      
      execSync(`git commit -m "${message}"`, { 
        cwd: this.workingDir,
        encoding: 'utf8'
      })
      
      // Извлекаем хеш коммита
      const commitHash = execSync('git rev-parse HEAD', { 
        cwd: this.workingDir,
        encoding: 'utf8'
      }).trim()
      
      console.log(`💾 Коммит создан: ${commitHash.substring(0, 7)}`)
      return commitHash.substring(0, 7)
    } catch (error) {
      throw new Error(`Ошибка создания коммита: ${error.message}`)
    }
  }

  gitPush() {
    try {
      execSync(`git push origin ${this.branch}`, { 
        cwd: this.workingDir,
        stdio: 'pipe'
      })
      console.log(`🚀 Изменения отправлены в ${this.branch}`)
    } catch (error) {
      console.warn(`⚠️ Ошибка отправки в репозиторий: ${error.message}`)
      // Не бросаем ошибку, так как это может быть проблема с сетью
    }
  }

  // Ручное сохранение
  async manualSave() {
    console.log('🔄 Ручное сохранение...')
    await this.performAutoSave()
  }

  status() {
    console.log(`📊 Статус автосохранения: ${this.isRunning ? '🟢 Включено' : '🔴 Отключено'}`)
    if (this.isRunning) {
      console.log(`⏰ Интервал: ${this.interval / 60000} минут`)
      console.log(`📁 Директория: ${this.workingDir}`)
      console.log(`🌿 Ветка: ${this.branch}`)
    }
  }
}

// CLI интерфейс
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  const saver = new AutoGitSaver()

  switch (command) {
    case 'start':
      saver.start()
      break
    case 'stop':
      saver.stop()
      break
    case 'save':
      saver.manualSave()
      break
    case 'status':
      saver.status()
      break
    default:
      console.log(`
🔄 Автосохранение в Git каждые 30 минут

Использование:
  node auto-git-save.js start    - Запустить автосохранение
  node auto-git-save.js stop     - Остановить автосохранение  
  node auto-git-save.js save     - Сохранить сейчас
  node auto-git-save.js status   - Показать статус

Пример:
  node auto-git-save.js start
      `)
  }
}

module.exports = AutoGitSaver
