"use client";

// Forked from shadcn/ui toast primitive
import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  variant?: "default" | "destructive";
};

type ToasterToastWithAdded = ToasterToast & {
  open: boolean;
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const listeners = new Set<(toast: ToasterToastWithAdded[]) => void>();
const toasts: ToasterToastWithAdded[] = [];

function dispatch(action: Payload) {
  if (action.type === "ADD_TOAST") {
    const toast = action.toast;
    toasts.push({ ...toast, open: true });

    if (toasts.length > TOAST_LIMIT) {
      const popped = toasts.shift();
      if (popped) {
        dismissToast(popped.id);
      }
    }

    const duration = toast.duration ?? TOAST_REMOVE_DELAY;
    if (duration !== Infinity) {
      const timeout = setTimeout(() => dismissToast(toast.id), duration);
      toastTimeouts.set(toast.id, timeout);
    }
  } else if (action.type === "UPDATE_TOAST") {
    const index = toasts.findIndex((toast) => toast.id === action.toast.id);
    if (index !== -1) {
      toasts[index] = { ...toasts[index], ...action.toast };
    }
  } else if (action.type === "DISMISS_TOAST") {
    dismissToast(action.toastId);
  } else if (action.type === "REMOVE_TOAST") {
    if (action.toastId === "ALL") {
      toasts.splice(0, toasts.length);
    } else {
      const index = toasts.findIndex((toast) => toast.id === action.toastId);
      if (index !== -1) {
        toasts.splice(index, 1);
      }
    }
  }

  listeners.forEach((listener) => {
    listener([...toasts]);
  });
}

type Payload =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & Pick<ToasterToast, "id"> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string | "ALL" };

function dismissToast(toastId?: string) {
  toasts.forEach((toast) => {
    if (toastId === undefined || toast.id === toastId) {
      toast.open = false;
    }
  });

  if (toastId) {
    const timeout = toastTimeouts.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.delete(toastId);
    }
  }
}

export function useToast() {
  const [toastState, setToastState] = React.useState<ToasterToastWithAdded[]>(toasts);

  React.useEffect(() => {
    listeners.add(setToastState);
    return () => {
      listeners.delete(setToastState);
    };
  }, []);

  return {
    toasts: toastState,
    toast,
    dismiss,
  };
}

export function toast(props: Omit<ToasterToast, "id">) {
  const id = crypto.randomUUID();

  dispatch({ type: "ADD_TOAST", toast: { ...props, id } });

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (props: ToasterToast) =>
      dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } }),
  };
}

export function dismiss(toastId?: string) {
  dispatch({ type: "DISMISS_TOAST", toastId });
}
