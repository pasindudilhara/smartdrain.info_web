import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import api from "./api"
import type { AuthUser, LoginResponse } from "./types"

type Ctx = { user:AuthUser|null; token:string|null; login:(username:string,password:string)=>Promise<AuthUser>; logout:()=>void }
const AuthContext=createContext<Ctx|null>(null)
function readUser(){try{return JSON.parse(localStorage.getItem("smartdrain_user")||"null") as AuthUser|null}catch{return null}}
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<AuthUser|null>(readUser); const [token,setToken]=useState<string|null>(()=>localStorage.getItem("smartdrain_token"))
 const login=async(username:string,password:string)=>{const {data}=await api.post<LoginResponse>("/auth/login",{username,password});localStorage.setItem("smartdrain_token",data.token);localStorage.setItem("smartdrain_user",JSON.stringify(data.user));setToken(data.token);setUser(data.user);return data.user}
 const logout=()=>{localStorage.removeItem("smartdrain_token");localStorage.removeItem("smartdrain_user");setToken(null);setUser(null)}
 const value=useMemo(()=>({user,token,login,logout}),[user,token])
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(){const c=useContext(AuthContext);if(!c)throw new Error("AuthProvider missing");return c}
