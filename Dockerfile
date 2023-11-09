FROM node:20.3-bullseye-slim

# # curl
# RUN apt-get -y update; apt-get install curl wget -y
# RUN apt-get install -y gnupg

# # git
# RUN apt-get install git -y

# #tmux
# RUN  apt-get install -y tmux

# # jq
# RUN apt-get install jq -y

# # fuse (for gcsfuse)
# RUN apt-get install fuse -y


# # install go START https://github.com/docker-library/golang/blob/079c1fa6a2b011b1a81f902da6498d527f311dd5/1.21/bullseye/Dockerfile
# # edit to remove "rm -rf /var/lib/apt/lists/*" 
# # install cgo-related dependencies
# RUN set -eux; \
# 	apt-get update; \
# 	apt-get install -y --no-install-recommends \
# 		g++ \
# 		gcc \
# 		libc6-dev \
# 		make \
# 		pkg-config \
# 	;

# ENV PATH /usr/local/go/bin:$PATH

# ENV GOLANG_VERSION 1.21.3

# RUN set -eux; \
# 	arch="$(dpkg --print-architecture)"; arch="${arch##*-}"; \
# 	url=; \
# 	case "$arch" in \
# 		'amd64') \
# 			url='https://dl.google.com/go/go1.21.3.linux-amd64.tar.gz'; \
# 			sha256='1241381b2843fae5a9707eec1f8fb2ef94d827990582c7c7c32f5bdfbfd420c8'; \
# 			;; \
# 		'armel') \
# 			export GOARCH='arm' GOARM='5' GOOS='linux'; \
# 			;; \
# 		'armhf') \
# 			url='https://dl.google.com/go/go1.21.3.linux-armv6l.tar.gz'; \
# 			sha256='a1ddcaaf0821a12a800884c14cb4268ce1c1f5a0301e9060646f1e15e611c6c7'; \
# 			;; \
# 		'arm64') \
# 			url='https://dl.google.com/go/go1.21.3.linux-arm64.tar.gz'; \
# 			sha256='fc90fa48ae97ba6368eecb914343590bbb61b388089510d0c56c2dde52987ef3'; \
# 			;; \
# 		'i386') \
# 			url='https://dl.google.com/go/go1.21.3.linux-386.tar.gz'; \
# 			sha256='fb209fd070db500a84291c5a95251cceeb1723e8f6142de9baca5af70a927c0e'; \
# 			;; \
# 		'mips64el') \
# 			url='https://dl.google.com/go/go1.21.3.linux-mips64le.tar.gz'; \
# 			sha256='a569ffbc88b4e14cf2682f65cec950460665e4392b0d78b8868b4718c979bda8'; \
# 			;; \
# 		'ppc64el') \
# 			url='https://dl.google.com/go/go1.21.3.linux-ppc64le.tar.gz'; \
# 			sha256='3b0e10a3704f164a6e85e0377728ec5fd21524fabe4c925610e34076586d5826'; \
# 			;; \
# 		'riscv64') \
# 			url='https://dl.google.com/go/go1.21.3.linux-riscv64.tar.gz'; \
# 			sha256='67d14d3e513e505d1ec3ea34b55641c6c29556603c7899af94045c170c1c0f94'; \
# 			;; \
# 		's390x') \
# 			url='https://dl.google.com/go/go1.21.3.linux-s390x.tar.gz'; \
# 			sha256='4c78e2e6f4c684a3d5a9bdc97202729053f44eb7be188206f0627ef3e18716b6'; \
# 			;; \
# 		*) echo >&2 "error: unsupported architecture '$arch' (likely packaging update needed)"; exit 1 ;; \
# 	esac; \
# 	build=; \
# 	if [ -z "$url" ]; then \
# # https://github.com/golang/go/issues/38536#issuecomment-616897960
# 		build=1; \
# 		url='https://dl.google.com/go/go1.21.3.src.tar.gz'; \
# 		sha256='186f2b6f8c8b704e696821b09ab2041a5c1ee13dcbc3156a13adcf75931ee488'; \
# 		echo >&2; \
# 		echo >&2 "warning: current architecture ($arch) does not have a compatible Go binary release; will be building from source"; \
# 		echo >&2; \
# 	fi; \
# 	\
# 	wget -O go.tgz.asc "$url.asc"; \
# 	wget -O go.tgz "$url" --progress=dot:giga; \
# 	echo "$sha256 *go.tgz" | sha256sum -c -; \
# 	\
# # https://github.com/golang/go/issues/14739#issuecomment-324767697
# 	GNUPGHOME="$(mktemp -d)"; export GNUPGHOME; \
# # https://www.google.com/linuxrepositories/
# 	gpg --batch --keyserver keyserver.ubuntu.com --recv-keys 'EB4C 1BFD 4F04 2F6D DDCC  EC91 7721 F63B D38B 4796'; \
# # let's also fetch the specific subkey of that key explicitly that we expect "go.tgz.asc" to be signed by, just to make sure we definitely have it
# 	gpg --batch --keyserver keyserver.ubuntu.com --recv-keys '2F52 8D36 D67B 69ED F998  D857 78BD 6547 3CB3 BD13'; \
# 	gpg --batch --verify go.tgz.asc go.tgz; \
# 	gpgconf --kill all; \
# 	rm -rf "$GNUPGHOME" go.tgz.asc; \
# 	\
# 	tar -C /usr/local -xzf go.tgz; \
# 	rm go.tgz; \
# 	\
# 	if [ -n "$build" ]; then \
# 		savedAptMark="$(apt-mark showmanual)"; \
# # add backports for newer go version for bootstrap build: https://github.com/golang/go/issues/44505
# 		( \
# 			. /etc/os-release; \
# 			echo "deb https://deb.debian.org/debian $VERSION_CODENAME-backports main" > /etc/apt/sources.list.d/backports.list; \
# 			\
# 			apt-get update; \
# 			apt-get install -y --no-install-recommends -t "$VERSION_CODENAME-backports" golang-go; \
# 		); \
# 		\
# 		export GOCACHE='/tmp/gocache'; \
# 		\
# 		( \
# 			cd /usr/local/go/src; \
# # set GOROOT_BOOTSTRAP + GOHOST* such that we can build Go successfully
# 			export GOROOT_BOOTSTRAP="$(go env GOROOT)" GOHOSTOS="$GOOS" GOHOSTARCH="$GOARCH"; \
# 			./make.bash; \
# 		); \
# 		\
# 		apt-mark auto '.*' > /dev/null; \
# 		apt-mark manual $savedAptMark > /dev/null; \
# 		apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false; \
# 		rm -rf /var/lib/apt/lists/*; \
# 		\
# # remove a few intermediate / bootstrapping files the official binary release tarballs do not contain
# 		rm -rf \
# 			/usr/local/go/pkg/*/cmd \
# 			/usr/local/go/pkg/bootstrap \
# 			/usr/local/go/pkg/obj \
# 			/usr/local/go/pkg/tool/*/api \
# 			/usr/local/go/pkg/tool/*/go_bootstrap \
# 			/usr/local/go/src/cmd/dist/dist \
# 			"$GOCACHE" \
# 		; \
# 	fi; \
# 	\
# 	go version

# # don't auto-upgrade the gotoolchain
# # https://github.com/docker-library/golang/issues/472
# ENV GOTOOLCHAIN=local

# ENV GOPATH /go
# ENV PATH $GOPATH/bin:$PATH
# RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 1777 "$GOPATH"


# # install go END 

# # python
# RUN apt-get install python3 python3-pip -y

# # Add gcloud to PATH
# ENV PATH=/usr/local/src/google-cloud-sdk/bin:$PATH

# # https://cloud.google.com/sdk/docs/install#linux for latest version and sha
# # Install gcloud + components
# # NOTE 1: the __pycache__ cleanup is done to reduce image size (if needed, they will be regenerated at runtime)
# # NOTE 2: the .backup directory is also removed to significantly reduce image size
# RUN set -eux; \
#     GCLOUD_VERSION=451.0.1; \
#     dpkgArch="$(dpkg --print-architecture)"; \
#     	dir=/usr/local/src; \
#     	url=; \
#     	case "${dpkgArch##*-}" in \
#     		'amd64') \
#     			url="https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-$GCLOUD_VERSION-linux-x86_64.tar.gz"; \
#     			sha256='8446f6d837168d7d66dd192c2221c1081c16a2b93cb54642a6bfb7078cd3dd53'; \
#     			;; \
#     		'arm64') \
#     			url="https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-$GCLOUD_VERSION-linux-arm.tar.gz"; \
#     			sha256='e472eec1f755b65b4805bfe465e54a37cc3b78d261b81fa9c92fe268da56d72e'; \
#     			;; \
#     		*) echo >&2 "error: unsupported architecture '$dpkgArch' (likely packaging update needed)"; exit 1 ;; \
#     	esac; \
#         curl --location --output gcloud.tar.gz "$url"; \
#         echo "$sha256  gcloud.tar.gz" | sha256sum -cw -; \
#         mkdir -p $dir; \
#         tar -zx -C $dir -f gcloud.tar.gz; \
#         $dir/google-cloud-sdk/install.sh --quiet; \
#         gcloud components install --quiet kubectl; \
#         gcloud auth configure-docker gcr.io,us-central1-docker.pkg.dev --quiet; \
#         rm -f gcloud.tar.gz; \
#         rm -rf $(find $dir/google-cloud-sdk/ -name __pycache__ -type d); \
#         rm -rf $dir/google-cloud-sdk/.install/.backup


# #install terraform
# RUN git clone --branch v1.6.2 --depth 1 https://github.com/hashicorp/terraform.git ; \
# 	cd terraform ; \
# 	go install ; \
# 	cd ~

# #install gcsfuse
# RUN GCSFUSE_REPO=gcsfuse-bullseye; \
# 	echo "deb https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list; \
# 	curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

# RUN	apt-get -y update
# RUN apt-get install gcsfuse -y

# # mcap cli
# RUN wget https://github.com/foxglove/mcap/releases/download/releases%2Fmcap-cli%2Fv0.0.34/mcap-linux-amd64 -O /usr/local/bin/mcap
# RUN chmod +x /usr/local/bin/mcap

# #install docker
# RUN install -m 0755 -d /etc/apt/keyrings
# RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# RUN chmod a+r /etc/apt/keyrings/docker.gpg
# RUN echo \
#     "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
#     "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
#     tee /etc/apt/sources.list.d/docker.list > /dev/null
# RUN apt-get update
# RUN apt-get install -y docker-ce=5:24.0.0-1~debian.11~bullseye  docker-ce-cli=5:24.0.0-1~debian.11~bullseye containerd.io docker-buildx-plugin docker-compose-plugin
