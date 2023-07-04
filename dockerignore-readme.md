from https://stackoverflow.com/questions/38946683/how-to-test-dockerignore-file
here is how you test your .dockerignore without actually copying data:

```shell
$ rsync -avn . /dev/shm --exclude-from .dockerignore
```