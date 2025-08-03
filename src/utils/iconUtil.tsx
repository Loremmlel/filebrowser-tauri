import { FileType } from '@/types/files'
import { DocumentIcon, FolderIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

export function getFileIcon(fileType: FileType) {
  switch (fileType) {
    case FileType.Folder:
      return <FolderIcon className='w-12 h-12 text-blue-500' />
    case FileType.Image:
      return <PhotoIcon className='w-12 h-12 text-green-500' />
    case FileType.Video:
      return <VideoCameraIcon className='w-12 h-12 text-purple-500' />
    default:
      return <DocumentIcon className='w-12 h-12 text-gray-500' />
  }
}
