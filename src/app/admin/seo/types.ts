export type HubTab = "auto" | "pending" | "published" | "trash" | "import";

export type HubPagination = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};
