import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { verifyUser, findUserByEmail } from "./users"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await verifyUser(credentials.username, credentials.password)
        if (!user) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "staff"
      }
      // Google OAuth — ค้นหา role จาก Users sheet
      if (!token.role && token.email) {
        try {
          const u = await findUserByEmail(token.email as string)
          token.role = u?.role || "staff"
        } catch {
          token.role = "staff"
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub || ""
        ;(session.user as any).role = token.role || "staff"
      }
      return session
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
}
