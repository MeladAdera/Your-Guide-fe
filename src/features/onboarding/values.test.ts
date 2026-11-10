import { describe, expect, it } from "vitest";
import { valuesDefaults, valuesPayload, valuesSchema } from "./values";

const filled = { ...valuesDefaults(null), personToBecome: "Someone who finishes things." };

describe("values", () => {
  it("starts empty, or with the saved picks in their order", () => {
    expect(valuesDefaults(null).values).toEqual([]);
    expect(valuesDefaults({ values: [{ value: "health" }, { value: "family", note: "Them." }] }).values).toEqual([
      { value: "health", note: "" },
      { value: "family", note: "Them." },
    ]);
  });

  it("asks for two to five values", () => {
    const one = valuesSchema.safeParse({ ...filled, values: [{ value: "family", note: "" }] });
    expect(one.error?.issues[0]).toMatchObject({ path: ["values"], message: "arrayMinSize" });
    const two = valuesSchema.safeParse({ ...filled, values: [{ value: "family", note: "" }, { value: "health", note: "" }] });
    expect(two.success).toBe(true);
  });

  it("keeps notes to 300 characters and requires the person to become", () => {
    const r = valuesSchema.safeParse({
      ...valuesDefaults(null),
      values: [{ value: "family", note: "a".repeat(301) }, { value: "health", note: "" }],
    });
    expect(r.error?.issues.map((i) => [i.path.join("."), i.message])).toEqual([
      ["values.0.note", "maxLength"],
      ["personToBecome", "required"],
    ]);
  });

  it("sends trimmed text, empty notes and answers as null", () => {
    expect(
      valuesPayload({ ...filled, values: [{ value: "learning", note: "  Always.  " }, { value: "creativity", note: " " }], rememberedFor: "  " }),
    ).toEqual({
      values: [{ value: "learning", note: "Always." }, { value: "creativity", note: null }],
      personToBecome: "Someone who finishes things.",
      wouldRegretNotDoing: null,
      rememberedFor: null,
    });
  });
});
