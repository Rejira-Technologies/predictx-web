'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        style: {
          background: "rgba(26, 31, 58, 0.95)",
          border: "1px solid rgba(0, 217, 255, 0.3)",
          color: "#e2e8f0",
          fontFamily: "Barlow, sans-serif",
          backdropFilter: "blur(12px)",
        },
        className: "predictx-toast",
      }}
      style={
        {
          '--normal-bg': 'rgba(26, 31, 58, 0.95)',
          '--normal-text': '#e2e8f0',
          '--normal-border': 'rgba(0, 217, 255, 0.3)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
