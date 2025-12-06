CC = emcc
#CFLAGS = -O2 -pedantic -Wall -Wno-format-pedantic -Wno-dollar-in-identifier-extension -Wno-newline-eof -Wno-unknown-attributes
CFLAGS = -pedantic -Werror -Wall -Wno-format-pedantic -Wno-gnu-anonymous-struct -Wno-c99-extensions -Wno-dollar-in-identifier-extension -Wno-newline-eof -Wno-unknown-attributes
SRC = $(wildcard *.c) $(wildcard */*.c) $(wildcard */*/*.c) $(wildcard */*/*/*.c)
OBJS := $(SRC:.c=.bc)

nstrumenta.js: nstrumenta.cpp $(OBJS)
	$(CC) $(CFLAGS) -s WASM=0 --memory-init-file 0 --bind -o nstrumenta.js nstrumenta.cpp  $(OBJS) $(LFLAGS) $(LIBS)

$(OBJS): %.bc:%.c
	$(CC) $(CFLAGS) -c $(INCLUDES) $^ -o $@

clean:
	find -name '*.bc' -delete