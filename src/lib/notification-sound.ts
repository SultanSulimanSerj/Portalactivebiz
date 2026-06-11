let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    audioContext = new AudioCtx()
  }
  return audioContext
}

export function unlockNotificationSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    void ctx.resume()
  }

  // Короткий беззвучный импульс — помогает Safari/Chrome разрешить звук после клика
  const buffer = ctx.createBuffer(1, 1, 22050)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)
}

export function setupNotificationSoundUnlock() {
  if (typeof window === 'undefined') return () => {}

  const unlock = () => unlockNotificationSound()

  window.addEventListener('pointerdown', unlock, { capture: true })
  window.addEventListener('keydown', unlock, { capture: true })

  return () => {
    window.removeEventListener('pointerdown', unlock, { capture: true })
    window.removeEventListener('keydown', unlock, { capture: true })
  }
}

export async function playNotificationSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const now = ctx.currentTime

    const playTone = (frequency: number, start: number, duration: number) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gain.gain.setValueAtTime(0.35, start)
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration)
      oscillator.start(start)
      oscillator.stop(start + duration)
    }

    playTone(880, now, 0.12)
    playTone(1100, now + 0.14, 0.16)
  } catch (error) {
    console.error('Ошибка воспроизведения звука уведомления:', error)
  }
}
