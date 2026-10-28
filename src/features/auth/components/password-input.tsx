"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ComponentProps, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & { id: string };

/**
 * A password field with a lock icon, a show/hide eye button and a Caps Lock
 * warning. Accepts react-hook-form's `register` props like a plain input.
 */
export function PasswordInput({ id, className, onKeyDown, onKeyUp, onBlur, "aria-describedby": describedBy, ...props }: PasswordInputProps) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const readCaps = (e: KeyboardEvent<HTMLInputElement>) => {
    // getModifierState is absent on some synthetic events (autofill); keep the last answer then.
    if (typeof e.getModifierState === "function") setCapsLock(e.getModifierState("CapsLock"));
  };
  const capsId = `${id}-caps`;
  const describedByIds = [describedBy, capsLock ? capsId : null].filter(Boolean).join(" ") || undefined;
  const EyeIcon = visible ? EyeOff : Eye;

  return (
    <div className="grid gap-1.5">
      {/* Passwords are typed left to right in every language; icons sit at the field's edges. */}
      <div className="relative" dir="ltr">
        <Lock aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          dir="ltr"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={describedByIds}
          className={cn("h-12 ps-11 pe-12", className)}
          onKeyDown={(e) => {
            readCaps(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            readCaps(e);
            onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
          {...props}
        />
        <button
          type="button"
          aria-controls={id}
          aria-pressed={visible}
          aria-label={visible ? t("hidePasswordLabel") : t("showPasswordLabel")}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <EyeIcon aria-hidden className="size-5" />
        </button>
      </div>
      {capsLock ? (
        <p id={capsId} role="status" className="inline-flex w-fit items-center gap-1.5 rounded-md bg-ink px-2 py-1 text-xs font-medium text-ink-foreground">
          {t("capsLock")}
        </p>
      ) : null}
    </div>
  );
}
