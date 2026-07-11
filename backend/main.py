import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
from abc import ABC, abstractmethod

# -------------------------------------------------------------------------
# 1. PYDANTIC SCHEMAS (API Contracts)
# -------------------------------------------------------------------------

class UserCreate(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None

class DraftSubmit(BaseModel):
    # If page_id is None, this is a proposal for a BRAND NEW page.
    # If page_id is provided, this is an EDIT to an existing page.
    page_id: Optional[int] = None
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    editor_id: int
    # base_version is required if editing an existing page for optimistic locking.
    base_version: Optional[int] = None

class ReviewAction(BaseModel):
    reviewer_id: int
    action: str = Field(..., pattern="^(approve|reject)$")
    rejection_reason: Optional[str] = None

# -------------------------------------------------------------------------
# 2. REPOSITORY INTERFACE (The Abstraction Layer)
# -------------------------------------------------------------------------

class DatabaseRepository(ABC):
    @abstractmethod
    def create_user(self, user: UserCreate) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_live_page(self, slug: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def submit_draft(self, draft: DraftSubmit) -> Dict[str, Any]:
        pass


    @abstractmethod
    def get_pending_drafts(self, page_id: Optional[int] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def process_review(self, pending_id: int, review: ReviewAction) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_recent_pages(self, limit: int = 5) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_updated_pages(self, limit: int = 5) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def search_pages(self, query: str) -> List[Dict[str, Any]]:
        pass

# -------------------------------------------------------------------------
# 3. SUPABASE IMPLEMENTATION (The Concrete Data Layer)
# -------------------------------------------------------------------------

class SupabaseRepo(DatabaseRepository):
    def __init__(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("Supabase credentials are missing from environment.")
        self.client: Client = create_client(url, key)

    def create_user(self, user: UserCreate) -> Dict[str, Any]:
        response = self.client.table("users").insert({
            "name": user.name,
            "role": "Bronze",
            "email": user.email,
            "avatar_url": user.avatar_url
        }).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create user")
        return response.data[0]

    def get_live_page(self, slug: str) -> Dict[str, Any]:
        response = self.client.table("live_pages") \
            .select("*, users!original_author_id(name)") \
            .eq("slug", slug) \
            .is_("deleted_at", "null") \
            .execute()
        if not response.data:
            # Check if there is an unreviewed pending page whose title (slugified) matches the slug
            pending_res = self.client.table("pending_pages") \
                .select("*, users!editor_id(name)") \
                .eq("status", "in_review") \
                .is_("page_id", "null") \
                .execute()
            import re
            for draft in pending_res.data:
                metadata = draft.get("metadata")
                draft_slug = None
                if isinstance(metadata, dict):
                    draft_slug = metadata.get("slug")
                elif isinstance(metadata, str):
                    try:
                        import json
                        draft_slug = json.loads(metadata).get("slug")
                    except Exception:
                        pass
                
                if not draft_slug:
                    base_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', draft["title"]).strip().lower()
                    draft_slug = re.sub(r'[\s-]+', '-', base_slug)
                if draft_slug == slug:
                    return {
                        "page_id": None,
                        "pending_id": draft["pending_id"],
                        "title": draft["title"],
                        "slug": draft_slug,
                        "content": draft["content"],
                        "metadata": draft["metadata"] or {},
                        "version": None,
                        "status": "in_review",
                        "created_at": draft["created_at"],
                        "updated_at": draft["created_at"],
                        "users": draft.get("users")
                    }
            raise HTTPException(status_code=404, detail="Page not found or deleted")
        return response.data[0]

    def submit_draft(self, draft: DraftSubmit) -> Dict[str, Any]:
        if draft.page_id is None:
            # BRAND NEW PAGE - bypass review and write directly to live_pages
            import re
            from datetime import datetime
            base_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', draft.title).strip().lower()
            base_slug = re.sub(r'[\s-]+', '-', base_slug)
            if not base_slug:
                base_slug = "untitled"
            
            # Ensure slug is unique
            metadata = draft.metadata
            slug = None
            if isinstance(metadata, dict):
                slug = metadata.get("slug")
            elif isinstance(metadata, str):
                try:
                    import json
                    slug = json.loads(metadata).get("slug")
                except Exception:
                    pass
                    
            if not slug:
                slug = base_slug
                counter = 1
                while True:
                    existing = self.client.table("live_pages").select("page_id").eq("slug", slug).execute()
                    if not existing.data:
                        break
                    slug = f"{base_slug}-{counter}"
                    counter += 1
            
            now_str = datetime.utcnow().isoformat()
            live_insert = self.client.table("live_pages").insert({
                "title": draft.title,
                "slug": slug,
                "content": draft.content,
                "metadata": draft.metadata,
                "original_author_id": draft.editor_id,
                "contributors": [draft.editor_id],
                "version": 1,
                "created_at": now_str,
                "updated_at": now_str,
            }).execute()
            
            if not live_insert.data:
                raise HTTPException(status_code=500, detail="Failed to create live page directly")
            
            # Log audit event
            self.client.table("audit_logs").insert({
                "actor_id": draft.editor_id,
                "action": "CREATE_NEW_PAGE_DIRECT",
                "table_name": "live_pages",
                "record_id": str(live_insert.data[0]["page_id"]),
                "ip_address": "127.0.0.1",
            }).execute()

            return live_insert.data[0]

        # Edits to existing pages - still require review (inserted into pending_pages)
        response = self.client.table("pending_pages").insert({
            "page_id": draft.page_id,
            "title": draft.title,
            "content": draft.content,
            "metadata": draft.metadata,
            "status": "in_review",
            "editor_id": draft.editor_id,
            "version": draft.base_version
        }).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to submit draft.")
        return response.data[0]

    def get_pending_drafts(self, page_id: Optional[int] = None) -> List[Dict[str, Any]]:
        query = self.client.table("pending_pages").select("*, users!editor_id(name)").eq("status", "in_review")
        if page_id:
            query = query.eq("page_id", page_id)

        response = query.order("created_at").execute()
        return response.data

    def process_review(self, pending_id: int, review: ReviewAction) -> Dict[str, Any]:
        if review.action == "reject":
            # Simple status update for rejections
            response = self.client.table("pending_pages").update({
                "status": "rejected",
                "reviewer_id": review.reviewer_id
            }).eq("pending_id", pending_id).execute()
            return {"message": "Draft rejected", "data": response.data}

        elif review.action == "approve":
            try:
                # 1. Fetch pending draft
                pending = self.client.table("pending_pages").select("*").eq("pending_id", pending_id).execute()
                if not pending.data:
                    raise HTTPException(status_code=404, detail="Pending draft not found")
                draft = pending.data[0]
                if draft["page_id"] is None:
                    # New Page Workflow
                    import re
                    from datetime import datetime
                    base_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', draft["title"]).strip().lower()
                    base_slug = re.sub(r'[\s-]+', '-', base_slug)
                    if not base_slug:
                        base_slug = "untitled"
                    
                    # Ensure slug is unique
                    metadata = draft.get("metadata")
                    slug = None
                    if isinstance(metadata, dict):
                        slug = metadata.get("slug")
                    elif isinstance(metadata, str):
                        try:
                            import json
                            slug = json.loads(metadata).get("slug")
                        except Exception:
                            pass
                            
                    if not slug:
                        slug = base_slug
                        counter = 1
                        while True:
                            existing = self.client.table("live_pages").select("page_id").eq("slug", slug).execute()
                            if not existing.data:
                                break
                            slug = f"{base_slug}-{counter}"
                            counter += 1
                    
                    now_str = datetime.utcnow().isoformat()
                    live_insert = self.client.table("live_pages").insert({
                        "title": draft["title"],
                        "slug": slug,
                        "content": draft["content"],
                        "metadata": draft["metadata"],
                        "original_author_id": draft["editor_id"],
                        "contributors": [draft["editor_id"]],
                        "version": 1,
                        "created_at": now_str,
                        "updated_at": now_str,
                    }).execute()
                    
                    if not live_insert.data:
                        raise HTTPException(status_code=500, detail="Failed to create live page")
                    
                    # Update pending status to approved
                    self.client.table("pending_pages").update({
                        "status": "approved",
                        "reviewer_id": review.reviewer_id
                    }).eq("pending_id", pending_id).execute()
                    
                    # Log audit event
                    self.client.table("audit_logs").insert({
                        "actor_id": review.reviewer_id,
                        "action": "APPROVE_NEW_PAGE",
                        "table_name": "pending_pages",
                        "record_id": str(pending_id),
                        "ip_address": "127.0.0.1",
                    }).execute()
                    
                    return {"message": "Draft approved and published.", "data": live_insert.data[0]}
                else:
                    # Edit existing page workflow
                    current_live = self.client.table("live_pages").select("*").eq("page_id", draft["page_id"]).execute()
                    if not current_live.data:
                        raise HTTPException(status_code=404, detail="Original live page not found")
                    live = current_live.data[0]
                    
                    # Backup to revision_pages
                    self.client.table("revision_pages").insert({
                        "page_id": live["page_id"],
                        "created_by_user_id": live["updated_by"] if live["updated_by"] is not None else live["original_author_id"],
                        "commit_message": f"Backup prior to draft {pending_id} approval",
                        "title": live["title"],
                        "slug": live["slug"],
                        "content": live["content"],
                        "metadata": live["metadata"],
                        "original_author_id": live["original_author_id"],
                        "contributors": live["contributors"],
                        "version": live["version"],
                        "created_at": live["created_at"],
                        "updated_at": live["updated_at"],
                        "deleted_at": live["deleted_at"],
                    }).execute()
                    
                    # Update live page
                    contributors = live["contributors"] or []
                    if draft["editor_id"] not in contributors:
                        contributors.append(draft["editor_id"])
                        
                    current_version = live["version"] if live["version"] is not None else 1
                    from datetime import datetime
                    live_update = self.client.table("live_pages").update({
                        "title": draft["title"],
                        "content": draft["content"],
                        "metadata": draft["metadata"],
                        "contributors": contributors,
                        "version": current_version + 1,
                        "updated_by": draft["editor_id"],
                        "updated_at": datetime.utcnow().isoformat(),
                    }).eq("page_id", draft["page_id"]).execute()
                    
                    if not live_update.data:
                        raise HTTPException(status_code=500, detail="Failed to update live page")
                    
                    # Update pending status to approved
                    self.client.table("pending_pages").update({
                        "status": "approved",
                        "reviewer_id": review.reviewer_id
                    }).eq("pending_id", pending_id).execute()
                    
                    # Reject all other competing drafts for the same page
                    self.client.table("pending_pages").update({
                        "status": "rejected",
                        "reviewer_id": review.reviewer_id
                    }).eq("page_id", draft["page_id"]).eq("status", "in_review").neq("pending_id", pending_id).execute()
                    
                    # Log audit event
                    self.client.table("audit_logs").insert({
                        "actor_id": review.reviewer_id,
                        "action": "APPROVE_EDIT_PAGE",
                        "table_name": "pending_pages",
                        "record_id": str(pending_id),
                        "ip_address": "127.0.0.1",
                    }).execute()
                    
                    return {"message": "Draft approved and published.", "data": live_update.data[0]}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")

    def get_recent_pages(self, limit: int = 5) -> List[Dict[str, Any]]:
        response = self.client.table("live_pages") \
            .select("page_id, title, slug, created_at") \
            .is_("deleted_at", "null") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return response.data

    def get_updated_pages(self, limit: int = 5) -> List[Dict[str, Any]]:
        response = self.client.table("live_pages") \
            .select("page_id, title, slug, updated_at") \
            .is_("deleted_at", "null") \
            .order("updated_at", desc=True) \
            .limit(limit) \
            .execute()
        return response.data

    def search_pages(self, query: str) -> List[Dict[str, Any]]:
        # Find matches in live_pages
        live_query = self.client.table("live_pages") \
            .select("page_id, title, slug, content, metadata") \
            .is_("deleted_at", "null")
        if query:
            live_query = live_query.or_(f"title.ilike.%{query}%,content.ilike.%{query}%")
        live_res = live_query.execute()
        
        results = []
        import re
        for p in live_res.data:
            content = p.get("content", "")
            clean_content = re.sub(r'^---[\s\S]*?---', '', content).strip()
            snippet = clean_content[:150] + "..." if len(clean_content) > 150 else clean_content
            
            results.append({
                "title": p["title"],
                "slug": p["slug"],
                "path": f"/wiki/page/{p['slug']}",
                "category": p.get("metadata", {}).get("category", "Campus") if p.get("metadata") else "Campus",
                "description": snippet,
                "is_pending": False
            })
            
        # Find matches in pending_pages (unreviewed brand new pages)
        pending_query = self.client.table("pending_pages") \
            .select("pending_id, title, content, metadata, status") \
            .eq("status", "in_review") \
            .is_("page_id", "null")
        if query:
            pending_query = pending_query.or_(f"title.ilike.%{query}%,content.ilike.%{query}%")
        pending_res = pending_query.execute()
        
        for p in pending_res.data:
            draft_slug = p.get("metadata", {}).get("slug") if p.get("metadata") else None
            if not draft_slug:
                base_slug = re.sub(r'[^a-zA-Z0-9\s-]', '', p["title"]).strip().lower()
                draft_slug = re.sub(r'[\s-]+', '-', base_slug)
                
            content = p.get("content", "")
            clean_content = re.sub(r'^---[\s\S]*?---', '', content).strip()
            snippet = clean_content[:150] + "..." if len(clean_content) > 150 else clean_content
            
            results.append({
                "title": p["title"],
                "slug": draft_slug,
                "path": f"/wiki/page/{draft_slug}",
                "category": p.get("metadata", {}).get("category", "Campus") if p.get("metadata") else "Campus",
                "description": snippet,
                "is_pending": True
            })
            
        return results

# -------------------------------------------------------------------------
# 4. FASTAPI APPLICATION & DEPENDENCY INJECTION
# -------------------------------------------------------------------------

load_dotenv()

app = FastAPI(title="Wiki API - Unified & Decoupled")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency generator - swap SupabaseRepo() for PostgresRepo() later
def get_db() -> DatabaseRepository:
    return SupabaseRepo()


# -------------------------------------------------------------------------
# 5. API ROUTES (Business Logic completely decoupled from DB)
# -------------------------------------------------------------------------

@app.post("/users", tags=["Users"])
def create_user(user: UserCreate, db: DatabaseRepository = Depends(get_db)):
    return db.create_user(user)

@app.get("/pages/recent/new", tags=["Pages"])
def get_recent_new_pages(db: DatabaseRepository = Depends(get_db)):
    return db.get_recent_pages()

@app.get("/pages/recent/updated", tags=["Pages"])
def get_recent_updated_pages(db: DatabaseRepository = Depends(get_db)):
    return db.get_updated_pages()

@app.get("/pages/search", tags=["Pages"])
def search_pages(query: str = "", db: DatabaseRepository = Depends(get_db)):
    return db.search_pages(query)

@app.get("/pages/{slug}", tags=["Pages"])
def get_page(slug: str, db: DatabaseRepository = Depends(get_db)):
    return db.get_live_page(slug)

@app.post("/drafts", tags=["Workflow"])
def submit_draft(draft: DraftSubmit, db: DatabaseRepository = Depends(get_db)):
    """
    Submit a new draft.
    Omit `page_id` to propose a completely new wiki page.
    Include `page_id` and `base_version` to propose an edit to an existing page.
    """
    return db.submit_draft(draft)

@app.get("/drafts/pending", tags=["Workflow"])
def list_pending_drafts(page_id: Optional[int] = None, db: DatabaseRepository = Depends(get_db)):
    """
    Fetch all drafts currently awaiting review.
    Optionally filter by a specific page_id to see competing edits.
    """
    return db.get_pending_drafts(page_id)

@app.post("/drafts/{pending_id}/review", tags=["Workflow"])
def review_draft(pending_id: int, review: ReviewAction, db: DatabaseRepository = Depends(get_db)):
    """
    Approve or reject a draft.
    Approving executes the backend merge transaction.
    """
    return db.process_review(pending_id, review)
