SET @has_projects_default_video_size = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'default_video_size'
);

SET @add_projects_default_video_size = IF(
  @has_projects_default_video_size = 0,
  "ALTER TABLE projects ADD COLUMN default_video_size VARCHAR(32) NULL COMMENT '项目级默认视频尺寸（可为空；分镜未覆盖时使用）'",
  'SELECT 1'
);
PREPARE stmt_add_projects_default_video_size FROM @add_projects_default_video_size;
EXECUTE stmt_add_projects_default_video_size;
DEALLOCATE PREPARE stmt_add_projects_default_video_size;

SET @has_projects_default_video_ratio = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'default_video_ratio'
);

SET @add_projects_default_video_ratio = IF(
  @has_projects_default_video_ratio = 0,
  "ALTER TABLE projects ADD COLUMN default_video_ratio VARCHAR(16) NULL COMMENT '项目级默认视频比例（可为空；分镜未覆盖时使用）'",
  'SELECT 1'
);
PREPARE stmt_add_projects_default_video_ratio FROM @add_projects_default_video_ratio;
EXECUTE stmt_add_projects_default_video_ratio;
DEALLOCATE PREPARE stmt_add_projects_default_video_ratio;

SET @has_shot_details_override_video_size = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'shot_details'
    AND COLUMN_NAME = 'override_video_size'
);

SET @add_shot_details_override_video_size = IF(
  @has_shot_details_override_video_size = 0,
  "ALTER TABLE shot_details ADD COLUMN override_video_size VARCHAR(32) NULL COMMENT '分镜级视频尺寸覆盖（为空表示继承项目默认）'",
  'SELECT 1'
);
PREPARE stmt_add_shot_details_override_video_size FROM @add_shot_details_override_video_size;
EXECUTE stmt_add_shot_details_override_video_size;
DEALLOCATE PREPARE stmt_add_shot_details_override_video_size;

SET @has_shot_details_override_video_ratio = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'shot_details'
    AND COLUMN_NAME = 'override_video_ratio'
);

SET @add_shot_details_override_video_ratio = IF(
  @has_shot_details_override_video_ratio = 0,
  "ALTER TABLE shot_details ADD COLUMN override_video_ratio VARCHAR(16) NULL COMMENT '分镜级视频比例覆盖（为空表示继承项目默认）'",
  'SELECT 1'
);
PREPARE stmt_add_shot_details_override_video_ratio FROM @add_shot_details_override_video_ratio;
EXECUTE stmt_add_shot_details_override_video_ratio;
DEALLOCATE PREPARE stmt_add_shot_details_override_video_ratio;
