"""Per-domain APIRouter modules. `main.py` includes each one to assemble
the final FastAPI app.
"""

from . import catalog, maps, users

__all__ = ["catalog", "maps", "users"]
