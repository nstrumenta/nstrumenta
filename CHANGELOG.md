# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.1.19](https://github.com/nstrumenta/nstrumenta/compare/v3.1.18...v3.1.19) (2023-11-13)

### [3.1.18](https://github.com/nstrumenta/nstrumenta/compare/v3.1.17...v3.1.18) (2023-11-12)


### Features

* **data:** uses project bucket for data mount ([7c852b5](https://github.com/nstrumenta/nstrumenta/commit/7c852b5762b1927a62c876cbdc4c1381a16edaf6))

### [3.1.17](https://github.com/nstrumenta/nstrumenta/compare/v3.1.16...v3.1.17) (2023-11-12)

### [3.1.16](https://github.com/nstrumenta/nstrumenta/compare/v3.1.15...v3.1.16) (2023-11-12)

### [3.1.15](https://github.com/nstrumenta/nstrumenta/compare/v3.1.14...v3.1.15) (2023-11-12)


### Features

* **key:** removes key from project ([6d4807f](https://github.com/nstrumenta/nstrumenta/commit/6d4807f63e84ce1ebdea5d5ac55759c37bcbeb84))

### [3.1.14](https://github.com/nstrumenta/nstrumenta/compare/v3.1.13...v3.1.14) (2023-11-12)


### Features

* **server:** uses docker.io images for cloud run and agent ([7aed74a](https://github.com/nstrumenta/nstrumenta/commit/7aed74a763352fc9a86dc66363535ca1fa51e632))
* **terraform:** storage trigger functions in terraform ([b7afc7d](https://github.com/nstrumenta/nstrumenta/commit/b7afc7d04cd17f0b369528083cf7b6ee40453b86))

### [3.1.13](https://github.com/nstrumenta/nstrumenta/compare/v3.1.12...v3.1.13) (2023-11-11)


### Features

* **ci:** use arm.large resource ([c19835e](https://github.com/nstrumenta/nstrumenta/commit/c19835e3996c51c4cc1a9243f94b69e18167438b))

### [3.1.12](https://github.com/nstrumenta/nstrumenta/compare/v3.1.11...v3.1.12) (2023-11-11)


### Features

* **docker:** switches to bullseye-slim from alpine ([3af856e](https://github.com/nstrumenta/nstrumenta/commit/3af856e85ea056dd259088d0d20166b6ffb3e67d))

### [3.1.11](https://github.com/nstrumenta/nstrumenta/compare/v3.1.10...v3.1.11) (2023-11-11)

### [3.1.10](https://github.com/nstrumenta/nstrumenta/compare/v3.1.9...v3.1.10) (2023-11-11)


### Bug Fixes

* **ci:** fixes yml ([a9e2bdf](https://github.com/nstrumenta/nstrumenta/commit/a9e2bdf0ad396152aa5e014a35eaa06c2c8992a0))

### [3.1.9](https://github.com/nstrumenta/nstrumenta/compare/v3.1.8...v3.1.9) (2023-11-11)


### Features

* **ci:** updates for docker hub ([#179](https://github.com/nstrumenta/nstrumenta/issues/179)) ([0d48d39](https://github.com/nstrumenta/nstrumenta/commit/0d48d39f3913a2bf6ca6b9fc44de7c795128dc28))
* **deploy:** adds terraform for creating new project ([#178](https://github.com/nstrumenta/nstrumenta/issues/178)) ([7644863](https://github.com/nstrumenta/nstrumenta/commit/764486331c979eae0978ce95c6e0081195771503))


### Bug Fixes

* **ci:** removes failing dependency canvas ([#177](https://github.com/nstrumenta/nstrumenta/issues/177)) ([5cf7394](https://github.com/nstrumenta/nstrumenta/commit/5cf739463c5cbe486bfc7e6175b27146e5dfcbd7))
* **data:** fixes duplicate module actions ([27a5fb3](https://github.com/nstrumenta/nstrumenta/commit/27a5fb3023c421788452e9c23cc47eb9006e45ea))
* **version:** restores version ([3eb90ab](https://github.com/nstrumenta/nstrumenta/commit/3eb90ab937eba21620218971c21063957f5d28a6))

### [3.1.8](https://github.com/nstrumenta/nstrumenta/compare/v3.1.7...v3.1.8) (2023-09-13)


### Features

* **cloud-run:** adds ffmpeg to data-job-runner ([b24b6f3](https://github.com/nstrumenta/nstrumenta/commit/b24b6f3e0c4515ce9a188f25f1f6f589155db832))
* **cloudData:** increases cloudDataJob memory size ([9f578a6](https://github.com/nstrumenta/nstrumenta/commit/9f578a6ba21fcd20759cb4327c91626ac109efc5))
* **data-detail:** prevents parsing large json ([a1e10b8](https://github.com/nstrumenta/nstrumenta/commit/a1e10b8a0936517268a700eabf8878d869062eea))


### Bug Fixes

* **data-job-build:** pins version of go in data-job-runner ([c3bd165](https://github.com/nstrumenta/nstrumenta/commit/c3bd1655c939426134399672ea1ff61680b83a26))
* **developer:** pins gcsfuse version ([1be1a4e](https://github.com/nstrumenta/nstrumenta/commit/1be1a4ebddc075d301dd5674ff3d9a1a4884f949))
* **module:** properly cleans up data mount, fixes moduleVersion for run module ([a3239ca](https://github.com/nstrumenta/nstrumenta/commit/a3239ca925509767757ba5657f3a60191fcf1ed3))

### [3.1.7](https://github.com/nstrumenta/nstrumenta/compare/v3.1.6...v3.1.7) (2023-09-06)


### Features

* **cli:** fixes process.stdout in asyncSpawn ([18d4d38](https://github.com/nstrumenta/nstrumenta/commit/18d4d38425ac4556df8a0360e796badf683aa955))
* **data-detail:** adds json spacing ([589e9a0](https://github.com/nstrumenta/nstrumenta/commit/589e9a0e8f0914e4a9d50cd54724e5d134f2fd13))
* **modules:** adds cloud-run action ; module delete ([b440beb](https://github.com/nstrumenta/nstrumenta/commit/b440beb5c886fc5adce31d719fc0a493c2516022))
* **run-module:** explicit command-args ([#175](https://github.com/nstrumenta/nstrumenta/issues/175)) ([9cd235b](https://github.com/nstrumenta/nstrumenta/commit/9cd235b8e1af1150bd8b32afa303afbdc342cb07))
* **storage:** adds delete trigger for storage objects ([9b213ca](https://github.com/nstrumenta/nstrumenta/commit/9b213ca5c74a1ea3c8a73e796bd4e0e756512989))
* **test:** increases timeout on delete test ([63a90f1](https://github.com/nstrumenta/nstrumenta/commit/63a90f1e78a4496a121d36041d5b529c736f88ba))
* **tests:** exit on spawn error ([3aa0738](https://github.com/nstrumenta/nstrumenta/commit/3aa0738cfec4f3f00b0a10ed8f976e9348d6eaa6))


### Bug Fixes

* **cloud-run:** fixes args ([f454c42](https://github.com/nstrumenta/nstrumenta/commit/f454c4239bf30e637c564b919d7ed0d1131a3794))

### [3.1.6](https://github.com/nstrumenta/nstrumenta/compare/v3.1.5...v3.1.6) (2023-08-05)


### Features

* **modules:** improves module publish, list, query, host  ([#174](https://github.com/nstrumenta/nstrumenta/issues/174)) ([f19e4c3](https://github.com/nstrumenta/nstrumenta/commit/f19e4c3e4cc53fb291e726eb75b3f3b0241acf60))

### [3.1.5](https://github.com/nstrumenta/nstrumenta/compare/v3.1.4...v3.1.5) (2023-08-02)

### [3.1.4](https://github.com/nstrumenta/nstrumenta/compare/v3.1.3...v3.1.4) (2023-08-01)


### Bug Fixes

* **browser:** fixes storage apiUrl ([5ec806b](https://github.com/nstrumenta/nstrumenta/commit/5ec806bee1ac80c517f34810a023b0d1aa351e23))

### [3.1.3](https://github.com/nstrumenta/nstrumenta/compare/v3.1.2...v3.1.3) (2023-08-01)


### Features

* **frontend:** upgrades to Angular 15, apiUrl in key ([#173](https://github.com/nstrumenta/nstrumenta/issues/173)) ([2d55b41](https://github.com/nstrumenta/nstrumenta/commit/2d55b41e3f490480fc15d832c30ad46ba89cc63c))
* **test:** increase cli cloud-run timeout ([f68e171](https://github.com/nstrumenta/nstrumenta/commit/f68e171d735aa50c9fc53495cf02e8a493969c62))
* **tests:** updates script ([9ff7954](https://github.com/nstrumenta/nstrumenta/commit/9ff79545fb578575a5348222260d69c2772a6eae))


### Bug Fixes

* **browser-client:** updates browser client to use apiUrl from apiKey ([c45eec4](https://github.com/nstrumenta/nstrumenta/commit/c45eec460c7aeda0e04e786da8f8c8f32fc18d09))
* **browser:** split key for header ([5c4aab0](https://github.com/nstrumenta/nstrumenta/commit/5c4aab0abaebc1194a42ad0ef92bb34fa6a5f9d1))

### [3.1.2](https://github.com/nstrumenta/nstrumenta/compare/v3.1.1...v3.1.2) (2023-07-25)


### Features

* **tests:** adds browser-client tests ([45b0551](https://github.com/nstrumenta/nstrumenta/commit/45b05511cc321a2b4fa491840dd7b9aca08b9718))
* **tests:** adds browser-client to ci ([e6bdb8c](https://github.com/nstrumenta/nstrumenta/commit/e6bdb8cabea82459bef4e3c7b4641f856c1f9eb5))
* **tests:** adds docker-compose down to ci script ([9043831](https://github.com/nstrumenta/nstrumenta/commit/90438311121fc7f5755c1c30b3bc9c68bf66114d))
* **tests:** adds nodejs-client integration test to ci ([259a146](https://github.com/nstrumenta/nstrumenta/commit/259a1463f030ad1e4fb426b4a8ffd06cd03a57ac))

### [3.1.1](https://github.com/nstrumenta/nstrumenta/compare/v3.1.0...v3.1.1) (2023-07-23)


### Features

* **deploy:** module deploy and run ([#171](https://github.com/nstrumenta/nstrumenta/issues/171)) ([117a31f](https://github.com/nstrumenta/nstrumenta/commit/117a31fd3aa35bbc384453f1935b60fc675a2bf6))
* **frontend:** removes old deploy script ([f502d46](https://github.com/nstrumenta/nstrumenta/commit/f502d46e7ca8e0e545a9bb3d1f48995f533eb824))
* **frontend:** updates deploy scripts ([6cb5ccc](https://github.com/nstrumenta/nstrumenta/commit/6cb5cccfc5448e88f790d7a34eaa3f09451d9d5f))
* **release:** skips tag for frontend release (still using for release notes) ([508b185](https://github.com/nstrumenta/nstrumenta/commit/508b18572ef31ce1a098389ebe7aa677608f1952))

## [3.1.0](https://github.com/nstrumenta/nstrumenta/compare/v3.0.47...v3.1.0) (2023-07-18)


### Features

* **cluster:** moves backend components to open source repo! ([#170](https://github.com/nstrumenta/nstrumenta/issues/170)) ([b4954d5](https://github.com/nstrumenta/nstrumenta/commit/b4954d5ab4f91f19c54adeda9cc74f000bd3449c))


### Bug Fixes

* **data-mount:** removes data folder so parent is empty ([13cbcf8](https://github.com/nstrumenta/nstrumenta/commit/13cbcf84928a919c48471bf0d50adac0eb4728db))

### [3.0.47](https://github.com/nstrumenta/nstrumenta/compare/v3.0.46...v3.0.47) (2023-06-26)


### Features

* **data:** adds mount and unmount with fuse ([d7fbead](https://github.com/nstrumenta/nstrumenta/commit/d7fbeadeedc7aa27fe24aa6cfb0f7de18366c807))
* **data:** cleans up dir in unmount ([fb8597e](https://github.com/nstrumenta/nstrumenta/commit/fb8597e74f296d27df65ebfc01adad6fe9af6665))

### [3.0.46](https://github.com/nstrumenta/nstrumenta/compare/v3.0.45...v3.0.46) (2023-06-14)


### Features

* **module:** adds cloud run ([#169](https://github.com/nstrumenta/nstrumenta/issues/169)) ([ebe0d84](https://github.com/nstrumenta/nstrumenta/commit/ebe0d84b92cc4612ed4d932342b06e8db199f820))

### [3.0.45](https://github.com/nstrumenta/nstrumenta/compare/v3.0.44...v3.0.45) (2023-05-17)


### Features

* **upload:** adds overwrite to client method ([007a061](https://github.com/nstrumenta/nstrumenta/commit/007a061510c9de1c973a6817ee380da9b41706e5))

### [3.0.44](https://github.com/nstrumenta/nstrumenta/compare/v3.0.43...v3.0.44) (2023-05-16)


### Features

* **client:** adds getDownloadUrl ; filter in query ([b816f9c](https://github.com/nstrumenta/nstrumenta/commit/b816f9cca58c47ebc51b168d49ba69dcd196730c))

### [3.0.43](https://github.com/nstrumenta/nstrumenta/compare/v3.0.42...v3.0.43) (2023-04-17)


### Features

* **storage:** makes storage available without agent required ([748c3e2](https://github.com/nstrumenta/nstrumenta/commit/748c3e22be2e38b52d356285616bdae66df7f236))

### [3.0.42](https://github.com/nstrumenta/nstrumenta/compare/v3.0.41...v3.0.42) (2023-03-22)


### Bug Fixes

* **video:** uses nstDir for video recordings ([86e0c5d](https://github.com/nstrumenta/nstrumenta/commit/86e0c5dccac2f9376b281d1f6bfa3c7cfcdbea40))

### [3.0.41](https://github.com/nstrumenta/nstrumenta/compare/v3.0.40...v3.0.41) (2023-03-22)


### Features

* **webrtc:** adds recording of webrtc ([#168](https://github.com/nstrumenta/nstrumenta/issues/168)) ([a42760b](https://github.com/nstrumenta/nstrumenta/commit/a42760b720371d15e31abcaf29e5244e23de2ad3))


### Bug Fixes

* **ffmpeg:** skipLibCheck to avoid issue with ffmpeg import ([a7f90c2](https://github.com/nstrumenta/nstrumenta/commit/a7f90c26e81c7089c5370ea41fd7dc7c9bb16b46))

### [3.0.40](https://github.com/nstrumenta/nstrumenta/compare/v3.0.39...v3.0.40) (2023-02-28)


### Features

* **webrtc:** removes throw from getSFU ([7a6baee](https://github.com/nstrumenta/nstrumenta/commit/7a6baeeae44e762e8e2a80e9529c91838fec72fc))

### [3.0.39](https://github.com/nstrumenta/nstrumenta/compare/v3.0.38...v3.0.39) (2023-02-26)


### Features

* **webrtc:** removes roomName ; NstrumentaClientEvents ([#166](https://github.com/nstrumenta/nstrumenta/issues/166)) ([8901c20](https://github.com/nstrumenta/nstrumenta/commit/8901c20f75ec46b99247fe6ec4c155cc62f9a031))

### [3.0.38](https://github.com/nstrumenta/nstrumenta/compare/v3.0.37...v3.0.38) (2023-02-21)


### Features

* **webrtc:** uses nstrumenta stun for ice ([#165](https://github.com/nstrumenta/nstrumenta/issues/165)) ([be4c335](https://github.com/nstrumenta/nstrumenta/commit/be4c335ee2612165e7976918e72446fd051d2523))

### [3.0.37](https://github.com/nstrumenta/nstrumenta/compare/v3.0.36...v3.0.37) (2023-02-05)


### Features

* **module:** reduces duplication in module.json ([#164](https://github.com/nstrumenta/nstrumenta/issues/164)) ([43cb055](https://github.com/nstrumenta/nstrumenta/commit/43cb055c4e8fcd4a56b9b0b3c95fdb0118def6d8))

### [3.0.36](https://github.com/nstrumenta/nstrumenta/compare/v3.0.35...v3.0.36) (2023-01-27)


### Features

* **webRTC:** removes mixer and associated native deps ([#163](https://github.com/nstrumenta/nstrumenta/issues/163)) ([08a1a61](https://github.com/nstrumenta/nstrumenta/commit/08a1a61dc2f3565df2cbdf9b13cb75929c2b95b2))

### [3.0.35](https://github.com/nstrumenta/nstrumenta/compare/v3.0.34...v3.0.35) (2023-01-27)


### Features

* **WebRTC:** adds webrtc support to server and browser client  ([#146](https://github.com/nstrumenta/nstrumenta/issues/146)) ([d154614](https://github.com/nstrumenta/nstrumenta/commit/d154614799be4be84b3f22d6b1b24b3bd2e5a10f))

### [3.0.34](https://github.com/nstrumenta/nstrumenta/compare/v3.0.33...v3.0.34) (2023-01-03)


### Bug Fixes

* **server:** fixes broken import ([#162](https://github.com/nstrumenta/nstrumenta/issues/162)) ([5ab8c70](https://github.com/nstrumenta/nstrumenta/commit/5ab8c700eb7b6a8c27a35de6f3cf456cdad41434))

### [3.0.33](https://github.com/nstrumenta/nstrumenta/compare/v3.0.32...v3.0.33) (2023-01-03)


### Bug Fixes

* **browser-client:** guards against process not defined ([#161](https://github.com/nstrumenta/nstrumenta/issues/161)) ([ad07b06](https://github.com/nstrumenta/nstrumenta/commit/ad07b06d6caf5a6ecf085d1f8a1ef66073ef64f6))

### [3.0.32](https://github.com/nstrumenta/nstrumenta/compare/v3.0.31...v3.0.32) (2023-01-02)


### Features

* **rpc:** adds ping and subscribe RPC calls ([#159](https://github.com/nstrumenta/nstrumenta/issues/159)) ([540713b](https://github.com/nstrumenta/nstrumenta/commit/540713be0413000741751e3095abc918043c3fa6))

### [3.0.31](https://github.com/nstrumenta/nstrumenta/compare/v3.0.30...v3.0.31) (2023-01-02)


### Features

* **clients:** implements shared code in shared/lib ([#160](https://github.com/nstrumenta/nstrumenta/issues/160)) ([17ea3d5](https://github.com/nstrumenta/nstrumenta/commit/17ea3d59e71675e22b9f0e40914d38f02c5cfa85))
* **debug:** plumbs debug option to agent start ([#158](https://github.com/nstrumenta/nstrumenta/issues/158)) ([41e5488](https://github.com/nstrumenta/nstrumenta/commit/41e5488ad32a712e894cc39447f9292680804100))

### [3.0.30](https://github.com/nstrumenta/nstrumenta/compare/v3.0.29...v3.0.30) (2022-12-08)


### Features

* **client:** clears reconnect timeout on shutdown ([60c6daf](https://github.com/nstrumenta/nstrumenta/commit/60c6daf52c0b0677edbd5ec1f36dcf5e761a6739))

### [3.0.29](https://github.com/nstrumenta/nstrumenta/compare/v3.0.28...v3.0.29) (2022-12-04)


### Features

* run module by version ([#155](https://github.com/nstrumenta/nstrumenta/issues/155)) ([2546a0e](https://github.com/nstrumenta/nstrumenta/commit/2546a0ed55f27f9d685c8383da74874b4e28005d))

### [3.0.28](https://github.com/nstrumenta/nstrumenta/compare/v3.0.27...v3.0.28) (2022-11-22)


### Features

* **auth:** adds key argument to auth add ([#156](https://github.com/nstrumenta/nstrumenta/issues/156)) ([ccb80b8](https://github.com/nstrumenta/nstrumenta/commit/ccb80b89b69eba51f1ffbd26c956e0c8c37e52b2))
* **cli:** allow id in data query ([#154](https://github.com/nstrumenta/nstrumenta/issues/154)) ([ce65ad3](https://github.com/nstrumenta/nstrumenta/commit/ce65ad32da449cc85dc2aea80db7ec24e81ece08))

### [3.0.27](https://github.com/nstrumenta/nstrumenta/compare/v3.0.25...v3.0.27) (2022-10-28)


### Features

* **client:nodejs:** adds query method ([#152](https://github.com/nstrumenta/nstrumenta/issues/152)) ([63b410f](https://github.com/nstrumenta/nstrumenta/commit/63b410f68ffe8e7fd51e549269670d16c4a23a40))
* **client:** adds browser client query method ([#153](https://github.com/nstrumenta/nstrumenta/issues/153)) ([7c82778](https://github.com/nstrumenta/nstrumenta/commit/7c827781b491794992c6f34415c0faecea16a571))

### [3.0.26](https://github.com/nstrumenta/nstrumenta/compare/v3.0.25...v3.0.26) (2022-10-17)

### [3.0.25](https://github.com/nstrumenta/nstrumenta/compare/v3.0.24...v3.0.25) (2022-09-28)


### Features

* **client:** updates browserclient.storage.upload method: uses parameters object ([#145](https://github.com/nstrumenta/nstrumenta/issues/145)) ([0fd7499](https://github.com/nstrumenta/nstrumenta/commit/0fd74995d6d93890c628c0f4f402e28909f445aa))

### [3.0.24](https://github.com/nstrumenta/nstrumenta/compare/v3.0.23...v3.0.24) (2022-09-14)


### Features

* **cli:** adds metadata to query and get data commands ([#142](https://github.com/nstrumenta/nstrumenta/issues/142)) ([d509585](https://github.com/nstrumenta/nstrumenta/commit/d509585f96b770c06b7c5f688d61680a8cc46bb1))
* **cli:** adds overwrite option to data upload ([#143](https://github.com/nstrumenta/nstrumenta/issues/143)) ([cc2a4fe](https://github.com/nstrumenta/nstrumenta/commit/cc2a4fef4970e3a772d7f231baf3e788dc176059))
* **client:browser:** enables browserclient.storage.download method ([#144](https://github.com/nstrumenta/nstrumenta/issues/144)) ([78d96f1](https://github.com/nstrumenta/nstrumenta/commit/78d96f17f7c5711e2fa28d9c823833ad3479d775))

### [3.0.23](https://github.com/nstrumenta/nstrumenta/compare/v3.0.22...v3.0.23) (2022-09-05)


### Features

* **client:node:** connect returns a promise once client is verified, not just 'open' event on the websocket ([#140](https://github.com/nstrumenta/nstrumenta/issues/140)) ([66fbcf3](https://github.com/nstrumenta/nstrumenta/commit/66fbcf3e679b352cc9b8c48abea3fddf7bdd4dc3))
* **cli:** module:list uses metadata.dataId before id to list modules by, for consistency with some existing modules ([#139](https://github.com/nstrumenta/nstrumenta/issues/139)) ([29958c2](https://github.com/nstrumenta/nstrumenta/commit/29958c2e4eff36b066266577454749e5a72579c4))

### [3.0.22](https://github.com/nstrumenta/nstrumenta/compare/v3.0.21...v3.0.22) (2022-08-24)


### Bug Fixes

* **nodejs:** fixes circular imports in nodejs client ([#134](https://github.com/nstrumenta/nstrumenta/issues/134)) ([eb01edc](https://github.com/nstrumenta/nstrumenta/commit/eb01edc564133809ccc094be4169bd69a1a239cf))

### [3.0.21](https://github.com/nstrumenta/nstrumenta/compare/v3.0.19...v3.0.21) (2022-08-11)


### Features

* **clients:** upload ([#132](https://github.com/nstrumenta/nstrumenta/issues/132)) ([ac475ac](https://github.com/nstrumenta/nstrumenta/commit/ac475acc1778768ed4fabf947e4d20810a7a8fcc))


### Bug Fixes

* **client:node:** Prioritize explicit apiKey if passed to connect method ([#130](https://github.com/nstrumenta/nstrumenta/issues/130)) ([0b643e0](https://github.com/nstrumenta/nstrumenta/commit/0b643e01890f3cef53807a56c1c7a759db824800))
* **client:upload:** strip absolute path from filename ([#133](https://github.com/nstrumenta/nstrumenta/issues/133)) ([43da2d6](https://github.com/nstrumenta/nstrumenta/commit/43da2d6ea5ee9849fdd9d072d986356625305a67))

### [3.0.20](https://github.com/nstrumenta/nstrumenta/compare/v3.0.19...v3.0.20) (2022-07-28)


### Bug Fixes

* **client:node:** Prioritize explicit apiKey if passed to connect method ([#130](https://github.com/nstrumenta/nstrumenta/issues/130)) ([0b643e0](https://github.com/nstrumenta/nstrumenta/commit/0b643e01890f3cef53807a56c1c7a759db824800))

### [3.0.19](https://github.com/nstrumenta/nstrumenta/compare/v3.0.18...v3.0.19) (2022-07-25)


### Features

* **browser-client:** adds client apiKey localStorage ([#129](https://github.com/nstrumenta/nstrumenta/issues/129)) ([9a78eb0](https://github.com/nstrumenta/nstrumenta/commit/9a78eb0f6e79e5b9ffa3f89a6f4089eecc32af83))
* **uploads:** add metadata to call to getUploadDataUrl  ([#128](https://github.com/nstrumenta/nstrumenta/issues/128)) ([6ad3e3a](https://github.com/nstrumenta/nstrumenta/commit/6ad3e3a4b8c0b49393165495c388673ba29fe1a7))


### Bug Fixes

* **deps:** npm audit fix ([ca523dd](https://github.com/nstrumenta/nstrumenta/commit/ca523dd584b43b0f48772975fd60e81aef29d2db))
* **deps:** npm audit fix in agent-admin-page ([7f18a96](https://github.com/nstrumenta/nstrumenta/commit/7f18a96013a415321664a1bd18a6ade888a5e7a5))

### [3.0.18](https://github.com/nstrumenta/nstrumenta/compare/v3.0.17...v3.0.18) (2022-07-15)


### Features

* **cli:** adds dataId option to data>upload ([#123](https://github.com/nstrumenta/nstrumenta/issues/123)) ([6ee120b](https://github.com/nstrumenta/nstrumenta/commit/6ee120bfb90afe1b8bc6e6b02f61743649952e8a))


### Bug Fixes

* **client:browser:** removes unecessary call to node:url in unused me… ([#126](https://github.com/nstrumenta/nstrumenta/issues/126)) ([1725c67](https://github.com/nstrumenta/nstrumenta/commit/1725c671995ec4c4ecd2f316061683b94ce58dc0))
* **cli:** get method now strips a leading 'projects/PROJECT_ID' from the download url on query ([#125](https://github.com/nstrumenta/nstrumenta/issues/125)) ([91763a5](https://github.com/nstrumenta/nstrumenta/commit/91763a5b5275fd39021340179779d91038b38b34))
* **imports:** fixes client imports ([0e90d70](https://github.com/nstrumenta/nstrumenta/commit/0e90d709159787c4cf0cd0bdc7448983ec193dcf))

### [3.0.17](https://github.com/nstrumenta/nstrumenta/compare/v3.0.15...v3.0.17) (2022-07-07)


### Features

* **cli:** flattens data upload metadata to filenames only under dataId ([#119](https://github.com/nstrumenta/nstrumenta/issues/119)) ([fe29f7f](https://github.com/nstrumenta/nstrumenta/commit/fe29f7f4cf9aa2f63574da2dccb252562fb06f84))
* **cli:** uses new flatter structure for data in data > get  ([#120](https://github.com/nstrumenta/nstrumenta/issues/120)) ([39a434f](https://github.com/nstrumenta/nstrumenta/commit/39a434fbffcd3eca62e9a563d46497206586a0ec))

### [3.0.16](https://github.com/nstrumenta/nstrumenta/compare/v3.0.15...v3.0.16) (2022-07-04)


### Features

* **cli:** flattens data upload metadata to filenames only under dataId ([#119](https://github.com/nstrumenta/nstrumenta/issues/119)) ([fe29f7f](https://github.com/nstrumenta/nstrumenta/commit/fe29f7f4cf9aa2f63574da2dccb252562fb06f84))

### [3.0.15](https://github.com/nstrumenta/nstrumenta/compare/v3.0.14...v3.0.15) (2022-06-29)


### Features

* **cli:** adds data > query ([#118](https://github.com/nstrumenta/nstrumenta/issues/118)) ([aea176d](https://github.com/nstrumenta/nstrumenta/commit/aea176dafe4b7bfa97c13c27f28b97af4050c976))
* **cli:** adds tags option to data upload command ([a83325b](https://github.com/nstrumenta/nstrumenta/commit/a83325b7b996e1bfd0769f6f2ccf2829653d225b))
* **client-split:** Uses resolveApiKey in node client ([#114](https://github.com/nstrumenta/nstrumenta/issues/114)) ([81f3dad](https://github.com/nstrumenta/nstrumenta/commit/81f3dad3cf99e69ba1cad30fbde283e26798451b))
* **cli:** updates data upload to set metadata on dataId bucket to facilitate filtering ([443bf45](https://github.com/nstrumenta/nstrumenta/commit/443bf45cc6440a47a96d6e1f01d0192ab2710c4a))
* **cli:** upload file to project data ([#116](https://github.com/nstrumenta/nstrumenta/issues/116)) ([f1176ef](https://github.com/nstrumenta/nstrumenta/commit/f1176ef6eda7986544f1570753b42f5cca53b71a))

### [3.0.14](https://github.com/nstrumenta/nstrumenta/compare/v3.0.13...v3.0.14) (2022-06-13)


### Features

* **client/server:** sends client the assigned clientId on very token ([#115](https://github.com/nstrumenta/nstrumenta/issues/115)) ([02d1083](https://github.com/nstrumenta/nstrumenta/commit/02d1083b18f75bd068416abcb2a43930570a56e2))

### [3.0.13](https://github.com/nstrumenta/nstrumenta/compare/v3.0.11...v3.0.13) (2022-06-06)


### Features

* **server:** adds agent log uploads to storage on interval ([#112](https://github.com/nstrumenta/nstrumenta/issues/112)) ([ccd90ea](https://github.com/nstrumenta/nstrumenta/commit/ccd90ea4637d34d2c87b5b42cda2d914bd3e6b8e))


### Bug Fixes

* **server:** removes log on every message ([#113](https://github.com/nstrumenta/nstrumenta/issues/113)) ([8d42fd9](https://github.com/nstrumenta/nstrumenta/commit/8d42fd96b9437c5091f69936f669f59f8f8770c5))

### [3.0.12](https://github.com/nstrumenta/nstrumenta/compare/v3.0.11...v3.0.12) (2022-06-04)


### Bug Fixes

* **server:** removes log on every message ([#113](https://github.com/nstrumenta/nstrumenta/issues/113)) ([8d42fd9](https://github.com/nstrumenta/nstrumenta/commit/8d42fd96b9437c5091f69936f669f59f8f8770c5))

### [3.0.11](https://github.com/nstrumenta/nstrumenta/compare/v3.0.10...v3.0.11) (2022-06-02)


### Features

* **cli:** returns entire body of listStorageObjects response, including id, which is now the file path relative to the project, and metadata ([#110](https://github.com/nstrumenta/nstrumenta/issues/110)) ([4a1c5ae](https://github.com/nstrumenta/nstrumenta/commit/4a1c5aed7a9ce15809d4bfd0bd32dcb4279c30bf))

### [3.0.10](https://github.com/nstrumenta/nstrumenta/compare/v3.0.9...v3.0.10) (2022-06-01)


### Features

* **cli:** adds module list command ([1fd291c](https://github.com/nstrumenta/nstrumenta/commit/1fd291c7f989abb2ea405a3d35d6bf5d9b96a9a8))
* **client:** adds storage service to browser and node clients for re… ([#107](https://github.com/nstrumenta/nstrumenta/issues/107)) ([f66616d](https://github.com/nstrumenta/nstrumenta/commit/f66616db89a4d51191f4bd4e495d539eaf42ea83))

### [3.0.9](https://github.com/nstrumenta/nstrumenta/compare/v3.0.8...v3.0.9) (2022-05-17)


### Features

* **admin-utils:** adds (hidden) call to generic admin-utils api function ([#104](https://github.com/nstrumenta/nstrumenta/issues/104)) ([dcee053](https://github.com/nstrumenta/nstrumenta/commit/dcee053eae85b4b648cc6ca95a27e593cd9fac4a))

### [3.0.8](https://github.com/nstrumenta/nstrumenta/compare/v3.0.7...v3.0.8) (2022-05-08)


### Bug Fixes

* **datalogs:** changes upload logs to getUploadDataUrl, with updated … ([#101](https://github.com/nstrumenta/nstrumenta/issues/101)) ([f525183](https://github.com/nstrumenta/nstrumenta/commit/f52518374aaca918dac5471979f018a6b3752a86)), closes [#102](https://github.com/nstrumenta/nstrumenta/issues/102)

### [3.0.7](https://github.com/nstrumenta/nstrumenta/compare/v3.0.6...v3.0.7) (2022-05-05)


### Bug Fixes

* **clients:** fixes firing "open" event on ws connection ([#100](https://github.com/nstrumenta/nstrumenta/issues/100)) ([2c8dad4](https://github.com/nstrumenta/nstrumenta/commit/2c8dad4715092a3914d9ca3e13b49813fc966c8b))

### [3.0.6](https://github.com/nstrumenta/nstrumenta/compare/v3.0.5...v3.0.6) (2022-05-01)


### Bug Fixes

* **browser-client:** fixes verify ; creates ws after getToken ([#99](https://github.com/nstrumenta/nstrumenta/issues/99)) ([ad934e8](https://github.com/nstrumenta/nstrumenta/commit/ad934e8bfd89d5886095e64f3eaf906122a49f79))

### [3.0.5](https://github.com/nstrumenta/nstrumenta/compare/v3.0.4...v3.0.5) (2022-04-28)


### Features

* **logs:** agent start/finish log, with file upload to storage on fi… ([#96](https://github.com/nstrumenta/nstrumenta/issues/96)) ([799dad6](https://github.com/nstrumenta/nstrumenta/commit/799dad6bce07e9611a44981291c78489be7eba69))


### Bug Fixes

* **server:** removes log on every bus message ([#98](https://github.com/nstrumenta/nstrumenta/issues/98)) ([3c4e498](https://github.com/nstrumenta/nstrumenta/commit/3c4e498df8ffabec634dd1b378357554984ba48c))

### [3.0.4](https://github.com/nstrumenta/nstrumenta/compare/v3.0.3...v3.0.4) (2022-04-24)


### Bug Fixes

* **nodejs-client:** fixes verify ; adds shutdown to enable cleaner tests ([#93](https://github.com/nstrumenta/nstrumenta/issues/93)) ([63c9326](https://github.com/nstrumenta/nstrumenta/commit/63c93262287469b709731166d2b28e76c5f24adc))

### [3.0.3](https://github.com/nstrumenta/nstrumenta/compare/v3.0.2...v3.0.3) (2022-04-24)


### Bug Fixes

* **nodejs-client:** fixes initial token message in nodejs client ([#92](https://github.com/nstrumenta/nstrumenta/issues/92)) ([f52c0e0](https://github.com/nstrumenta/nstrumenta/commit/f52c0e0083b0a613e66ee0f14eefbe1e16ab256f))

### [3.0.2](https://github.com/nstrumenta/nstrumenta/compare/v3.0.0...v3.0.2) (2022-04-22)


### Features

* **client:** adds verify option to browser client connect (default true), to allow attempting to connect without a needing a token ([1c6c2c3](https://github.com/nstrumenta/nstrumenta/commit/1c6c2c3043ee5f9136ef4e15a8b3edc0ed47696e))
* **client:** adds verify option to client connect (default true), to allow attempting to connect to ws server without token ([61b4ac8](https://github.com/nstrumenta/nstrumenta/commit/61b4ac8819c838aa60e76e9ab382974238cfea30))
* **server:** adds allowUnverifiedConnection option to server connect (default false), to allow clients to connect without a token, therefore not needing internet connectivity ([46ec87a](https://github.com/nstrumenta/nstrumenta/commit/46ec87a1f9a6b9d4ddc4ec88aa8aff34d41c34e0))
* **server:** if allowUnverifiedConnection is true, don't skip the first bus message; update messaging to alert that connection is unverified ([6d3839b](https://github.com/nstrumenta/nstrumenta/commit/6d3839b61dd8ede61bbdec6a56ab4f161d2a0c5f))


### Bug Fixes

* **agent-admin-page:** fixes deps ([b8f9458](https://github.com/nstrumenta/nstrumenta/commit/b8f9458d82e39d5c732997196604acb286fea94c))
* **client:** if verify=false, send a dummy first message to initialize connection ([aec8739](https://github.com/nstrumenta/nstrumenta/commit/aec8739ab0cdc02e8b0e218c49d48a1961f5b8df))
* **modules:** fixes modules prefix ([#88](https://github.com/nstrumenta/nstrumenta/issues/88)) ([3b6bf88](https://github.com/nstrumenta/nstrumenta/commit/3b6bf88fed36c9db79bd98c3f46d298fd16b669d))

### [3.0.1](https://github.com/nstrumenta/nstrumenta/compare/v3.0.0...v3.0.1) (2022-04-15)


### Bug Fixes

* **modules:** fixes modules prefix ([#88](https://github.com/nstrumenta/nstrumenta/issues/88)) ([3b6bf88](https://github.com/nstrumenta/nstrumenta/commit/3b6bf88fed36c9db79bd98c3f46d298fd16b669d))

## [3.0.0](https://github.com/nstrumenta/nstrumenta/compare/v2.1.18...v3.0.0) (2022-04-14)


### Features

* **agent-admin:** uses local version ([c374a19](https://github.com/nstrumenta/nstrumenta/commit/c374a19dcb63ec29d7238872f360563509bdd8be))
* **agentAdminPanel:** removes ejs dependency ([#87](https://github.com/nstrumenta/nstrumenta/issues/87)) ([de0484e](https://github.com/nstrumenta/nstrumenta/commit/de0484ef575f719d2e861bd8012576901eee7d2f))
* **nodejs:** splits nodejs and browser clients ([#84](https://github.com/nstrumenta/nstrumenta/issues/84)) ([653ba3e](https://github.com/nstrumenta/nstrumenta/commit/653ba3ed4bdd3e07333fd3a6b0877e8d8ac6cc31))

### [2.1.18](https://github.com/nstrumenta/nstrumenta/compare/v2.1.17...v2.1.18) (2022-04-12)


### Features

* **agent:** adds tag or agentId prefix to logger ([#83](https://github.com/nstrumenta/nstrumenta/issues/83)) ([406537f](https://github.com/nstrumenta/nstrumenta/commit/406537f06a24c32c6f7baee3480fd2588c871826))

### [2.1.17](https://github.com/nstrumenta/nstrumenta/compare/v2.1.16...v2.1.17) (2022-04-12)


### Features

* **agent:** adds tag=local for dev ([f5fd70c](https://github.com/nstrumenta/nstrumenta/commit/f5fd70c8ca7b6b745bfcb1f87e0a344b05429c1f))
* **auth:** `nst auth add` requires only apiKey; projectId is inferred via api ([#82](https://github.com/nstrumenta/nstrumenta/issues/82)) ([da234e1](https://github.com/nstrumenta/nstrumenta/commit/da234e1cda71e76dfa2299075944bd5bccdbc99a))

### [2.1.16](https://github.com/nstrumenta/nstrumenta/compare/v2.1.15...v2.1.16) (2022-04-11)


### Features

* **agent:** fixes run-module (removes localstream for now) ([#81](https://github.com/nstrumenta/nstrumenta/issues/81)) ([e219795](https://github.com/nstrumenta/nstrumenta/commit/e219795042c4ca395764ec9243743891bffc3c9a))

### [2.1.15](https://github.com/nstrumenta/nstrumenta/compare/v2.1.14...v2.1.15) (2022-04-09)


### Features

* **agent-admin:** displays agent stdout ([1373beb](https://github.com/nstrumenta/nstrumenta/commit/1373beb3af3ab7dfb7764908911fdeeee3b04161))

### [2.1.14](https://github.com/nstrumenta/nstrumenta/compare/v2.1.13...v2.1.14) (2022-04-08)


### Features

* **dockerfile:** adds dockerfile ([40a6203](https://github.com/nstrumenta/nstrumenta/commit/40a6203304bc5db9b6e6ee0d58843f9053f3643c))
* replaces console.log with simple custom logger with stream; logs to stdout by default; server pipes log to log file and backplane, if connected ([#79](https://github.com/nstrumenta/nstrumenta/issues/79)) ([7697d33](https://github.com/nstrumenta/nstrumenta/commit/7697d33269f5a7afb8b435dd22e6b64c16352f65))

### [2.1.13](https://github.com/nstrumenta/nstrumenta/compare/v2.1.12...v2.1.13) (2022-03-28)


### Features

* **keepalive:** adds 30s health pulse to all verified clients ([6093a41](https://github.com/nstrumenta/nstrumenta/commit/6093a41c78f4fd751bd305d7ee3f662b04621112))

### [2.1.12](https://github.com/nstrumenta/nstrumenta/compare/v2.1.11...v2.1.12) (2022-03-24)


### Features

* **agent:** uses .nst folder in current working dir for servers ([#72](https://github.com/nstrumenta/nstrumenta/issues/72)) ([795a322](https://github.com/nstrumenta/nstrumenta/commit/795a322a2875d79e2664eeb399b1eb1d69f99279))

### [2.1.11](https://github.com/nstrumenta/nstrumenta/compare/v2.1.10...v2.1.11) (2022-03-24)


### Features

* **agent run-module:** uses cwd from process ; actionId ([#71](https://github.com/nstrumenta/nstrumenta/issues/71)) ([18e1cf7](https://github.com/nstrumenta/nstrumenta/commit/18e1cf79d9c7e20ff17840c52634e578c4b67550))

### [2.1.10](https://github.com/nstrumenta/nstrumenta/compare/v2.1.9...v2.1.10) (2022-03-17)


### Features

* **agent:** updates run-module to get agent id from tag ([41f3d1d](https://github.com/nstrumenta/nstrumenta/commit/41f3d1d76fddf01a6779ec7c0648c445f19ecd10))
* **server:** add backplane stream to pipe child process stdout to ([41ea6b1](https://github.com/nstrumenta/nstrumenta/commit/41ea6b1d6956edd0a56198a28e0f39f24a1f8ab0))
* **utils:** accepts array of writable streams to pipe asyncSpawn's stdout to ([eebf92e](https://github.com/nstrumenta/nstrumenta/commit/eebf92e03bce7e16f9158432890d27061332eeb7))


### Bug Fixes

* **spawn:** asyncSpawn maintains child.stdout pipe to parent stdout even when passed a stream ([ff7d69b](https://github.com/nstrumenta/nstrumenta/commit/ff7d69bd236b113c6d12cb8053f7a4e8f5bb7ef5))

### [2.1.9](https://github.com/nstrumenta/nstrumenta/compare/v2.1.8...v2.1.9) (2022-03-11)


### Features

* **agent:** tags with host_instance_id if set ([cf06da0](https://github.com/nstrumenta/nstrumenta/commit/cf06da08636bca0b0ea4b8c38e457ab215bb15f9))

### [2.1.8](https://github.com/nstrumenta/nstrumenta/compare/v2.1.7...v2.1.8) (2022-03-11)


### Features

* **agent:** fixes module version compare sort order ([128579a](https://github.com/nstrumenta/nstrumenta/commit/128579a0071f3edb2b1d1ad43edda87a406119d2))

### [2.1.7](https://github.com/nstrumenta/nstrumenta/compare/v2.1.6...v2.1.7) (2022-03-11)


### Features

* **backplane:** separates cli from server ; removes auto copy of sandbox files ([#62](https://github.com/nstrumenta/nstrumenta/issues/62)) ([350d80b](https://github.com/nstrumenta/nstrumenta/commit/350d80b5969bd5c29136d3de9c93e0cadbd37119))

### [2.1.6](https://github.com/nstrumenta/nstrumenta/compare/v2.1.5...v2.1.6) (2022-03-10)


### Features

* **connection:** simplifies error messages for token issues ([#60](https://github.com/nstrumenta/nstrumenta/issues/60)) ([9b0ee99](https://github.com/nstrumenta/nstrumenta/commit/9b0ee9957d1ff243ffab404f76b06636759c9775))

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
