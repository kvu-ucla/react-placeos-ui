// src/notify.ts
import { toast } from "react-toastify";

// All app toasts go through here: severity by intent, dedup id always
// (defaults to the message so repeat triggers update in place, not stack).
// Look/behavior comes only from the ToastContainer in App.tsx.
export const notify = {
  success: (message: string, id?: string) =>
    toast.success(message, { toastId: id ?? message }),
  info: (message: string, id?: string) =>
    toast.info(message, { toastId: id ?? message }),
  error: (message: string, id?: string) =>
    toast.error(message, { toastId: id ?? message }),
  dismiss: (id: string) => toast.dismiss(id),
};
