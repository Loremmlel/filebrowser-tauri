create table if not exists favorites (
    id integer primary key autoincrement,
    name text not null,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    sort_order integer not null default 0
);

create table if not exists favorite_files (
    id integer primary key autoincrement,
    favorite_id integer not null,
    filename text not null,
    file_size integer not null,
    file_type text not null,
    file_path text not null,
    last_modified datetime not null,
    is_directory boolean not null,
    created_at datetime not null default current_timestamp,
    foreign key (favorite_id) references favorites(id) on delete cascade
);

create index if not exists idx_favorite_files_favorite_id on favorite_files(favorite_id);
create index if not exists idx_favorites_sort_order on favorites(sort_order);

pragma foreign_keys = on;