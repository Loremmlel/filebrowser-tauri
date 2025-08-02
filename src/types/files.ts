export interface FileInfo {
  name: string;
  size: number;
  isDirectory: boolean;
  type: FileType;
  lastModified: number;
  path: string;
}

export enum FileType {
  Folder = "Folder",
  Image = "Image",
  Video = "Video",
  Other = "Other",
}
