#!make
################################################################################
# Makefile
################################################################################
.PHONY: help clean format lint test test-unit test-integration

help:  ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

################################################################################

clean:  ## Remove all pyc and caches
	@find . -name '*.py[co]' -exec rm -f {} +
	@find . -name '.pytest_cache' -exec rm -fr {} +
	@find . -name '.ruff_cache' -exec rm -fr {} +
	@find . -name '__pycache__' -exec rm -fr {} +

format:  ## Format code with ruff
	@uv run --extra dev ruff format .
	@uv run --extra dev ruff check --fix .

lint:  ## Lint code with ruff
	@uv run --extra dev ruff check .

test:  ## Run all tests with pytest
	@uv run --extra test pytest .

test-unit:  ## Run unit tests only (no API calls)
	@uv run --extra test pytest . -m "not integration"

test-integration:  ## Run integration tests only (real API calls — costs money)
	@if [ -z "$$OPENAI_API_KEY" ] && [ -z "$$GEMINI_API_KEY" ] && [ -z "$$GOOGLE_API_KEY" ] && [ -z "$$ANTHROPIC_API_KEY" ]; then \
		echo "error: no LLM API key in the environment (OPENAI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY or ANTHROPIC_API_KEY)"; \
		exit 1; \
	fi
	@echo "Integration tests will make REAL LLM API calls and may burn quota or cost money."
	@read -p "Continue? [y/N] " ok && [ "$$ok" = "y" ] || [ "$$ok" = "Y" ]
	@uv run --extra test pytest . -m "integration" -v
