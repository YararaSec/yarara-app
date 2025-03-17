# Use an official Python image as the base
FROM python:3.10

# Install dependencies
RUN apt-get update && \
    apt-get install -y git curl && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 20 for Next.js compatibility
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Install CodeQL
RUN git clone --depth=1 https://github.com/github/codeql.git /opt/codeql && \
    ln -s /opt/codeql/codeql /usr/local/bin/codeql

# Set up working directory
WORKDIR /app

# Clone repositories
RUN git clone https://github.com/Argimirodelpozo/ClarityFuzzer.git && \
    git clone https://github.com/rgermanm/yarara-fe.git

# Install Python dependencies inside a virtual environment
WORKDIR /app/ClarityFuzzer
RUN python -m venv venv && \
    /app/ClarityFuzzer/venv/bin/pip install git+https://github.com/xlittlerag/tree-sitter-clarity@6eb27feb tree_sitter

# Install dependencies for yarara-dashboard-bff
WORKDIR /app/yarara-fe/yarara-dashboard-bff
RUN npm install

# Install dependencies for yarara-dashboard
WORKDIR /app/yarara-fe/yarara-dashboard
RUN npm install
