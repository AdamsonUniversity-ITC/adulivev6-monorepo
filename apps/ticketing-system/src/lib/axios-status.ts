import axios from "axios";

export function getAxiosStatus(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }
  return null;
}

export function getAxiosMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}
