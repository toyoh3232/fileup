FROM node:14

ENV http_proxy http://proxy.toshiba.co.jp:8080
ENV https_proxy http://proxy.toshiba.co.jp:8080

ENV FILEUPSAVEDIR "/tmp/fileup/upload"

# Create app directory
WORKDIR /usr/src/fileup-server

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY . .

EXPOSE 54321

CMD [ "node", "app.js" ]
