FROM node:alpine

EXPOSE 3000

WORKDIR app

# зависимости
COPY package.json .
COPY package-lock.json .
RUN npm ci

# остальное + билд
COPY . .
RUN npm run build

# запуск сервера
CMD [ "npm", "start" ]