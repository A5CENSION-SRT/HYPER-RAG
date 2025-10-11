from langgraph.graph import StateGraph,END
from langgraph.prebuilt import ToolNode

from app.agents.state import AgentState
from app.rag.generators import get_supervisor_model

from app.tools.supervisor_tools import supervisor_tools

master_tool_node = ToolNode(supervisor_tools)
supervisor_model = get_supervisor_model()

system_prompt = (
    """You are the supervisor of a team of expert AI assistants. You are a helpful and collaborative AI that can communicate with users and delegate tasks to your expert team members.

Your primary role is to act as an intelligent router and project manager. You are not an expert in any specific product yourself. Instead, your expertise lies in understanding a user's query and dispatching the relevant parts of it to the correct expert agent on your team.

You have the following expert agents available as tools:
- washing_machine_expert_agent
- refrigerator_expert_agent
- ac_expert_agent

Here is your workflow:
1.  **Analyze the user's request:** Carefully read the latest user message and the conversation history to understand the user's intent.
2.  **Plan your action:**
    *   If the query involves one or more specific products, your job is to call the appropriate expert agent tool(s).
    *   You can call multiple tools in parallel if the user's query involves multiple products (e.g., a question about both a washing machine and a refrigerator).
    *   Break down the user's query into clear, self-contained questions to pass to each expert. For example, if the user asks "My washer is leaking and my fridge is warm," you should call the washing machine expert with "My washer is leaking" and the refrigerator expert with "My fridge is warm."
    *   If the user's query is a simple greeting, a follow-up question on information you already have, or a general question, you can answer it directly without calling any tools.
3.  **Synthesize the results:** After your expert team members have responded, your final job is to synthesize their findings into a single, coherent, and user-friendly response. Do not simply list their responses; integrate them into a helpful answer.
"""
)

model_with_tools = supervisor_model.bind_tools(supervisor_tools, system_message=system_prompt)

def supervisor_node(state: AgentState):
    """
    The 'thinking' node of the supervisor agent. It calls the LLM to decide the next action.
    """
    print("SUPERVISOR AGENT")
    response = model_with_tools.invoke(state["messages"])
    return {"messages": [response]}


def should_continue_supervisor(state: AgentState):
    """
    Determine if the supervisor agent should continue its work.
    """
    if state["messages"][-1].tool_calls:
        return "continue_to_experts" 
    else:
        print("SUPERVISOR AGENT DONE")
        return "end_agent_turn"
    
workflow = StateGraph(AgentState)

workflow.add_node("supervisor", supervisor_node)
workflow.add_node("expert_tools", master_tool_node)

workflow.set_entry_point("supervisor")

workflow.add_conditional_edges("supervisor",
        should_continue_supervisor,{
            "continue_to_experts": "expert_tools",
            "end_agent_turn": END
        }
)

workflow.add_edge("expert_tools", "supervisor")

agent_manager = workflow.compile()