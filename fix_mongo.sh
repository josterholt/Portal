#!/bin/bash

mongod --repair --dbpath /var/lib/mongodb

chown -R mongodb:mongodb /var/lib/mongodb

service mongodb start
