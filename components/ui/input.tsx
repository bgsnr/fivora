import * as React from 'react'

import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from 'cn'

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-7 w-full min-w-0 rounded-md border border-[#D8DFEA] bg-white px-2 py-0.5 text-sm text-[#010736] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs/relaxed file:font-medium file:text-[#010736] placeholder:text-[#718097] focus-visible:border-[#22396F] focus-visible:ring-2 focus-visible:ring-[#22396F]/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20 md:text-xs/relaxed',
        className
      )}
      {...props}
    />
  )
}

export { Input }