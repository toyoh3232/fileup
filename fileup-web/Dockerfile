FROM node:14

# ENV http_proxy 
# ENV https_proxy

# Create app directory
WORKDIR /usr/src/fileup-cli-client

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY build/ ./

RUN npm install -g http-server
# If you are building your code for production
# RUN npm ci --only=production

EXPOSE 8080

CMD [ "http-server", "-s", "." ]
