#!/usr/bin/sh
sudo mongod --repair --dbpath /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo service mongodb start
