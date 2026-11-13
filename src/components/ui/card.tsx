import type { HTMLAttributes } from "react"
export function Card({className="",...p}:HTMLAttributes<HTMLDivElement>){return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`} {...p}/>}
export function CardHeader({className="",...p}:HTMLAttributes<HTMLDivElement>){return <div className={`px-5 pt-5 ${className}`} {...p}/>}
export function CardTitle({className="",...p}:HTMLAttributes<HTMLHeadingElement>){return <h3 className={`font-semibold text-slate-900 ${className}`} {...p}/>}
export function CardContent({className="",...p}:HTMLAttributes<HTMLDivElement>){return <div className={`p-5 ${className}`} {...p}/>}
