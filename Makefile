## Common project commands
.PHONY: run install clean db-shell help ollama ollama-pull dev reset test test-backend test-backend-unit test-backend-integration test-backend-e2e test-frontend test-ml test-ml-unit test-ml-experimental test-experimental test-coverage

help:
	@echo "Available targets:"
	@echo "  run              - Start the API/web server (python3 -m src.service.api)"
	@echo "  install          - Install Python dependencies from requirements.txt"
	@echo "  db-shell         - Open SQLite shell for data/app.db (if exists)"
	@echo "  clean            - Remove Python cache files and build artifacts"
	@echo "  ollama           - Start Ollama local server (ollama serve)"
	@echo "  ollama-pull      - Pull default LLM model (llama3)"
	@echo "  dev              - Start Ollama and API together (foreground)"
	@echo "  reset            - Clean, install, clean, install, then start dev"
	@echo ""
	@echo "Testing:"
	@echo "  test                    - Run all tests"
	@echo "  test-backend            - Run all backend tests"
	@echo "  test-backend-unit       - Run backend unit tests only"
	@echo "  test-backend-integration - Run backend integration tests only"
	@echo "  test-backend-e2e        - Run backend e2e tests only"
	@echo "  test-frontend           - Run frontend tests only"
	@echo "  test-ml                 - Run all ML tests"
	@echo "  test-ml-unit            - Run ML unit tests only"
	@echo "  test-ml-experimental    - Run ML experimental tests only"
	@echo "  test-experimental       - Run all experimental tests (backend + ML)"
	@echo "  test-coverage           - Run tests with coverage report"

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

# All: clean, install, clean, install, then start dev
a:
	@echo "────────────────────────────────────────────────────────"
	@echo "🔄 Resetting project: clean → install → clean → install → dev"
	@echo "────────────────────────────────────────────────────────"
	$(MAKE) clean
	$(MAKE) install
	$(MAKE) clean
	$(MAKE) install
	$(MAKE) dev

# Testing
test:
	pytest tests/

test-backend:
	pytest tests/backend/

test-backend-unit:
	pytest tests/backend/unit/

test-backend-integration:
	pytest tests/backend/integration/

test-backend-e2e:
	pytest tests/backend/e2e/

test-frontend:
	pytest tests/frontend/

test-ml:
	pytest tests/ml/

test-ml-unit:
	pytest tests/ml/unit/

test-ml-experimental:
	pytest tests/ml/experimental/

test-experimental:
	pytest tests/backend/experimental/ tests/ml/experimental/

test-coverage:
	pytest --cov=src --cov-report=html --cov-report=term tests/
	@echo "Coverage report generated in htmlcov/index.html"

# Aliases
d: dev
i: install
c: clean
r: run
t: test