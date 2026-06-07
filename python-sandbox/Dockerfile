FROM python:3.12-slim

# Install only required packages — no network tools (curl/wget) intentionally omitted
RUN pip install --no-cache-dir \
    "pandas>=2.2,<3.0" \
    "numpy>=1.26,<3.0" \
    "matplotlib>=3.9,<4.0" \
    "seaborn>=0.13,<1.0"

# Non-root sandbox user
RUN useradd --uid 1000 --no-create-home --shell /sbin/nologin sandbox

WORKDIR /work

COPY runner.py /runner.py

USER sandbox

ENTRYPOINT ["python", "/runner.py"]
