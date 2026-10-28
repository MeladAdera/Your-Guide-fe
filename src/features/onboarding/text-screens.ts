import { z } from "zod";

/** The four screens made only of written answers (docs/handoff.md §8). */
export type TextScreen = "situation" | "achievements" | "patterns" | "selfView";

export interface TextQuestion {
  /** The API field, also the message key under `onboarding.questions`. */
  name: string;
  max: number;
  /** Required questions show at once with a starter phrase; optional ones sit under "Add more". */
  required: boolean;
}

const q = (name: string, required = false, max = 1000): TextQuestion => ({ name, required, max });

export const TEXT_SCREENS: Record<TextScreen, TextQuestion[]> = {
  situation: [q("typicalDay", true), q("wantToChange", true), q("satisfiedWith"), q("wishMoreTimeFor")],
  achievements: [q("proudOf", true), q("whatWasHard"), q("learnedAboutSelf")],
  patterns: [q("oftenPostpone", true), q("lessonFromMistake"), q("patternToChange")],
  selfView: [q("whoIAm", true, 3000), q("goodAt"), q("othersComeToMeFor"), q("stillFiguringOut")],
};

export function isTextScreen(screen: string): screen is TextScreen {
  return screen in TEXT_SCREENS;
}

export type TextValues = Record<string, string>;

/** Rule codes from the `validation` namespace; limits mirror the API. */
export function textSchema(screen: TextScreen) {
  return z.object(
    Object.fromEntries(
      TEXT_SCREENS[screen].map(({ name, required, max }) => {
        const text = z.string().trim().max(max, "maxLength");
        return [name, required ? text.min(1, "required") : text];
      }),
    ),
  );
}

/** Form values from what the API returned, or empty strings. */
export function textDefaults(screen: TextScreen, saved: Record<string, unknown> | null): TextValues {
  return Object.fromEntries(TEXT_SCREENS[screen].map(({ name }) => [name, typeof saved?.[name] === "string" ? (saved[name] as string) : ""]));
}

/** The PUT body: every field of the screen, trimmed, empty optional answers as null. */
export function textPayload(screen: TextScreen, values: TextValues): Record<string, string | null> {
  const v = textSchema(screen).parse(values) as TextValues;
  return Object.fromEntries(TEXT_SCREENS[screen].map(({ name }) => [name, v[name] || null]));
}
