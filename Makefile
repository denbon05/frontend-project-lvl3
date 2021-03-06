install: install-deps

install-deps:
	npm ci

start:
	npm run start:dev

build:
	npm run build

test:
	npm test

# tw:
# 	npx -n --experimental-vm-modules jest --watch --no-warnings

cover:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

fix:
	npx eslint --fix .

format:
	npx prettier --write .

.PHONY: test build