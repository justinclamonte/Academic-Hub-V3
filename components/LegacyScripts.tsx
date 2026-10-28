'use client'

import Script from 'next/script'
import { useState } from 'react'

export default function LegacyScripts() {
  const [step, setStep] = useState(0)

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        strategy="afterInteractive"
        onLoad={() => setStep(1)}
      />
      {step >= 1 && (
        <Script
          src="/supabase-client.js"
          strategy="afterInteractive"
          onLoad={() => setStep(2)}
        />
      )}
      {step >= 2 && <Script src="/script.js" strategy="afterInteractive" />}
    </>
  )
}
