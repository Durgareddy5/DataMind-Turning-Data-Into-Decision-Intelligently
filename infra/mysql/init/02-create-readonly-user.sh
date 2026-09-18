#!/bin/bash
set -e

# Deliberately not using the image's built-in MYSQL_USER/MYSQL_PASSWORD vars,
# since that grants the created user full privileges on MYSQL_DATABASE. The
# app only ever needs SELECT — see MYSQL_APP_USER/MYSQL_APP_PASSWORD below.
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
  CREATE USER IF NOT EXISTS '${MYSQL_APP_USER}'@'%' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
  GRANT SELECT ON \`${MYSQL_DATABASE}\`.customers TO '${MYSQL_APP_USER}'@'%';
  GRANT SELECT ON \`${MYSQL_DATABASE}\`.employees TO '${MYSQL_APP_USER}'@'%';
  GRANT SELECT ON \`${MYSQL_DATABASE}\`.order_items TO '${MYSQL_APP_USER}'@'%';
  GRANT SELECT ON \`${MYSQL_DATABASE}\`.orders TO '${MYSQL_APP_USER}'@'%';
  GRANT SELECT ON \`${MYSQL_DATABASE}\`.products TO '${MYSQL_APP_USER}'@'%';
  GRANT SELECT ON \`${MYSQL_DATABASE}\`.regions TO '${MYSQL_APP_USER}'@'%';
  FLUSH PRIVILEGES;
EOSQL
