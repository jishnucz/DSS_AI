import os
import logging
import requests
import json
import re
import time
import threading
from bs4 import BeautifulSoup
from PIL import Image
import io
from pypdf import PdfReader
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from collections import Counter
import heapq
import traceback
from transformers import BlipProcessor, BlipForConditionalGeneration
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.text_rank import TextRankSummarizer

# configure basic logging for the chatbot module
logging.basicConfig(level=logging.INFO, filename='chatbot.log', filemode='a',
                    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)
logger.propagate = False

# prepare nltk data path
nltk_data_path = os.path.expanduser('~/AppData/Roaming/nltk_data')
os.makedirs(nltk_data_path, exist_ok=True)
os.environ['NLTK_DATA'] = nltk_data_path

# API keys and configuration
GOOEY_API_KEY = os.getenv('GOOEY_API_KEY', "sk-MU0mYSGuIg4381fSkduIPW5wOyUyZcHZoEX4RhSejqq02PQN")
EXAMPLE_ID = "dydl4df9oxw4"
PRICE_API_KEY = os.getenv('PRICE_API_KEY', "579b464db66ec23bdd00000135352946489d4be358b70471efea2bde")
CATALOG_ID = "9ef84268-d588-465a-a308-a864a43d0070"
PRICE_API_URL = f"https://api.data.gov.in/resource/{CATALOG_ID}?api-key={PRICE_API_KEY}&format=json&limit=5000"

# shared state for price data
price_data = []
PRICE_REFRESH_INTERVAL = 3600  # 1 hour
MAX_RETRIES = 3
RETRY_DELAY = 5
REQUEST_TIMEOUT = 90  # Increased to 90 seconds for slow API responses
EMPTY_PRICE_RETRY_INTERVAL = 900  # 15 minutes when upstream data is unavailable
_last_empty_price_warning_ts = 0.0

# BLIP model placeholders
processor = None
blip_model = None
model_load_timeout = 300


def clean_response(text: str) -> str:
    if not text:
        return text
    # remove reference markers, urls and extraneous whitespace
    text = re.sub(r'[\*\†‡§¶]', '', text)
    text = re.sub(r'\[\s*\]', '', text)
    text = re.sub(r'\(\s*\)', '', text)
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'^.*PoP.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'(?i)references?:?[\s\S]*$', '', text)
    text = re.sub(r'\n{2,}', '\n', text)
    text = re.sub(r'^\.', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()


def ensure_nltk_data():
    try:
        nltk.download('punkt', download_dir=nltk_data_path, quiet=False)
        logger.debug(f"NLTK punkt data ensured at: {nltk_data_path}")
        punkt_path = os.path.join(nltk_data_path, 'tokenizers', 'punkt')
        if not os.path.exists(punkt_path):
            raise LookupError(f"Punkt directory not found: {punkt_path}")
        nltk.download('punkt_tab', download_dir=nltk_data_path, quiet=False)
        logger.debug(f"NLTK punkt_tab data ensured at: {nltk_data_path}")
        punkt_tab_path = os.path.join(nltk_data_path, 'tokenizers', 'punkt_tab')
        if not os.path.exists(punkt_tab_path):
            raise LookupError(f"Punkt_tab directory not found: {punkt_tab_path}")
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('tokenizers/punkt_tab')
        logger.info("NLTK punkt and punkt_tab data verified successfully.")
        return True
    except Exception as e:
        logger.error(f"Failed to ensure NLTK data: {str(e)}")
        return False


def fetch_price_data():
    global price_data
    for attempt in range(MAX_RETRIES):
        try:
            logger.info(f"Fetching price data from: {PRICE_API_URL} (Attempt {attempt + 1}/{MAX_RETRIES})")
            response = requests.get(PRICE_API_URL, timeout=REQUEST_TIMEOUT)
            logger.info(f"API Response Status: HTTP {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                price_data = (
                    data.get("records", []) or
                    data.get("data", []) or
                    data.get("results", []) or
                    []
                )
                if not price_data:
                    logger.warning("No price records found in API response. Keys: " + ", ".join(data.keys()))
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_DELAY)
                    continue
                logger.info(f"Price data fetched successfully: {len(price_data)} records")
                return True
            else:
                logger.error(f"Failed to fetch price data: HTTP {response.status_code}, Response: {response.text}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                continue
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error fetching price data: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue
        except Exception as e:
            logger.error(f"Unexpected error fetching price data: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue
    logger.warning("All retry attempts failed. Price data remains unavailable.")
    price_data = []
    return False


def refresh_price_data_periodically():
    global _last_empty_price_warning_ts
    while True:
        success = fetch_price_data()
        if not success or not price_data:
            now = time.time()
            # Throttle warning noise from upstream API that returns no records.
            if now - _last_empty_price_warning_ts >= EMPTY_PRICE_RETRY_INTERVAL:
                logger.warning(
                    f"Price data unavailable. Next retry in {EMPTY_PRICE_RETRY_INTERVAL} seconds."
                )
                _last_empty_price_warning_ts = now
            time.sleep(EMPTY_PRICE_RETRY_INTERVAL)
            continue
        time.sleep(PRICE_REFRESH_INTERVAL)


def build_crop_mappings():
    crop_mappings = {}
    api_commodities = {record.get("commodity", "").lower().strip() for record in price_data if record.get("commodity")}
    for commodity in api_commodities:
        cleaned_commodity = re.sub(r'\s*\([^)]*\)\s*', '', commodity).strip()
        key = re.sub(r'\s+', '_', cleaned_commodity)
        aliases = {cleaned_commodity, commodity, cleaned_commodity.replace(" ", ""), commodity.replace(" ", "")}
        if cleaned_commodity.endswith("s"):
            aliases.add(cleaned_commodity[:-1])
        else:
            aliases.add(cleaned_commodity + "s")
        if "rice" in cleaned_commodity.lower():
            aliases.update(["rice", "paddy", "rices"])
        if "soy" in cleaned_commodity.lower():
            aliases.update(["soybean", "soyabean", "soya bean", "soybeans", "soyabeans", "soya beans"])
        crop_mappings[key] = list(aliases)
    logger.info(f"Built crop mappings for {len(crop_mappings)} crops")
    return crop_mappings


def get_available_crops():
    return set(build_crop_mappings().keys())


def get_answer(user_input):
    user_input_lower = user_input.lower().strip()
    logger.info(f"Processing input: {user_input_lower}")

    # price queries
    if "price" in user_input_lower:
        crop_mappings = build_crop_mappings()
        requested_crops = []
        input_words = re.findall(r'\b\w+\b', user_input_lower)
        for crop_key, aliases in crop_mappings.items():
            for alias in aliases:
                if alias in input_words and crop_key not in requested_crops:
                    requested_crops.append(crop_key)
                    logger.info(f"Matched crop: {crop_key} (alias: {alias})")
                    break
        if not price_data:
            fetch_price_data()
            if not price_data:
                return {"type": "price", "data": [{"message": "No price data available. Please try again later."}]}
        results = []
        for crop in requested_crops:
            commodity_aliases = crop_mappings.get(crop, [crop])
            matched = False
            for record in price_data:
                commodity = record.get("commodity", "").lower().strip()
                cleaned_commodity = re.sub(r'\s*\([^)]*\)\s*', '', commodity).strip()
                if any((alias in cleaned_commodity or cleaned_commodity in alias or alias == cleaned_commodity) for alias in commodity_aliases):
                    price_entry = {
                        "commodity": record.get("commodity", "N/A").capitalize(),
                        "market": record.get("market", "N/A"),
                        "state": record.get("state", "N/A"),
                        "date": record.get("arrival_date", "N/A"),
                        "price_range": f"Rs. {record.get('min_price', 'N/A')}-{record.get('max_price', 'N/A')} per quintal"
                    }
                    results.append(price_entry)
                    matched = True
                    break
            if not matched:
                results.append({"message": f"No price data available for {crop.replace('_', ' ').capitalize()} in the current dataset."})
        return {"type": "price", "data": results}

    if not GOOEY_API_KEY:
        logger.warning("No valid GOOEY_API_KEY provided. Using fallback response.")
        return {"type": "text", "response": "Error: API key is missing. Please ask about crop prices or upload an image/document."}

    headers = {"Authorization": f"Bearer {GOOEY_API_KEY}"}
    payload = {"input_prompt": user_input, "messages": []}
    for attempt in range(3):
        try:
            logger.info(f"Sending request for query: {user_input} (Attempt {attempt+1}/3)")
            response = requests.post(
                f"https://api.gooey.ai/v2/video-bots?example_id={EXAMPLE_ID}",
                headers=headers,
                json=payload,
                timeout=30
            )
            if response.status_code == 200:
                result = response.json()
                answer = result.get("output", {}).get("output_text", [None])[0]
                copilot_url = result.get("copilot_url", result.get("url", ""))
                audio_url = None
                # collect audio from possible fields
                for field in ["audio_url","audio","media_url","audio_file","response_audio","audio_response","audio_output","audio_answer"]:
                    if result.get("output", {}).get(field):
                        audio_url = result["output"][field]
                        break
                response_content = ""
                if answer:
                    response_content += clean_response(answer.strip()) + "\n\n"
                else:
                    if copilot_url:
                        try:
                            url_resp = requests.get(copilot_url, headers=headers, timeout=10)
                            if url_resp.status_code == 200:
                                soup = BeautifulSoup(url_resp.text, 'html.parser')
                                answer_element = soup.find('div', class_='response-content') or soup.find('div', class_='output-text') or soup.find('p')
                                if answer_element:
                                    response_content += clean_response(answer_element.get_text(strip=True)) + "\n\n"
                        except Exception:
                            pass
                if audio_url:
                    response_content += f'<audio controls src="{audio_url}"></audio>'
                return {"type": "text", "response": response_content} if response_content.strip() else {"type": "text", "response": "No answer or URL provided."}
            elif response.status_code in (401,402):
                return {"type": "text", "response": f"Error: {response.status_code} from Gooey API."}
            else:
                time.sleep(5)
                continue
        except Exception as e:
            logger.error(f"Error contacting Gooey API: {e}")
            time.sleep(5)
            continue
    return {"type": "text", "response": "Unable to retrieve response from Gooey API."}


def summarize_image(image):
    if processor is None or blip_model is None:
        logger.warning("BLIP model not loaded. Returning fallback message.")
        return "Image summarization is currently unavailable due to model loading issues. Please try again later or upload a different image."
    try:
        if image.format not in ['JPEG', 'PNG', 'GIF']:
            logger.error(f"Unsupported image format: {image.format}")
            return f"Unsupported image format: {image.format}. Please upload a JPEG, PNG, or GIF image."
        inputs = processor(images=image, return_tensors="pt")
        out = blip_model.generate(**inputs)
        caption = processor.decode(out[0], skip_special_tokens=True)
        detailed_summary = [f"Image Summary: {caption}"]
        caption_lower = caption.lower()
        crop_keywords = {
            "rice": ["rice", "paddy", "flooded field"],
            "wheat": ["wheat", "grain field"],
            "maize": ["maize", "corn"],
            "tomato": ["tomato", "red fruit"],
            "potato": ["potato", "tubers"],
            "onion": ["onion", "bulb"],
            "coconut": ["coconut", "copra", "palm", "tender coconut"],
            "soybean": ["soybean", "soyabean", "soya bean"]
        }
        detected_crop = None
        for crop, keywords in crop_keywords.items():
            if any(keyword in caption_lower for keyword in keywords):
                detected_crop = crop
                break
        if detected_crop:
            detailed_summary.extend([
                f"Crop Detected: {detected_crop.capitalize()}",
                f"Description: Image depicts a {caption_lower} with healthy vegetation."
            ])
        else:
            detailed_summary.append("Summary: No specific crop identified.")
        logger.info(f"Image summarized successfully: {caption}")
        return "\n\n".join(detailed_summary)
    except Exception as e:
        logger.error(f"Error summarizing image with BLIP: {str(e)}")
        return f"Error summarizing image: {str(e)}. Please ensure the image is valid and try again."


def fetch_image_from_url(url):
    try:
        if not re.match(r'^https?://.*\.(jpg|jpeg|png|gif)$', url, re.IGNORECASE):
            logger.error(f"Invalid URL format: {url}. Must end with .jpg, .jpeg, .png, or .gif")
            return None, "Invalid image URL. Please ensure the URL ends with .jpg, .jpeg, .png, or .gif."
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8'
        }
        logger.debug(f"Fetching image from URL: {url}")
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            logger.error(f"Failed to fetch image from {url}: HTTP {response.status_code}")
            return None, f"Failed to fetch image: HTTP {response.status_code}"
        content_type = response.headers.get('content-type', '').lower()
        logger.debug(f"Content-Type: {content_type}")
        if not content_type.startswith('image/'):
            logger.error(f"URL {url} returned non-image content type: {content_type}")
            return None, f"URL does not point to a valid image (Content-Type: {content_type})."
        content_length = response.headers.get('content-length')
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
            logger.error(f"Image at {url} is too large: {content_length} bytes")
            return None, "Image is too large (exceeds 10MB)."
        image = Image.open(io.BytesIO(response.content))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        logger.info(f"Successfully fetched and loaded image from {url}")
        return image, None
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error fetching image from {url}: {str(e)}")
        return None, f"Network error fetching image: {str(e)}."
    except Exception as e:
        logger.error(f"Error processing image from {url}: {str(e)}")
        return None, f"Error processing image from URL: {str(e)}."


def process_image(image_file=None, image_url=None):
    try:
        if image_url:
            image, error = fetch_image_from_url(image_url)
            if error:
                return error
        else:
            if not image_file or not image_file.filename:
                logger.error("No image file provided")
                return "No image file provided. Please upload a valid image."
            image = Image.open(io.BytesIO(image_file.read()))
            if image.mode != 'RGB':
                image = image.convert('RGB')
        return summarize_image(image)
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return f"Error processing image: {str(e)}. Please ensure the image is valid and try again."

# Document processing

def extract_text_from_pdf(file):
    try:
        pdf_reader = PdfReader(io.BytesIO(file.read()))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text, len(pdf_reader.pages)
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        return f"Error extracting PDF text: {str(e)}", 0

def extract_text_from_txt(file):
    try:
        text = file.read().decode('utf-8')
        return text, 1
    except Exception as e:
        logger.error(f"Error extracting TXT text: {str(e)}")
        return f"Error extracting TXT text: {str(e)}", 0

def summarize_text(text):
    if not text.strip():
        logger.warning("No content available for summarization.")
        return "No content available for summarization."
    try:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = TextRankSummarizer()
        summary_sentences = summarizer(parser.document, 3)
        summary = "Summary:\n" + "\n".join(str(sentence) for sentence in summary_sentences)
        return summary
    except Exception as e:
        logger.error(f"Error summarizing text with TextRank: {str(e)}")
        return f"Error: {str(e)}"

def process_document(file):
    try:
        filename = file.filename.lower()
        if filename.endswith('.pdf'):
            text, num_pages = extract_text_from_pdf(file)
        elif filename.endswith('.txt'):
            text, num_pages = extract_text_from_txt(file)
        else:
            return "Unsupported file type. Use .pdf or .txt."
        if isinstance(text, str) and "Error" not in text:
            word_count = len(text.split())
            summary = summarize_text(text)
            detailed_summary = (
                f"Document Metadata:\n"
                f"Filename: {file.filename}\n"
                f"Number of Pages: {num_pages}\n"
                f"Word Count: {word_count}\n\n"
                f"{summary}"
            )
            return detailed_summary
        return text
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        return f"Error processing document: {str(e)}"

# kick off initial tasks
if not ensure_nltk_data():
    logger.warning("NLTK data initialization failed; some features may be affected.")

try:
    if fetch_price_data():
        logger.info("Initial price data fetch successful.")
    else:
        logger.warning("Initial price data fetch failed.")
    threading.Thread(target=refresh_price_data_periodically, daemon=True).start()
except Exception as e:
    logger.error(f"Error during initial price data fetch: {e}")

# lazy load BLIP model in background

def load_blip_model():
    global processor, blip_model
    try:
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        logger.info("BLIP model loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading BLIP model: {e}")

try:
    threading.Thread(target=load_blip_model, daemon=True).start()
except Exception as e:
    logger.error(f"Failed to start BLIP model loading thread: {e}")
