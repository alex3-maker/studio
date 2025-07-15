
"use client"

import * as React from "react"
import { icons } from "lucide-react"

export type LucideIconName = keyof typeof icons

type LucideIconProps = React.ComponentProps<(typeof icons)[LucideIconName]> & {
  name: LucideIconName
}

export function LucideIcon({ name, ...props }: LucideIconProps) {
  const Icon = icons[name]
  if (!Icon) {
    return null
  }

  return <Icon {...props} />
}
