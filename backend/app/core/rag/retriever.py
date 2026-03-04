from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from openai import AsyncOpenAI
import uuid
from typing import List

client = AsyncOpenAI() # uses OPENAI_API_KEY from env
qdrant = QdrantClient(path=":memory:") # Use memory for local test. Swap to host for prod
COLLECTION_NAME = "saarkaar_knowledge"

async def initialize_rag():
    \"\"\"
    Create Qdrant collection on start.
    \"\"\"
    if not qdrant.collection_exists(COLLECTION_NAME):
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )

async def generate_embedding(text: str) -> List[float]:
    response = await client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

async def store_project_document(project_id: str, content: str, meta: dict):
    \"\"\"
    Convert knowledge into embeddings and store in Qdrant.
    \"\"\"
    vector = await generate_embedding(content)
    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload={"project_id": project_id, "content": content, **meta}
    )
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[point]
    )

async def retrieve_knowledge(query: str, top_k: int = 3) -> str:
    \"\"\"
    STEP 4: Semantic Search.
    Retrieve top K matching documents from Qdrant via OpenAI embeddings.
    \"\"\"
    query_vector = await generate_embedding(query)
    search_result = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=top_k
    )
    
    contexts = [hit.payload["content"] for hit in search_result]
    return "\\n---\\n".join(contexts) if contexts else ""
