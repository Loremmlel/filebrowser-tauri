use std::{io::Cursor, path::Path};

use image::{imageops::FilterType, GenericImageView};
use serde::Deserialize;

use crate::{
    models::{
        error::ApiError,
        files::{FileType, ToFileType},
    },
    repos::{offline::OfflineRepo, thumbnails_repo::ThumbnailsRepo, Repo},
};

pub struct OfflineThumbnailsRepo;

#[derive(Debug, Deserialize)]
struct FFprobeOutput {
    streams: Option<Vec<FFStream>>,
    format: FFFormat,
}

#[derive(Debug, Deserialize)]
struct FFStream {
    codec_type: String,
    duration: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FFFormat {
    duration: Option<String>,
}

const THUMBNAIL_MAX_WIDTH: u32 = 256;
const THUMBNAIL_MAX_HEIGHT: u32 = 256;

impl Repo for OfflineThumbnailsRepo {
    type Id = String;

    type Item = Vec<u8>;

    type CreateRequest = ();

    type UpdateRequest = ();

    async fn get(id: Self::Id) -> Result<Self::Item, ApiError> {
        let path_string = format!("{}{}", &Self::get_base_dir(), id);
        let file_type = std::path::Path::new(&path_string).to_file_type();
        match file_type {
            FileType::Image => Self::get_image_thumbnail(path_string).await,
            FileType::Video => Self::get_video_thumbnail(path_string).await,
            _ => Err(ApiError::new(404, "不支持提取缩略图的类型".to_string())),
        }
    }
}

impl OfflineRepo for OfflineThumbnailsRepo {}

impl ThumbnailsRepo for OfflineThumbnailsRepo {
    async fn get_image_thumbnail(id: Self::Id) -> Result<Self::Item, ApiError> {
        let img =
            image::open(id).map_err(|e| ApiError::new(500, format!("打开图片失败: {}", e)))?;
        let (width, height) = img.dimensions();

        let (scaled_width, scaled_height) =
            if width <= THUMBNAIL_MAX_WIDTH && height <= THUMBNAIL_MAX_HEIGHT {
                (width, height)
            } else {
                let ratio = (THUMBNAIL_MAX_WIDTH as f32 / width as f32)
                    .min(THUMBNAIL_MAX_HEIGHT as f32 / height as f32);
                (
                    (width as f32 * ratio) as u32,
                    (height as f32 * ratio) as u32,
                )
            };

        let thumbnail = img.resize(scaled_width, scaled_height, FilterType::Lanczos3);

        let mut buf = Cursor::new(Vec::new());
        thumbnail
            .write_to(&mut buf, image::ImageFormat::Png)
            .map_err(|e| ApiError::new(500, format!("写入缩略图失败: {}", e)))?;

        Ok(buf.into_inner())
    }

    async fn get_video_thumbnail(id: Self::Id) -> Result<Self::Item, ApiError> {
        let duration_secs = Self::get_video_duration_secs(Path::new(&id))?;

        if duration_secs <= 0.0 {
            return Err(ApiError::new(500, "视频时长无效".to_string()));
        }

        let start_time = duration_secs * 0.1;
        let end_time = duration_secs * 0.9;
        let random_seek_time = rand::random_range(start_time..end_time);

        let temp_output_path =
            std::env::temp_dir().join(format!("thumbnail_{}.jpg", rand::random::<u64>()));

        let output = std::process::Command::new("ffmpeg")
            .args([
                "-ss",
                &random_seek_time.to_string(),
                "-i",
                &id,
                "-vframes",
                "1",
                "-q:v",
                "2",
                "-y",
                temp_output_path.to_str().unwrap_or_default(),
            ])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .output()
            .map_err(|e| ApiError::new(500, format!("执行ffmpeg失败: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ApiError::new(500, format!("ffmpeg错误: {}", stderr)));
        }

        let thumbnail_bytes =
            Self::get_image_thumbnail(temp_output_path.to_string_lossy().into_owned()).await?;

        let _ = std::fs::remove_file(temp_output_path);

        Ok(thumbnail_bytes)
    }
}

impl OfflineThumbnailsRepo {
    fn get_video_duration_secs(path: &Path) -> Result<f64, ApiError> {
        let output = std::process::Command::new("ffprobe")
            .args([
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                path.to_str().unwrap_or_default(),
            ])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .output()
            .map_err(|e| ApiError::new(500, format!("执行ffprobe失败: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ApiError::new(500, format!("ffprobe错误: {}", stderr)));
        }

        let json_str = String::from_utf8_lossy(&output.stdout);
        let ffprobe_data: FFprobeOutput = serde_json::from_str(&json_str)
            .map_err(|e| ApiError::new(500, format!("解析ffprobe输出失败: {}", e)))?;

        if let Some(duration_str) = ffprobe_data.format.duration {
            if let Ok(d) = duration_str.parse::<f64>() {
                return Ok(d);
            }
        }
        if let Some(duration_str) = ffprobe_data
            .streams
            .and_then(|s| s.into_iter().find(|st| st.codec_type == "video"))
            .and_then(|sf| sf.duration.clone())
        {
            if let Ok(d) = duration_str.parse::<f64>() {
                return Ok(d);
            }
        }
        Err(ApiError::new(500, "无法获取视频时长".to_string()))
    }
}
