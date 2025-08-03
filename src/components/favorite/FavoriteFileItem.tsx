import { FileInfo, FileType } from '@/types/files'
import { getFileIcon } from '@/utils/iconUtil'
import { useMemo } from 'react'
import { Thumbnail } from '../yuzu/Thumbnail'

interface FavoriteHeaderProps {
  file: FileInfo
  onClick: () => void
}

export const FavoriteFileItem: React.FC<FavoriteHeaderProps> = ({ file, onClick }) => {
  const FileIcon = useMemo(() => getFileIcon(file.type), [file.type])

  return (
    <div
      onClick={onClick}
      className='w-20 h-20 bg-gray-50 rounded-lg border border-gray-200
    hover:shadow-md transition-shadow cursor-pointer overflow-hidden'
    >
      <div className='w-full h-full flex items-center justify-center p-2'>
        {file.type === FileType.Image || file.type === FileType.Video ? (
          <Thumbnail file={file} className='w-full h-full rounded' />
        ) : (
          FileIcon
        )}
      </div>
    </div>
  )
}
