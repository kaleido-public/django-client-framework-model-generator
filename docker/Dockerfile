FROM alpine

RUN apk add nodejs
RUN apk add npm
RUN npm install -g quicktype
RUN apk add python3 py3-pip
RUN pip3 install click

COPY py /py
RUN pip3 install /py

ENTRYPOINT gen-kotlin-models
