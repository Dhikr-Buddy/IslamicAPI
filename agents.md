# AI Agents Integration Guide

This guide explains how to integrate **IslamicAPI** with AI Agents (such as LLMs, LangChain, CrewAI, AutoGen, or custom GPTs) to enable absolute-veracity religious content retrieval, prayer calculation, and Qibla tracking, completely eliminating hallucination risks.

---

## The Hallucination Problem in Religious QA

Large Language Models (LLMs) are notorious for hallucinating text, misquoting Quranic verses, mixing up Hadith chains of narration (Isnad), or inventing fabricated sayings. In religious contexts, this is extremely critical.

By using **IslamicAPI**, you can wrap our structured offline-first SDKs and raw JSON API indexes as **LLM Tools (Function Calling)**. This forces the agent to fetch verified, exact, and original source texts directly with provenance, rather than relying on the LLM's parametric memory.

---

## Wrapping SDK as LLM Tools

Here are ready-to-use Python and JavaScript tool definitions for popular agent frameworks.

### 1. Python Tool (LangChain / OpenAI Function Calling)

Using our Pydantic-validated `deensdk` in Python:

```python
from typing import Type, List
from pydantic import BaseModel, Field
from langchain.tools import BaseTool
from deensdk import search, get_ayah, get_hadith

class QuranSearchInput(BaseModel):
    query: str = Field(description="Exact phrase to search inside the Quran, supports Arabic diacritics.")

class QuranSearchTool(BaseTool):
    name = "quran_search"
    description = "Use this tool to search the Quran for exact matching verses/ayahs."
    args_schema: Type[BaseModel] = QuranSearchInput

    def _run(self, query: str) -> str:
        results = search(query, limit=5)
        if not results:
            return "No matching verses found."
        
        output = []
        for ayah in results:
            output.append(
                f"Ayah {ayah.id}:\n"
                f"Text: {ayah.text.get('simple')}\n"
                f"Source: {ayah.provenance[0].source_url}\n"
                "---"
            )
        return "\n".join(output)
```

---

### 2. OpenAI Schema Definition (JSON)

If you are building custom GPTs or using the Assistant API:

```json
{
  "name": "calculate_prayer_times",
  "description": "Calculates daily prayer timetables (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) for a given location and timezone.",
  "parameters": {
    "type": "object",
    "properties": {
      "latitude": {
        "type": "number",
        "description": "Latitude of the location (e.g. 40.7128 for New York)."
      },
      "longitude": {
        "type": "number",
        "description": "Longitude of the location (e.g. -74.006)."
      },
      "timezone": {
        "type": "number",
        "description": "Timezone offset in hours (e.g. -4 for EST DST)."
      },
      "date": {
        "type": "string",
        "description": "Optional ISO format date 'YYYY-MM-DD'. Defaults to today."
      }
    },
    "required": ["latitude", "longitude"]
  }
}
```

---

## Best Practices for Agent Prompts (System Instructions)

To guarantee the agent behaves strictly, enforce the following system prompt instructions:

```
You are an Islamic Knowledge AI Assistant. You have access to tools that query the authoritative IslamicAPI (Quran and Hadith databases).

CRITICAL INSTRUCTIONS:
1. NEVER quote any Quranic verse, ayah, or Hadith from your own memory.
2. ALWAYS use the `quran_search` or `get_hadith` tools to retrieve the exact wording of any reference before answering.
3. If a tool returns no results, state clearly that you could not find the verified reference, and do not make one up.
4. Always display the provenance source URL and translation details returned by the tool to guarantee authenticity to the user.
```
