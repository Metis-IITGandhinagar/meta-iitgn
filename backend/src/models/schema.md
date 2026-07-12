Enum user_role {
  normal
  moderator
  admin
}

Enum pending_status {
  draft
  in_review
  approved
  rejected
}

Table live_pages [headercolor: #175e7a] {
  page_id integer [ pk, increment, not null ]
  title varchar
  slug varchar [ not null, unique ]
  content text
  metadata jsonb [ not null, default: '{}' ]
  original_author_id integer [ not null ]
  contributors jsonb
  created_at timestamp [ not null ]
  updated_at timestamp [ not null ]
  updated_by integer
  deleted_at timestamp
  version integer

  indexes {
    (slug) [ name: 'live_pages_index_0' ]
    (metadata) [ name: 'live_pages_metadata_gin', note: 'Requires GIN index in Postgres' ]
  }
}

Table pending_pages [headercolor: #175e7a, note: 'Strictly non-editable'] {
  pending_id integer [ pk, increment, not null ]
  page_id integer
  title varchar
  content text
  metadata jsonb [ not null, default: '{}' ]
  status pending_status
  editor_id integer [ not null ]
  created_at timestamp
  version integer
  reviewer_id integer

  indexes {
    (status) [ name: 'pending_pages_index_0' ]
  }
}

Table pending_page_comments [headercolor: #175e7a] {
  comment_id integer [ pk, increment, not null ]
  pending_id integer [ not null ]
  user_id integer [ not null ]
  content text [ not null ]
  created_at timestamp [ not null, default: `now()` ]
  updated_at timestamp [ not null, default: `now()` ]
  deleted_at timestamp
}

Table users [headercolor: #175e7a] {
  user_id integer [ pk, increment, not null ]
  name varchar [ not null ]
  role user_role [ not null, default: 'normal' ]
  email varchar [ not null, unique ]
  avatar_url varchar
  is_banned boolean [ default: false ]
  points integer [ not null, default: 0 ]
  last_login_at timestamp
  created_at timestamp [ not null, default: `now()` ]
  updated_at timestamp [ not null, default: `now()` ]
  deleted_at timestamp
}

Table revision_pages [headercolor: #175e7a] {
  revision_id integer [ pk, increment, not null ]
  page_id integer [ not null ]
  created_by_user_id integer [ not null ]
  commit_message varchar
  title varchar
  slug varchar [ not null ]
  content text
  metadata jsonb [ not null, default: '{}' ]
  original_author_id integer [ not null ]
  contributors jsonb
  created_at timestamp [ not null ]
  updated_at timestamp [ not null ]
  updated_by integer
  deleted_at timestamp
  version integer
}

Table media_assets [headercolor: #175e7a] {
  media_id integer [ pk, increment, not null ]
  user_id integer [ not null ]
  file_url varchar [ not null ]
  file_type varchar 
  file_size integer 
  created_at timestamp [ not null, default: `now()` ]
  updated_at timestamp [ not null, default: `now()` ]
  deleted_at timestamp
}

Table bookmarks [headercolor: #175e7a] {
  bookmark_id integer [ pk, increment, not null ]
  user_id integer [ not null ]
  page_id integer [ not null ]
  created_at timestamp [ not null, default: `now()` ]
  updated_at timestamp [ not null, default: `now()` ]

  indexes {
    (user_id, page_id) [ unique, name: 'unique_user_bookmark' ]
  }
}

Table page_links [headercolor: #175e7a] {
  link_id integer [ pk, increment, not null ]
  source_page_id integer [ not null ]
  target_page_id integer [ not null ]
  created_at timestamp [ not null, default: `now()` ]
  updated_at timestamp [ not null, default: `now()` ]
  
  indexes {
    (source_page_id, target_page_id) [ unique, name: 'unique_page_link' ]
  }
}

// --- NEW: AUDIT LOGS ---
Table audit_logs [headercolor: #175e7a] {
  log_id integer [ pk, increment, not null ]
  actor_id integer [ not null ] 
  action varchar [ not null ] 
  table_name varchar [ not null ] 
  record_id integer [ not null ] 
  ip_address varchar
  created_at timestamp [ not null, default: `now()` ]

  indexes {
    (actor_id) [ name: 'idx_audit_actor' ]
    (table_name, record_id) [ name: 'idx_audit_target' ]
  }
}


// --- RELATIONSHIPS ---

Ref fk_live_pages_original_author_id_users {
  live_pages.original_author_id > users.user_id [ delete: no action, update: no action ]
}

Ref fk_live_pages_updated_by_users {
  live_pages.updated_by > users.user_id [ delete: no action ]
}

Ref fk_pending_pages_reviewer_id_users {
  pending_pages.reviewer_id > users.user_id [ delete: no action, update: no action ]
}

Ref fk_pending_pages_editor_id_users {
  pending_pages.editor_id > users.user_id [ delete: no action, update: no action ]
}

Ref fk_rollback_pages_original_author_id_users {
  revision_pages.original_author_id > users.user_id [ delete: no action, update: no action ]
}

Ref fk_revision_created_by {
  revision_pages.created_by_user_id > users.user_id [ delete: no action ]
}

Ref fk_rollback_pages_page_id_live_pages {
  revision_pages.page_id > live_pages.page_id [ delete: no action, update: no action ]
}

Ref fk_pending_pages_page_id_live_pages {
  pending_pages.page_id > live_pages.page_id [ delete: no action, update: no action ]
}

Ref fk_comments_pending_id {
  pending_page_comments.pending_id > pending_pages.pending_id [ delete: cascade ]
}

Ref fk_comments_user_id {
  pending_page_comments.user_id > users.user_id [ delete: cascade ]
}

Ref fk_media_user_id {
  media_assets.user_id > users.user_id [ delete: no action ]
}


Ref fk_bookmarks_user_id {
  bookmarks.user_id > users.user_id [ delete: cascade ]
}

Ref fk_bookmarks_page_id {
  bookmarks.page_id > live_pages.page_id [ delete: cascade ]
}

Ref fk_page_links_source_id {
  page_links.source_page_id > live_pages.page_id [ delete: cascade ]
}

Ref fk_page_links_target_id {
  page_links.target_page_id > live_pages.page_id [ delete: cascade ]
}

Ref fk_audit_logs_actor_id {
  audit_logs.actor_id > users.user_id [ delete: no action ]
}