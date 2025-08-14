export function createEmptyTable(rows: number, cols: number): string[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => "")
    );
  }
  