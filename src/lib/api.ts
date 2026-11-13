import axios from "axios"
const api = axios.create({ baseURL: "https://smartdrain.info/smartdrain-backend/api" })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartdrain_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(r=>r, err=>{
  if(err.response?.status===401){ localStorage.removeItem("smartdrain_token"); localStorage.removeItem("smartdrain_user"); }
  return Promise.reject(err)
})
export default api
export const errorMessage = (e:unknown) => axios.isAxiosError(e) ? (e.response?.data?.message ?? e.message) : e instanceof Error ? e.message : "Request failed"
