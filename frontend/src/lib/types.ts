export interface SubItem {
  id: string;
  title: string;
}

export interface TocItem {
  id: string;
  title: string;
  active?: boolean;
  subItems?: SubItem[];
}
export interface InfoboxRow {
  label: string;
  value: string | string[];
  type?: "badge" | "text";
}

export interface InfoboxData {
  image: string;
  imageAlt: string;
  description?: string;
  rows: InfoboxRow[];
}
