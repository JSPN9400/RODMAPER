// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // Demo login - remove in production
    CredentialsProvider({
      name: 'Demo',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@roadmaper.com' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        let user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) {
          user = await prisma.user.create({
            data: { email: credentials.email, name: credentials.email.split('@')[0] }
          })
        }
        return user
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
