import type { ReactNode } from "react"
export function TableWrap({children}:{children:ReactNode}){return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm">{children}</table></div>}
export function Th({children}:{children:ReactNode}){return <th className="border-b bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</th>}
export function Td({children,className=""}:{children:ReactNode;className?:string}){return <td className={`border-b border-slate-100 px-4 py-3.5 ${className}`}>{children}</td>}
