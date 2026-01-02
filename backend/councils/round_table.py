"""Round Table Council - Collaborative iteration where every agent sees every other agent's response."""

from typing import List, Dict, Any, Tuple
from ..openrouter import query_models_parallel, query_model
from ..config import COUNCIL_MODELS, CHAIRMAN_MODEL


async def run_round_table_council(user_query: str, iterations: int = 2) -> Tuple[List, Dict]:
    """
    Run the Round Table council process.
    
    Every agent sees every other agent's response and iterates together.
    Good for creative brainstorming and collaborative problem-solving.
    
    Args:
        user_query: The user's question
        iterations: Number of rounds agents should iterate (default 2)
    
    Returns:
        Tuple of (iteration_results, metadata)
    """
    iteration_results = []
    
    # Initial round - collect responses
    messages = [{"role": "user", "content": user_query}]
    responses = await query_models_parallel(COUNCIL_MODELS, messages)
    
    round_1_results = []
    for model, response in responses.items():
        if response is not None:
            round_1_results.append({
                "model": model,
                "response": response.get('content', '')
            })
    
    iteration_results.append({
        "round": 1,
        "responses": round_1_results
    })
    
    # Additional iterations where agents see each other's work
    previous_responses = round_1_results
    
    for iteration in range(2, iterations + 1):
        # Build context showing all previous responses
        responses_context = "\n\n".join([
            f"**{result['model']}:**\n{result['response']}"
            for result in previous_responses
        ])
        
        iteration_prompt = f"""You are part of a collaborative council discussing the following question:

**Question:** {user_query}

**Previous responses from other council members:**
{responses_context}

Based on the responses above, please provide your refined or alternative perspective on this question. 
Consider what others have said, add your insights, or refine your approach based on their input.
Aim to either build upon the best ideas or offer a genuinely different perspective that adds value."""
        
        iteration_messages = [{"role": "user", "content": iteration_prompt}]
        
        # Get refined responses from all models
        iteration_responses = await query_models_parallel(COUNCIL_MODELS, iteration_messages)
        
        iteration_round_results = []
        for model, response in iteration_responses.items():
            if response is not None:
                iteration_round_results.append({
                    "model": model,
                    "response": response.get('content', '')
                })
        
        iteration_results.append({
            "round": iteration,
            "responses": iteration_round_results
        })
        
        previous_responses = iteration_round_results
    
    # Generate final synthesis
    final_context = "\n\n".join([
        f"**{result['model']}:**\n{result['response']}"
        for result in previous_responses
    ])
    
    synthesis_prompt = f"""You are the facilitator of a Round Table council that has been discussing the following question:

**Question:** {user_query}

**Final perspectives from all council members:**
{final_context}

Please synthesize all of these perspectives into a comprehensive, well-rounded final answer that captures the best insights from the entire discussion. 
The answer should integrate the different viewpoints and create a cohesive response."""
    
    synthesis_messages = [{"role": "user", "content": synthesis_prompt}]
    synthesis_response = await query_model(CHAIRMAN_MODEL, synthesis_messages)
    
    synthesis_result = {
        "model": CHAIRMAN_MODEL,
        "response": synthesis_response.get('content', '') if synthesis_response else "Unable to synthesize responses."
    }
    
    metadata = {
        "council_type": "round_table",
        "iterations": iterations,
        "total_models": len(COUNCIL_MODELS),
        "models": COUNCIL_MODELS,
        "synthesis_model": CHAIRMAN_MODEL
    }
    
    return iteration_results, synthesis_result, metadata
