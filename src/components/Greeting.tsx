'use client'

import { useEffect, useState } from 'react'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Greeting() {
  // Start with empty string to avoid hydration mismatch
  const [text, setText] = useState('')

  useEffect(() => {
    setText(getGreeting())
  }, [])

  if (!text) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{text} 👋</h1>
      <p className="text-sm text-gray-400 mt-1">
        {new Date().toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}
      </p>
    </div>
  )
}
