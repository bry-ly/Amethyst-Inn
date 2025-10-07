"use client"
import React from "react"
import { IconPhoto } from "@tabler/icons-react"

type Props = {
  alt?: string
  className?: string
  text?: string
}

export function ImageFallback({ alt = "No image", className, text }: Props) {
  return (
    <div
      className={
        className ||
        "w-full h-40 bg-gray-100 dark:bg-neutral-900 flex items-center justify-center"
      }
      aria-label={alt}
      role="img"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <IconPhoto className="size-5" />
        <span className="text-xs">{text || alt}</span>
      </div>
    </div>
  )
}







