# Development

* Apple Silicon 

    * In order for npm i for dev purposes, _node-canvas_ needs some dependencies installed:
  
  ```bash
  $ brew install pkg-config cairo pango libpng jpeg giflib librsvg
  ```

  see: [https://github.com/Automattic/node-canvas](https://github.com/Automattic/node-canvas)

    * docker compose running these on m1 also need some more cli options
      * docker platform needs to be specified. One possibility:

    ```bash
    $ export DOCKER_DEFAULT_PLATFORM=linux/amd64; NSTRUMENTA_API_KEY=0ce4e1bb-7f82-439e-b915-88fecbc643be TEST_ID=${uuidgen} docker compose up
    ```
