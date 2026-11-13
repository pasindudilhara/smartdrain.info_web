import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query"
import { Building2,Plus,Users,Edit3 } from "lucide-react"
import { useState } from "react"
import api,{errorMessage} from "@/lib/api"
import type { Council,CouncilUser } from "@/lib/types"
import { PageHeader } from "@/components/PageParts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Field,Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const blank={code:"",name:"",city:"",country:"Sri Lanka",contactEmail:"",contactPhone:"",whatsappNumber:"",username:"",password:"",displayName:""}

export default function CouncilsPage(){
 const qc=useQueryClient()
 const [createOpen,setCreateOpen]=useState(false)
 const [selected,setSelected]=useState<Council|null>(null)
 const [editOpen,setEditOpen]=useState(false)
 const [userOpen,setUserOpen]=useState(false)
 const [form,setForm]=useState(blank)
 const [editForm,setEditForm]=useState<any>({})
 const [uf,setUf]=useState({username:"",password:"",displayName:""})

 const councils=useQuery({queryKey:["councils"],queryFn:async()=> (await api.get<Council[]>("/admin/councils")).data})
 const users=useQuery({queryKey:["council-users",selected?.id],enabled:!!selected,queryFn:async()=> (await api.get<CouncilUser[]>(`/admin/councils/${selected!.id}/users`)).data})

 const create=useMutation({
  mutationFn:async()=> (await api.post("/admin/councils",form)).data,
  onSuccess:()=>{qc.invalidateQueries({queryKey:["councils"]});setCreateOpen(false);setForm(blank)},
  onError:e=>alert(errorMessage(e))
 })
 const edit=useMutation({
  mutationFn:async()=> (await api.put(`/admin/councils/${selected!.id}`,editForm)).data,
  onSuccess:()=>{qc.invalidateQueries({queryKey:["councils"]});setEditOpen(false);setSelected(null)},
  onError:e=>alert(errorMessage(e))
 })
 const addUser=useMutation({
  mutationFn:async()=> (await api.post(`/admin/councils/${selected!.id}/users`,{...uf,active:true})).data,
  onSuccess:()=>{qc.invalidateQueries({queryKey:["council-users",selected?.id]});setUserOpen(false);setUf({username:"",password:"",displayName:""})},
  onError:e=>alert(errorMessage(e))
 })
 const toggleUser=useMutation({
  mutationFn:async(u:CouncilUser)=> (await api.put(`/admin/users/${u.id}`,{username:u.username,password:"",displayName:u.displayName,active:!u.active})).data,
  onSuccess:()=>qc.invalidateQueries({queryKey:["council-users",selected?.id]}),
  onError:e=>alert(errorMessage(e))
 })

 function openEdit(c:Council){setSelected(c);setEditForm({...c});setEditOpen(true)}

 return <>
  <PageHeader title="Councils" description="Super Admin controls council tenants, council details and login accounts." action={<Button onClick={()=>setCreateOpen(true)}><Plus size={16}/>New council + login</Button>}/>
  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
   {councils.data?.map(c=><Card key={c.id} className="p-5">
    <div className="flex items-start justify-between">
     <div className="flex gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Building2 size={20}/></div><div><h3 className="font-bold">{c.name}</h3><p className="text-xs text-slate-500">{c.code} · {c.city}</p></div></div>
     <Badge tone={c.active?"green":"slate"}>{c.active?"Active":"Inactive"}</Badge>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><span className="block text-xs text-slate-500">Devices</span><b>{c.deviceCount}</b></div><div><span className="block text-xs text-slate-500">WhatsApp</span><b className="text-xs">{c.whatsappNumber||"Not set"}</b></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={()=>openEdit(c)}><Edit3 size={16}/>Edit</Button>
      <Button variant="outline" onClick={()=>setSelected(c)}><Users size={16}/>Logins</Button>
    </div>
   </Card>)}
  </div>

  <Dialog open={createOpen} onClose={()=>setCreateOpen(false)} title="Create Urban Council and first login" wide>
   <div className="grid gap-4 md:grid-cols-2">
    {Object.entries({code:"Council code",name:"Council name",city:"City",country:"Country",contactEmail:"Contact email",contactPhone:"Contact phone",whatsappNumber:"WhatsApp number",username:"Login username",password:"Login password",displayName:"Admin display name"}).map(([k,l])=><Field key={k} label={l}><Input type={k==="password"?"password":"text"} value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></Field>)}
   </div>
   <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setCreateOpen(false)}>Cancel</Button><Button onClick={()=>create.mutate()} disabled={create.isPending}>Create council</Button></div>
  </Dialog>

  <Dialog open={editOpen} onClose={()=>{setEditOpen(false);setSelected(null)}} title="Edit Urban Council" wide>
   <div className="grid gap-4 md:grid-cols-2">
    {Object.entries({code:"Council code",name:"Council name",city:"City",country:"Country",contactEmail:"Contact email",contactPhone:"Contact phone",whatsappNumber:"WhatsApp number"}).map(([k,l])=><Field key={k} label={l}><Input value={editForm[k]??""} onChange={e=>setEditForm({...editForm,[k]:e.target.value})}/></Field>)}
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium"><input type="checkbox" checked={!!editForm.active} onChange={e=>setEditForm({...editForm,active:e.target.checked})}/>Council active</label>
   </div>
   <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditOpen(false)}>Cancel</Button><Button onClick={()=>edit.mutate()}>Save council</Button></div>
  </Dialog>

  <Dialog open={!!selected&&!editOpen} onClose={()=>setSelected(null)} title={selected?`${selected.name} logins`:"Council logins"}>
   <div className="space-y-3">{users.data?.map(u=><div key={u.id} className="flex items-center justify-between rounded-xl border p-3"><div><b className="text-sm">{u.displayName}</b><div className="text-xs text-slate-500">{u.username}</div></div><div className="flex items-center gap-2"><Badge tone={u.active?"green":"slate"}>{u.active?"Active":"Inactive"}</Badge><Button size="sm" variant="ghost" onClick={()=>toggleUser.mutate(u)}>{u.active?"Disable":"Enable"}</Button></div></div>)}</div>
   <Button className="mt-4 w-full" onClick={()=>setUserOpen(true)}><Plus size={16}/>Add another login</Button>
  </Dialog>

  <Dialog open={userOpen} onClose={()=>setUserOpen(false)} title="Add council login">
   <div className="grid gap-4"><Field label="Username"><Input value={uf.username} onChange={e=>setUf({...uf,username:e.target.value})}/></Field><Field label="Display name"><Input value={uf.displayName} onChange={e=>setUf({...uf,displayName:e.target.value})}/></Field><Field label="Password"><Input type="password" value={uf.password} onChange={e=>setUf({...uf,password:e.target.value})}/></Field><Button onClick={()=>addUser.mutate()}>Create login</Button></div>
  </Dialog>
 </>
}
