import json
import yaml
import time

from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

GENERATE_TASKS_PROMPT_V2 = """
You're a world-class psychologist and life coach.

You help me identify actionable tasks to make progress on my goals, and generally stay on top of everything.

A task should be:
- specific
- small
- contains one action, not a project in disguise (not "buy a house", but "research 3 different areas to buy a house")

Your task is to detect ALL potential tasks from one of my journal entries:
- detect tasks that I'm mentioning OR
- based on your understanding on psychology and some challenges I'm experiencing, suggest other tasks

For each task, indicate:
- a priority 1,2,3,4 as integer (4 being the highest, 1 being the default)
- an explanation for the priority you assigned 
- the related text from the journal entry that spurred you to identify this task


Output raw JSON (and nothing else) with following format:
    [{{"title": {{title}}, "description": {{explanation}}, "related_text": {{related_text}}, "priority":{{priority}} }}, ...]

=== journal entry ===
{journal_entry}
"""

USE_LLM = False



class Transformer:
    """
    Transforms a text into a list of tasks suggested by the LLM.

    """
    def __init__(self):
        model = "gpt-3.5-turbo-0125"
        temperature = 0.0
        max_tokens = 4000
        with open("secrets.yaml", "r") as yaml_file:
            config = yaml.safe_load(yaml_file)
            if config["llm"]:
                openai_api_key = config["open-ai"]["api-key"]
                self.llm = ChatOpenAI(openai_api_key=openai_api_key, model_name=model,temperature=temperature, max_tokens = max_tokens)
            else:
                self.llm = None

    def _generate(self, journal_entry):
        prompt = PromptTemplate.from_template(
            GENERATE_TASKS_PROMPT_V2
        )
        prompt_val = prompt.invoke({"journal_entry": journal_entry}) 

        response = self.llm(prompt_val.to_messages())
        
        return response.content

    def suggest(self, journal_entry):
        if self.llm:
            content = self._generate(journal_entry)
        else:
            time.sleep(3)
            content = open("tasks.json", "r").read()
        return json.loads(content)

