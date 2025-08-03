import { FileType } from '../files'

export interface AddFileToFavoriteRequest {
  filename: string
  filePath: string
  isDirectory: boolean
  fileType: FileType
  lastModified: number
  fileSize: number
}
