"""FastAPI bootstrap. All routes live in `app/routers/`; main.py just builds
the app and mounts each domain router.
"""

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from .routers import catalog, maps, users  # noqa: E402  (load_dotenv first)

app = FastAPI(title="LensHive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(maps.router)
app.include_router(catalog.router)
app.include_router(users.router)
