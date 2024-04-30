import type { Pager } from './base'

export interface LovePhotoModel {
  id?: string
  title: string
  descrip?: string
  colors?: string
  time?: string
  key?: string
  hasPhotos?: string
}

export interface LovePhotoResponse {
  data: LovePhotoModel[]
  pagination: Pager
}
