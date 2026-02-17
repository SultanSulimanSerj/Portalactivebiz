import Link from 'next/link'
import Layout from '@/components/layout'

export default function NotFound() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Страница не найдена
          </h2>
          <p className="text-gray-600 mb-6">
            Запрашиваемая страница не существует
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </Layout>
  )
}
