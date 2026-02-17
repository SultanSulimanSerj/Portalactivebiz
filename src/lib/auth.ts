import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            company: true
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          company: user.company,
          phone: user.phone,
          address: user.address
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // При первом входе сохраняем данные пользователя
      if (user) {
        token.name = user.name
        token.role = user.role
        token.companyId = user.companyId
        token.company = user.company
        token.phone = user.phone
        token.address = user.address
      }

      // При обновлении сессии (trigger === 'update') подтягиваем свежие данные из БД
      if (trigger === 'update' && token.sub) {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            company: true // Загружаем полную информацию о компании с реквизитами
          }
        })

        if (updatedUser) {
          token.name = updatedUser.name
          token.phone = updatedUser.phone
          token.address = updatedUser.address
          token.role = updatedUser.role
          token.companyId = updatedUser.companyId
          token.company = updatedUser.company
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
        session.user.company = token.company as any
        session.user.phone = token.phone as string
        session.user.address = token.address as string

        // Добавляем реквизиты компании в сессию для использования в шаблонах
        if (token.company && typeof token.company === 'object') {
          session.user.company = {
            ...token.company,
            name: token.company.name,
            // Реквизиты теперь доступны в сессии
            inn: token.company.inn,
            legalName: token.company.legalName,
            directorName: token.company.directorName,
            directorPosition: token.company.directorPosition,
            contactEmail: token.company.contactEmail,
            contactPhone: token.company.contactPhone,
            bankAccount: token.company.bankAccount,
            bankName: token.company.bankName,
            bankBik: token.company.bankBik,
            correspondentAccount: token.company.correspondentAccount,
            legalAddress: token.company.legalAddress,
            actualAddress: token.company.actualAddress
          }
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  }
}
