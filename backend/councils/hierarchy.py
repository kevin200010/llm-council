"""Hierarchy Council - Junior agents report to a Lead Agent who makes the final call."""

from typing import List, Dict, Any, Tuple
from ..openrouter import query_models_parallel, query_model
from ..config import COUNCIL_MODELS, CHAIRMAN_MODEL


async def run_hierarchy_council(user_query: str) -> Tuple[List, Dict]:
    """
    Run the Hierarchy council process.
    
    Junior agents (council members) provide responses, and a Lead Agent 
    (chairman) evaluates them and makes the final decision.
    Good for professional and technical tasks where expertise matters.
    
    Args:
        user_query: The user's question
    
    Returns:
        Tuple of (junior_responses, lead_decision, metadata)
    """
    # Stage 1: Junior agents provide initial responses
    messages = [{"role": "user", "content": user_query}]
    responses = await query_models_parallel(COUNCIL_MODELS, messages)
    
    junior_responses = []
    for model, response in responses.items():
        if response is not None:
            junior_responses.append({
                "model": model,
                "response": response.get('content', '')
            })
    
    # Stage 2: Lead Agent evaluates and makes final call
    responses_context = "\n\n".join([
        f"**Junior Agent ({result['model']}):**\n{result['response']}"
        for result in junior_responses
    ])
    
    lead_prompt = f"""You are the Lead Agent of a professional council. Multiple junior agents have provided their responses and recommendations to the following question:

**Question:** {user_query}

**Responses from Junior Agents:**
{responses_context}

As the Lead Agent, your responsibility is to:
1. Evaluate the quality and accuracy of each junior agent's response
2. Identify the most reliable and insightful recommendation
3. Make a definitive final decision based on professional judgment
4. Clearly state your rationale for the decision

Please provide your authoritative final decision and recommendation:"""
    
    lead_messages = [{"role": "user", "content": lead_prompt}]
    lead_response = await query_model(CHAIRMAN_MODEL, lead_messages)
    
    lead_decision = {
        "model": CHAIRMAN_MODEL,
        "role": "Lead Agent",
        "decision": lead_response.get('content', '') if lead_response else "Unable to make decision."
    }
    
    metadata = {
        "council_type": "hierarchy",
        "junior_agents": len(COUNCIL_MODELS),
        "agents": COUNCIL_MODELS,
        "lead_agent": CHAIRMAN_MODEL,
        "total_junior_responses": len(junior_responses)
    }
    
    return junior_responses, lead_decision, metadata
