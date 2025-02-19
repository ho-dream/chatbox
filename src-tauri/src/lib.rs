use std::fs;
use std::path::PathBuf;
use std::net::SocketAddr;
use std::sync::Arc;
use tauri::Manager;
use rusqlite::Connection;
use axum::{
    routing::{get, post},
    Router,
    response::Json,
    extract::Query,
};
use serde_json::json;
use tokio::runtime::Runtime;
use tokio::sync::oneshot;
use tower_http::cors::{CorsLayer};

async fn start_axum_server(shutdown_rx: oneshot::Receiver<()>) {
    // 构建路由
    let app = Router::new()
        .route("/", get(|| async { Json(json!({"status": "running"})) }))
        .route("/hello", get(hello_handler))
        .layer(CorsLayer::permissive()); // 允许所有来源

    // 设置监听地址
    let addr = SocketAddr::from(([127, 0, 0, 1], 3030));

    // 启动服务器
    println!("Axum server starting on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    // 使用 axum 的 graceful shutdown
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            shutdown_rx.await.ok();
        })
        .await
        .unwrap();
}

fn init_database(app_dir: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    // 确保数据目录存在
    fs::create_dir_all(app_dir)?;

    // 构建数据库文件路径
    let db_path = app_dir.join("userdata.db");

    // 创建/连接数据库
    let conn = Connection::open(&db_path)?;

    // 这里可以添加创建表等初始化操作
    // 例如:
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )",
        [],
    )?;

    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Deserialize)]
struct HelloParams {
    name: String,
}

async fn hello_handler(Query(params): Query<HelloParams>) -> Json<serde_json::Value> {
    Json(json!({
        "message": format!("Hello, {}! You've been greeted from Rust!", params.name)
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 创建 tokio 运行时
    let runtime = Arc::new(Runtime::new().unwrap());
    let runtime_clone = runtime.clone();

    // 创建关闭信号通道
    let (shutdown_tx, shutdown_rx) = oneshot::channel();

    tauri::Builder::default()
        .setup(move |app| {
            // 获取应用数据目录
            let app_dir = app.path().app_data_dir().expect("Failed to get app data dir");

            // 初始化数据库
            if let Err(e) = init_database(&app_dir) {
                eprintln!("Failed to initialize database: {}", e);
            }

            // 在新的线程中启动 axum 服务器
            let rt = runtime_clone.clone();
            std::thread::spawn(move || {
                rt.block_on(async {
                    start_axum_server(shutdown_rx).await;
                });
            });

            // 设置应用关闭时的处理
            let window = app.get_webview_window("main").unwrap();
            let shutdown_tx = Arc::new(std::sync::Mutex::new(Some(shutdown_tx)));

            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Destroyed = event {
                    if let Some(tx) = shutdown_tx.lock().unwrap().take() {
                        tx.send(()).ok();
                    }
                }
            });

            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
