import axios from "axios"
import { hrmdoSvc } from "@repo/axios-config/hrmdo-service"

axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true

if (import.meta.env.DEV) {
  hrmdoSvc.defaults.baseURL = "/hrmdo-api/"
}