import os
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

# --- Supabase Initialization ---
# Use env file, dont commit it, add it to .gitignore
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 1. Initialize the application
app = FastAPI(title="Basic API")

# --- CORS Setup ---
origins = [
    "https://meta-iitgn-vercel.onrender.com",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Define a data schema
class Page(BaseModel):
    content: str

# 3. A simple GET route
@app.get("/")
def read_root():
    return {"message": "API is Live."}

# 4. A GET route with a path parameter that queries Supabase
@app.get("/page/{page_id}")
def read_page(page_id: str):
    try:
        response = supabase.table("mockpages").select("*").eq("page_id", page_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Mock page not found in database")

        page_data = response.data[0]

        return {
            "page_id": page_data.get("page_id"),
            "status": "Found",
            "content": page_data.get("content")
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 5. A POST route to create a new page
@app.post("/page")
def create_page(page: Page):
    try:
        # Insert the new content into Supabase
        # Supabase automatically generates the page_id (UUID) and created_at timestamp
        response = supabase.table("mockpages").insert({"content": page.content}).execute()

        # Check if the insertion was successful
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create page")

        # Extract the newly created record
        new_page = response.data[0]

        return {
            "message": "Page successfully created",
            "page_id": new_page.get("page_id"),
            "content": new_page.get("content")
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# 6. A PUT route to update/overwrite an existing page
@app.put("/page/{page_id}")
def update_page(page_id: str, page: Page):
    try:
        # Update the row where the page_id matches
        response = supabase.table("mockpages").update({
            "content": page.content
        }).eq("page_id", page_id).execute()

        # If the data array is empty, it means no row was found to update
        if not response.data:
            raise HTTPException(status_code=404, detail="Page not found or update failed")

        updated_page = response.data[0]

        return {
            "message": "Page successfully updated",
            "page_id": updated_page.get("page_id"),
            "content": updated_page.get("content")
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
