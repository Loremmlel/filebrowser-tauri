import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'

interface YuzuVolumeIndicatorProps {
  isMuted: boolean
  volume: number
}

export const YuzuVolumeIndicator: React.FC<YuzuVolumeIndicatorProps> = ({ isMuted, volume }) => {
  return (
    <div className='absolute top-20 right-8 z-60 pointer-events-none'>
      <div className='bg-black/70 rounded-lg p-4 flex flex-col items-center min-w-[60px]'>
        {/* 音量图标 */}
        <div className='mb-3'>
          {isMuted || volume === 0 ? (
            <SpeakerXMarkIcon className='w-6 h-6 text-white' />
          ) : (
            <SpeakerWaveIcon className='w-6 h-6 text-white' />
          )}
        </div>

        {/* 竖直进度条 */}
        <div className='relative w-2 h-24 bg-white/30 rounded-full overflow-hidden'>
          <div
            className='absolute bottom-0 w-full bg-white transition-all duration-100 rounded-full'
            style={{ height: `${volume * 100}%` }}
          />
        </div>

        {/* 音量百分比 */}
        <span className='text-white text-xs mt-2'>{Math.round(volume * 100)}%</span>
      </div>
    </div>
  )
}
