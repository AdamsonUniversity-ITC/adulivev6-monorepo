import React, { SetStateAction, useState } from "react";

export type UseDataTableReturn = {
  keyword: string;
  setKeyword: React.Dispatch<SetStateAction<string>>;
  rows: number;
  setRows: React.Dispatch<SetStateAction<number>>;
  page: number;
  setPage: React.Dispatch<SetStateAction<number>>;
};

export const useDataTable = (): UseDataTableReturn => {
  const [keyword, setKeyword] = useState<string>("");
  const [rows, setRows] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  return {
    keyword,
    setKeyword,
    rows,
    setRows,
    page,
    setPage,
  };
};
