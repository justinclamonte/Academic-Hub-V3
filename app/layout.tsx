import { Suspense } from 'react'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense>
          <ClerkProvider>
            <header style={{ display: 'flex', gap: 12, padding: 16, justifyContent: 'flex-end' }}>
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
            {children}
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  )
}
