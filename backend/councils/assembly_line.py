"""Assembly Line Council - Agent A finishes, then Agent B starts, then Agent C polishes."""

from typing import List, Dict, Any, Tuple
from ..openrouter import query_models_parallel, query_model
from ..config import COUNCIL_MODELS, CHAIRMAN_MODEL


async def run_assembly_line_council(user_query: str) -> Tuple[List, Dict]:
    """
    Run the Assembly Line council process.
    
    Sequential workflow where each agent builds on the previous agent's work:
    - Agent A: Initial response/draft
    - Agent B: Reviews and expands on Agent A's work
    - Agent C: Polishes and finalizes
    
    Good for structured workflows like coding, legal documents, or technical writing.
    
    Args:
        user_query: The user's question
    
    Returns:
        Tuple of (stage_results, final_output, metadata)
    """
    stage_results = []
    
    # Stage 1: First agent provides initial response/draft
    agent_a_prompt = f"""You are the first specialist in an assembly line team. Your job is to provide an initial response/draft to the following question.

**Question:** {user_query}

Provide a clear, well-structured initial response that will be reviewed and refined by specialists after you:"""
    
    messages = [{"role": "user", "content": agent_a_prompt}]
    agent_a_response = await query_model(COUNCIL_MODELS[0] if COUNCIL_MODELS else "mistralai/mistral-small-3.1-24b-instruct:free", messages)
    
    agent_a_content = agent_a_response.get('content', '') if agent_a_response else ""
    
    stage_results.append({
        "stage": 1,
        "agent": COUNCIL_MODELS[0] if COUNCIL_MODELS else "Agent A",
        "role": "Drafter",
        "response": agent_a_content
    })
    
    # Stage 2: Second agent reviews and expands
    agent_b_prompt = f"""You are the second specialist in an assembly line team. Your job is to review and expand on the work of the previous specialist.

**Original Question:** {user_query}

**Previous Specialist's Draft:**
{agent_a_content}

Your task is to:
1. Review their work for accuracy and completeness
2. Identify any gaps or areas that need more detail
3. Expand and improve their response with additional insights and structure
4. Build upon their foundation rather than starting over

Please provide your enhanced version:"""
    
    messages = [{"role": "user", "content": agent_b_prompt}]
    agent_b_response = await query_model(COUNCIL_MODELS[1] if len(COUNCIL_MODELS) > 1 else "mistralai/mistral-small-3.1-24b-instruct:free", messages)
    
    agent_b_content = agent_b_response.get('content', '') if agent_b_response else ""
    
    stage_results.append({
        "stage": 2,
        "agent": COUNCIL_MODELS[1] if len(COUNCIL_MODELS) > 1 else "Agent B",
        "role": "Reviewer & Expander",
        "response": agent_b_content
    })
    
    # Stage 3: Final agent polishes and finalizes
    agent_c_prompt = f"""You are the final specialist in an assembly line team. Your job is to polish and finalize the work.

**Original Question:** {user_query}

**Current Version (from previous specialists):**
{agent_b_content}

Your task is to:
1. Review the current work for clarity and coherence
2. Fix any issues with grammar, structure, or flow
3. Ensure all points are well-articulated and professional
4. Add final touches for polish and elegance
5. Make sure the response fully answers the original question

Please provide the final, polished version:"""
    
    messages = [{"role": "user", "content": agent_c_prompt}]
    agent_c_response = await query_model(COUNCIL_MODELS[2] if len(COUNCIL_MODELS) > 2 else "mistralai/mistral-small-3.1-24b-instruct:free", messages)
    
    agent_c_content = agent_c_response.get('content', '') if agent_c_response else ""
    
    stage_results.append({
        "stage": 3,
        "agent": COUNCIL_MODELS[2] if len(COUNCIL_MODELS) > 2 else "Agent C",
        "role": "Polisher",
        "response": agent_c_content
    })
    
    # Final output
    final_output = {
        "model": "Assembly Line Council",
        "response": agent_c_content,
        "stages_completed": 3
    }
    
    metadata = {
        "council_type": "assembly_line",
        "stages": 3,
        "agents": COUNCIL_MODELS[:3] if len(COUNCIL_MODELS) >= 3 else COUNCIL_MODELS,
        "agent_a": COUNCIL_MODELS[0] if COUNCIL_MODELS else "Agent A",
        "agent_b": COUNCIL_MODELS[1] if len(COUNCIL_MODELS) > 1 else "Agent B",
        "agent_c": COUNCIL_MODELS[2] if len(COUNCIL_MODELS) > 2 else "Agent C"
    }
    
    return stage_results, final_output, metadata
