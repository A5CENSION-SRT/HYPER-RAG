import os
import fitz
import pdfplumber
import io
from typing import List, Optional
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForVision2Seq

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma



loaded = False
processor = None
model = None
device = "cuda" if torch.cuda.is_available() else "cpu"

def load_blip_model():
    global processor, model, loaded
    processor = AutoProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    model = AutoModelForVision2Seq.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
    loaded = True

def generate_caption(image):
    global loaded, processor, model
    if not loaded:
        load_blip_model()
    inputs = processor(images=image, return_tensors="pt").to(device)
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)

    return caption
def round_bbox(bbox):
    return tuple(round(v, 2) for v in bbox)
def process_pdf_ordered(pdf_path):
    """
    Extract text, images (with captions), and tables from a PDF in reading order.
    Tables now get approximate bounding boxes for proper sorting.
    """
    docs = []
    doc = fitz.open(pdf_path)

    with pdfplumber.open(pdf_path) as pdf_plumber:
        for page_num, page in enumerate(doc, start=1):
            elements = []

            # 1️⃣ Text blocks
            for block in page.get_text("blocks"):
                if len(block) >= 6:
                    x0, y0, x1, y1, text, block_no = block[:6]
                    if text.strip():
                        elements.append({
                            "type": "text",
                            "content": text,
                            "bbox": str(round_bbox((x0, y0, x1, y1))),
                            "page": page_num
                        })

            # 2️⃣ Images
            for img in page.get_images(full=True):
                xref = img[0]
                bbox = page.get_image_bbox(img)
                base_image = doc.extract_image(xref)
                pil_image = Image.open(io.BytesIO(base_image["image"])).convert("RGB")
                caption = generate_caption(pil_image)
                elements.append({
                    "type": "image",
                    "content": f"[IMAGE] {caption}",
                    "bbox": str(round_bbox(bbox)),
                    "page": page_num
                })


            # 3️⃣ Tables with approximate bbox
            pdf_plumber_page = pdf_plumber.pages[page_num - 1]  # 0-indexed
            try:
                for table in pdf_plumber_page.find_tables():
                    # Table coordinates
                    cells = [cell for row in table.cells for cell in row if isinstance(cell, dict)]
                    if not cells:
                        continue
                    x0 = min(cell["x0"] for cell in cells)
                    y0 = min(cell["top"] for cell in cells)
                    x1 = max(cell["x1"] for cell in cells)
                    y1 = max(cell["bottom"] for cell in cells)
                    bbox = str(round_bbox((x0, y0, x1, y1)))

                    # Table text
                    table_text = "\n".join([
                        "\t".join(cell if cell else "" for cell in row)
                        for row in table.extract()
                        if any(row)
                    ])
                    if table_text.strip():
                        elements.append({
                            "type": "table",
                            "content": f"[TABLE]\n{table_text}",
                            "bbox": bbox,
                            "page": page_num
                        })
                    
            except Exception as e:
                print(f"Error extracting tables from page {page_num}: {e}")
                pass

            # Sort elements top-to-bottom on page
            elements.sort(key=lambda x: (x['bbox'][1], x['bbox'][0]))
            for el in elements:
                docs.append(
                    Document(
                        page_content=el["content"],
                        metadata={
                            "source": os.path.basename(pdf_path),
                            "type": el["type"],
                            "page": el["page"],
                            "bbox": el["bbox"],
                            
                        }
                    )
                )
    return docs

def chunk_documents(documents, chunk_size=1000, chunk_overlap=200):
    """
    Split a list of LangChain Documents into smaller chunks.

    Args:
        docs (list[Document]): List of parsed LangChain Documents.
        chunk_size (int): Max characters per chunk.
        chunk_overlap (int): Number of overlapping characters.

    Returns:
        list[Document]: Chunked documents ready for embedding/RAG.
    """

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    all_chunks = []
    for doc in documents:
        chunks = text_splitter.split_text(doc.page_content)
        for i, chunk in enumerate(chunks):
            print(f"Chunk {i+1}/{len(chunks)}: {chunk}")
            all_chunks.append(
                Document(
                    page_content=chunk,
                    metadata={
                        **doc.metadata,
                        "chunk": i + 1,
                        "total_chunks": len(chunks)
                    }
                )
            )
    return all_chunks


def create_embeddings():
    """
    Create HuggingFace embeddings for the documents.
    """
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return embedding_model

def build_chroma_index(
    documents: List[Document],
    embedding_model,
    persist_directory: str = "main_db/vector_db",
    collection_name: Optional[str] = None,
):
    """
    Create or update a Chroma vector database from a list of LangChain Documents.

    Args:
        documents (List[Document]): List of LangChain Document objects to index.
        embedding_model: Any LangChain-compatible embedding function.
        persist_directory (str): Directory where Chroma DB will be stored.
        collection_name (str, optional): Name of the Chroma collection.
        reset (bool): If True, deletes any existing DB at persist_directory.

    Returns:
        Chroma: A persisted Chroma vector store instance.
    """
    
    vectordb = Chroma.from_documents(
        documents=documents,
        embedding=embedding_model,
        persist_directory=persist_directory,
        collection_name=collection_name
    )

    vectordb.persist()
    return vectordb

    
if __name__ == "__main__":
    # Example usage with the provided PDF
    pdf_path = r"c:\coding\Repositories\Multi-Agent-RAG-Pipeline\main_db\pdfs_db\Washing Machine Sales Template (1).pdf"
    if os.path.exists(pdf_path):
        docs = process_pdf_ordered(pdf_path)        
        chunks = chunk_documents(docs)
        embedding_model = create_embeddings()
        vectordb = build_chroma_index(chunks, embedding_model, collection_name="pdf_collection")
        print(f" Indexed {len(chunks)} chunks into Chroma at {vectordb._persist_directory}")
    else:
        print(" PDF file not found. Please check the path.")