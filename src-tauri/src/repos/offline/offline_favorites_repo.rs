use crate::{
    models::favorite::{CreateFavoriteRequest, FavoriteDto},
    repos::Repo,
};

pub struct OfflineFavoritesRepo;

impl Repo for OfflineFavoritesRepo {
    type Id = i64;

    type Item = FavoriteDto;

    type CreateRequest = CreateFavoriteRequest;

    type UpdateRequest = ();
}
