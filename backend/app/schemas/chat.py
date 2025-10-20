import datetime
from typing import List, Optional,Dict,Any
from pydantic import BaseModel,ConfigDict

class Ormconfig(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class ChatMessageBase(Ormconfig):
    """
    Schema for a single chat message when sent to the client.
    """
    