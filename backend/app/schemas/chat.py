import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class OrmConfig(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class ChatMessageResponse(OrmConfig):
    """
    Schema for a single chat message when sent to the client.
    """
    id: int
    session_id: str
    sender: str
    content: str
    created_at: datetime.datetime

class ChatSessionResponse(OrmConfig):
    """
    Schema for a chat session's metadata.
    """
    id: str
    title: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

class ChatMessageCreate(BaseModel):
    """
    Schema for the data the client sends when creating a new message.
    """
    content: str

class ChatSessionTitleUpdate(BaseModel):
    """
    Schema for updating a chat session's title.
    """
    title: str
