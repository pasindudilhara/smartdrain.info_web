import type { ReactNode } from "react"
export function Badge({children,tone="slate"}:{children:ReactNode;tone?:"green"|"amber"|"red"|"blue"|"slate"|"purple"}){
 const m={green:"bg-emerald-50 text-emerald-700 ring-emerald-600/20",amber:"bg-amber-50 text-amber-700 ring-amber-600/20",red:"bg-red-50 text-red-700 ring-red-600/20",blue:"bg-sky-50 text-sky-700 ring-sky-600/20",slate:"bg-slate-50 text-slate-700 ring-slate-500/20",purple:"bg-purple-50 text-purple-700 ring-purple-600/20"}[tone]
 return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${m}`}>{children}</span>
}
