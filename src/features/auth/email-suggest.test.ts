import { describe, expect, it } from "vitest";
import { editDistance, suggestEmail } from "./email-suggest";

describe("editDistance", () => {
  it("counts single edits", () => {
    expect(editDistance("gmail.com", "gmail.com")).toBe(0);
    expect(editDistance("gmail.con", "gmail.com")).toBe(1);
    expect(editDistance("gmial.com", "gmail.com")).toBe(1);
    expect(editDistance("acme.com", "me.com")).toBe(2);
    expect(editDistance("", "abc")).toBe(3);
  });
});

describe("suggestEmail", () => {
  it("fixes common domain typos and keeps the local part as typed", () => {
    expect(suggestEmail("Lina@gmial.com")).toBe("Lina@gmail.com");
    expect(suggestEmail("lina@gmail.con")).toBe("lina@gmail.com");
    expect(suggestEmail("lina@hotmial.com")).toBe("lina@hotmail.com");
    expect(suggestEmail(" lina@outlok.com ")).toBe("lina@outlook.com");
    expect(suggestEmail("lina@GMAIL.CON")).toBe("lina@gmail.com");
    expect(suggestEmail("lina@protonmial.com")).toBe("lina@protonmail.com");
  });

  it("leaves known and unrelated domains alone", () => {
    expect(suggestEmail("lina@gmail.com")).toBeNull();
    expect(suggestEmail("lina@mail.com")).toBeNull();
    expect(suggestEmail("lina@acme.com")).toBeNull();
    expect(suggestEmail("lina@university.edu")).toBeNull();
  });

  it("ignores input that is not an address yet", () => {
    expect(suggestEmail("")).toBeNull();
    expect(suggestEmail("lina")).toBeNull();
    expect(suggestEmail("lina@")).toBeNull();
    expect(suggestEmail("@gmail.com")).toBeNull();
    expect(suggestEmail("a@b@gmial.com")).toBeNull();
  });
});
