FROM mcr.microsoft.com/devcontainers/dotnet:8.0

WORKDIR /workspace

# Optional: install kubectl, helm, terraform if you want them inside the container
# RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Copy solution files for restore
COPY ./*.sln ./
COPY ./src ./src

RUN dotnet restore
