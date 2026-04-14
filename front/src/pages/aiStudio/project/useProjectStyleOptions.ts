import { useEffect, useMemo, useState } from 'react'
import { StudioProjectsService } from '../../../services/generated'
import type { ProjectStyleOptionsRead } from '../../../services/generated'
import type { ProjectStyleFieldOptions } from './ProjectVisualStyleAndStyleFields'

const FALLBACK_OPTIONS: ProjectStyleFieldOptions = {
  visualStyles: [
    { value: '现实', label: '现实' },
    { value: '动漫', label: '动漫' },
  ],
  stylesByVisual: {
    现实: [
      { value: '真人都市', label: '真人都市' },
      { value: '真人科幻', label: '真人科幻' },
      { value: '真人古装', label: '真人古装' },
    ],
    动漫: [
      { value: '动漫科幻', label: '动漫科幻' },
      { value: '动漫3D', label: '动漫3D' },
      { value: '国漫', label: '国漫' },
      { value: '水墨画', label: '水墨画' },
    ],
  },
  defaultStyleByVisual: {
    现实: '真人都市',
    动漫: '动漫3D',
  },
}

type OptionItem = { value: string; label: string }
type ProjectStyleOptionsSnapshot = {
  options: ProjectStyleFieldOptions
  videoSizeOptions: OptionItem[]
  videoRatioOptions: OptionItem[]
  defaultVideoSize: string
  defaultVideoRatio: string
}

let cachedSnapshot: ProjectStyleOptionsSnapshot | null = null
let loadingSnapshotPromise: Promise<ProjectStyleOptionsSnapshot> | null = null
const FALLBACK_DEFAULT_VIDEO_SIZE = '1920x1080'
const FALLBACK_DEFAULT_VIDEO_RATIO = '16:9'

function normalizeOptionItems(items: OptionItem[] | null | undefined): OptionItem[] {
  if (!Array.isArray(items)) return []
  return items.filter((item) => item && typeof item.value === 'string' && typeof item.label === 'string')
}

function normalizeStyleOptions(raw: ProjectStyleOptionsRead | null | undefined): ProjectStyleFieldOptions {
  const visualStyles = normalizeOptionItems(raw?.visual_styles as OptionItem[] | undefined)
  const stylesByVisualRaw = (raw?.styles_by_visual_style ?? {}) as Record<string, OptionItem[]>
  const stylesByVisual: Record<string, OptionItem[]> = Object.fromEntries(
    Object.entries(stylesByVisualRaw).map(([key, list]) => [key, normalizeOptionItems(list)]),
  )
  const defaultStyleByVisual = ((raw?.default_style_by_visual_style ?? {}) as Record<string, string>) || {}
  if (!visualStyles.length || !Object.keys(stylesByVisual).length) {
    return FALLBACK_OPTIONS
  }
  return {
    visualStyles,
    stylesByVisual,
    defaultStyleByVisual,
  }
}

function resolveDefaultStyle(options: ProjectStyleFieldOptions, visual: string): string {
  return (
    options.defaultStyleByVisual?.[visual] ??
    options.stylesByVisual?.[visual]?.[0]?.value ??
    ''
  )
}

/**
 * 加载并缓存项目风格配置，保证多个页面/弹窗共享同一次请求结果。
 */
async function loadProjectStyleOptionsSnapshot(): Promise<ProjectStyleOptionsSnapshot> {
  if (cachedSnapshot) return cachedSnapshot
  if (loadingSnapshotPromise) return loadingSnapshotPromise
  loadingSnapshotPromise = (async () => {
    try {
      const res = await StudioProjectsService.getProjectStyleOptionsApiV1StudioProjectsStyleOptionsGet()
      const data = res.data
      const snapshot: ProjectStyleOptionsSnapshot = {
        options: normalizeStyleOptions(data ?? undefined),
        videoSizeOptions: normalizeOptionItems((data?.video_sizes ?? []) as OptionItem[]),
        videoRatioOptions: normalizeOptionItems((data?.video_ratios ?? []) as OptionItem[]),
        defaultVideoSize: data?.default_video_size ?? FALLBACK_DEFAULT_VIDEO_SIZE,
        defaultVideoRatio: data?.default_video_ratio ?? FALLBACK_DEFAULT_VIDEO_RATIO,
      }
      cachedSnapshot = snapshot
      return snapshot
    } catch {
      const snapshot: ProjectStyleOptionsSnapshot = {
        options: FALLBACK_OPTIONS,
        videoSizeOptions: [],
        videoRatioOptions: [],
        defaultVideoSize: FALLBACK_DEFAULT_VIDEO_SIZE,
        defaultVideoRatio: FALLBACK_DEFAULT_VIDEO_RATIO,
      }
      cachedSnapshot = snapshot
      return snapshot
    } finally {
      loadingSnapshotPromise = null
    }
  })()
  return loadingSnapshotPromise
}

export function useProjectStyleOptions() {
  const [options, setOptions] = useState<ProjectStyleFieldOptions>(cachedSnapshot?.options ?? FALLBACK_OPTIONS)
  const [videoSizeOptions, setVideoSizeOptions] = useState<OptionItem[]>(cachedSnapshot?.videoSizeOptions ?? [])
  const [videoRatioOptions, setVideoRatioOptions] = useState<OptionItem[]>(cachedSnapshot?.videoRatioOptions ?? [])
  const [defaultVideoSize, setDefaultVideoSize] = useState<string>(cachedSnapshot?.defaultVideoSize ?? FALLBACK_DEFAULT_VIDEO_SIZE)
  const [defaultVideoRatio, setDefaultVideoRatio] = useState<string>(cachedSnapshot?.defaultVideoRatio ?? FALLBACK_DEFAULT_VIDEO_RATIO)

  useEffect(() => {
    let active = true
    void (async () => {
      const snapshot = await loadProjectStyleOptionsSnapshot()
      if (!active) return
      setOptions(snapshot.options)
      setVideoSizeOptions(snapshot.videoSizeOptions)
      setVideoRatioOptions(snapshot.videoRatioOptions)
      setDefaultVideoSize(snapshot.defaultVideoSize)
      setDefaultVideoRatio(snapshot.defaultVideoRatio)
    })()
    return () => {
      active = false
    }
  }, [])

  const defaultVisualStyle = useMemo(() => options.visualStyles[0]?.value ?? '现实', [options])
  const getDefaultStyle = useMemo(
    () => (visual: string) => resolveDefaultStyle(options, visual),
    [options],
  )

  return {
    options,
    videoSizeOptions,
    videoRatioOptions,
    defaultVideoSize,
    defaultVideoRatio,
    defaultVisualStyle,
    getDefaultStyle,
  }
}
