import chromadb
import ollama
from typing import List, Optional

CHROMA_PATH = "./chroma_data"
EMBEDDING_MODEL = "nomic-embed-text"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

_client: Optional[chromadb.PersistentClient] = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
    return _client


def _collection_name(subject_id: int) -> str:
    return f"subject_{subject_id}"


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks by word count."""
    words = text.split()
    if len(words) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts using Ollama."""
    response = ollama.embed(model=EMBEDDING_MODEL, input=texts)
    return response["embeddings"]


def ingest_document(subject_id: int, text: str, source_type: str = "curriculum") -> int:
    """Chunk text, embed it, and store in ChromaDB. Returns number of chunks stored."""
    client = get_chroma_client()
    collection = client.get_or_create_collection(name=_collection_name(subject_id))

    chunks = chunk_text(text)
    if not chunks:
        return 0

    embeddings = generate_embeddings(chunks)

    ids = [f"{source_type}_{subject_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"source_type": source_type, "subject_id": subject_id, "chunk_index": i} for i in range(len(chunks))]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


def retrieve_context(subject_id: int, query: str, top_k: int = 5) -> Optional[str]:
    """Query ChromaDB for relevant chunks and return formatted context string."""
    client = get_chroma_client()

    col_name = _collection_name(subject_id)
    existing = [c.name for c in client.list_collections()]
    if col_name not in existing:
        return None

    collection = client.get_collection(name=col_name)
    if collection.count() == 0:
        return None

    query_embedding = generate_embeddings([query])[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
    )

    if not results["documents"] or not results["documents"][0]:
        return None

    context_parts = results["documents"][0]
    return "\n\n---\n\n".join(context_parts)


def delete_subject_data(subject_id: int):
    """Remove all ChromaDB data for a subject."""
    client = get_chroma_client()
    col_name = _collection_name(subject_id)
    existing = [c.name for c in client.list_collections()]
    if col_name in existing:
        client.delete_collection(name=col_name)
