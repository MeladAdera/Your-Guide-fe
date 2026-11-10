import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft, draftKey, fillFromDraft, readDraft, writeDraft } from "./drafts";
import { textDefaults } from "@/features/onboarding/text-screens";
import { valuesDefaults } from "@/features/onboarding/values";

describe("drafts", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a screen's answers under its yg: key and reads them back", () => {
    writeDraft("situation", { typicalDay: "Most days I work late.", wantToChange: "" });
    expect(draftKey("situation")).toBe("yg:draft:situation");
    expect(readDraft("situation")).toEqual({ typicalDay: "Most days I work late.", wantToChange: "" });
  });

  it("leaves no draft when nothing is written, and clears on save", () => {
    writeDraft("patterns", { oftenPostpone: "Calling" });
    writeDraft("patterns", { oftenPostpone: "   ", patternToChange: "" });
    expect(localStorage.getItem("yg:draft:patterns")).toBeNull();

    writeDraft("values", { values: [{ value: "family", note: "" }], personToBecome: "" });
    clearDraft("values");
    expect(readDraft("values")).toBeNull();
  });

  it("ignores a broken or foreign stored value", () => {
    localStorage.setItem("yg:draft:situation", "{not json");
    expect(readDraft("situation")).toBeNull();
    localStorage.setItem("yg:draft:situation", "[1,2]");
    expect(readDraft("situation")).toBeNull();
  });

  it("fills only the fields the server left empty; a saved answer wins", () => {
    const saved = { typicalDay: "Saved day.", wantToChange: null, satisfiedWith: "" };
    const draft = { typicalDay: "Draft day.", wantToChange: "Draft change.", satisfiedWith: "  ", wishMoreTimeFor: "Reading." };
    expect(textDefaults("situation", fillFromDraft(saved, draft))).toEqual({
      typicalDay: "Saved day.",
      wantToChange: "Draft change.",
      satisfiedWith: "",
      wishMoreTimeFor: "Reading.",
    });
    expect(fillFromDraft(saved, null)).toBe(saved);
    expect(textDefaults("situation", fillFromDraft(null, draft)).typicalDay).toBe("Draft day.");
  });

  it("restores value picks only into an empty list, and drops anything unknown", () => {
    const draft = {
      values: [{ value: "family", note: "Them." }, { value: "fame" }, { value: "family" }, "health", { value: "health", note: 3 }],
      personToBecome: 42,
    };
    expect(valuesDefaults(fillFromDraft(null, draft))).toEqual({
      values: [
        { value: "family", note: "Them." },
        { value: "health", note: "" },
      ],
      personToBecome: "",
      wouldRegretNotDoing: "",
      rememberedFor: "",
    });
    const saved = { values: [{ value: "learning", note: null }], personToBecome: "Kind." };
    expect(valuesDefaults(fillFromDraft(saved, draft)).values).toEqual([{ value: "learning", note: "" }]);
  });
});
