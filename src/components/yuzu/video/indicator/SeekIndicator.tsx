import { formatTime } from '@/utils/stringUtil'
import { ChevronDoubleLeftIcon } from '@heroicons/react/24/outline'
import { ChevronDoubleRightIcon } from '@heroicons/react/24/solid'

interface YuzuSeekIndicatorProps {
  seekDirection: 'forward' | 'backward' | null
  seekTime: number
  duration: number
}

export const YuzuSeekIndicator: React.FC<YuzuSeekIndicatorProps> = ({
  seekDirection,
  seekTime,
  duration,
}) => {
  return (
    <div className='absolute inset-0 flex items-center justify-center z-60 pointer-events-none'>
      <div className='bg-black/70 rounded-lg p-6 flex flex-col items-center'>
        {seekDirection === 'forward' ? (
          <ChevronDoubleRightIcon className='w-12 h-12 text-white mb-2' />
        ) : (
          <ChevronDoubleLeftIcon className='w-12 h-12 text-white mb-2' />
        )}
        <span className='text-white text-sm'>
          {formatTime(seekTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
