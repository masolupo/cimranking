"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ActionResult = { error?: string; success?: string } | void;

export function ActionButton({
  action,
  children,
  confirmText,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "action"> & {
  action: () => Promise<ActionResult>;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        startTransition(async () => {
          const res = await action();
          if (res?.error) toast.error(res.error);
          else if (res?.success) toast.success(res.success);
        });
      }}
    >
      {children}
    </Button>
  );
}
