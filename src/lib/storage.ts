import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner'

// MinIO конфигурация
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  },
  forcePathStyle: true, // MinIO требует path-style URLs
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'project-portal'

// Создание bucket если не существует
async function ensureBucketExists() {
  try {
    const { CreateBucketCommand } = await import('@aws-sdk/client-s3')
    await s3Client.send(new CreateBucketCommand({
      Bucket: BUCKET_NAME,
    }))
    console.log(`Bucket ${BUCKET_NAME} created successfully`)
  } catch (error: any) {
    if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
      console.log(`Bucket ${BUCKET_NAME} already exists`)
    } else {
      console.error('Error creating bucket:', error)
    }
  }
}

// Инициализация при первом импорте
ensureBucketExists()

// Экспортируем отдельные функции для удобства
export async function uploadFile(filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType,
    })

    await s3Client.send(command)
    return `${process.env.MINIO_ENDPOINT || 'http://localhost:9000'}/${BUCKET_NAME}/${filePath}`
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file')
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    })

    return await awsGetSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Failed to generate signed URL')
  }
}

export function getPublicUrl(filePath: string): string {
  return `${process.env.MINIO_ENDPOINT || 'http://localhost:9000'}/${BUCKET_NAME}/${filePath}`
}

export const storage = {
  uploadFile,
  deleteFile,
  getSignedUrl,
  getPublicUrl
}
