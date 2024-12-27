#!/bin/bash
# Autor: Fabricio Luis Covalesci            									
# Contato: fabcovalesci@gmail.com									
# Descricao: Scripts para Automatizar Tarefas Diarias  									
# Referencia: https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html			
#       																	
#################################################################################

DOCKER_COMPOSE_FILE = docker-compose.yml
SERVICE_NAME = api-fgts


## Get Container ID API
CONTAINER_ID_API=$(shell docker ps --filter "ancestor=back-end-api" --format "{{.ID}}")

## Get Container ID Mongo
CONTAINER_ID_MONGO=$(shell docker ps | grep 'mongo:5' | awk '{print $$1}')

## Get Container IP Mongo
CONTAINER_IP=$(shell docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(CONTAINER_ID_MONGO))



FGTS_API := 'api_fgts'

.PHONY: help build up stop  down up-b stp roll list-containers ip-mongo exec rmi-clean


help: ## Help about commands
	@echo "Commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)



# DOCKER TASKS

build: ## Build do container, especificando o nome da API | default api_fgts
	docker build -t $(FGTS_API) .


roll:
	CONTAINER_ID=$$(docker ps | grep 'back-end_api' | awk '{print $$1}'); \
	docker exec -it $$CONTAINER_ID npm run rollback


up: ## Execute
	@echo "Starting container"
	docker compose -f $(DOCKER_COMPOSE_FILE) up --remove-orphans


up-b: ## Builds the docker image and runs container with flag --build
	docker compose -f $(DOCKER_COMPOSE_FILE) up --build --force-recreate

up-hproxy: ## Builds the docker image and runs container with flag --build
	docker compose -f  $(DOCKER_COMPOSE_FILE) up --build --force-recreate --remove-orphans --scale api-monolito=4

down: ## Stop running container
	docker compose -f $(DOCKER_COMPOSE_FILE) down


stop: ## For all running containers
	docker stop $(docker ps -q)


ip-mongo: ## MongoDB container IP
	@if [ -z "$(CONTAINER_ID_MONGO)" ]; then \
	  echo "The MongoDB container was not found."; \
	  exit 1; \
	fi
	@echo "MongoDB container IP: $(CONTAINER_IP)"


rmi-clean: ## Realiza limpeza de imagens none. Ex <none>
	@none_images=$$(docker images -f "dangling=true" -q); \
	if [ -n "$$none_images" ]; then \
		docker rmi -f $$none_images; \
	else \
		echo "No <none> images to remove"; \
	fi


