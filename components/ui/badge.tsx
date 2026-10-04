import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from 'cn'

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-2.5!',
  {
    variants: {
      variant: {
        default:
          'bg-[#010736] text-white [a]:hover:bg-[#0D1C42]',

        secondary:
          'border-[#D8DFEA] bg-[#FCF1D0] text-[#010736] [a]:hover:bg-[#F5E5B5]',

        destructive:
          'border-red-200 bg-red-50 text-red-700 focus-visible:ring-red-500/20 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 [a]:hover:bg-red-100 dark:[a]:hover:bg-red-900/50',

        outline:
          'border-[#D8DFEA] bg-white text-[#010736] dark:bg-[#0D1C42] dark:text-white [a]:hover:bg-[#F8FAFC] dark:[a]:hover:bg-[#22396F]',

        ghost:
          'bg-transparent text-[#52627D] hover:bg-[#F1F4F8] hover:text-[#010736] dark:hover:bg-[#22396F] dark:hover:text-white',

        link:
          'text-[#22396F] underline-offset-4 hover:text-[#010736] hover:underline',
      },
    },

    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(
          badgeVariants({ variant }),
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  })
}

export { Badge, badgeVariants }