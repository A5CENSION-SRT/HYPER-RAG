# RAG Retrieval Improvement Strategies

## Current Issues Analysis
- **Partial retrieval**: Not getting complete relevant information
- **Accuracy problems**: Retrieved chunks may not be the most relevant
- **Current setup**: Basic similarity search with k=5

---

## 🎯 Improvement Strategies (Ranked by Impact)

### 1. **Hybrid Search (Semantic + Keyword)** ⭐⭐⭐⭐⭐
**Impact**: HIGH | **Complexity**: MEDIUM

Combine semantic search with keyword-based search (BM25) for better accuracy.

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

def get_hybrid_retriever(product_category: str, documents: List[Document]):
    # Semantic retriever (current)
    semantic_retriever = get_retriever(product_category)
    
    # Keyword retriever (BM25)
    bm25_retriever = BM25Retriever.from_documents(documents)
    bm25_retriever.k = 5
    
    # Combine both with weights
    ensemble_retriever = EnsembleRetriever(
        retrievers=[semantic_retriever, bm25_retriever],
        weights=[0.5, 0.5]  # Equal weight, tune as needed
    )
    return ensemble_retriever
```

**Pros**: Catches exact matches that semantic search might miss
**Cons**: Need to store documents in memory for BM25

---

### 2. **Reranking with Cross-Encoder** ⭐⭐⭐⭐⭐
**Impact**: VERY HIGH | **Complexity**: LOW

Retrieve more candidates (k=20), then rerank them with a more accurate model.

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder

def get_reranking_retriever(product_category: str):
    base_retriever = get_retriever(product_category)
    
    # Use a cross-encoder model for reranking
    model = HuggingFaceCrossEncoder(model_name="cross-encoder/ms-marco-MiniLM-L-6-v2")
    compressor = CrossEncoderReranker(model=model, top_n=5)
    
    return ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=base_retriever
    )
```

**Install**: `pip install sentence-transformers`

---

### 3. **Multi-Query Retrieval** ⭐⭐⭐⭐
**Impact**: HIGH | **Complexity**: LOW

Generate multiple variations of the user's query to catch different phrasings.

```python
from langchain.retrievers.multi_query import MultiQueryRetriever

def get_multi_query_retriever(product_category: str, llm):
    base_retriever = get_retriever(product_category)
    
    return MultiQueryRetriever.from_llm(
        retriever=base_retriever,
        llm=llm
    )
```

**How it works**: LLM generates 3-5 variations of the query, retrieves for each, and deduplicates results.

---

### 4. **Contextual Chunk Headers** ⭐⭐⭐⭐
**Impact**: MEDIUM-HIGH | **Complexity**: MEDIUM

Add context to each chunk about its location in the document.

```python
def chunk_documents_with_context(documents: List[Document], chunk_size: int = 1000):
    chunks = []
    for doc in documents:
        # Add header with context
        context_header = f"Document: {doc.metadata.get('source', 'unknown')}\n"
        context_header += f"Page: {doc.metadata.get('page_number', 'N/A')}\n"
        context_header += f"Section: {doc.metadata.get('element_type', 'text')}\n\n"
        
        # Split the content
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size - len(context_header),
            chunk_overlap=200
        )
        
        splits = text_splitter.split_text(doc.page_content)
        for split in splits:
            chunks.append(Document(
                page_content=context_header + split,
                metadata=doc.metadata
            ))
    
    return chunks
```

---

### 5. **Improved Chunking Strategy** ⭐⭐⭐⭐
**Impact**: MEDIUM-HIGH | **Complexity**: LOW

Current: chunk_size=1000, overlap=200
Better: Adjust based on content type

```python
def smart_chunk_documents(documents: List[Document]) -> List[Document]:
    chunks = []
    
    for doc in documents:
        element_type = doc.metadata.get('element_type', 'text')
        
        if element_type == 'table':
            # Don't split tables
            chunks.append(doc)
        elif element_type == 'image':
            # Keep image captions whole
            chunks.append(doc)
        else:
            # Split text with appropriate sizes
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,  # Smaller chunks for better precision
                chunk_overlap=150,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            chunks.extend(text_splitter.split_documents([doc]))
    
    return chunks
```

---

### 6. **MMR (Maximum Marginal Relevance)** ⭐⭐⭐
**Impact**: MEDIUM | **Complexity**: LOW

Reduce redundancy by diversifying retrieved results.

```python
def get_mmr_retriever(product_category: str):
    vectorstore = Chroma(
        persist_directory=get_persist_dir(product_category),
        embedding_function=get_embedding_model(),
        collection_name=product_category
    )
    
    return vectorstore.as_retriever(
        search_type="mmr",  # Use MMR instead of similarity
        search_kwargs={
            "k": 5,
            "fetch_k": 20,  # Fetch more, then diversify
            "lambda_mult": 0.5  # Balance relevance vs diversity
        }
    )
```

---

### 7. **Metadata Filtering** ⭐⭐⭐
**Impact**: MEDIUM | **Complexity**: LOW

Filter results by metadata (e.g., specific model number, page range).

```python
def get_filtered_retriever(product_category: str, filters: dict = None):
    vectorstore = Chroma(...)
    
    search_kwargs = {"k": 5}
    if filters:
        search_kwargs["filter"] = filters
    
    return vectorstore.as_retriever(search_kwargs=search_kwargs)

# Usage:
retriever = get_filtered_retriever(
    "washing_machine",
    filters={"source": "User Manual_NA-F65G7_F70H7.pdf"}
)
```

---

### 8. **Increase k and Add Score Threshold** ⭐⭐⭐
**Impact**: MEDIUM | **Complexity**: VERY LOW

Simple but effective: retrieve more results with quality filtering.

```python
return vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={
        "k": 10,  # Retrieve more candidates
        "score_threshold": 0.5  # Only return chunks above this similarity
    }
)
```

---

### 9. **Parent Document Retriever** ⭐⭐⭐⭐
**Impact**: HIGH | **Complexity**: MEDIUM

Retrieve small chunks for accuracy, but return larger parent chunks for context.

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

def get_parent_retriever(product_category: str):
    vectorstore = Chroma(...)
    store = InMemoryStore()
    
    return ParentDocumentRetriever(
        vectorstore=vectorstore,
        docstore=store,
        child_splitter=RecursiveCharacterTextSplitter(chunk_size=400),
        parent_splitter=RecursiveCharacterTextSplitter(chunk_size=2000)
    )
```

---

### 10. **Query Expansion with Synonyms** ⭐⭐⭐
**Impact**: MEDIUM | **Complexity**: LOW

Expand technical terms before searching.

```python
def expand_query(query: str) -> str:
    synonyms = {
        "operation panel": ["control panel", "display panel", "interface"],
        "error": ["fault", "issue", "problem", "malfunction"],
        "washing machine": ["washer", "laundry machine", "washing appliance"]
    }
    
    expanded = query
    for term, syns in synonyms.items():
        if term.lower() in query.lower():
            expanded += " " + " ".join(syns)
    
    return expanded
```

---

## 🚀 Recommended Implementation Order

### Phase 1: Quick Wins (1-2 hours)
1. Increase k to 10 and add score threshold
2. Adjust chunk sizes to 800/150
3. Use MMR search type

### Phase 2: Significant Improvements (2-4 hours)
4. Implement reranking with cross-encoder
5. Add contextual chunk headers
6. Implement multi-query retrieval

### Phase 3: Advanced (4-8 hours)
7. Implement hybrid search (semantic + BM25)
8. Add parent document retriever
9. Implement metadata filtering

---

## 📊 Evaluation Metrics

Track these to measure improvement:
- **Retrieval Precision**: % of retrieved chunks that are relevant
- **Retrieval Recall**: % of relevant chunks that are retrieved
- **Answer Quality**: Does the final answer use the retrieved info correctly?
- **Latency**: How long does retrieval take?

---

## 🔧 Quick Fix for Your Current Setup

Update your `retrievers.py` with these immediate improvements:

```python
def get_retriever(product_category: str) -> VectorStoreRetriever:
    embedding_function = get_embedding_model()
    persist_directory = get_persist_dir(product_category)
    
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding_function,
        collection_name=product_category,
    )
    
    # IMPROVED: Use MMR with more candidates and score threshold
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 8,  # Return 8 results
            "fetch_k": 20,  # Consider 20 candidates
            "lambda_mult": 0.7  # Favor relevance over diversity
        }
    )
```

This simple change should improve your results immediately!
