import axios from "axios";

export function getAxiosStatus(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }
  return null;
}
