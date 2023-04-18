## Build Environment ##
FROM node:17-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./

# RUN npm ci 
# RUN npm install --force
RUN npm install

COPY . ./
RUN npm run build



## Production Environment ##
FROM nginx:stable-alpine
WORKDIR /var/www/skillbuilder-app
COPY --from=build /usr/src/app /var/www/skillbuilder-app
COPY /deploy_stage/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY start.sh /var/www/skillbuilder-app/start.sh
RUN apk add --no-cache nodejs npm

## Install Pm2 
RUN npm install pm2 -g

RUN chmod +x start.sh

EXPOSE 3000
ENTRYPOINT /bin/sh -x /var/www/skillbuilder-app/start.sh && nginx -g 'daemon off;' 