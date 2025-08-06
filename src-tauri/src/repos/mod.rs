use crate::fn_name;
use crate::models::error::ApiError;

pub mod favorites_repo;
pub mod files_repo;
pub mod offline;
pub mod online;
pub mod thumbnails_repo;
pub mod transcode_repo;

pub trait Repo {
    type Id;
    type Item;
    type CreateRequest;
    type UpdateRequest;
    async fn create(_data: Self::CreateRequest) -> Result<Self::Item, ApiError> {
        Err(ApiError::not_implemented(fn_name!()))
    }

    async fn get_all() -> Result<Vec<Self::Item>, ApiError> {
        Err(ApiError::not_implemented(fn_name!()))
    }

    async fn get(_id: Self::Id) -> Result<Self::Item, ApiError> {
        Err(ApiError::not_implemented(fn_name!()))
    }

    async fn update(_id: Self::Id, _data: Self::UpdateRequest) -> Result<Self::Item, ApiError> {
        Err(ApiError::not_implemented(fn_name!()))
    }

    async fn delete(_id: Self::Id) -> Result<bool, ApiError> {
        Err(ApiError::not_implemented(fn_name!()))
    }
}
