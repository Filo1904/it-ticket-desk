from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import get_connection
from datetime import datetime, timezone

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="IT Ticket Desk")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")



class TicketCreate(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    description : str = Field(min_length=10, max_length=2000)
    priority: Literal["bassa", "media", "alta"] = "media"

class TicketUpdate(BaseModel):
    status : Literal["aperto", "in lavorazione", "risolto"] | None = None
    priority : Literal["bassa", "media", "alta"] | None = None

@app.get("/")
def home():
    return FileResponse(BASE_DIR / "static" / "index.html")

@app.get("/tickets")
def list_tickets(status : Literal["aperto", "in lavorazione", "risolto"] | None = None, search : str | None = None, priority : Literal["bassa", "media", "alta"] | None = None):
    connection = get_connection()
    try:
        rows = connection.execute("""
        SELECT * FROM tickets ORDER BY
        CASE priority
        WHEN 'alta' THEN 1
        WHEN 'media' THEN 2
        WHEN 'bassa' THEN 3
        END ASC,
        created_at DESC,
        id DESC"""
        ).fetchall()
    finally:
        connection.close()

    new_ticket_list = []
    for ticket in rows:
        status_matches = status is None or ticket["status"] == status
        search_matches = search is None or search.lower() in ticket["name"].lower()
        priority_matches = priority is None or ticket["priority"] == priority
        if status_matches and search_matches and priority_matches:
            new_ticket_list.append(dict(ticket))

    return new_ticket_list


@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int):
    connection = get_connection()
    try:
        ticket = connection.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    finally:
        connection.close()

    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket non trovato")
    else:
        return dict(ticket)


@app.post("/tickets")
def create_ticket(data: TicketCreate):
    connection = get_connection()
    try:
        created_at = datetime.now(timezone.utc).isoformat()
        cursor = connection.execute("INSERT INTO tickets (name, description, priority, created_at) VALUES (?, ?, ?, ?)", (data.name, data.description, data.priority, created_at))
        connection.commit()
        new_id = cursor.lastrowid
    finally:
        connection.close()

    new_ticket = {"id": new_id, "name": data.name, "description": data.description, "priority": data.priority, "status": "aperto", "created_at": created_at}
    return new_ticket


@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: int, data: TicketUpdate):
    connection = get_connection()
    try:
        ticket = connection.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not ticket: 
            raise HTTPException(status_code=404, detail="Ticket non trovato")
        
        new_status = data.status if data.status is not None else ticket["status"]
        new_priority = data.priority if data.priority is not None else ticket["priority"]

        connection.execute("UPDATE tickets SET status = ?, priority = ? WHERE id = ?", (new_status, new_priority, ticket_id))
        connection.commit()
        ticket = connection.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    finally:
        connection.close()

    return dict(ticket)
