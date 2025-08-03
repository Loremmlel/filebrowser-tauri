interface LoadingProps {
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div className={`${className} flex items-center justify-center bg-gray-100 rounded`}>
      <div
        className='w-6 h-6 border-2 border-blue-500 
      border-t-transparent rounded-full animate-spin'
      />
    </div>
  )
}
