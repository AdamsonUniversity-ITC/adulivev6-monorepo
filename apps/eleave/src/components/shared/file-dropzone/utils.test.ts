import { describe, expect, it } from "vitest"

import {
  DEFAULT_DOCUMENT_ACCEPT,
  getAcceptedFileLabel,
  getFileKindFromMime,
} from "./utils"

describe("DEFAULT_DOCUMENT_ACCEPT", () => {
  it("allows jfif under jpeg and webp as its own type", () => {
    expect(DEFAULT_DOCUMENT_ACCEPT["image/jpeg"]).toEqual([
      ".jpg",
      ".jpeg",
      ".jfif",
    ])
    expect(DEFAULT_DOCUMENT_ACCEPT["image/webp"]).toEqual([".webp"])
  })

  it("includes jfif and webp in the accepted file label", () => {
    const label = getAcceptedFileLabel(DEFAULT_DOCUMENT_ACCEPT)

    expect(label).toContain("JFIF")
    expect(label).toContain("WEBP")
  })
})

describe("getFileKindFromMime", () => {
  it("treats jfif and webp extensions as images", () => {
    expect(getFileKindFromMime(null, "scan.jfif")).toBe("image")
    expect(getFileKindFromMime(null, "photo.webp")).toBe("image")
    expect(getFileKindFromMime("image/webp", "photo.webp")).toBe("image")
  })
})
