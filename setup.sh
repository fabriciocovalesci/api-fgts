#!/bin/bash


GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'


check_success() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}$1 concluído com sucesso!${NC}"
  else
    echo -e "${RED}Erro ao executar $1. Saindo...${NC}"
    exit 1
  fi
}

echo -e "${GREEN}Iniciando a configuração do ambiente...${NC}"


# echo -e "${GREEN}Atualizando npm...${NC}"
# npm install -g npm
# check_success "Atualização do npm"


echo -e "${GREEN}Instalando NestJS CLI globalmente...${NC}"
npm install -g @nestjs/cli
check_success "Instalação do NestJS CLI"


echo -e "${GREEN}Instalando PM2 globalmente...${NC}"
npm install -g pm2
check_success "Instalação do PM2"


echo -e "${GREEN}Instalando dependências do projeto...${NC}"
npm install
check_success "Instalação das dependências do projeto"


echo -e "${GREEN}Gerando o build da aplicação...${NC}"
npm run build
check_success "Geração do build"

echo -e "${GREEN}Configuração do ambiente concluída!${NC}"
