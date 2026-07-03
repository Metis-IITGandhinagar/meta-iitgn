import os

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 1. Initialize the application
app = FastAPI(title="Basic API")


origins = [
    "https://meta-iitgn-vercel.onrender.com/", # Replace with your actual Vercel URL
    "http://localhost:3000",                  # Keep this for local development
]


# 2. Define a data schema for validation
class Page(BaseModel):
    name: str
    text: str | None = None


# 3. A simple GET route
@app.get("/")
def read_root():
    return {"message": "API is Live."}


# 4. A GET route with a path parameter
@app.get("/page/{page_id}")
def read_page(page_id: int):
    # The path to your mock file
    file_path = "mockPage.md"

    # Always good practice to check if the file actually exists
    if not os.path.exists(file_path):
        # Return a proper 404 error if it's missing
        raise HTTPException(status_code=404, detail="Mock page not found")

    # Read from the markdown file
    with open(file_path, "r", encoding="utf-8") as file:
        file_content = file.read()

    return {"page_id": page_id, "status": "Found", "content": file_content}
