import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
        accent: "bg-[#5318eb] text-white hover:bg-[#4513c7] shadow-xs",
        outline:
          "border border-border bg-background hover:bg-secondary hover:text-foreground text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[#e8e8e8] border border-border/50",
        ghost:
          "hover:bg-secondary hover:text-foreground text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-[#5318eb] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 text-xs/relaxed font-medium",
        xs: "h-6 gap-1 rounded-sm px-2 text-[0.6875rem]",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-11 gap-2 px-5 text-sm font-semibold min-h-[44px]",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
