# flake8: noqa: E501
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from datetime import datetime
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Disable Flask request logging for production
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# Groq API configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Create a single, pooled HTTP session with retries


def _create_http_session():
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
    session = requests.Session()
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

HTTP_SESSION = _create_http_session()



def call_groq_api(text, mode):
    """
    Call Groq API to process text based on the selected mode
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in environment variables")

    # Define prompts and parameters for different modes
    mode_configs = {
        "summarize": {
            "prompt": f"""Create a concise summary of the following content.
Follow these guidelines:

1. Identify the main points and ignore filler content
2. Output in 3-5 sentences or bullet points if text is very long
3. Maintain neutral tone without adding opinions
4. Preserve key facts, statistics, and dates
5. Avoid unnecessary technical jargon unless essential
6. Provide a short title or headline for the summary

Content to summarize:
{text}

Format your response as:
Title: [Brief title]
Summary: [Your summary here]""",
            "temperature": 0.3,
            "max_tokens": 300
        },
        "expand": {
            "prompt": f"""Expand and elaborate on the following content.
Follow these guidelines:

1. Rephrase the input into a more detailed version with background info
2. Add explanations, examples, or case studies to clarify complex points
3. Provide historical, social, or technical context where relevant
4. Maintain the original tone (academic, professional, casual, etc.)
5. Use well-structured paragraphs for readability
6. Optionally, add comparisons or future implications
7. Ensure your response is complete and well-concluded
8. Do not end abruptly or with incomplete sentences

Content to expand:
{text}

Provide a comprehensive, well-structured expansion that adds depth and
context. Make sure your response is complete and properly concluded.""",
            "temperature": 0.7,
            "max_tokens": 1000
        },
        "validate": {
            "prompt": f"""Fact-check and verify claims in the following text.
Follow these guidelines:

1. Identify claims or statistics in the text
2. Cross-check against trusted knowledge sources using reasoning
3. Output results in structured format with clear verification status
4. Highlight uncertainty when evidence is mixed
5. Maintain neutral, factual tone (avoid personal opinions)
6. Provide reasoning or evidence for each claim
7. Ensure your response is complete and well-structured
8. Do not end abruptly or with incomplete validation

Content to validate:
{text}

Format your response as:
VALIDATION REPORT

[For each claim found, provide:]
Claim: "[exact claim from text]"
Status: ✅ Verified / ❌ False / ⚠️ Partially True / ❓ Uncertain
Reasoning: [Your analysis and evidence]
Source: [If applicable, mention type of source or study]

[If no specific claims are found, provide general accuracy assessment]

Make sure your validation report is complete and properly concluded.""",
            "temperature": 0.2,
            "max_tokens": 800
        }
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    # Try multiple models in order of preference
    models_to_try = [
        "llama-3.1-8b-instant",
        "llama-3.1-70b-versatile",
        "mixtral-8x7b-32768",
        "gemma-7b-it"
    ]

    # Get the configuration for the selected mode
    config = mode_configs.get(mode, mode_configs["summarize"])

    for model in models_to_try:
        data = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that processes "
                               "content according to user requests. Provide "
                               "clear, well-formatted responses."
                },
                {
                    "role": "user",
                    "content": config["prompt"]
                }
            ],
            "temperature": config["temperature"],
            "max_tokens": config["max_tokens"]
        }

        try:
            response = HTTP_SESSION.post(
                GROQ_API_URL, headers=headers, json=data, timeout=30
            )
            response.raise_for_status()

            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # Validate content completeness
            validated_content = validate_content_completeness(content, mode)
            return validated_content

        except requests.exceptions.RequestException as e:
            if "model_decommissioned" in str(e) or "400" in str(e):
                continue
            else:
                raise Exception(f"Error calling Groq API: {str(e)}")
        except KeyError as e:
            raise Exception(f"Unexpected response format from Groq API: "
                            f"{str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error: {str(e)}")

    # If we get here, all models failed
    raise Exception("All available models failed. Please check your Groq API "
                    "key and available models.")


def validate_content_completeness(content, mode):
    """Validate and ensure content completeness for different modes."""
    if not content or not isinstance(content, str):
        return content
    
    content = content.strip()
    
    # Check for common incomplete patterns
    incomplete_indicators = [
        content.endswith('...'),
        content.endswith('…'),
        content.endswith('['),
        content.endswith('('),
        content.endswith(','),
        content.endswith(';'),
    ]
    
    if any(incomplete_indicators):
        # Try to complete the content based on mode
        if mode == 'expand':
            if not content.endswith('.'):
                content += '.'
            # Add a brief conclusion if content seems incomplete
            if len(content.split()) < 50:  # Very short content
                content += "\n\nThis expanded content provides additional context and detail on the topic."
        elif mode == 'validate':
            if not content.endswith('.'):
                content += '.'
            # Ensure validation report is complete
            if 'VALIDATION REPORT' in content and not content.endswith('.'):
                content += "\n\nThis completes the validation report."
        elif mode == 'summarize':
            if not content.endswith('.'):
                content += '.'
    
    return content


def fetch_url_content(url):
    """
    Fetch content from a URL using BeautifulSoup for better HTML parsing
    """
    try:
        # Import BeautifulSoup here to avoid global import issues
        from bs4 import BeautifulSoup
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = HTTP_SESSION.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script_or_style in soup(["script", "style", "header", "footer", "nav"]):
            script_or_style.extract()
        
        # Get page title
        title = soup.title.string if soup.title else ""
        
        # Extract text from main content areas
        main_content = ""
        
        # Try to find main content containers
        content_elements = soup.select("article, main, #content, .content, .article, .post, .entry")
        
        if content_elements:
            # Use the first matching content container
            for element in content_elements:
                main_content += element.get_text(separator=" ", strip=True) + "\n\n"
        else:
            # If no main content containers found, use the body
            main_content = soup.get_text(separator=" ", strip=True)
        
        # Combine title and content
        content = f"{title}\n\n{main_content}" if title else main_content
        
        # Clean up the text
        content = re.sub(r'\s+', ' ', content).strip()
        
        # Limit content length to avoid overwhelming the API
        if len(content) > 10000:
            content = content[:10000] + "..."
            
        return content
    except ImportError:
        # Fallback to regex-based extraction if BeautifulSoup is not available
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = HTTP_SESSION.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Extract text content from HTML
            content = response.text
            
            # Use regex to extract the main content
            content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
            content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL)
            content = re.sub(r'<nav[^>]*>.*?</nav>', '', content, flags=re.DOTALL)
            content = re.sub(r'<header[^>]*>.*?</header>', '', content, flags=re.DOTALL)
            content = re.sub(r'<footer[^>]*>.*?</footer>', '', content, flags=re.DOTALL)
            content = re.sub(r'<[^>]*>', ' ', content)
            
            # Remove extra whitespace
            content = re.sub(r'\s+', ' ', content).strip()
            
            # Limit content length
            if len(content) > 10000:
                content = content[:10000] + "..."
                
            return content
        except requests.exceptions.RequestException as e:
            raise Exception(f"Error fetching URL content: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error fetching URL content: {str(e)}")

@app.route('/api/enhance', methods=['POST'])
def enhance_content():
    """
    Main endpoint to enhance content using AI
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        text = data.get('text', '').strip()
        mode = data.get('mode', 'summarize')

        if not text:
            return jsonify({'error': 'Text content is required'}), 400

        if mode not in ['summarize', 'expand', 'validate']:
            return jsonify({'error': 'Invalid mode. Must be one of: '
                                     'summarize, expand, validate'}), 400

        # Check if the text is a URL
        url_pattern = re.compile(
            r'^https?://'
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+'
            r'(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'
            r'localhost|'
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
            r'(?::\d+)?'
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if url_pattern.match(text):
            try:
                # Fetch content from URL
                text = fetch_url_content(text)
            except Exception as e:
                return jsonify({'error': f'Failed to fetch URL content: {str(e)}'}), 400

        # Call Groq API
        enhanced_content = call_groq_api(text, mode)

        return jsonify({
            'success': True,
            'original_text': text,
            'enhanced_content': enhanced_content,
            'mode': mode,
            'timestamp': datetime.now().isoformat()
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'groq_api_configured': bool(GROQ_API_KEY)
    })


# Get the absolute path to the frontend build directory

FRONTEND_BUILD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), 'frontend', 'build')
)


@app.route('/')
def serve_frontend():
    """
    Serve the React frontend
    """
    try:
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
    except FileNotFoundError:
        return jsonify({'error': 'Frontend build not found.'}), 404


@app.route('/static/css/<filename>')
def serve_css_files(filename):
    """
    Serve CSS files
    """
    try:
        css_dir = os.path.join(FRONTEND_BUILD_DIR, 'static', 'css')
        return send_from_directory(css_dir, filename)
    except FileNotFoundError:
        return jsonify({'error': 'CSS file not found'}), 404


@app.route('/static/js/<filename>')
def serve_js_files(filename):
    """
    Serve JavaScript files
    """
    try:
        js_dir = os.path.join(FRONTEND_BUILD_DIR, 'static', 'js')
        return send_from_directory(js_dir, filename)
    except FileNotFoundError:
        return jsonify({'error': 'JavaScript file not found'}), 404


@app.route('/<path:path>')
def serve_other_files(path):
    """
    Serve other files like manifest.json, favicon.ico, etc.
    """
    try:
        return send_from_directory(FRONTEND_BUILD_DIR, path)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
