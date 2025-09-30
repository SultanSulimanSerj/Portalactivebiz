import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      companyId?: string
      company?: {
        id: string
        name: string
      }
    }
  }

  interface User {
    role: string
    companyId?: string
    company?: {
      id: string
      name: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    companyId?: string
    company?: {
      id: string
      name: string
    }
  }
}
