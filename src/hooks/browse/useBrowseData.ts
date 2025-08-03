import { favoriteService } from '@/api/favoriteService'
import { fileService } from '@/api/fileService'
import { useBrowseStore } from '@/stores/browseStore'
import { toast } from '@/utils/toast'
import { useCallback, useEffect } from 'react'

/**
 * 文件浏览相关的数据逻辑Hook
 * 封装了文件加载、收藏夹管理等核心业务逻辑
 */
export const useBrowseData = () => {
  const {
    files,
    loading,
    path,
    setFiles,
    setLoading,
    setFavorites,
    setFavoriteFilesMap,
    requestPath,
  } = useBrowseStore()

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      const files = await fileService.getFiles(requestPath())
      setFiles(files)
    } catch {
      toast.show('加载文件失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [setFiles, setLoading, requestPath])

  // 加载收藏夹数据
  const loadFavorites = useCallback(async () => {
    try {
      const [favorites, favoriteFiles] = await Promise.all([
        favoriteService.getFavorites(),
        favoriteService.getAllFavoriteFiles(),
      ])

      setFavorites(favorites)

      const favoriteFilesMap = new Map<string, number>()
      favoriteFiles.forEach(favoriteFile => {
        favoriteFilesMap.set(favoriteFile.filePath, favoriteFile.id)
      })
      setFavoriteFilesMap(favoriteFilesMap)
    } catch {
      toast.show('加载收藏夹失败，请稍后重试')
    }
  }, [setFavorites, setFavoriteFilesMap])

  // 初始化数据加载
  useEffect(() => {
    loadFiles()
    loadFavorites()
  }, [loadFiles, loadFavorites])

  // 监听路径变化，重新加载文件
  useEffect(() => {
    loadFiles()
  }, [path, loadFiles])

  return {
    files,
    loading,
    loadFiles,
    loadFavorites,
  }
}
