import { describe, expect, it } from "vitest";
import { InMemoryParchmentService } from "../src/application/in-memory-parchment-service";

describe("InMemoryParchmentService", () => {
  it("creates a notebook with 60 pages and makes the first page retrievable", () => {
    const service = new InMemoryParchmentService();

    service.createNotebook("nb1");

    const firstPage = service.getPage("notebook-nb1-page-0");

    expect(firstPage).toBeDefined();
    expect(firstPage?.kind).toBe("notebook-page");
  });

  it("returns a clip group after it is created", () => {
    const service = new InMemoryParchmentService();

    service.createClipGroup("cg1");

    const clipGroup = service.getClipGroup("cg1");

    expect(clipGroup).toBeDefined();
    expect(clipGroup?.id).toBe("cg1");
  });
  it("removes a page from its notebook after tearOutPage",() =>{
    const service = new InMemoryParchmentService();

    service.createNotebook("nb1");
    service.tearOutPage("notebook-nb1-page-0");
    const notebook=service.getNotebook("nb1");
    expect(notebook).toBeDefined();
    expect(notebook?.pages.some((page) => page.id==="notebook-nb1-page-0")).toBe(false);
  });

  it("throws when tearOutPage is called on a loose-leaf page",() =>{
    const service = new InMemoryParchmentService();
    service.createLooseLeafPage("llp1",[],1000);
    expect(() => service.tearOutPage("llp1")).toThrowError();
  });

  it("initializes notebook currentPageIndex to 0 when created", () => {
  const service = new InMemoryParchmentService();

  service.createNotebook("nb1");

  const notebook = service.getNotebook("nb1");

  expect(notebook).toBeDefined();
  expect(notebook?.currentPageSlotIndex).toBe(0);
});
  it("returns the current page of a notebook", () => {
  const service = new InMemoryParchmentService();

  service.createNotebook("nb1");

  const page = service.getCurrentNotebookPage("nb1");

  expect(page).toBeDefined();
  expect(page?.id).toBe("notebook-nb1-page-0");
  expect(page?.kind).toBe("notebook-page");
});
  it("wraps to the first page when going past the last notebook page", () => {
  const service = new InMemoryParchmentService();

  service.createNotebook("nb1");

  for (let i = 0; i < 60; i++) {
    service.goToNextPage("nb1");
  }

  const page = service.getCurrentNotebookPage("nb1");

  expect(page).toBeDefined();
  expect(page?.id).toBe("notebook-nb1-page-0");
});

  it("moves focus to the next remaining page when tearing out the current page", () => {
    const service = new InMemoryParchmentService();

    service.createNotebook("nb1");
    service.tearOutPage("notebook-nb1-page-0");

    const currentPage = service.getCurrentNotebookPage("nb1");

    expect(currentPage).toBeDefined();
    expect(currentPage?.id).toBe("notebook-nb1-page-1");
    expect(currentPage?.slotIndex).toBe(1);
  });

  it("keeps the current page unchanged when tearing out a different notebook page", () => {
    const service = new InMemoryParchmentService();

    service.createNotebook("nb1");
    service.tearOutPage("notebook-nb1-page-1");

    const currentPage = service.getCurrentNotebookPage("nb1");

    expect(currentPage).toBeDefined();
    expect(currentPage?.id).toBe("notebook-nb1-page-0");
    expect(currentPage?.slotIndex).toBe(0);
  });

  it("throws when clipLooseleaf is called on a notebook page", () => {
    const service = new InMemoryParchmentService();

    service.createNotebook("nb1");
    service.createClipGroup("cg1");

    expect(() => service.clipLooseleaf("notebook-nb1-page-0", "cg1")).toThrowError();
  });

  it("returns a clip-group page back to a loose-leaf page when torn out from the clip group", () => {
    const service = new InMemoryParchmentService();

    service.createNotebook("nb1");
    service.createClipGroup("cg1");
    service.tearOutPage("notebook-nb1-page-0");
    service.clipLooseleaf("notebook-nb1-page-0", "cg1");

    service.tearOutPage("notebook-nb1-page-0");

    const page = service.getPage("notebook-nb1-page-0");
    const clipGroup = service.getClipGroup("cg1");

    expect(page).toBeDefined();
    expect(page?.kind).toBe("loose-leaf-page");
    expect(clipGroup?.pages).toHaveLength(0);
  });

  it("supports a deterministic notebook-to-loose-leaf-to-clip-group-to-loose-leaf chain", () => {
    const service = new InMemoryParchmentService();

    service.createNotebook("nb1");
    service.createClipGroup("cg1");

    service.tearOutPage("notebook-nb1-page-0");
    expect(service.getPage("notebook-nb1-page-0")?.kind).toBe("loose-leaf-page");

    service.clipLooseleaf("notebook-nb1-page-0", "cg1");
    expect(service.getPage("notebook-nb1-page-0")?.kind).toBe("clip-group-page");

    service.tearOutPage("notebook-nb1-page-0");

    const page = service.getPage("notebook-nb1-page-0");
    const clipGroup = service.getClipGroup("cg1");

    expect(page?.kind).toBe("loose-leaf-page");
    expect(clipGroup?.pages.map((groupPage) => groupPage.id)).not.toContain("notebook-nb1-page-0");
  });
});

