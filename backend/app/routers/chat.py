from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Session
from typing import List

from app.database.database import get_db
from app.models.session import ChatSession, ChatMessage
from app.schemas.session import ChatSessionCreate, ChatSessionResponse, ChatMessageCreate\

from app.agents.agent_manager import agent_manager
from langchain_core.messages import HumanMessage

router = APIRouter(prefix="/chats", tags=["chat"])

