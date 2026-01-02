"""FastAPI backend for LLM Council."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid
import json
import asyncio

from . import storage
from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings
from .councils import run_round_table_council, run_hierarchy_council, run_assembly_line_council

app = FastAPI(title="LLM Council API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""
    pass


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str
    council_type: str = "default"  # "default", "round_table", "hierarchy", "assembly_line"


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    message_count: int


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "LLM Council API"}


@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations():
    """List all conversations (metadata only)."""
    return storage.list_conversations()


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation."""
    conversation_id = str(uuid.uuid4())
    conversation = storage.create_conversation(conversation_id)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all its messages."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    try:
        success = storage.delete_conversation(conversation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"status": "deleted", "id": conversation_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting conversation: {str(e)}")


@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    # Add user message
    storage.add_user_message(conversation_id, request.content)

    # If this is the first message, generate a title with council type
    if is_first_message:
        title = await generate_conversation_title(request.content, request.council_type or "default")
        storage.update_conversation_title(conversation_id, title)

    # Respect the selected council type and route accordingly
    council_type = request.council_type or "default"

    if council_type == "round_table":
        iteration_results, synthesis_result, metadata = await run_round_table_council(request.content, iterations=2)
        assistant_message = {
            "role": "assistant",
            "council_type": "round_table",
            "iterations": iteration_results,
            "synthesis": synthesis_result,
            "metadata": metadata
        }
        storage.add_assistant_message_obj(conversation_id, assistant_message)
        return {"iterations": iteration_results, "synthesis": synthesis_result, "metadata": metadata, "council_type": "round_table"}

    elif council_type == "hierarchy":
        junior_responses, lead_decision, metadata = await run_hierarchy_council(request.content)
        assistant_message = {
            "role": "assistant",
            "council_type": "hierarchy",
            "junior_responses": junior_responses,
            "lead_decision": lead_decision,
            "metadata": metadata
        }
        storage.add_assistant_message_obj(conversation_id, assistant_message)
        return {"junior_responses": junior_responses, "lead_decision": lead_decision, "metadata": metadata, "council_type": "hierarchy"}

    elif council_type == "assembly_line":
        stage_results, final_output, metadata = await run_assembly_line_council(request.content)
        assistant_message = {
            "role": "assistant",
            "council_type": "assembly_line",
            "stages": stage_results,
            "final_output": final_output,
            "metadata": metadata
        }
        storage.add_assistant_message_obj(conversation_id, assistant_message)
        return {"stages": stage_results, "final_output": final_output, "metadata": metadata, "council_type": "assembly_line"}

    else:
        # Default: 3-stage council
        stage1_results, stage2_results, stage3_result, metadata = await run_full_council(request.content)

        # Add assistant message with all stages
        storage.add_assistant_message(
            conversation_id,
            stage1_results,
            stage2_results,
            stage3_result
        )

        # Return the complete response with metadata
        return {
            "stage1": stage1_results,
            "stage2": stage2_results,
            "stage3": stage3_result,
            "metadata": metadata,
            "council_type": "default"
        }


@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and stream the council process.
    Supports different council types: default, round_table, hierarchy, assembly_line.
    Returns Server-Sent Events as each stage completes.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0
    council_type = request.council_type or "default"

    async def event_generator():
        try:
            # Add user message
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(request.content, council_type))

            # Route to appropriate council type
            if council_type == "round_table":
                # Round Table: Collaborative iteration
                yield f"data: {json.dumps({'type': 'council_start', 'council_type': 'round_table'})}\n\n"
                iteration_results, synthesis_result, metadata = await run_round_table_council(request.content, iterations=2)
                yield f"data: {json.dumps({'type': 'council_complete', 'iterations': iteration_results, 'synthesis': synthesis_result, 'metadata': metadata})}\n\n"
                
                assistant_message = {
                    "role": "assistant",
                    "council_type": "round_table",
                    "iterations": iteration_results,
                    "synthesis": synthesis_result,
                    "metadata": metadata
                }
                
            elif council_type == "hierarchy":
                # Hierarchy: Lead agent makes final call
                yield f"data: {json.dumps({'type': 'council_start', 'council_type': 'hierarchy'})}\n\n"
                junior_responses, lead_decision, metadata = await run_hierarchy_council(request.content)
                yield f"data: {json.dumps({'type': 'council_complete', 'junior_responses': junior_responses, 'lead_decision': lead_decision, 'metadata': metadata})}\n\n"
                
                assistant_message = {
                    "role": "assistant",
                    "council_type": "hierarchy",
                    "junior_responses": junior_responses,
                    "lead_decision": lead_decision,
                    "metadata": metadata
                }
                
            elif council_type == "assembly_line":
                # Assembly Line: Sequential workflow
                yield f"data: {json.dumps({'type': 'council_start', 'council_type': 'assembly_line'})}\n\n"
                stage_results, final_output, metadata = await run_assembly_line_council(request.content)
                yield f"data: {json.dumps({'type': 'council_complete', 'stages': stage_results, 'final_output': final_output, 'metadata': metadata})}\n\n"
                
                assistant_message = {
                    "role": "assistant",
                    "council_type": "assembly_line",
                    "stages": stage_results,
                    "final_output": final_output,
                    "metadata": metadata
                }
                
            else:
                # Default: 3-stage council
                yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
                stage1_results = await stage1_collect_responses(request.content)
                yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

                yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
                stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results)
                aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
                yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

                yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
                stage3_result = await stage3_synthesize_final(request.content, stage1_results, stage2_results)
                yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"
                
                assistant_message = {
                    "role": "assistant",
                    "council_type": "default",
                    "stage1": stage1_results,
                    "stage2": stage2_results,
                    "stage3": stage3_result,
                    "metadata": {"label_to_model": label_to_model, "aggregate_rankings": aggregate_rankings}
                }

            # Wait for title generation if it was started
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            # Save complete assistant message
            storage.add_assistant_message_obj(conversation_id, assistant_message)

            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
