---
title: Component Generator
description: Template for generating new React components following project standards
---

# Component Generator Template

## Component Structure
```tsx
import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  // Add custom props here
}

export const Component = ({
  className,
  ...props
}: ComponentProps) => {
  return (
    <div
      className={cn(
        // Base styles
        "relative",
        className
      )}
      {...props}
    />
  )
}
```

## Usage Guidelines
- Place in appropriate directory under `src/components/`
- Use kebab-case for filenames
- Include proper TypeScript types
- Add JSDoc comments for complex props
- Include unit tests in `__tests__` directory

## Common Patterns
- Use composition over inheritance
- Implement proper accessibility patterns
- Consider mobile-first responsive design
- Add loading and error states
- Include proper aria labels

## Required Files
- Component file (*.tsx)
- Test file (*.test.tsx)
- Stories if visual component (*.stories.tsx)

@accessibility.mdc
@react.mdc
