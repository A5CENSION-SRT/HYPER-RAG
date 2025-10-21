import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, AsyncGenerator

from app.database.database import get_db, SessionLocal
from app.models.session import ChatSession, ChatMessage
from app.schemas.chat import ChatSessionResponse, ChatMessageResponse, ChatMessageCreate, ChatSessionTitleUpdate, ChatMessageMetadataUpdate

from app.agents.agent_manager import agent_manager
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(
    prefix="/chats",
    tags=["Chat"],
)

@router.post("/", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(db: Session = Depends(get_db)):
    new_session = ChatSession(title="New Chat")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    new_session.id = str(new_session.id)
    return new_session

@router.get("/", response_model=List[ChatSessionResponse])
def get_all_chat_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    for session in sessions:
        session.id = str(session.id)
    return sessions

@router.get("/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    for message in messages:
        message.session_id = str(message.session_id)
    return messages

@router.patch("/{session_id}/title", status_code=status.HTTP_200_OK)
def update_session_title(
    session_id: str, 
    title_update: ChatSessionTitleUpdate,
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.title = title_update.title
    db.commit()
    return {"message": "Title updated successfully"}

@router.patch("/{session_id}/messages/{message_id}/metadata", status_code=status.HTTP_200_OK)
def update_message_metadata(
    session_id: str,
    message_id: int,
    metadata_update: ChatMessageMetadataUpdate,
    db: Session = Depends(get_db)
):
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.session_id == session_id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if metadata_update.agent_name is not None:
        message.agent_name = metadata_update.agent_name
    if metadata_update.time_consumed is not None:
        message.time_consumed = metadata_update.time_consumed
    
    db.commit()
    return {"message": "Message metadata updated successfully"}

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
        
        try:
            async for event in agent_manager.astream_events(initial_state, version="v2", config={"recursion_limit": 10}):
                kind = event["event"]
                name = event.get("name", "")
                metadata = event.get("metadata", {})
                langgraph_node = metadata.get("langgraph_node", "")
                
                print(f"[EVENT] Kind: {kind}, Name: {name}, Node: {langgraph_node}")
                
                # Send status when supervisor node starts
                if kind == "on_chain_start" and langgraph_node == "supervisor":
                    status_msg = 'Supervisor analyzing your question...'
                    print(f"[STATUS] {status_msg}")
                    yield f"data: {json.dumps({'status': status_msg})}\n\n"
                
                # Send status updates for tool calls (when supervisor delegates to agents)
                if kind == "on_tool_start":
                    # Clean up tool name
                    tool_name = name.replace("_", " ").replace("tool", "").strip().title()
                    if "washing" in name.lower():
                        status_msg = 'Delegating to Washing Machine Expert...'
                    elif "refrigerator" in name.lower():
                        status_msg = 'Delegating to Refrigerator Expert...'
                    elif "air" in name.lower() or "conditioner" in name.lower():
                        status_msg = 'Delegating to Air Conditioner Expert...'
                    else:
                        status_msg = f'Calling tool: {tool_name}'
                    print(f"[STATUS] {status_msg}")
                    yield f"data: {json.dumps({'status': status_msg})}\n\n"
                
                # Send status when sub-agents start running
                if kind == "on_chain_start" and langgraph_node and langgraph_node != "supervisor":
                    if "washing" in langgraph_node.lower():
                        status_msg = 'Washing Machine Agent searching knowledge base...'
                    elif "refrigerator" in langgraph_node.lower():
                        status_msg = 'Refrigerator Agent searching knowledge base...'
                    elif "air" in langgraph_node.lower():
                        status_msg = 'Air Conditioner Agent searching knowledge base...'
                    else:
                        # Fallback: clean up node name
                        clean_name = langgraph_node.replace("_", " ").replace("agent", "").replace("Agent", "").strip().title()
                        status_msg = f'Running {clean_name} Agent...'
                    print(f"[STATUS] {status_msg}")
                    yield f"data: {json.dumps({'status': status_msg})}\n\n"
                
                # Only capture streaming tokens from the final supervisor response
                if kind == "on_chat_model_stream" and event.get("name") == "ChatGoogleGenerativeAI":
                    # Check if this is from the supervisor node (not sub-agents)
                    if metadata.get("langgraph_node") == "supervisor":
                        chunk = event["data"].get("chunk")
                        if chunk and hasattr(chunk, 'content'):
                            token = chunk.content
                            if token:
                                full_ai_response += token
                                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            print(f"Error during streaming: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        # Save the AI response to database after streaming is complete
        message_id = None
        with SessionLocal() as db_session:
            if full_ai_response:
                ai_message_to_save = ChatMessage(
                    session_id=session_id,
                    sender="ai",
                    content=full_ai_response.strip()
                )
                db_session.add(ai_message_to_save)
                db_session.commit()
                db_session.refresh(ai_message_to_save)
                message_id = ai_message_to_save.id
                
                # Update session's updated_at timestamp
                session_to_update = db_session.query(ChatSession).filter(ChatSession.id == session_id).first()
                if session_to_update:
                    session_to_update.updated_at = ai_message_to_save.created_at
                    db_session.commit()
        
        yield f"data: {json.dumps({'event': 'end', 'message_id': message_id})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )