const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

/** Case-insensitive, number-aware name comparison. */
export function compareNames(a: string | null | undefined, b: string | null | undefined) {
  return collator.compare(a ?? "", b ?? "");
}

export function sortSectionsByName<T extends { section_name: string }>(
  sections: readonly T[],
): T[] {
  return [...sections].sort((a, b) =>
    compareNames(a.section_name, b.section_name),
  );
}

export function sortCategoriesByName<T extends { name: string }>(
  categories: readonly T[],
): T[] {
  return [...categories].sort((a, b) => compareNames(a.name, b.name));
}

/** Orders a board's sections and categories by name, leaving other fields alone. */
export function sortBoardLists<
  T extends {
    sections?: Array<{ section_name: string }>;
    categories?: Array<{ name: string }>;
  },
>(board: T): T {
  return {
    ...board,
    ...(board.sections ? { sections: sortSectionsByName(board.sections) } : {}),
    ...(board.categories
      ? { categories: sortCategoriesByName(board.categories) }
      : {}),
  };
}
