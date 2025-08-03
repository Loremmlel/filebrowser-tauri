import { BreadCrumbItem } from '@/components/browse/BreadCrumb'
import { FavoriteDto } from '@/types/favorite'
import { FileInfo } from '@/types/files'
import { create } from 'zustand'

interface BrowseState {
  files: FileInfo[]
  loading: boolean
  currentPath: BreadCrumbItem[]

  previewItem: FileInfo | null

  favorites: FavoriteDto[]
  favoriteFilesMap: Map<string, number>
  currentFavoriteFile: FileInfo | null

  supportHevc: boolean | null
}

interface BrowseStore extends BrowseState {
  setFiles: (files: FileInfo[]) => void
  setLoading: (loading: boolean) => void
  setCurrentPath: (path: BreadCrumbItem[]) => void
  setPreviewItem: (item: FileInfo | null) => void

  setFavorites: (favorites: FavoriteDto[]) => void
  setFavoriteFilesMap: (map: Map<string, number>) => void

  setCurrentFavoriteFile: (file: FileInfo | null) => void
  setSupportHevc: (support: boolean) => void

  requestPath: () => string
  isFileFavorite: (filePath: string) => boolean
}

export const useBrowseStore = create<BrowseStore>((set, get) => ({
  files: [],
  loading: false,
  currentPath: [],
  previewItem: null,
  favorites: [],
  favoriteFilesMap: new Map(),
  currentFavoriteFile: null,
  supportHevc: null,

  setFiles: files => set({ files }),
  setLoading: loading => set({ loading }),
  setCurrentPath: currentPath => set({ currentPath }),
  setPreviewItem: previewItem => set({ previewItem }),
  setFavorites: favorites => set({ favorites }),
  setFavoriteFilesMap: favoriteFilesMap => set({ favoriteFilesMap }),
  setCurrentFavoriteFile: currentFavoriteFile => set({ currentFavoriteFile }),
  setSupportHevc: supportHevc => set({ supportHevc }),

  requestPath: () => {
    const { currentPath } = get()
    return currentPath.map(item => item.name).join('/')
  },

  isFileFavorite: filePath => {
    const { favoriteFilesMap } = get()
    return favoriteFilesMap.has(filePath)
  },
}))
