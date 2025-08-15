use std::{
    path::{Path, PathBuf},
    time::Duration,
};
use once_cell::sync::Lazy;
use tauri::{AppHandle, Emitter};
use tokio::{
    fs,
    io::{AsyncBufReadExt, BufReader},
    process::Child,
    sync::Mutex,
    time::sleep,
};
use uuid::Uuid;

use crate::{
    models::{
        error::ApiError,
        files::{FileType, ToFileType},
        transcode::{TranscodeState, TranscodeStatus},
    },
    repos::{offline::OfflineRepo, Repo},
};

static CURRENT_TASK: Mutex<Option<TranscodeTask>> = Mutex::const_new(None);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::const_new(None);

static DURATION_REGEX: Lazy<regex::Regex> = Lazy::new(|| regex::Regex::new(r"Duration: (\d+):(\d+):(\d+\.\d+)").unwrap());
static TIME_REGEX: Lazy<regex::Regex> = Lazy::new(|| regex::Regex::new(r"time=(\d+):(\d+):(\d+\.\d+)").unwrap());

pub struct OfflineTranscodeRepo;

impl Repo for OfflineTranscodeRepo {
    type Id = String;

    type Item = TranscodeStatus;

    type CreateRequest = String;

    type UpdateRequest = ();

    async fn create(data: Self::CreateRequest) -> Result<Self::Item, ApiError> {
        let file_path_string = format!("{}/{}", Self::get_base_dir(), data);
        let file_path = Path::new(&file_path_string);

        if file_path.to_file_type() != FileType::Video {
            return Err(ApiError::new(400, "文件不是视频格式".to_string()));
        }

        let id = Uuid::new_v4().to_string();
        let cache_dir = Self::get_cache_dir();
        let output_dir = cache_dir.join(&id);

        fs::create_dir_all(&output_dir)
            .await
            .map_err(|e| ApiError::new(500, format!("无法创建输出目录: {}", e)))?;

        let mut status = TranscodeStatus {
            id: id.clone(),
            status: TranscodeState::Pending,
            progress: 0.0,
            output_path: Some(format!("{}/playlist.m3u8", output_dir.display())),
            error: None,
        };

        let mut current_task = CURRENT_TASK.lock().await;
        if current_task.is_some() {
            return Err(ApiError::new(409, "已有转码任务正在进行".to_string()));
        }

        let task = TranscodeTask {
            id: id.clone(),
            status: status.clone(),
            process: None,
            output_dir: output_dir.clone(),
        };
        *current_task = Some(task);
        drop(current_task);

        tokio::spawn(async move {
            if let Err(e) = Self::execute_transcode(file_path_string, id).await {
                if let Some(app) = APP_HANDLE.lock().await.as_ref() {
                    let _ = app.emit("transcode-error", format!("转码任务失败: {}", e));
                }
            }
        });
        Self::wait_for_first_segment(&output_dir).await?;
        status.status = TranscodeState::Completed;
        Ok(status)
    }

    async fn delete(id: Self::Id) -> Result<bool, ApiError> {
        let mut current_task = CURRENT_TASK.lock().await;

        if let Some(task) = current_task.take() {
            if task.id == id {
                if let Some(mut process) = task.process {
                    let _ = process.kill().await;
                }

                if let Err(e) = fs::remove_dir_all(&task.output_dir).await {
                    eprintln!("无法删除输出目录: {}", e);
                }

                Ok(true)
            } else {
                *current_task = Some(task);
                Err(ApiError::new(404, "没有找到对应的转码任务".to_string()))
            }
        } else {
            Err(ApiError::new(404, "没有找到对应的转码任务".to_string()))
        }
    }
}

impl OfflineRepo for OfflineTranscodeRepo {}

#[derive(Debug)]
struct TranscodeTask {
    id: String,
    status: TranscodeStatus,
    process: Option<Child>,
    output_dir: PathBuf,
}

impl OfflineTranscodeRepo {
    fn get_cache_dir() -> PathBuf {
        PathBuf::from(&Self::get_base_dir()).join(".cache")
    }

    pub async fn set_app_handle(app: &AppHandle) {
        let mut app_lock = APP_HANDLE.lock().await;
        *app_lock = Some(app.clone());
    }

    async fn execute_transcode(file_path: String, id: String) -> Result<(), ApiError> {
        let hwaccel_config = Self::detect_hardware_acceleration().await;
        let cache_dir = Self::get_cache_dir();
        let output_dir = cache_dir.join(&id);
        let playlist_file = output_dir.join("playlist.m3u8");

        let mut command = tokio::process::Command::new("ffmpeg");

        if let Some(hwaccel) = &hwaccel_config.hwaccel {
            command.args(["-hwaccel", hwaccel]);
        }
        if let Some(hwaccel_output_format) = &hwaccel_config.hwaccel_output_format {
            command.args(["-hwaccel_output_format", hwaccel_output_format]);
        }
        command.args(["-i", &file_path]);
        command.args(["-c:v", &hwaccel_config.encoder]);
        command.args(["-preset", &hwaccel_config.preset]);
        for arg in &hwaccel_config.extra_args {
            command.arg(arg);
        }

        command.args([
            "-c:a",
            "copy",
            "-f",
            "hls",
            "-g",
            "90",
            "-hls_time",
            "9",
            "-hls_list_size",
            "0",
            "-hls_flags",
            "append_list+temp_file",
            "-hls_segment_filename",
            &format!("{}/segment%04d.ts", output_dir.display()),
        ]);
        command.arg(&playlist_file.to_string_lossy().into_owned());

        let child = command
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| ApiError::new(500, format!("无法启动转码进程: {}", e)))?;

        {
            let mut current_task = CURRENT_TASK.lock().await;
            if let Some(task) = current_task.as_mut() {
                task.process = Some(child);
                task.status.status = TranscodeState::Processing;
            }
        }

        Self::monitor_transcode().await;

        let mut current_task = CURRENT_TASK.lock().await;
        let Some(mut process) = current_task.as_mut().and_then(|t| t.process.take()) else {
            return Err(ApiError::new(500, "转码任务未找到".to_string()));
        };
        let exit_status = process
            .wait()
            .await
            .map_err(|e| ApiError::new(500, format!("转码进程等待失败: {}", e)))?;
        if let Some(task) = current_task.as_mut() {
            if exit_status.success() {
                task.status.status = TranscodeState::Completed;
                task.status.progress = 1.0;
            } else {
                task.status.status = TranscodeState::Error;
                task.status.error =
                    Some(format!("ffmpeg进程退出，状态码: {:?}", exit_status.code()));
            }

            if let Some(app) = APP_HANDLE.lock().await.as_ref() {
                let _ = app.emit("transcode-status", &task.status);
            }
        }

        if exit_status.success() {
            Ok(())
        } else {
            Err(ApiError::new(
                500,
                format!("转码进程异常退出，状态码: {:?}", exit_status.code()),
            ))
        }
    }

    async fn monitor_transcode() {
        let (stderr, task_id) = {
            let mut current_task = CURRENT_TASK.lock().await;
            let task = current_task.as_mut().expect("当前任务应该存在");
            let stderr = task
                .process
                .as_mut()
                .and_then(|p| p.stderr.take())
                .expect("stderr应该设置管道");
            (stderr, task.id.clone())
        };

        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        let mut duration = 0.0;

        while let Ok(Some(line)) = lines.next_line().await {
            // 解析时长
            if let Some(captures) = DURATION_REGEX.captures(&line) {
                if let (Ok(h), Ok(m), Ok(s)) = (
                    captures[1].parse::<f64>(),
                    captures[2].parse::<f64>(),
                    captures[3].parse::<f64>(),
                ) {
                    duration = h * 3600.0 + m * 60.0 + s;
                }
            }

            // 解析当前时间并计算进度
            if let Some(captures) = TIME_REGEX.captures(&line) {
                if duration > 0.0 {
                    if let (Ok(h), Ok(m), Ok(s)) = (
                        captures[1].parse::<f64>(),
                        captures[2].parse::<f64>(),
                        captures[3].parse::<f64>(),
                    ) {
                        let current_time = h * 3600.0 + m * 60.0 + s;
                        let progress = current_time / duration;

                        let mut current_task = CURRENT_TASK.lock().await;
                        if let Some(task) = current_task.as_mut() {
                            if task.id == task_id {
                                task.status.progress = progress;
                                let status = task.status.clone();
                                drop(current_task);

                                if let Some(app) = APP_HANDLE.lock().await.as_ref() {
                                    let _ = app.emit("transcode-status", status);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    async fn wait_for_first_segment(output_dir: &Path) -> Result<(), ApiError> {
        let playlist_file = output_dir.join("playlist.m3u8");
        let first_segment = output_dir.join("segment0000.ts");

        for _ in 0..300 {
            if playlist_file.exists() && first_segment.exists() {
                return Ok(());
            }
            sleep(Duration::from_millis(100)).await;
        }

        Err(ApiError::new(500, "等待第一个分段文件超时".to_string()))
    }
}

#[derive(Debug, Clone)]
struct HwaccelConfig {
    encoder: String,
    preset: String,
    hwaccel: Option<String>,
    hwaccel_output_format: Option<String>,
    extra_args: Vec<String>,
}

impl OfflineTranscodeRepo {
    async fn detect_hardware_acceleration() -> HwaccelConfig {
        let os = std::env::consts::OS;

        match os {
            "macos" => {
                if Self::check_videotoolbox_support().await {
                    HwaccelConfig {
                        encoder: "h264_videotoolbox".to_string(),
                        preset: "medium".to_string(),
                        hwaccel: None,
                        hwaccel_output_format: None,
                        extra_args: vec![
                            "-allow_sw".to_string(),
                            "1".to_string(),
                            "-realtime".to_string(),
                            "0".to_string(),
                        ],
                    }
                } else {
                    Self::get_cpu_config()
                }
            }
            "windows" => {
                if Self::check_nvidia_nvenc_support().await {
                    HwaccelConfig {
                        encoder: "h264_nvenc".to_string(),
                        preset: "p6".to_string(),
                        hwaccel: Some("cuda".to_string()),
                        hwaccel_output_format: Some("cuda".to_string()),
                        extra_args: vec![],
                    }
                } else if Self::check_intel_qsv_support().await {
                    HwaccelConfig {
                        encoder: "h264_qsv".to_string(),
                        preset: "medium".to_string(),
                        hwaccel: Some("qsv".to_string()),
                        hwaccel_output_format: Some("qsv".to_string()),
                        extra_args: vec![],
                    }
                } else if Self::check_amd_amf_support().await {
                    HwaccelConfig {
                        encoder: "h264_amf".to_string(),
                        preset: "speed".to_string(),
                        hwaccel: None,
                        hwaccel_output_format: None,
                        extra_args: vec![
                            "-usage".to_string(),
                            "transcoding".to_string(),
                            "-profile".to_string(),
                            "main".to_string(),
                        ],
                    }
                } else {
                    Self::get_cpu_config()
                }
            }
            _ => Self::get_cpu_config(),
        }
    }

    fn get_cpu_config() -> HwaccelConfig {
        HwaccelConfig {
            encoder: "libx264".to_string(),
            preset: "fast".to_string(),
            hwaccel: None,
            hwaccel_output_format: None,
            extra_args: vec!["-crf".to_string(), "25".to_string()],
        }
    }

    async fn check_videotoolbox_support() -> bool {
        match tokio::process::Command::new("ffmpeg")
            .args(["-hide_banner", "-encoders"])
            .output()
            .await
        {
            Ok(output) => String::from_utf8_lossy(&output.stdout).contains("h264_videotoolbox"),
            Err(_) => false,
        }
    }

    async fn check_nvidia_nvenc_support() -> bool {
        if tokio::process::Command::new("nvidia-smi")
            .output()
            .await
            .is_err()
        {
            return false;
        }

        match tokio::process::Command::new("ffmpeg")
            .args(["-hide_banner", "-encoders"])
            .output()
            .await
        {
            Ok(output) => String::from_utf8_lossy(&output.stdout).contains("h264_nvenc"),
            Err(_) => false,
        }
    }

    async fn check_intel_qsv_support() -> bool {
        match tokio::process::Command::new("ffmpeg")
            .args(["-hide_banner", "-encoders"])
            .output()
            .await
        {
            Ok(output) => String::from_utf8_lossy(&output.stdout).contains("h264_qsv"),
            Err(_) => false,
        }
    }

    async fn check_amd_amf_support() -> bool {
        match tokio::process::Command::new("ffmpeg")
            .args(["-hide_banner", "-encoders"])
            .output()
            .await
        {
            Ok(output) => String::from_utf8_lossy(&output.stdout).contains("h264_amf"),
            Err(_) => false,
        }
    }
}
