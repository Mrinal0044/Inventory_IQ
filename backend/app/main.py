from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.forecast import router as forecast_router
from app.routes.inventory import router as inventory_router
from app.routes.profile import router as profile_router
from app.routes.category import router as category_router

app = FastAPI(title="InventoryIQ")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(upload_router)
app.include_router(forecast_router)
app.include_router(inventory_router)
app.include_router(profile_router)
app.include_router(category_router)

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
