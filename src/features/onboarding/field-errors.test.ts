import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { placeFieldErrors } from "./field-errors";

const valuesShows = (f: string) => f === "values" || /^values\.\d+\.note$/.test(f) || f === "personToBecome";

const fromApi = (errors: { field: string; code: string }[]) =>
  ApiError.fromBody(400, { statusCode: 400, error: "Bad Request", code: "validation.failed", message: [], errors }).fieldErrors();

describe("placeFieldErrors", () => {
  it("puts the API path values.0.note under the note of the first chosen value", () => {
    const { placed, allPlaced } = placeFieldErrors(fromApi([{ field: "values.0.note", code: "maxLength" }]), valuesShows);
    expect(placed).toEqual([["values.0.note", "maxLength"]]);
    expect(allPlaced).toBe(true);
  });

  it("keeps the first rule per field", () => {
    const errors = fromApi([
      { field: "personToBecome", code: "isString" },
      { field: "personToBecome", code: "maxLength" },
    ]);
    expect(placeFieldErrors(errors, valuesShows).placed).toEqual([["personToBecome", "isString"]]);
  });

  it("asks for the form alert when a field has no place on the screen", () => {
    const some = placeFieldErrors(fromApi([{ field: "values.1.note", code: "maxLength" }, { field: "updatedAt", code: "whitelistValidation" }]), valuesShows);
    expect(some.placed).toEqual([["values.1.note", "maxLength"]]);
    expect(some.allPlaced).toBe(false);

    const none = placeFieldErrors(fromApi([{ field: "ageRange", code: "isIn" }]), (f) => f === "employmentStatus");
    expect(none).toEqual({ placed: [], allPlaced: false });
    // A validation error with no fields listed at all still needs the alert.
    expect(placeFieldErrors({}, valuesShows).allPlaced).toBe(false);
  });
});
