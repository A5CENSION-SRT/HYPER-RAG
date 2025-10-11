import sys
from pathlib import Path
from langchain_core.messages import AIMessage, HumanMessage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.agents.agent_manager import agent_manager
from app.agents.state import AgentState

def main():
    """test run"""

