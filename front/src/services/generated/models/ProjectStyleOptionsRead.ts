/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StyleOption } from './StyleOption';
/**
 * 项目风格与视频参数候选项。
 */
export type ProjectStyleOptionsRead = {
    /**
     * 视觉风格可选项
     */
    visual_styles?: Array<StyleOption>;
    /**
     * 按视觉风格分组的视频风格选项
     */
    styles_by_visual_style?: Record<string, Array<StyleOption>>;
    /**
     * 各视觉风格默认视频风格
     */
    default_style_by_visual_style?: Record<string, string>;
    /**
     * 默认视频比例（用于创建项目时的初始值）
     */
    default_video_ratio?: (string | null);
    /**
     * 默认视频尺寸（用于创建项目时的初始值）
     */
    default_video_size?: (string | null);
    /**
     * 视频比例候选项
     */
    video_ratios?: Array<StyleOption>;
    /**
     * 视频尺寸候选项
     */
    video_sizes?: Array<StyleOption>;
};

