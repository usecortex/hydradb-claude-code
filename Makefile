.DEFAULT_GOAL := help

.PHONY: help bootstrap install check clean

help: ## Show available targets
	@printf "\nUsage: make <target>\n\n"
	@printf "Targets:\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'
	@echo ""

bootstrap: ## Zero-to-running setup (install deps, create config, run checks)
	@bash scripts/bootstrap.sh

install: ## Install npm dependencies
	npm install

check: ## Run syntax and integration checks
	npm run check

clean: ## Remove node_modules
	rm -rf node_modules
