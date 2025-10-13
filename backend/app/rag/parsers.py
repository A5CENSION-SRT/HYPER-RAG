import os
import fitz  # PyMuPDF
import pdfplumber
import io
import logging
from typing import List
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForVision2Seq

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Global Variables for Efficient Model Loading ---
PROCESSOR = None
MODEL = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def load_blip_model():
    """Loads the BLIP image captioning model into memory only when needed."""

    global PROCESSOR, MODEL

    if MODEL is None:
        logger.info(f"Loading BLIP model onto device: {DEVICE}")
        PROCESSOR = AutoProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        MODEL = AutoModelForVision2Seq.from_pretrained("Salesforce/blip-image-captioning-base").to(DEVICE)
        logger.info("BLIP model loaded successfully.")

def generate_caption(pil_image: Image.Image) -> str:
    """Generates a caption for a given PIL image."""
    load_blip_model()
    inputs = PROCESSOR(images=pil_image, return_tensors="pt").to(DEVICE)
    out = MODEL.generate(**inputs)
    caption = PROCESSOR.decode(out[0], skip_special_tokens=True)
    return caption

def process_pdf(pdf_path: str) -> List[Document]:
    """Extracts text, image captions, and tables from a PDF in reading order."""
    logger.info(f"Starting PDF processing for: {os.path.basename(pdf_path)}")
    all_docs = []
    try:
        fitz_doc = fitz.open(pdf_path)
        with pdfplumber.open(pdf_path) as plumber_doc:
            for page_num, page in enumerate(fitz_doc, start=1):
                plumber_page = plumber_doc.pages[page_num - 1]
                page_elements = []
                
                # First, extract all tables and store their bounding boxes
                table_bboxes = []
                try:
                    for table_obj in plumber_page.find_tables():
                        if table_obj.bbox:
                            table_bboxes.append(table_obj.bbox)  # (x0, y0, x1, y1)
                except Exception as e:
                    logger.warning(f"Could not detect table regions on page {page_num}. Error: {e}")

                # Extract Text Blocks (but skip text inside table regions)
                for block in page.get_text("blocks"):
                    x0, y0, x1, y1, text, _, _ = block
                    if text.strip():
                        # Check if this text block overlaps with any table bbox
                        is_inside_table = False
                        for table_bbox in table_bboxes:
                            tx0, ty0, tx1, ty1 = table_bbox
                            # Check if block center is inside table bbox
                            block_center_x = (x0 + x1) / 2
                            block_center_y = (y0 + y1) / 2
                            if tx0 <= block_center_x <= tx1 and ty0 <= block_center_y <= ty1:
                                is_inside_table = True
                                break
                        
                        # Only add text block if it's NOT inside a table
                        if not is_inside_table:
                            page_elements.append({"bbox": (y0, x0), "content": text, "type": "text"})

                # Extract Images and generate captions
                for img_info in page.get_images(full=True):
                    xref = img_info[0]
                    try:
                        bbox = page.get_image_bbox(img_info)
                        base_image = fitz_doc.extract_image(xref)
                        pil_image = Image.open(io.BytesIO(base_image["image"])).convert("RGB")
                        caption = generate_caption(pil_image)
                        content = f"[IMAGE: A picture of '{caption}']"
                        page_elements.append({"bbox": (bbox.y0, bbox.x0), "content": content, "type": "image"})
                    except Exception as e:
                        logger.warning(f"Could not process image on page {page_num}. Error: {e}")

                # Extract Tables
                try:
                    for table_obj in plumber_page.find_tables():
                        table = table_obj.extract()
                        if table:
                            table_text = "\n".join([
                                "\t".join(str(cell if cell is not None else "") for cell in row)
                                for row in table
                            ])
                            content = f"[TABLE]\n{table_text}"
                            page_elements.append({"bbox": (table_obj.bbox[1], table_obj.bbox[0]), "content": content, "type": "table"})
                except Exception as e:
                    logger.warning(f"Could not extract tables from page {page_num}. Error: {e}")

                # Sort elements by position and create Document objects
                page_elements.sort(key=lambda el: el["bbox"])
                for el in page_elements:
                    all_docs.append(Document(
                        page_content=el["content"],
                        metadata={
                            "source": os.path.basename(pdf_path),
                            "page_number": page_num,
                            "element_type": el["type"]
                        }
                    ))
    except Exception as e:
        logger.error(f"Failed to process PDF {pdf_path}. Error: {e}", exc_info=True)
        return []

    logger.info(f"Successfully processed PDF. Extracted {len(all_docs)} elements.")
    return all_docs

def chunk_documents(documents: List[Document], chunk_size: int = 800, chunk_overlap: int = 150) -> List[Document]:
    """Splits documents into smaller chunks with smart handling for different content types."""
    logger.info(f"Starting to chunk {len(documents)} documents...")
    chunks = []
    
    for doc in documents:
        element_type = doc.metadata.get('element_type', 'text')
        
        # Add context header to each chunk
        context_header = f"[Source: {doc.metadata.get('source', 'unknown')} | Page: {doc.metadata.get('page_number', 'N/A')}]\n\n"
        
        if element_type == 'table':
            # Keep tables whole - don't split them
            doc.page_content = context_header + doc.page_content
            chunks.append(doc)
            
        elif element_type == 'image':
            # Keep image captions whole
            doc.page_content = context_header + doc.page_content
            chunks.append(doc)
            
        else:
            # Split text with better separators for natural breaks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size - len(context_header),
                chunk_overlap=chunk_overlap,
                length_function=len,
                separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""],
                is_separator_regex=False,
            )
            
            # Split the text
            splits = text_splitter.split_text(doc.page_content)
            
            # Create new documents with context headers
            for split in splits:
                chunks.append(Document(
                    page_content=context_header + split,
                    metadata=doc.metadata
                ))
    
    logger.info(f"Finished chunking. Created {len(chunks)} chunks from {len(documents)} documents.")
    return chunks
