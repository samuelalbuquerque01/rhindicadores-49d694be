import { useEffect, useMemo, useState } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export function usePagination(options?: UsePaginationOptions) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 25, 50],
  } = options || {};

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, pageSize]);

  const setPage = (value: number) => {
    const safe = Math.min(Math.max(value, 1), totalPages);
    setPageState(safe);
  };

  const setPageSize = (value: number) => {
    setPageSizeState(value);
    setPageState(1);
  };

  useEffect(() => {
    if (page > totalPages) {
      setPageState(totalPages);
    }
  }, [page, totalPages]);

  return {
    page,
    pageSize,
    totalPages,
    totalCount,
    pageSizeOptions,
    setPage,
    setPageSize,
    setTotalCount,
  };
}
