import { fileService } from '@/api/fileService'
import { FileInfo, FileType } from '@/types/files'
import { useEffect, useState } from 'react'
import { YuzuLoading } from './Loading'
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid'

interface ThumbnailProps {
  file: FileInfo
  className?: string
}

export const YuzuThumbnail: React.FC<ThumbnailProps> = ({ file, className }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let currentUrl: string | null = null

    async function loadThumbnail() {
      if (file.type !== FileType.Image && file.type !== FileType.Video) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(false)
        const thumbnailData = await fileService.getThumbnail(file.path)
        const blob = new Blob([thumbnailData], { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)
        currentUrl = url
        setThumbnailUrl(url)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadThumbnail()

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [file.path, file.type])

  if (loading) {
    return <YuzuLoading className={className} />
  }

  if (error || thumbnailUrl == null) {
    const Icon = file.type === FileType.Image ? PhotoIcon : VideoCameraIcon
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded`}>
        <Icon className='w-8 h-8 text-gray-400' />
      </div>
    )
  }

  return (
    <img
      src={thumbnailUrl}
      alt={`${file.name}缩略图`}
      className={`${className} w-full h-full object-cover rounded`}
    />
  )
}
