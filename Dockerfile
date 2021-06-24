FROM node:latest

RUN mkdir coty-be

ADD . /
WORKDIR /
RUN npm install

ENV APP_ID=$APP_ID
ENV MASTER_KEY=$MASTER_KEY
ENV DATABASE_URI=$DATABASE_URI

COPY . .

EXPOSE 1337

CMD [ "npm", "start" ]
