import { FileType } from "./files";

export interface FavoriteDto {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
  files: FavoriteFileDto[];
}

export interface FavoriteFileDto {
  id: number;
  favoriteId: number;
  filename: string;
  fileSize: number;
  fileType: FileType;
  filePath: string;
  lastModified: number;
  isDirectory: boolean;
  createdAt: number;
}
