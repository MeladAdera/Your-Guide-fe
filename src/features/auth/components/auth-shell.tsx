"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { LocaleSwitch } from "@/features/settings/components/locale-switch";
import { cn } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

type Mode = "sign-in" | "sign-up";
type Phase = "intro" | "filling";

function modeOf(pathname: string): Mode {
  if (pathname === "/sign-in") return "sign-in";
  if (pathname === "/sign-up") return "sign-up";
  throw new Error(`AuthShell rendered on an unexpected path: ${pathname}`);
}

const IMAGE = "/images/auth-journey.png";
const EASE = "ease-[cubic-bezier(0.77,0,0.18,1)]";
/** The illustration is light mint; in dark mode it is dimmed so it sits in the dark ground. */
const IMAGE_TONE = "dark:brightness-[0.45] dark:saturate-[0.7]";

/**
 * The sign-in / sign-up screen. It lives in the (auth) layout, which stays
 * mounted across /sign-in ⇄ /sign-up, so both forms and the image are always
 * rendered and the switch is a CSS transition driven by the pathname. The
 * pages themselves render nothing; moving a form into its page would make it
 * vanish halfway through the slide.
 *
 * Laptop: a large rounded card on the sage ground holds both forms side by
 * side; an inset photo tile with a message for the other form glides over the
 * inactive one (the image inside moves a little the other way). On short
 * windows the card scales down so it always fits. Phone: a hero with the photo
 * and a headline, the form in a sheet over it; a 200% wide row of the two
 * forms slides by half, and the first focus on a field collapses the hero.
 *
 * This screen is the design reference for the whole app (docs/DESIGN.md).
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const mode = modeOf(usePathname());
  const isUp = mode === "sign-up";
  const [phase, setPhase] = useState<Phase>("intro");
  const filling = phase === "filling";
  const t = useTranslations();
  const name = t("app.name");
  const year = new Date().getFullYear();

  const heroes = [
    { mode: "sign-in", title: t("auth.login.heroTitle"), body: t("auth.login.heroBody") },
    { mode: "sign-up", title: t("auth.register.heroTitle"), body: t("auth.register.heroBody") },
  ] as const;

  const sections = [
    { mode: "sign-in", headingId: "signin-heading", title: t("auth.login.title"), intro: t("auth.login.intro"), form: <SignInForm /> },
    { mode: "sign-up", headingId: "signup-heading", title: t("auth.register.title"), intro: t("auth.register.intro"), form: <SignUpForm /> },
  ] as const;

  // The photo tile speaks to the other form: on sign-in it shows the sign-up message, and back.
  const invites = [
    { mode: "sign-in", title: t("auth.register.heroTitle"), body: t("auth.register.heroBody") },
    { mode: "sign-up", title: t("auth.login.heroTitle"), body: t("auth.login.heroBody") },
  ] as const;

  return (
    <div className="relative flex min-h-dvh flex-col bg-background lg:items-center lg:justify-center lg:bg-muted lg:px-8 lg:pt-17 lg:pb-4">
      {children}

      {/* Laptop: brand and language above the card, the year below it. */}
      <header className="absolute inset-x-0 top-0 hidden items-center justify-between px-10 py-5 lg:flex">
        <BrandMark name={name} />
        <LocaleSwitch compact />
      </header>
      <footer className="absolute inset-x-0 bottom-0 hidden px-10 py-4 text-sm text-muted-foreground lg:block">
        © {year} {name}
      </footer>

      {/* Phone hero: image, logo row, headline. Collapses to the logo row while filling. */}
      <div className="relative lg:hidden">
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-0 h-[44dvh] overflow-hidden bg-illustration transition-opacity duration-500 motion-reduce:transition-none",
            EASE,
            filling && "opacity-0",
          )}
        >
          <Image src={IMAGE} alt="" fill fetchPriority="high" sizes="100vw" className={cn("object-cover object-[100%_40%]", IMAGE_TONE)} />
        </div>
        <div className="relative z-10 flex h-17 items-center justify-between px-5">
          <BrandMark name={name} />
          <LocaleSwitch compact />
        </div>
        <div
          aria-hidden={filling}
          className={cn(
            "absolute inset-x-0 top-17 z-10 grid px-5 pt-3 transition duration-500 motion-reduce:transition-none",
            EASE,
            filling && "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          {heroes.map((hero) => (
            <div
              key={hero.mode}
              aria-hidden={hero.mode !== mode}
              className={cn("[grid-area:1/1] transition-opacity duration-200 motion-reduce:transition-none", hero.mode === mode ? "opacity-100" : "opacity-0")}
            >
              <p className="max-w-[13ch] text-[1.75rem] leading-tight font-semibold tracking-tight">{hero.title}</p>
              <p className="mt-2 max-w-[24ch] text-base">{hero.body}</p>
            </div>
          ))}
        </div>
        {/* The only height that changes: the hero's room below the logo row. */}
        <div
          aria-hidden
          className={cn("transition-[height] duration-500 motion-reduce:transition-none", EASE, filling ? "h-6" : "h-[calc(44dvh-4.25rem)]")}
        />
      </div>

      {/* The card. Phone: a sheet over the hero, a 200% row that slides by half. Laptop: a framed card, both forms side by side, a photo tile inset over one of them. */}
      <div className="relative z-10 -mt-6 flex-1 rounded-t-3xl bg-background lg:mt-0 lg:w-full lg:max-w-[1320px] [@media(min-width:1024px)_and_(min-height:701px)_and_(max-height:820px)]:[zoom:0.92] [@media(min-width:1024px)_and_(max-height:700px)]:[zoom:0.82] lg:flex-none lg:rounded-[28px] lg:shadow-[0_30px_80px_-30px_rgb(15_61_53/0.35)]">
        <div className="overflow-hidden lg:overflow-visible">
          <div
            onFocus={(e) => {
              // Only a field starts filling. A tapped button or link also takes focus, and
              // collapsing the hero under the finger would make that tap miss.
              if (e.target.matches("input, select, textarea")) setPhase("filling");
            }}
            className={cn(
              // The slide is phone-only; scoping it with max-lg keeps the rtl rule from overriding the laptop layout.
              "grid w-[200%] grid-cols-2 transition-transform duration-500 motion-reduce:transition-none lg:w-full lg:transition-none",
              EASE,
              isUp && "max-lg:-translate-x-1/2 max-lg:rtl:translate-x-1/2",
            )}
          >
            {sections.map((section) => (
              <section key={section.mode} inert={section.mode !== mode} className="flex min-w-0 flex-col">
                <div className="flex flex-1 justify-center px-5 pt-7 pb-8 lg:items-center lg:px-16 lg:py-12">
                  <div className="w-full max-w-[360px] lg:max-w-[460px]">
                    <div
                      className={cn(
                        "mb-7 lg:mb-8",
                        filling ? "max-lg:animate-in max-lg:fade-in max-lg:slide-in-from-bottom-2 max-lg:duration-500" : "max-lg:hidden",
                      )}
                    >
                      <h1 id={section.headingId} className="text-3xl font-semibold tracking-tight text-balance lg:text-5xl lg:leading-tight">
                        {section.title}
                      </h1>
                      <p className="mt-2 text-muted-foreground lg:mt-3 lg:text-lg">{section.intro}</p>
                    </div>
                    <Suspense>{section.form}</Suspense>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Laptop: the photo tile, inset in the card, glides over the inactive form with a message for the other one. */}
        <div
          className={cn(
            "absolute top-3 bottom-3 end-3 z-20 hidden w-[calc(50%-0.75rem)] overflow-hidden rounded-[22px] bg-illustration transition-transform duration-700 motion-reduce:transition-none lg:block",
            EASE,
            isUp && "-translate-x-full rtl:translate-x-full",
          )}
        >
          <div
            aria-hidden
            className={cn(
              // The photo fills the lower part of the tile and fades in at its top edge, leaving
              // plain mint above for the message.
              "absolute -inset-x-[10%] top-[30%] bottom-0 [mask-image:linear-gradient(to_bottom,transparent,black_18%)] transition-transform duration-700 motion-reduce:transition-none",
              EASE,
              isUp && "translate-x-[8%] rtl:-translate-x-[8%]",
            )}
          >
            <Image src={IMAGE} alt="" fill fetchPriority="high" sizes="50vw" className={cn("object-cover object-[100%_50%]", IMAGE_TONE)} />
          </div>
          <div className="absolute inset-0 grid">
            {invites.map((invite) => {
              const shown = invite.mode === mode;
              return (
                <div
                  key={invite.mode}
                  inert={!shown}
                  className={cn(
                    "[grid-area:1/1] flex flex-col items-start px-14 pt-14 text-start transition-opacity motion-reduce:transition-none",
                    // The old message leaves fast; the new one arrives once the tile has mostly moved.
                    shown ? "opacity-100 delay-300 duration-300" : "opacity-0 duration-150",
                  )}
                >
                  <p className="max-w-[17ch] text-4xl leading-tight font-semibold tracking-tight text-balance">{invite.title}</p>
                  <p className="mt-4 max-w-[32ch] text-lg text-muted-foreground">{invite.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phone, while filling: the image as a quiet decoration at the bottom. */}
      <div aria-hidden className={cn("transition-[height] duration-500 motion-reduce:transition-none lg:hidden", EASE, filling ? "h-[30dvh]" : "h-0")} />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[30dvh] overflow-hidden bg-illustration transition-opacity duration-500 motion-reduce:transition-none lg:hidden",
          EASE,
          filling ? "opacity-100" : "opacity-0",
        )}
      >
        <Image src={IMAGE} alt="" fill sizes="100vw" className={cn("object-cover object-[60%_50%]", IMAGE_TONE)} />
        <p className="absolute start-5 bottom-4 text-sm">
          © {year} {name}
        </p>
      </div>
    </div>
  );
}

