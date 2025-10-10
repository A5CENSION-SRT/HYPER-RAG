# app/agents/state.py
from typing import List, TypedDict, Annotated
from langchain_core.messages import BaseMessage
import operator

MessagesState = Annotated[List[BaseMessage], operator.add]

class AgentState(TypedDict):
    messages: MessagesState