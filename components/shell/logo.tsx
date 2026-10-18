import { KeyRound } from 'lucide-react'

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <KeyRound className="size-4" aria-hidden="true" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Kalit</span>
    </span>
  )
}
