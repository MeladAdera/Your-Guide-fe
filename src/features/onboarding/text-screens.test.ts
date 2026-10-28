import { describe, expect, it } from "vitest";
import { TEXT_SCREENS, textDefaults, textPayload, textSchema } from "./text-screens";

describe("text screens", () => {
  it("covers every field of the four screens, required ones first", () => {
    for (const questions of Object.values(TEXT_SCREENS)) {
      const firstOptional = questions.findIndex((q) => !q.required);
      expect(questions.slice(firstOptional).every((q) => !q.required)).toBe(true);
    }
    expect(TEXT_SCREENS.situation.filter((q) => q.required).map((q) => q.name)).toEqual(["typicalDay", "wantToChange"]);
  });

  it("starts empty, or with what was saved", () => {
    expect(textDefaults("patterns", null)).toEqual({ oftenPostpone: "", lessonFromMistake: "", patternToChange: "" });
    expect(textDefaults("patterns", { oftenPostpone: "Emails", lessonFromMistake: null, updatedAt: "x" })).toEqual({
      oftenPostpone: "Emails",
      lessonFromMistake: "",
      patternToChange: "",
    });
  });

  it("requires the required answers and trims before counting", () => {
    const r = textSchema("achievements").safeParse({ proudOf: "   ", whatWasHard: "", learnedAboutSelf: "" });
    expect(r.error?.issues.map((i) => [i.path[0], i.message])).toEqual([["proudOf", "required"]]);
  });

  it("allows 3000 characters for who I am and 1000 elsewhere", () => {
    const base = textDefaults("selfView", null);
    expect(textSchema("selfView").safeParse({ ...base, whoIAm: "a".repeat(3000) }).success).toBe(true);
    expect(textSchema("selfView").safeParse({ ...base, whoIAm: "a", goodAt: "a".repeat(1001) }).error?.issues[0].message).toBe("maxLength");
  });

  it("sends every field, trimmed, empty optional answers as null", () => {
    expect(textPayload("patterns", { oftenPostpone: "  Calling the bank  ", lessonFromMistake: " ", patternToChange: "" })).toEqual({
      oftenPostpone: "Calling the bank",
      lessonFromMistake: null,
      patternToChange: null,
    });
  });
});
