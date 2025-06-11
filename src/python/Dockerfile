FROM nstrumenta/data-job-runner

RUN ln -s /usr/bin/python3 /usr/bin/python

COPY requirements.txt .

RUN pip install --break-system-packages -r requirements.txt

