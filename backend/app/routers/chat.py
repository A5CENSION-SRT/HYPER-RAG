from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Session
from typing import List

from app.database.database import get_db
from app.models.session import ChatSession, ChatMessage
from app.schemas.session import ChatSessionCreate, ChatSessionResponse, ChatMessageCreate
from app.schemas.chat import ChatMessageResponse
from app.agents.agent_manager import agent_manager
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(prefix="/chats", tags=["chat"])


@router.post("/", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(db: Session = Depends(get_db)):
    new_session = ChatSession(title="New Chat")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/", response_model=List[ChatSessionResponse])
def get_all_chat_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    return sessions

@router.get("/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    return messages

@router.post("/{session_id}/messages", response_model=ChatMessageResponse)
def post_message(
    session_id: str,
    message_in: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    user_message = ChatMessage(
        session_id=session_id,
        sender="human",
        content=message_in.content
    )
    db.add(user_message)
    db.commit()

    history_from_db = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    
    messages_for_agent = []
    for msg in history_from_db:
        if msg.sender == "human":
            messages_for_agent.append(HumanMessage(content=msg.content))
        elif msg.sender == 'ai':
            messages_for_agent.append(AIMessage(content=msg.content))
            
    initial_state = {"messages": messages_for_agent}

    final_state = agent_manager.invoke(initial_state, {"recursion_limit": 100})
    ai_response_message = final_state['messages'][-1]
    
    ai_message_to_save = ChatMessage(
        session_id=session_id,
        sender="ai",
        content=ai_response_message.content
    )
    db.add(ai_message_to_save)
    
    session.updated_at = ai_message_to_save.created_at
    db.commit()
    db.refresh(ai_message_to_save)

    return ai_message_to_save