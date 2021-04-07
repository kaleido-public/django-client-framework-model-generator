FROM node:10.24-alpine
RUN apk add bash git

COPY ./src /_src
WORKDIR /_src
RUN yarn install && yarn build
# ENTRYPOINT dcf_clientmodels
