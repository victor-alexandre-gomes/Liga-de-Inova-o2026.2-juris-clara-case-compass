import { describe, expect, it } from "vitest";
import { parseArticleQuery } from "./wiki";

describe("pesquisa por número de artigo", () => {
  it("reconhece formatos comuns", () => {
    expect(parseArticleQuery("art. 5")).toBe("5");
    expect(parseArticleQuery("artigo 18º")).toBe("18");
    expect(parseArticleQuery("291")).toBe("291");
  });
  it("ignora texto que não é artigo", () => {
    expect(parseArticleQuery("consumidor")).toBeNull();
  });
});
