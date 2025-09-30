import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export async function optimizeImage(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const {
    width = 1200,
    height = 800,
    quality = 80,
    format = 'webp',
    fit = 'cover'
  } = options

  return await sharp(inputBuffer)
    .resize(width, height, { fit })
    .toFormat(format, { quality })
    .toBuffer()
}

export async function generateThumbnail(
  inputBuffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  return await sharp(inputBuffer)
    .resize(size, size, { fit: 'cover' })
    .toFormat('jpeg', { quality: 70 })
    .toBuffer()
}

export async function saveOptimizedImage(
  file: File,
  uploadDir: string,
  filename: string,
  options?: ImageOptimizationOptions
): Promise<{ originalPath: string; optimizedPath: string; thumbnailPath: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Создаем директории
  await mkdir(uploadDir, { recursive: true })
  await mkdir(join(uploadDir, 'optimized'), { recursive: true })
  await mkdir(join(uploadDir, 'thumbnails'), { recursive: true })

  const originalPath = join(uploadDir, filename)
  const optimizedPath = join(uploadDir, 'optimized', filename)
  const thumbnailPath = join(uploadDir, 'thumbnails', filename)

  // Сохраняем оригинал
  await writeFile(originalPath, buffer)

  // Оптимизируем изображение
  const optimizedBuffer = await optimizeImage(buffer, options)
  await writeFile(optimizedPath, optimizedBuffer)

  // Создаем миниатюру
  const thumbnailBuffer = await generateThumbnail(buffer)
  await writeFile(thumbnailPath, thumbnailBuffer)

  return {
    originalPath,
    optimizedPath,
    thumbnailPath
  }
}

export function getImageUrl(path: string, type: 'original' | 'optimized' | 'thumbnail' = 'optimized'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (type === 'original') {
    return `${baseUrl}/uploads/${path}`
  } else if (type === 'optimized') {
    return `${baseUrl}/uploads/optimized/${path}`
  } else {
    return `${baseUrl}/uploads/thumbnails/${path}`
  }
}
