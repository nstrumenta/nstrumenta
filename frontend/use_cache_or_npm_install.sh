#/bin/bash -vx
if [ -e "node_modules" ]
then
    echo "node_modules restored from cache"
else
    echo "node_modules doesn't exist"
    pwd
    ls
    set -e
    npm install --no-save
fi