"use client";

import { useTranslations } from "next-intl";
import { useState, type ComponentProps, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & { id: string };

/**
 * A password field with Show/Hide and a Caps Lock warning. Accepts
 * react-hook-form's `register` props like a plain input.
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

  return (
    <div className="grid gap-1.5">
      {/* Passwords are typed left to right in every language; the button sits at the field's end. */}
      <div className="relative" dir="ltr">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          dir="ltr"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={describedByIds}
          className={cn("pe-16", className)}
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
          className="absolute inset-y-0 end-0 flex items-center rounded-e-md px-3 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {visible ? t("hidePassword") : t("showPassword")}
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
