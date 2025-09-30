'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableDescriptionProps {
  description: string
  maxLength?: number
  className?: string
}

export default function ExpandableDescription({ 
  description, 
  maxLength = 100,
  className = ""
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!description) return null
  
  const shouldTruncate = description.length > maxLength
  const displayText = isExpanded || !shouldTruncate 
    ? description 
    : description.substring(0, maxLength) + '...'
  
  return (
    <div className={`text-sm text-gray-700 ${className}`}>
      <div className="whitespace-pre-wrap break-words transition-all duration-200 max-w-full overflow-hidden">
        {displayText}
      </div>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 transition-colors duration-200 hover:bg-blue-50 px-1 py-0.5 rounded"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 transition-transform duration-200" />
              Показать меньше
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 transition-transform duration-200" />
              Показать больше
            </>
          )}
        </button>
      )}
    </div>
  )
}
