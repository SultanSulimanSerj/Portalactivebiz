// CDN конфигурация для статических файлов
export interface CDNConfig {
  provider: 'cloudinary' | 'aws-s3' | 'local'
  baseUrl?: string
  apiKey?: string
  apiSecret?: string
  bucket?: string
  region?: string
}

const cdnConfig: CDNConfig = {
  provider: process.env.CDN_PROVIDER as any || 'local',
  baseUrl: process.env.CDN_BASE_URL,
  apiKey: process.env.CDN_API_KEY,
  apiSecret: process.env.CDN_API_SECRET,
  bucket: process.env.CDN_BUCKET,
  region: process.env.CDN_REGION
}

export function getCDNUrl(path: string): string {
  if (cdnConfig.provider === 'local') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/uploads/${path}`
  }

  if (cdnConfig.provider === 'cloudinary') {
    return `${cdnConfig.baseUrl}/image/upload/${path}`
  }

  if (cdnConfig.provider === 'aws-s3') {
    return `https://${cdnConfig.bucket}.s3.${cdnConfig.region}.amazonaws.com/${path}`
  }

  return path
}

export function getOptimizedImageUrl(
  path: string,
  width?: number,
  height?: number,
  quality?: number,
  format?: string
): string {
  if (cdnConfig.provider === 'cloudinary') {
    const transformations = []
    
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (quality) transformations.push(`q_${quality}`)
    if (format) transformations.push(`f_${format}`)
    
    const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : ''
    return `${cdnConfig.baseUrl}/image/upload${transformString}/${path}`
  }

  if (cdnConfig.provider === 'aws-s3') {
    // Для AWS S3 можно использовать Lambda@Edge или CloudFront
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    if (quality) params.set('q', quality.toString())
    if (format) params.set('f', format)
    
    const queryString = params.toString()
    return `https://${cdnConfig.bucket}.s3.${cdnConfig.region}.amazonaws.com/${path}${queryString ? `?${queryString}` : ''}`
  }

  // Для локального хранения возвращаем обычный URL
  return getCDNUrl(path)
}

export function getThumbnailUrl(path: string, size: number = 300): string {
  return getOptimizedImageUrl(path, size, size, 70, 'jpeg')
}

export function getWebPUrl(path: string, width?: number, height?: number): string {
  return getOptimizedImageUrl(path, width, height, 80, 'webp')
}

export function getAVIFUrl(path: string, width?: number, height?: number): string {
  return getOptimizedImageUrl(path, width, height, 80, 'avif')
}

// Responsive image URLs для разных размеров экрана
export function getResponsiveImageUrls(path: string): {
  mobile: string
  tablet: string
  desktop: string
  retina: string
} {
  return {
    mobile: getOptimizedImageUrl(path, 480, undefined, 80, 'webp'),
    tablet: getOptimizedImageUrl(path, 768, undefined, 85, 'webp'),
    desktop: getOptimizedImageUrl(path, 1200, undefined, 90, 'webp'),
    retina: getOptimizedImageUrl(path, 2400, undefined, 95, 'webp')
  }
}
