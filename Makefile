## Common project commands
.PHONY: run install clean db-shell help

help:
	@echo "Available targets:"
	@echo "  run         - Start the API/web server (python3 -m src.service.api)"
	@echo "  install     - Install Python dependencies from requirements.txt"
	@echo "  db-shell    - Open SQLite shell for data/app.db (if exists)"
	@echo "  clean       - Remove Python cache files and build artifacts"

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


