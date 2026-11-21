import asyncio, os, sys, time
sys.path.insert(0, "/app/backend")
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dialogue import system_prompt
from game_data import OWNERS

MSGS = ["What's your budget, Uncle?", "Nice evening!", "Which colours do you like?", "Tell me about your father.", "Anything to avoid?"]


async def one(params, msg):
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=str(time.time()), system_message=system_prompt(OWNERS["wing"])).with_model("anthropic", os.environ["DIALOGUE_MODEL"]).with_params(**params)
    t = time.time()
    try:
        await chat.send_message(UserMessage(text=f'Florist\'s latest message: "{msg}"'))
        return round(time.time() - t, 2)
    except Exception as e:
        return f"ERR {repr(e)[:120]}"


async def main():
    configs = {"plain160": dict(max_tokens=160), "effort_low": dict(max_tokens=160, extra_body={"output_config": {"effort": "low"}})}
    for name, p in configs.items():
        print(name, [await one(p, m) for m in MSGS])

asyncio.run(main())
