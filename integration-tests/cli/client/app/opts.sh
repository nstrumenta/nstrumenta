#!/bin/bash
case $1 in
create)
    echo creating $2
    ;;
delete)
    echo deleting $2
    ;;
*)
    echo 'usage: ./script.sh [create|delete] filename'
    ;;
esac
