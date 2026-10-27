FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8001/api/v1
ARG VITE_COMPANY_ID=4

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_COMPANY_ID=$VITE_COMPANY_ID

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
