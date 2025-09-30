import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      companyId?: string | null
      company?: any
      phone?: string | null
      address?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    companyId?: string | null
    company?: any
    phone?: string | null
    address?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    companyId?: string | null
    company?: any
    phone?: string | null
    address?: string | null
  }
}