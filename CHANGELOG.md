# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.1.5](https://github.com/nstrumenta/nstrumenta/compare/v2.1.4...v2.1.5) (2022-03-09)


### Features

* **agent:** run module with args ([1ba6ab5](https://github.com/nstrumenta/nstrumenta/commit/1ba6ab51d697a82c7ada25d21711c5c84f57ea21))

### [2.1.4](https://github.com/nstrumenta/nstrumenta/compare/v2.1.3...v2.1.4) (2022-03-08)


### Features

* **agent:** adds `module-run [--tag ...] [--agentId] [--module]` command: module is optional, one of tag or agentId is required ([#59](https://github.com/nstrumenta/nstrumenta/issues/59)) ([cad655c](https://github.com/nstrumenta/nstrumenta/commit/cad655ca85dc691870448eba46495784b8c6421b))

### [2.1.3](https://github.com/nstrumenta/nstrumenta/compare/v2.1.2...v2.1.3) (2022-03-07)


### Features

* **agent:** when a sandbox module is run by an agent, the module files are copied to hosted modules directory ([#49](https://github.com/nstrumenta/nstrumenta/issues/49)) ([c4db8f0](https://github.com/nstrumenta/nstrumenta/commit/c4db8f0a75384b94a6ae59c02996bc1f38f9c8ca))
* **util:** Adds find nearest `.nstrumenta/config.json` up the dir tree ([#54](https://github.com/nstrumenta/nstrumenta/issues/54)) ([8e4f379](https://github.com/nstrumenta/nstrumenta/commit/8e4f37972672d0a067152d3db9d0a59f19dc6a42))

### [2.1.2](https://github.com/nstrumenta/nstrumenta/compare/v2.1.1...v2.1.2) (2022-03-04)


### Features

* adds 'includes' field to Module interface ([f1ccf74](https://github.com/nstrumenta/nstrumenta/commit/f1ccf74e0dedd94c914d38458d14767328ef0bf2))
* **module:** add optional prePublishCommand step ([5c6a2be](https://github.com/nstrumenta/nstrumenta/commit/5c6a2be8e4b2b65fcf9a8c48766c7b0a96b69e93))

### [2.1.1](https://github.com/nstrumenta/nstrumenta/compare/v2.1.0...v2.1.1) (2022-03-02)

## [2.1.0](https://github.com/nstrumenta/nstrumenta/compare/v2.0.19...v2.1.0) (2022-03-02)

### [2.0.19](https://github.com/nstrumenta/nstrumenta/compare/v2.0.18...v2.0.19) (2022-03-01)


### Features

* **agentActions:** adds agent set-action command ([adbf20a](https://github.com/nstrumenta/nstrumenta/commit/adbf20a8aa308246c9ea558b4d05665fb3737050))

### [2.0.18](https://github.com/nstrumenta/nstrumenta/compare/v2.0.17...v2.0.18) (2022-02-28)


### Features

* **publish:** continue on failing promise ([1b854ea](https://github.com/nstrumenta/nstrumenta/commit/1b854ea85cf8ba7f3062ffb557ae467865a2ac68))

### [2.0.17](https://github.com/nstrumenta/nstrumenta/compare/v2.0.16...v2.0.17) (2022-02-24)


### Bug Fixes

* **apiKey:** fixes import in machines.ts ([ba437d4](https://github.com/nstrumenta/nstrumenta/commit/ba437d4ed4127c5d505113f978d5f38549c9b844))

### [2.0.16](https://github.com/nstrumenta/nstrumenta/compare/v2.0.15...v2.0.16) (2022-02-23)


### Features

* **keys:** uses common resolveApiKey ([35cd6b4](https://github.com/nstrumenta/nstrumenta/commit/35cd6b48fc6ef5d45eb29ce8e13af590884c40ca))

### [2.0.15](https://github.com/nstrumenta/nstrumenta/compare/v2.0.14...v2.0.15) (2022-02-23)

### [2.0.14](https://github.com/nstrumenta/nstrumenta/compare/v2.0.13...v2.0.14) (2022-02-22)


### Features

* **backplane:** adds server events ([#40](https://github.com/nstrumenta/nstrumenta/issues/40)) ([7e369bb](https://github.com/nstrumenta/nstrumenta/commit/7e369bb1ba77d5b5ee4b66162ca9f42ee6346c4f))

### [2.0.13](https://github.com/nstrumenta/nstrumenta/compare/v2.0.12...v2.0.13) (2022-02-19)


### Bug Fixes

* **deps:** audit fix ([50e8e05](https://github.com/nstrumenta/nstrumenta/commit/50e8e056a5a07526e4c794f6e33e5dfdd653df66))

### [2.0.12](https://github.com/nstrumenta/nstrumenta/compare/v2.0.11...v2.0.12) (2022-02-18)


### Features

* **backplane:** adds getBackplaneUrl to server.ts ([6fab0bc](https://github.com/nstrumenta/nstrumenta/commit/6fab0bcdd6550554905e6e5cce1304eac7dbd21e))

### [2.0.11](https://github.com/nstrumenta/nstrumenta/compare/v2.0.10...v2.0.11) (2022-02-16)


### Bug Fixes

* **agent:** fixes import ([696f482](https://github.com/nstrumenta/nstrumenta/commit/696f482c0e01fbfb71d776447ed6b1bd9a33199c))

### [2.0.10](https://github.com/nstrumenta/nstrumenta/compare/v2.0.9...v2.0.10) (2022-02-16)


### Bug Fixes

* **agent start:** passes port from options ([030b529](https://github.com/nstrumenta/nstrumenta/commit/030b52984fb6cc30b5f72077e252c12ba2e1913b))

### [2.0.9](https://github.com/nstrumenta/nstrumenta/compare/v2.0.8...v2.0.9) (2022-02-16)


### Bug Fixes

* **server:** fixes check for node env ([e8a457d](https://github.com/nstrumenta/nstrumenta/commit/e8a457d24229b3a9aa82ce62360ff4195509f8a2))

### [2.0.8](https://github.com/nstrumenta/nstrumenta/compare/v2.0.7...v2.0.8) (2022-02-16)


### Features

* **agent start:** wraps config checking in try catch ([04fd36a](https://github.com/nstrumenta/nstrumenta/commit/04fd36a2f66eb0432236273fab3a386e85c0826e))

### [2.0.7](https://github.com/nstrumenta/nstrumenta/compare/v2.0.6...v2.0.7) (2022-02-11)


### Features

* **reconnection:** fixes verification and apiKey for react clients ([3f8930b](https://github.com/nstrumenta/nstrumenta/commit/3f8930be3ca26cc05672562bf779b50eac429705))

### [2.0.6](https://github.com/nstrumenta/nstrumenta/compare/v2.0.5...v2.0.6) (2022-02-10)

### [2.0.5](https://github.com/nstrumenta/nstrumenta/compare/v2.0.4...v2.0.5) (2022-02-10)


### Features

* **apiKey:** improved error message ([3ede84f](https://github.com/nstrumenta/nstrumenta/commit/3ede84fc6c757eb605ec19b8c536cbb0f4ca43c0))

### [2.0.4](https://github.com/nstrumenta/nstrumenta/compare/v2.0.3...v2.0.4) (2022-02-10)


### Features

* **apiKey:** uses environment var for key if avaliable ([1b950de](https://github.com/nstrumenta/nstrumenta/commit/1b950de80f39b4055f05b2012ef467f66a399c01))

### [2.0.3](https://github.com/nstrumenta/nstrumenta/compare/v2.0.2...v2.0.3) (2022-02-09)

### [2.0.2](https://github.com/nstrumenta/nstrumenta/compare/v2.0.1...v2.0.2) (2022-02-09)

### [2.0.1](https://github.com/nstrumenta/nstrumenta/compare/v2.0.0...v2.0.1) (2022-02-09)

## [2.0.0](https://github.com/nstrumenta/nstrumenta/compare/v1.0.52...v2.0.0) (2022-02-08)

### [1.0.52](https://github.com/nstrumenta/nstrumenta/compare/v1.0.51...v1.0.52) (2022-02-02)

### [1.0.51](https://github.com/nstrumenta/nstrumenta/compare/v1.0.50...v1.0.51) (2022-02-01)

### [1.0.50](https://github.com/nstrumenta/nstrumenta/compare/v1.0.48...v1.0.50) (2022-01-24)

### [1.0.49](https://github.com/nstrumenta/nstrumenta/compare/v1.0.48...v1.0.49) (2022-01-21)

### [1.0.48](https://github.com/nstrumenta/nstrumenta/compare/v1.0.47...v1.0.48) (2022-01-10)

### [1.0.47](https://github.com/nstrumenta/nstrumenta/compare/v1.0.46...v1.0.47) (2022-01-10)


### Features

* **agent start:** renames noBackplane to local ; fixes tmp file collisions ([c1193fa](https://github.com/nstrumenta/nstrumenta/commit/c1193fa6d0e6e8f2be59ea9e0473867d7417293e))

### [1.0.46](https://github.com/nstrumenta/nstrumenta/compare/v1.0.45...v1.0.46) (2022-01-10)

### [1.0.45](https://github.com/nstrumenta/nstrumenta/compare/v1.0.44...v1.0.45) (2022-01-07)

### [1.0.44](https://github.com/nstrumenta/nstrumenta/compare/v1.0.43...v1.0.44) (2022-01-04)


### Bug Fixes

* **index:** restores lib/index ([dbcd76f](https://github.com/nstrumenta/nstrumenta/commit/dbcd76f76b95ad08d48a00e044a5730a0a86f46d))

### [1.0.43](https://github.com/nstrumenta/nstrumenta/compare/v1.0.42...v1.0.43) (2022-01-04)


### Features

* **session:** getToken on init ([1901223](https://github.com/nstrumenta/nstrumenta/commit/19012230573cf69599a8872e5b9e44558fd53c6a))

### [1.0.42](https://github.com/nstrumenta/nstrumenta/compare/v1.0.41...v1.0.42) (2022-01-03)

### [1.0.41](https://github.com/nstrumenta/nstrumenta/compare/v1.0.40...v1.0.41) (2021-12-08)

### [1.0.40](https://github.com/nstrumenta/nstrumenta/compare/v1.0.39...v1.0.40) (2021-12-08)

### [1.0.39](https://github.com/nstrumenta/nstrumenta/compare/v1.0.38...v1.0.39) (2021-12-08)


### Features

* **client:** adds sendBuffer ([625f454](https://github.com/nstrumenta/nstrumenta/commit/625f45403402f5e984bf9a87d91e54b76e439fed))

### [1.0.38](https://github.com/nstrumenta/nstrumenta/compare/v1.0.37...v1.0.38) (2021-12-06)

### [1.0.37](https://github.com/nstrumenta/nstrumenta/compare/v1.0.36...v1.0.37) (2021-11-14)

### [1.0.36](https://github.com/nstrumenta/nstrumenta/compare/v1.0.35...v1.0.36) (2021-11-14)

### [1.0.35](https://github.com/nstrumenta/nstrumenta/compare/v1.0.34...v1.0.35) (2021-11-14)

### [1.0.34](https://github.com/nstrumenta/nstrumenta/compare/v1.0.32...v1.0.34) (2021-11-12)

### [1.0.33](https://github.com/nstrumenta/nstrumenta/compare/v1.0.32...v1.0.33) (2021-11-12)

### [1.0.32](https://github.com/nstrumenta/nstrumenta/compare/v1.0.31...v1.0.32) (2021-11-09)


### Features

* **machines:**  uses object in console.log ([f4fe53c](https://github.com/nstrumenta/nstrumenta/commit/f4fe53c4f9c6351c151f5fdcbeeacbd3062f170f))

### [1.0.31](https://github.com/nstrumenta/nstrumenta/compare/v1.0.30...v1.0.31) (2021-11-09)


### Bug Fixes

* **machines:** fixes blue is not a function ([3fa9180](https://github.com/nstrumenta/nstrumenta/commit/3fa91804e4f3bdfb24b8529d435773ffadeb5e7e))

### [1.0.30](https://github.com/nstrumenta/nstrumenta/compare/v1.0.29...v1.0.30) (2021-11-05)


### Bug Fixes

* **serve:** moves index.ejs back to top level ; cp in build ([15218e1](https://github.com/nstrumenta/nstrumenta/commit/15218e17b97deb2b617fdaa33bdcdfaae4dd03fa))

### [1.0.29](https://github.com/nstrumenta/nstrumenta/compare/v1.0.28...v1.0.29) (2021-11-05)


### Bug Fixes

* **serve:** moves ejs to public ([104e9f4](https://github.com/nstrumenta/nstrumenta/commit/104e9f4e273de634e57cf162e2e01a51b5757ede))

### [1.0.28](https://github.com/nstrumenta/nstrumenta/compare/v1.0.27...v1.0.28) (2021-11-05)


### Bug Fixes

* **addContext:** fixes addcontext prompt ([abb89ba](https://github.com/nstrumenta/nstrumenta/commit/abb89ba6358c60f9863330b8ffdf3732700c24f4))
* **setContext:** destructures context ([75e5c57](https://github.com/nstrumenta/nstrumenta/commit/75e5c574ce93d042df093b66d9af345d2f44e5d9))

### [1.0.27](https://github.com/nstrumenta/nstrumenta/compare/v1.0.25...v1.0.27) (2021-11-04)

### [1.0.26](https://github.com/nstrumenta/nstrumenta/compare/v1.0.25...v1.0.26) (2021-11-04)

### [1.0.25](https://github.com/nstrumenta/nstrumenta/compare/v1.0.24...v1.0.25) (2021-11-04)

### [1.0.24](https://github.com/nstrumenta/nstrumenta/compare/v1.0.23...v1.0.24) (2021-11-04)

### [1.0.23](https://github.com/nstrumenta/nstrumenta/compare/v1.0.22...v1.0.23) (2021-10-25)

### [1.0.22](https://github.com/nstrumenta/nstrumenta/compare/v1.0.21...v1.0.22) (2021-10-15)

### [1.0.21](https://github.com/nstrumenta/nstrumenta/compare/v1.0.20...v1.0.21) (2021-10-15)


### Bug Fixes

* **lib:** adds ./dist/models to exports ([6417a98](https://github.com/nstrumenta/nstrumenta/commit/6417a989d2d42bee4ab0d18d00a2b8673c0a6ecf))

### [1.0.20](https://github.com/nstrumenta/nstrumenta/compare/v1.0.19...v1.0.20) (2021-10-14)

### [1.0.19](https://github.com/nstrumenta/nstrumenta/compare/v1.0.18...v1.0.19) (2021-10-11)

### [1.0.18](https://github.com/nstrumenta/nstrumenta/compare/v1.0.17...v1.0.18) (2021-10-11)


### Features

* **subscribe:** adds message-only subscribe option ([3025dc8](https://github.com/nstrumenta/nstrumenta/commit/3025dc8ebe5b228f259d15330ca30c446f7f6614))

### [1.0.17](https://github.com/nstrumenta/nstrumenta/compare/v1.0.16...v1.0.17) (2021-10-08)

### [1.0.16](https://github.com/nstrumenta/nstrumenta/compare/v1.0.15...v1.0.16) (2021-10-08)

### [1.0.15](https://github.com/nstrumenta/nstrumenta/compare/v1.0.14...v1.0.15) (2021-10-07)


### Features

* **subscribe:** handles payload and event ([1b667a8](https://github.com/nstrumenta/nstrumenta/commit/1b667a81e986fa1afde6227ea9d46a3008939aa2))

### [1.0.14](https://github.com/nstrumenta/nstrumenta/compare/v1.0.13...v1.0.14) (2021-10-05)


### Features

* **pubsub:** adds publish and subscribe to channel ([92434fb](https://github.com/nstrumenta/nstrumenta/commit/92434fb31c7c618dc4b9ce0e6c4a0224ad87325b))

### [1.0.13](https://github.com/nstrumenta/nstrumenta/compare/v1.0.12...v1.0.13) (2021-09-30)

### [1.0.12](https://github.com/nstrumenta/nstrumenta/compare/v1.0.11...v1.0.12) (2021-09-30)


### Features

* **connect ws:** adds ws and connect to machine ([44eb2eb](https://github.com/nstrumenta/nstrumenta/commit/44eb2ebe16c761e3dcf1a12488ce32961441b6d4))

### [1.0.11](https://github.com/nstrumenta/nstrumenta/compare/v1.0.10...v1.0.11) (2021-09-28)

### [1.0.10](https://github.com/nstrumenta/nstrumenta/compare/v1.0.9...v1.0.10) (2021-09-28)

### [1.0.9](https://github.com/nstrumenta/nstrumenta/compare/v1.0.8...v1.0.9) (2021-09-28)

### 1.0.8 (2021-09-28)
