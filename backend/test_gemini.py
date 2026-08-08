import os, json, logging
from dotenv import load_dotenv
load_dotenv()

api_key = os.environ.get('GEMINI_API_KEY')
print(f"API Key loaded: {bool(api_key)} | Key starts with: {api_key[:10] if api_key else 'NONE'}")

try:
    import google.genai as genai
    print("google-genai module: OK")
    
    # The new SDK uses Client for initialization rather than configure global state
    client = genai.Client(api_key=api_key)
    print("Client initialized: OK")
    
    prompt = (
        "You are a financial educator. Generate 5 multiple-choice questions "
        "about personal finance (topics: Saving, Budgeting, Interest, Investing). "
        "Return the output STRICTLY as a valid JSON array of objects. "
        "Do not include markdown json block syntax (like ```json), just raw array. "
        "Each object must have the following exact keys: "
        '"topic", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation". '
        'The "correct_answer" must be exactly one of "a", "b", "c", or "d". '
        'The "explanation" must be a concise 1-2 sentence explanation of why the correct answer is right. '
        "Ensure questions are practical, accurate, and unique."
    )
    
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt
    )
    raw = response.text.strip()
    print(f"Response received: {len(raw)} characters")
    print(f"First 200 chars: {raw[:200]}")
    
    # Try to parse
    data = json.loads(raw)
    print(f"Parsed {len(data)} questions successfully!")
    print(f"First question topic: {data[0].get('topic')}")
    print(f"First question: {data[0].get('question')}")
    
except Exception as e:
    print(f"EXACT ERROR: {type(e).__name__}: {e}")
