import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, AsyncGenerator

from app.database.database import get_db
from app.models.session import ChatSession, ChatMessage
from app.schemas.chat import ChatSessionResponse, ChatMessageResponse, ChatMessageCreate

from app.agents.agent_manager import agent_manager
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(
    prefix="/chats",
    tags=["Chat"],
)

#new session 
@router.post("/", response_model=ChatSessionResponse, status_code=status.HTTP_2_CREATED)
def create_chat_session(db: Session = Depends(get_db)):
    new_session = ChatSession(title="New Chat")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

#all chat sessions
@router.get("/", response_model=List[ChatSessionResponse])
def get_all_chat_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    return sessions

#get chat history
@router.get("/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    return messages

@router.post("/{session_id}/messages/stream")
async def stream_message(
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

    async def event_generator() -> AsyncGenerator[str, None]:
        full_ai_response = ""
        
        async for event in agent_manager.astream_events(initial_state, version="v2", config={"recursion_limit": 10}):
            kind = event["event"]
            
            if kind == "on_llm_stream" and event["name"] == "supervisor":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, 'content'):
                    token = chunk.content
                    if token:
                        full_ai_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"

        with SessionLocal() as db_session:
            session_to_update = db_session.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session_to_update and full_ai_response:
                ai_message_to_save = ChatMessage(
                    session_id=session_id,
                    sender="ai",
                    content=full_ai_response.strip()
                )
                db_session.add(ai_message_to_save)
                session_to_update.updated_at = ai_message_to_save.created_at
                db_session.commit()
        
        yield f"data: {json.dumps({'event': 'end'})}\n\n"

    from app.database.database import SessionLocal
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")