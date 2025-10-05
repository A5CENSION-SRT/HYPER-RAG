from typing import List, TypedDict, Annotated
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    """Represents the state of an agent, including its name, tools, and message history."""
    name: str
    tools: List[str]
    message_history: Annotated[List[BaseMessage], "A list of messages exchanged by the agent."]