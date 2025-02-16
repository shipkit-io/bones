'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PreviewProps } from './types'

export function Preview({ component, currentStyle }: PreviewProps) {
    return (
        <div className={cn(
            "w-full h-full flex items-center justify-center p-4",
            currentStyle === 'brutalist'
                ? 'border-2 border-primary'
                : 'border rounded-md'
        )}>
            <Card className={cn(
                "w-full h-full flex items-center justify-center",
                currentStyle === 'brutalist'
                    ? 'border-2 border-primary rounded-none'
                    : 'border rounded-md'
            )}>
                <div className="text-center text-muted-foreground">
                    <p>Preview not available for {component.name}</p>
                    <p className="text-sm mt-2">Component type: {component.type}</p>
                </div>
            </Card>
        </div>
    )
}
