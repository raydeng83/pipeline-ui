## AIC Config Pipeline — CLI shortcuts
## Usage: make <target> ENV=<env-name> [SCOPE=<scope>]
##
## Examples:
##   make test ENV=ide3
##   make test-debug ENV=ide3
##   make pull ENV=ide3
##   make pull ENV=ide3 SCOPE=journeys
##   make push ENV=ide3 SCOPE=journeys
##   make promote ENV=ide3 OP=check-locked-status

ENV    ?= ide3
SCOPE  ?=
OP     ?= check-locked-status
RUNNER := node scripts/run.js

.PHONY: test test-debug pull push promote promote-lock promote-dryrun promote-run promote-unlock promote-rollback dev

## Test connection
test:
	$(RUNNER) $(ENV) fr-config-pull test

test-debug:
	$(RUNNER) $(ENV) fr-config-pull test --debug

## Pull config (SCOPE= optional; omit to pull all)
pull:
	$(RUNNER) $(ENV) fr-config-pull $(SCOPE)

## Push config (SCOPE= optional; omit to push all)
push:
	$(RUNNER) $(ENV) fr-config-push $(SCOPE)

## Promote (OP= to specify subcommand)
promote:
	$(RUNNER) $(ENV) fr-config-promote $(OP)

promote-lock:
	$(RUNNER) $(ENV) fr-config-promote lock-tenants

promote-dryrun:
	$(RUNNER) $(ENV) fr-config-promote run-dryrun-promotion

promote-run:
	$(RUNNER) $(ENV) fr-config-promote run-promotion

promote-unlock:
	$(RUNNER) $(ENV) fr-config-promote unlock-tenants

promote-rollback:
	$(RUNNER) $(ENV) fr-config-promote rollback

## Start Next.js dev server
dev:
	npm run dev
