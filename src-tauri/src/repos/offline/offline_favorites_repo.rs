use sqlx::{types::chrono::Utc, SqlitePool};

use crate::{
    models::{
        error::ApiError,
        favorite::{
            AddFileToFavoriteRequest, CreateFavoriteRequest, Favorite, FavoriteDto, FavoriteFile,
            FavoriteFileDto, UpdateFavoriteRequest,
        },
    },
    repos::{favorites_repo::FavoritesRepo, offline::Database, Repo},
};

pub struct OfflineFavoritesRepo;

impl Repo for OfflineFavoritesRepo {
    type Id = i64;

    type Item = FavoriteDto;

    type CreateRequest = CreateFavoriteRequest;

    type UpdateRequest = UpdateFavoriteRequest;

    async fn create(data: Self::CreateRequest) -> Result<Self::Item, ApiError> {
        let pool = Self::get_pool()?;
        let now = Utc::now();

        let result = sqlx::query(
            r"INSERT INTO favorites(name, created_at, updated_at, sort_order) VALUES(?, ?, ?, ?)",
        )
        .bind(&data.name)
        .bind(&now)
        .bind(&now)
        .bind(&data.sort_order)
        .execute(pool)
        .await
        .map_err(|e| ApiError::new(500, format!("创建收藏失败: {}", e)))?;

        let favorite = Favorite {
            id: result.last_insert_rowid(),
            name: data.name,
            created_at: now,
            updated_at: now,
            sort_order: data.sort_order,
        };
        let dto = FavoriteDto::from(favorite);
        Ok(dto)
    }

    async fn get_all() -> Result<Vec<Self::Item>, ApiError> {
        let pool = Self::get_pool()?;
        let favorites =
            sqlx::query_as::<_, Favorite>(r"SELECT * FROM favorites ORDER BY sort_order")
                .fetch_all(pool)
                .await
                .map_err(|e| ApiError::new(500, format!("获取收藏失败: {}", e)))?;

        let mut result = Vec::new();
        for favorite in favorites {
            let files = Self::get_favorite_files(favorite.id).await?;
            let mut dto = FavoriteDto::from(favorite);
            dto.files = files;
            result.push(dto);
        }
        Ok(result)
    }

    async fn get(id: Self::Id) -> Result<Self::Item, ApiError> {
        let pool = Self::get_pool()?;
        let favorite = sqlx::query_as::<_, Favorite>(
            r"SELECT id, name, created_at, updated_at, sort_order FROM favorites WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::new(500, format!("获取收藏失败: {}", e)))?
        .ok_or_else(|| ApiError::new(400, "收藏不存在".to_string()))?;

        let files = Self::get_favorite_files(id).await?;
        let mut dto = FavoriteDto::from(favorite);
        dto.files = files;
        Ok(dto)
    }

    async fn update(id: Self::Id, data: Self::UpdateRequest) -> Result<Self::Item, ApiError> {
        let pool = Self::get_pool()?;
        let now = Utc::now();

        // 更新收藏夹信息
        sqlx::query(r"UPDATE favorites SET name = ?, updated_at = ?, sort_order = ? WHERE id = ?")
            .bind(&data.name)
            .bind(&now)
            .bind(&data.sort_order)
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| ApiError::new(500, format!("更新收藏失败: {}", e)))?;

        // 获取更新后的收藏夹信息
        let favorite = sqlx::query_as::<_, Favorite>(
            r"SELECT id, name, created_at, updated_at, sort_order FROM favorites WHERE id = ?",
        )
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::new(500, format!("获取更新后的收藏失败: {}", e)))?;

        Ok(FavoriteDto::from(favorite))
    }

    async fn delete(id: Self::Id) -> Result<bool, ApiError> {
        let pool = Self::get_pool()?;
        let result = sqlx::query(r"DELETE FROM favorites WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| ApiError::new(500, format!("删除收藏失败: {}", e)))?;

        if result.rows_affected() > 0 {
            Ok(true)
        } else {
            Err(ApiError::new(400, "未删除任何收藏夹".to_string()))
        }
    }
}

impl FavoritesRepo for OfflineFavoritesRepo {
    async fn add_file_to_favorite(
        request: AddFileToFavoriteRequest,
        favorite_id: i64,
    ) -> Result<bool, ApiError> {
        if !Self::favorite_exists(favorite_id).await? {
            return Err(ApiError::new(400, "收藏夹不存在".to_string()));
        }

        let pool = Self::get_pool()?;
        let now = Utc::now();

        sqlx::query(
                r"
                INSERT INTO favorite_files 
                (favorite_id, filename, file_size, file_type, file_path, last_modified, is_directory, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                "
            )
            .bind(favorite_id)
            .bind(&request.filename)
            .bind(request.file_size)
            .bind(&request.file_type.to_string())
            .bind(&request.file_path)
            .bind(request.last_modified)
            .bind(request.is_directory)
            .bind(&now)
            .execute(pool)
            .await
            .map_err(|e| ApiError::new(500, format!("添加文件到收藏夹失败: {}", e)))?;

        Ok(true)
    }

    async fn get_all_favorite_files() -> Result<Vec<FavoriteFileDto>, ApiError> {
        let pool = Self::get_pool()?;
        let files = sqlx::query_as::<_, FavoriteFile>(
            r"
            SELECT id, favorite_id, filename, file_size, file_type, file_path, 
                   last_modified, is_directory, created_at 
            FROM favorite_files
            ",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::new(500, format!("获取所有收藏文件失败: {}", e)))?;

        Ok(files.into_iter().map(FavoriteFileDto::from).collect())
    }

    async fn delete_favorite_file(id: i64) -> Result<bool, ApiError> {
        let pool = Self::get_pool()?;
        let result = sqlx::query(r"DELETE FROM favorite_files WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| ApiError::new(500, format!("删除收藏文件失败: {}", e)))?;

        if result.rows_affected() > 0 {
            Ok(true)
        } else {
            Err(ApiError::new(404, "未删除任何收藏文件".to_string()))
        }
    }
}

impl OfflineFavoritesRepo {
    fn get_pool() -> Result<&'static SqlitePool, ApiError> {
        Database::get_pool()
    }

    async fn get_favorite_files(favorite_id: i64) -> Result<Vec<FavoriteFileDto>, ApiError> {
        let pool = Self::get_pool()?;
        let files = sqlx::query_as::<_, FavoriteFile>(
            r"
            SELECT id, favorite_id, filename, file_size, file_type, file_path, 
                   last_modified, is_directory, created_at 
            FROM favorite_files 
            WHERE favorite_id = ?
            ",
        )
        .bind(favorite_id)
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::new(500, format!("获取收藏文件失败: {}", e)))?;

        Ok(files.into_iter().map(FavoriteFileDto::from).collect())
    }

    async fn favorite_exists(id: i64) -> Result<bool, ApiError> {
        let pool = Self::get_pool()?;
        let count: i64 = sqlx::query_scalar(r"SELECT count(*) FROM favorites WHERE id = ?")
            .bind(id)
            .fetch_one(pool)
            .await
            .map_err(|e| ApiError::new(500, format!("检查收藏是否存在失败: {}", e)))?;

        Ok(count > 0)
    }
}
