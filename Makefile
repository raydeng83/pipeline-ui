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

ENV   ?= ide3
SCOPE ?=
OP    ?= check-locked-status
DIR    = environments/$(ENV)

.PHONY: test test-debug pull push promote promote-lock promote-dryrun promote-run promote-unlock promote-rollback dev

## Test connection
test:
	cd $(DIR) && fr-config-pull test

test-debug:
	cd $(DIR) && fr-config-pull test --debug

## Pull config (SCOPE= optional; omit to pull all)
pull:
	cd $(DIR) && fr-config-pull $(SCOPE)

## Push config (SCOPE= optional; omit to push all)
push:
	cd $(DIR) && fr-config-push $(SCOPE)

## Promote (OP= to specify subcommand)
promote:
	cd $(DIR) && fr-config-promote $(OP)

promote-lock:
	cd $(DIR) && fr-config-promote lock-tenants

promote-dryrun:
	cd $(DIR) && fr-config-promote run-dryrun-promotion

promote-run:
	cd $(DIR) && fr-config-promote run-promotion

promote-unlock:
	cd $(DIR) && fr-config-promote unlock-tenants

promote-rollback:
	cd $(DIR) && fr-config-promote rollback

## Start Next.js dev server
dev:
	npm run dev
