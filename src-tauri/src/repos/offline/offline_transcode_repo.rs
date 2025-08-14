use std::{
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
};
use tauri::{AppHandle, Emitter};
use tokio::{
    fs,
    io::{AsyncBufReadExt, BufReader},
    process::Child,
    sync::Mutex,
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

static TRANSCODE_ACTIVE: AtomicBool = AtomicBool::new(false);
static CURRENT_TASK: Mutex<Option<TranscodeTask>> = Mutex::const_new(None);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::const_new(None);

pub struct OfflineTranscodeRepo;

impl Repo for OfflineTranscodeRepo {
    type Id = String;

    type Item = TranscodeStatus;

    type CreateRequest = String;

    type UpdateRequest = ();

    async fn create(data: Self::CreateRequest) -> Result<Self::Item, ApiError> {
        if TRANSCODE_ACTIVE.load(Ordering::Relaxed) {
            return Err(ApiError::new(400, "有转码任务正在进行中".to_string()));
        }
        let path_string = format!("{}/{}", Self::get_base_dir(), data);

        let path = Path::new(&path_string);
        if !path.exists() {
            return Err(ApiError::new(404, "文件不存在".to_string()));
        }
        if path.to_file_type() != FileType::Video {
            return Err(ApiError::new(400, "只能转码视频文件".to_string()));
        }

        let id = Uuid::new_v4().to_string();
        let cache_dir = Self::get_cache_dir();
        let output_dir = cache_dir.join(&id);

        fs::create_dir_all(&output_dir)
            .await
            .map_err(|e| ApiError::new(500, format!("创建输出目录失败: {}", e)))?;

        let status = TranscodeStatus {
            id: id.clone(),
            status: TranscodeState::Pending,
            progress: 0.0,
            output_path: Some(format!("/video/{}/playlist.m3u8", id)),
            error: None,
        };

        TRANSCODE_ACTIVE.store(true, Ordering::Relaxed);

        let task = TranscodeTask {
            id: id.clone(),
            status: status.clone(),
            process: None,
            output_dir: output_dir.clone(),
        };

        {
            let mut task_lock = CURRENT_TASK.lock().await;
            *task_lock = Some(task);
        }

        tokio::spawn(async move {
            if let Err(e) = Self::execute_transcode(path_string.clone(), id.clone()).await {
                // 发送错误状态
                if let Some(app) = APP_HANDLE.lock().await.as_ref() {
                    let error_status = TranscodeStatus {
                        id: id.clone(),
                        status: TranscodeState::Error,
                        progress: 0.0,
                        output_path: None,
                        error: Some(e.to_string()),
                    };
                    let _ = app.emit("transcode-status-update", &error_status);
                }
                TRANSCODE_ACTIVE.store(false, Ordering::Relaxed);
                let mut task_guard = CURRENT_TASK.lock().await;
                *task_guard = None;
            }
        });

        Ok(status)
    }

    async fn get(id: Self::Id) -> Result<Self::Item, ApiError> {
        let task_guard = CURRENT_TASK.lock().await;
        if let Some(task) = task_guard.as_ref() {
            if task.id == id {
                return Ok(task.status.clone());
            }
        }
        Err(ApiError::new(400, "转码任务不存在".to_string()))
    }

    async fn delete(id: Self::Id) -> Result<bool, ApiError> {
        let mut task_lock = CURRENT_TASK.lock().await;
        if let Some(task) = task_lock.take() {
            if task.id == id {
                // 停止进程
                if let Some(mut process) = task.process {
                    let _ = process.kill().await;
                }

                // 清理输出目录
                let _ = fs::remove_dir_all(&task.output_dir).await;

                TRANSCODE_ACTIVE.store(false, Ordering::Relaxed);
                return Ok(true);
            } else {
                // 如果 ID 不匹配，把任务放回去
                *task_lock = Some(task);
            }
        }
        Err(ApiError::new(400, "转码任务不存在".to_string()))
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
        let cache_dir = Self::get_cache_dir();
        let output_dir = cache_dir.join(&id);
        let playlist_file = output_dir.join("playlist.m3u8");

        let hwaccel_config = Self::detect_hardware_acceleration().await;

        let mut command = tokio::process::Command::new("ffmpeg");
        command.arg("-y");

        if let Some(hwaccel) = &hwaccel_config.hwaccel {
            command.args(["-hwaccel", hwaccel]);
        }
        if let Some(hwaccel_output_format) = &hwaccel_config.hwaccel_output_format {
            command.args(["-hwaccel_output_format", hwaccel_output_format]);
        }

        command
            .args(["-i", &file_path])
            .args(["-c:v", &hwaccel_config.encoder])
            .args(["-preset", &hwaccel_config.preset]);

        for arg in &hwaccel_config.extra_args {
            command.arg(arg);
        }

        command
            .args(["-c:a", "copy"])
            .args(["-f", "hls"])
            .args(["-g", "90"])
            .args(["-hls_time", "9"])
            .args(["-hls_list_size", "0"])
            .args(["-hls_flags", "append_list+temp_file"])
            .args([
                "-hls_segment_filename",
                &format!("{}/segment%04d.ts", output_dir.display()),
            ])
            .arg(playlist_file.to_string_lossy().to_string())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        let mut process = command
            .spawn()
            .map_err(|e| ApiError::new(500, format!("启动转码进程失败: {}", e)))?;

        {
            let mut task_lock = CURRENT_TASK.lock().await;
            if let Some(task) = task_lock.as_mut() {
                task.process = Some(process);
                task.status.status = TranscodeState::Processing;

                if let Some(app) = APP_HANDLE.lock().await.as_ref() {
                    let _ = app.emit("transcode-status", &task.status);
                }
            } else {
                return Err(ApiError::new(500, "转码任务已被删除".to_string()));
            }
        }

        // 重新获取进程句柄以监控
        process = {
            let mut task_lock = CURRENT_TASK.lock().await;
            if let Some(task) = task_lock.as_mut() {
                task.process.take().unwrap()
            } else {
                return Err(ApiError::new(500, "转码任务已被删除".to_string()));
            }
        };

        let stderr = process.stderr.take().unwrap();
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();

        let mut duration = 0.0;

        while let Ok(Some(line)) = lines.next_line().await {
            // 解析持续时间
            if let Some(captures) = Self::duration_regex().captures(&line) {
                if let (Ok(h), Ok(m), Ok(s)) = (
                    captures[1].parse::<f64>(),
                    captures[2].parse::<f64>(),
                    captures[3].parse::<f64>(),
                ) {
                    duration = h * 3600.0 + m * 60.0 + s;
                }
            }

            // 解析当前时间
            if let Some(captures) = Self::time_regex().captures(&line) {
                if duration > 0.0 {
                    if let (Ok(h), Ok(m), Ok(s)) = (
                        captures[1].parse::<f64>(),
                        captures[2].parse::<f64>(),
                        captures[3].parse::<f64>(),
                    ) {
                        let current_time = h * 3600.0 + m * 60.0 + s;
                        let progress = (current_time / duration).min(0.99);

                        // 更新全局状态并发送事件
                        {
                            let mut task_lock = CURRENT_TASK.lock().await;
                            if let Some(task) = task_lock.as_mut() {
                                task.status.progress = progress;

                                if let Some(app) = APP_HANDLE.lock().await.as_ref() {
                                    let _ = app.emit("transcode-status-update", &task.status);
                                }
                            }
                        }
                    }
                }
            }
        }

        let exit_status = process.wait().await;

        // 处理结果并发送最终状态
        let final_status = match exit_status {
            Ok(status_code) if status_code.success() => TranscodeStatus {
                id: id.clone(),
                status: TranscodeState::Completed,
                progress: 1.0,
                output_path: Some(format!("/video/{}/playlist.m3u8", id)),
                error: None,
            },
            Ok(status_code) => TranscodeStatus {
                id: id.clone(),
                status: TranscodeState::Error,
                progress: 0.0,
                output_path: None,
                error: Some(format!("FFmpeg 进程异常退出: {:?}", status_code)),
            },
            Err(e) => TranscodeStatus {
                id: id.clone(),
                status: TranscodeState::Error,
                progress: 0.0,
                output_path: None,
                error: Some(format!("等待进程结束失败: {}", e)),
            },
        };

        // 更新最终状态并发送事件
        {
            let mut task_guard = CURRENT_TASK.lock().await;
            if let Some(task) = task_guard.as_mut() {
                task.status = final_status.clone();

                if let Some(app) = APP_HANDLE.lock().await.as_ref() {
                    let _ = app.emit("transcode-status-update", &final_status);
                }
            }
        }

        // 清理全局状态
        TRANSCODE_ACTIVE.store(false, Ordering::Relaxed);

        Ok(())
    }

    fn duration_regex() -> &'static regex::Regex {
        use std::sync::OnceLock;
        static DURATION_REGEX: OnceLock<regex::Regex> = OnceLock::new();
        DURATION_REGEX
            .get_or_init(|| regex::Regex::new(r"Duration: (\d+):(\d+):(\d+\.\d+)").unwrap())
    }

    fn time_regex() -> &'static regex::Regex {
        use std::sync::OnceLock;
        static TIME_REGEX: OnceLock<regex::Regex> = OnceLock::new();
        TIME_REGEX.get_or_init(|| regex::Regex::new(r"time=(\d+):(\d+):(\d+\.\d+)").unwrap())
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
