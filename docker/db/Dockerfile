FROM postgres:16-alpine

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=my_nest_api

EXPOSE 5432

HEALTHCHECK --interval=5s --timeout=5s --retries=5 \
  CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
