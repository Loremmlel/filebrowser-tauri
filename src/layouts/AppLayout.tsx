import { BottomNav } from '@/components/yuzu/BottomNav'
import { ToastContainer } from '@/components/yuzu/Toast'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <ToastContainer>
      <div className='flex flex-col h-screen bg-gray-50'>
        {/* 主内容区域 */}
        <main className='flex-1 overflow-hidden'>{children}</main>

        {/* 底部导航 */}
        <BottomNav />
      </div>
    </ToastContainer>
  )
}
