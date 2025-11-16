## Common project commands
.PHONY: run install clean db-shell help ollama ollama-pull dev

help:
	@echo "Available targets:"
	@echo "  run         - Start the API/web server (python3 -m src.service.api)"
	@echo "  install     - Install Python dependencies from requirements.txt"
	@echo "  db-shell    - Open SQLite shell for data/app.db (if exists)"
	@echo "  clean       - Remove Python cache files and build artifacts"
	@echo "  ollama      - Start Ollama local server (ollama serve)"
	@echo "  ollama-pull - Pull default LLM model (llama3)"
	@echo "  dev         - Start Ollama and API together (foreground)"

# Start API + Web (serves HTTPS if configured inside the app)
run:
	python3 -m src.service.api

# Install dependencies
install:
	python3 -m pip install -r requirements.txt

# Open SQLite database shell
db-shell:
	@if [ -f data/app.db ]; then \
		sqlite3 data/app.db; \
	else \
		echo "SQLite database not found at data/app.db"; \
	fi

# Clean caches and temporary files
clean:
	find . -name "__pycache__" -type d -exec rm -rf {} +
	find . -name "*.pyc" -type f -delete
	find . -name "*.pyo" -type f -delete
	find . -name "*.pytest_cache" -type d -exec rm -rf {} +

## Start Ollama server
ollama:
	ollama serve

## Pull default model for the assistant
ollama-pull:
	ollama pull llama3

## Start both Ollama (in background) and API (foreground)
dev:
	@set -e; \
	echo "────────────────────────────────────────────────────────"; \
    echo "💫 Starting Dev Environment: Ollama + API"; \
    echo "────────────────────────────────────────────────────────"; \
    \
	if ! command -v ollama >/dev/null 2>&1; then echo "Ollama not installed"; exit 1; fi; \
	ollama serve >/dev/null 2>&1 & OLLAMA_PID=$$!; \
	set +e; \
	python3 -m src.service.api; \
	set -e; \
	kill $$OLLAMA_PID >/dev/null 2>&1 || true; \
	wait $$OLLAMA_PID 2>/dev/null || true; \
	exit 0

# Aliases
d: dev
i: install
c: clean