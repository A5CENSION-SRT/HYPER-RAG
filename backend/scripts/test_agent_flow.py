import sys
from pathlib import Path
from langchain_core.messages import BaseMessage, HumanMessage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.agents.agent_manager import agent_manager
from app.agents.state import AgentState

def main():
    print("\nMulti-Agent RAG System Test")
    print("Enter 'exit' to quit.")
    
    conversation_history: list[BaseMessage] = []

    while True:
        try:
            user_input = input("\nYou: ")
            if user_input.lower() == "exit":
                print("Exiting...")
                break

            conversation_history.append(HumanMessage(content=user_input))
            initial_state: AgentState = {"messages": conversation_history}
            
            print("\nAI is thinking...")
            print("-" * 20)

            final_state = None
            for step in agent_manager.stream(initial_state, {"recursion_limit": 50}):
                node_name = list(step.keys())[0]
                print(f"Executed node: {node_name}")
                final_state = step

            ai_response_message = final_state['supervisor']['messages'][-1]
            final_answer = ai_response_message.content
            conversation_history.append(ai_response_message)
            
            print("-" * 20)
            print(f"AI: {final_answer}\n")

        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"\nError: {e}")
            break

if __name__ == "__main__":
    main()