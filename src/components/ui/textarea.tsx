import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * If true, the textarea grows/shrinks to fit its content.
   * Manual resize is disabled regardless.
   */
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = true, onChange, value, defaultValue, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null)

    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, [])

    const syncHeight = React.useCallback(() => {
      const el = innerRef.current
      if (!el || !autoResize) return
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }, [autoResize])

    React.useLayoutEffect(() => {
      syncHeight()
    }, [syncHeight, value])

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={innerRef}
        onChange={(e) => {
          if (autoResize) {
            e.currentTarget.style.height = "auto"
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
          }
          onChange?.(e)
        }}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
