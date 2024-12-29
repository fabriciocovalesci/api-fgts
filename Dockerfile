FROM node:20

RUN apt-get update && apt-get install -y tzdata
ENV TZ="America/Sao_Paulo"

WORKDIR /app

COPY package*.json ./

RUN npm install --unsafe-perm && npm install -g @nestjs/cli

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
