import React from "react"
import "./globals.css"
import { AuthProvider } from "../providers/auth-provider"
import { ThemeProvider } from "../providers/theme-provider"
import { QueryProvider } from "../providers/query-provider"
import { WorkspaceProvider } from "../providers/workspace-provider"
import { MotionProvider } from "../providers/motion-provider"

export const metadata = {
  title: "BMT Platform",
  description: "Enterprise Marketing Operating System",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <ThemeProvider>
                <MotionProvider>
                  {children}
                </MotionProvider>
              </ThemeProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
