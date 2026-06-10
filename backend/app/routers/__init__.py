"""Per-domain APIRouter modules. `main.py` includes each one to assemble
the final FastAPI app.
"""

from . import admin, catalog, maps, payments, spots, suggestions, users

__all__ = ["admin", "catalog", "maps", "payments", "spots", "suggestions", "users"]
