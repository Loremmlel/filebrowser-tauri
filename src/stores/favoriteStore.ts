import { FavoriteDto } from '@/types/favorite'
import { create } from 'zustand'

interface FavoriteState {
  favorites: FavoriteDto[]
  loading: boolean
  selectedFavoriteIds: Set<number>
}

interface FavoriteStore extends FavoriteState {
  setFavorites: (favorites: FavoriteDto[]) => void
  setLoading: (loading: boolean) => void
  setSelectedFavoriteIds: (ids: number[]) => void
  toggleFavoriteSelection: (id: number) => void
  clearSelection: () => void
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  loading: false,
  selectedFavoriteIds: new Set(),

  setFavorites: favorites => set({ favorites }),
  setLoading: loading => set({ loading }),

  setSelectedFavoriteIds: ids => set({ selectedFavoriteIds: new Set(ids) }),
  toggleFavoriteSelection: id => {
    const { selectedFavoriteIds } = get()
    const newSelectedIds = new Set(selectedFavoriteIds)
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id)
    } else {
      newSelectedIds.add(id)
    }

    set({ selectedFavoriteIds: newSelectedIds })
  },

  clearSelection: () => set({ selectedFavoriteIds: new Set() }),
}))
