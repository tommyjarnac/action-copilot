import json
import logging

from typing import List, Optional

from pydantic import BaseModel
from fastapi import FastAPI, Depends, Request
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware


from db import Task, get_all_tasks, get_db, SessionLocal
from transformer import Transformer

import todoist


app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    db = SessionLocal()
    try:
        pass
    finally:
        db.close()

init_db()


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Middleware to log incoming requests
@app.middleware("http")
async def log_request(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    logger.info(f"Query parameters: {request.query_params}")
    body = await request.body()
    logger.info(f"Request body: {body.decode()}")
    response = await call_next(request)
    return response


# Pydantic model for the request body
class TaskCreate(BaseModel):
    title: str
    priority: Optional[int] = None
    related_text: Optional[str] = None
    note_link: Optional[str] = None
    description: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    priority: Optional[int] = None
    related_text: Optional[str] = None
    note_link: Optional[str] = None
    description: Optional[str] = None


@app.get("/tasks/", response_model=List[TaskResponse])
def read_tasks(db: Session = Depends(get_db)):
    tasks = get_all_tasks(db)
    return tasks


@app.post("/tasks/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task_data.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    export = True
    if export:
        todoist.export(db_task)

    return db_task


@app.post("/tasks/{task_id}/export")
async def export_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="task not found")
    url = todoist.export(db_task)
    db_task.url = url
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


@app.get("/tasks/{task_id}")
async def read_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Item).filter(Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="task not found")
    return db_task


class SuggestionCreate(BaseModel):
    content: str


@app.post("/suggest")
async def suggest(content: SuggestionCreate, db: Session = Depends(get_db)):
    t = Transformer()
    response = t.suggest(content)
    tasks = []
    for task_data in response:
        db_task = Task(**task_data)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        task_data["id"] = db_task.id
        tasks.append(task_data)

    return tasks

