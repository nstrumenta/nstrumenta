# Nstrumenta

A client library for Nstrumenta API.

## Installation

```bash
pip install nstrumenta
```


## publishing
Collecting workspace information

To publish your Python package so others can install it with `pip`, follow these steps:

1. **Install Required Tools**:
   Ensure you have 

setuptools, `wheel`, and `twine` installed:
```sh
pip install setuptools wheel twine
```

2. **Build Your Package**:
   Run the following command to create distribution archives:
```sh
python setup.py sdist bdist_wheel
```

3. **Upload Your Package**:
   Use `twine` to upload your package to PyPI:
```sh
twine upload dist/*
```

4. **Verify Installation**:
   After uploading, you can verify the installation by running:
```sh
pip install nstrumenta
```

Make sure you have an account on [PyPI](https://pypi.org/) and have configured your `.pypirc` file with your credentials.