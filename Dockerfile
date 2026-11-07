FROM nginx:alpine

COPY Index.html /usr/share/nginx/html/index.html
COPY styles.css script.js /usr/share/nginx/html/

EXPOSE 80
