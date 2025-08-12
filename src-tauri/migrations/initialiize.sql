create table if not exists favorite (
    id integer primary key autoincrement,
    name text not null,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp,
    sort_order integer not null default 0
);

create table if not exists favorite_file (
    id integer primary key autoincrement,
    favorite_id integer not null,
    file_name text not null,
    file_size integer not null,
    file_type text not null,
    file_path text not null,
    last_modified datetime not null,
    is_directory boolean not null,
    created_at datetime not null default current_timestamp,
    foreign key (favorite_id) references favorite(id) on delete cascade
);

create index if not exists idx_favorite_file_favorite_id on favorite_file(favorite_id);
create index if not exists idx_favorite_sort_order on favorite(sort_order);