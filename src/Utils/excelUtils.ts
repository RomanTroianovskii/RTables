//src/utils/excelUtils.ts

import * as XLSX from "xlsx";

export const exportTableToExcel = (data: string[][]): void => {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, "table.xlsx");
};

export const importExcelFile = (file: File, onSuccess: (data: string[][]) => void): void => {
  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (!e.target?.result) return;
    const data = new Uint8Array(e.target.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const newTableData: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    onSuccess(newTableData);
  };
  reader.readAsArrayBuffer(file);
}
