import { authSvc } from "@repo/axios-config"
export const useAuth = () => {

    const check = () => {
       return authSvc.get('user').then(() => true).catch(() => false)
    }

    return {
        check
    }
}