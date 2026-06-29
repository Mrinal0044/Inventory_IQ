
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.forecast import router as forecast_router
from app.routes.inventory import router as inventory_router
from app.routes.profile import router as profile_router
from app.routes.category import router as category_router
from app.routes.history import router as history_router

app = FastAPI(title="InventoryIQ")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(upload_router)
app.include_router(forecast_router)
app.include_router(inventory_router)
app.include_router(profile_router)
app.include_router(category_router)
app.include_router(history_router)

@app.get("/")
def root():
    return {
        "message": "InventoryIQ Backend Running"
    }

@app.get("/health")
def health():
    return {
        "status": "running"
    }
