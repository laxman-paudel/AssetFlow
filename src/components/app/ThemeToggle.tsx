"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  return (
    <div className="flex w-full items-center rounded-md bg-muted p-1">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={theme === option.value ? "default" : "ghost"}
          size="sm"
          className="flex-1 justify-center gap-2"
          onClick={() => setTheme(option.value)}
        >
          <option.icon className="h-4 w-4" />
          {option.label}
        </Button>
      ))}
    </div>
  )
}
