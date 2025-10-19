import os
import fitz  # PyMuPDF
import pdfplumber
import logging
from typing import List
from PIL import Image
import pytesseract  # Import for OCR

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# --- BLIP model and related functions have been removed ---


def process_pdf(pdf_path: str) -> List[Document]:
    """
    Extracts text and tables from a PDF using a hybrid approach.

    For each page, it first tries to extract digital text. If a page contains
    minimal digital text (indicating it's likely a scanned image), it falls

    back to using Tesseract OCR to extract text from an image of the page.
    """
    logger.info(f"Starting HYBRID PDF processing for: {os.path.basename(pdf_path)}")
    all_docs = []

    try:
        fitz_doc = fitz.open(pdf_path)
        
        with pdfplumber.open(pdf_path) as plumber_doc:
            for page_num, page in enumerate(fitz_doc, start=1):
                logger.info(f"Processing page {page_num}/{len(fitz_doc)}...")
                
                # --- HYBRID LOGIC ---
                
                # 1. Attempt to extract digital text.
                digital_text = page.get_text("text")

                # 2. Check if the page is likely scanned. A small character count is a strong indicator.
                if len(digital_text.strip()) > 100:
                    logger.info(f"  -> Page {page_num} is digital. Processing for text & tables.")
                    plumber_page = plumber_doc.pages[page_num - 1]
                    page_elements = []

                    # Get table bounding boxes to avoid re-extracting table text.
                    table_bboxes = [tbl.bbox for tbl in plumber_page.find_tables() if tbl.bbox]

                    # Extract text blocks that are not inside tables.
                    for block in page.get_text("blocks"):
                        x0, y0, x1, y1, text, _, _ = block
                        if text.strip():
                            # Check if the center of the block is inside any table's bounding box.
                            block_center_x, block_center_y = (x0 + x1) / 2, (y0 + y1) / 2
                            is_inside_table = any(
                                bbox[0] <= block_center_x <= bbox[2] and
                                bbox[1] <= block_center_y <= bbox[3]
                                for bbox in table_bboxes
                            )
                            if not is_inside_table:
                                page_elements.append({"bbox": (y0, x0), "content": text, "type": "text"})

                    # Extract tables.
                    for table_obj in plumber_page.find_tables():
                        table = table_obj.extract()
                        if table:
                            table_text = "\n".join(["\t".join(map(str, cell or "")) for cell in table])
                            page_elements.append({
                                "bbox": (table_obj.bbox[1], table_obj.bbox[0]), 
                                "content": f"[TABLE]\n{table_text}", 
                                "type": "table"
                            })

                    # Sort elements by their position on the page (top-to-bottom, left-to-right).
                    page_elements.sort(key=lambda el: el["bbox"])
                    
                    for el in page_elements:
                        all_docs.append(Document(
                            page_content=el["content"],
                            metadata={"source": os.path.basename(pdf_path), "page_number": page_num, "element_type": el["type"]}
                        ))
                else:
                    # 3. If it's a scanned page, fall back to OCR.
                    logger.warning(f"  -> Page {page_num} appears to be scanned. Using OCR fallback.")
                    
                    # Render the page as a high-resolution image for better OCR accuracy.
                    pix = page.get_pixmap(dpi=300)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    
                    try:
                        # Use Tesseract to extract text from the image.
                        ocr_text = pytesseract.image_to_string(img, lang='eng') # Specify language if known.
                        
                        if ocr_text.strip():
                            # Create a single document for the entire OCR'd page.
                            all_docs.append(Document(
                                page_content=ocr_text,
                                metadata={
                                    "source": os.path.basename(pdf_path),
                                    "page_number": page_num,
                                    "element_type": "ocr_text_block"
                                }
                            ))
                            logger.info(f"  -> Successfully extracted text from page {page_num} using OCR.")
                    except Exception as ocr_error:
                        logger.error(f"  -> OCR processing failed for page {page_num}: {ocr_error}")

    except Exception as e:
        logger.error(f"Failed to process PDF {pdf_path}. Error: {e}", exc_info=True)
        return []

    logger.info(f"Successfully processed PDF. Extracted {len(all_docs)} total elements.")
    return all_docs


def chunk_documents(documents: List[Document], chunk_size: int = 1000, chunk_overlap: int = 200) -> List[Document]:
    """
    Splits a list of LangChain Document objects into smaller chunks, handling
    different content types (like tables) intelligently.
    """
    logger.info(f"Starting to chunk {len(documents)} document elements...")
    chunks = []
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""],
        is_separator_regex=False,
    )

    current_text_batch = []
    
    for doc in documents:
        element_type = doc.metadata.get('element_type', 'text')
        if element_type in ['table', 'ocr_text_block']:
            if current_text_batch:
                combined_text = "\n\n".join(current_text_batch)
                splits = text_splitter.split_text(combined_text)
                for split in splits:
                    chunks.append(Document(page_content=split, metadata=doc.metadata))
                current_text_batch = []
            
            # Add the table or OCR block itself. We can split it if it's too large.
            if len(doc.page_content) > chunk_size:
                splits = text_splitter.split_text(doc.page_content)
                for split in splits:
                    chunks.append(Document(page_content=split, metadata=doc.metadata))
            else:
                chunks.append(doc)
        else:
            current_text_batch.append(doc.page_content)

    # Process any remaining text in the last batch.
    if current_text_batch:
        combined_text = "\n\n".join(current_text_batch)
        splits = text_splitter.split_text(combined_text)
        for split in splits:
            # Use metadata from the last document for the batch.
            chunks.append(Document(page_content=split, metadata=documents[-1].metadata))
    
    logger.info(f"Finished chunking. Created {len(chunks)} final chunks.")
    return chunks