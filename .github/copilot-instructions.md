# Copilot Instructions

This is a university RAG system that answers student queries using vectorized institutional documents and database tools.

The system is a **Node.js/Express RAG API** with a single endpoint `POST /ask`.

## Infrastructure

- **api**: The Express App
- **qdrant**: Vector Store 
- **postgres**: SQL Database
- **Ollama**: IA Model
- **BAAI/bge-reranker-base**: Reranking Model

## Two Information Sources

The RAG system has two distinct data sources:

1. **Vectorized documents** — university rules, career plans, correlativities, regulations (indexed into Qdrant from `DOCS_PATH`)
2. **Database tools** — student-specific data fetched via predefined backend functions using the authenticated student's ID

Tools always operate on the authenticated student's ID. Database queries are only possible through the defined tools, never raw SQL from the LLM.
