// src/notify.ts
import { toast } from "react-toastify";

// All app toasts go through here: severity by intent, dedup id always
// (defaults to the message so repeat triggers update in place, not stack).
// Look/behavior comes only from the ToastContainer in App.tsx.
export const notify = {
  success: (message: string, id?: string, onClick?: () => void) =>
    toast.success(message, { toastId: id ?? message, onClick }),
  info: (message: string, id?: string, onClick?: () => void) =>
    toast.info(message, { toastId: id ?? message, onClick }),
  error: (message: string, id?: string, onClick?: () => void) =>
    toast.error(message, { toastId: id ?? message, onClick }),
  dismiss: (id: string) => toast.dismiss(id),
};
