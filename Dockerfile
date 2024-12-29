FROM node:20

ENV TZ=America/Sao_Paulo

RUN apt-get update && apt-get install -y tzdata

WORKDIR /app

COPY package*.json ./

RUN npm install --unsafe-perm && npm install -g @nestjs/cli

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
