FROM node:boron-alpine

RUN apk update && apk add \
    curl\
 && rm -rf /var/cache/apk/*

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
#RUN npm install

# note that "npm install" must be executed outside Dockerfile
# because it is reading private repositories and it is a nightmare
# to add credentials into a Dockerfile (without compromising security)
COPY node_modules /usr/src/app/node_modules/

# Bundle app source
COPY . /usr/src/app

EXPOSE 3001

CMD [ "npm", "start" ]