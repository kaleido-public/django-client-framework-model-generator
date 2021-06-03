# # must use node 10 because quicktype depends on it
# FROM node:10.24-alpine
# RUN apk add bash git

# COPY ./src /_src
# WORKDIR /_src
# RUN yarn install && yarn build
# ENTRYPOINT ["node", ".build/cli.js"]
