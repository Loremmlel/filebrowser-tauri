import { YuzuBottomNav } from '@/components/yuzu/BottomNav'
import { YuzuToastContainer } from '@/components/yuzu/ToastContainer'
import { YuzuThumbnailStatusBar } from '@/components/yuzu/ThumbnailStatusBar'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <YuzuToastContainer>
      <div className='flex flex-col h-screen bg-gray-50'>
        {/* 主内容区域 */}
        <main className='relative flex-1 overflow-hidden'>
          {children}
          {/* 缩略图状态栏 */}
          <YuzuThumbnailStatusBar />
        </main>

        {/* 底部导航 */}
        <YuzuBottomNav />
      </div>
    </YuzuToastContainer>
  )
}

