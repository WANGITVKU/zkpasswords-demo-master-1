FROM node:18

# Cài các tool cần thiết
RUN apt-get update && \
    apt-get install -y curl build-essential git && \
    curl https://sh.rustup.rs -sSf | sh -s -- -y && \
    export PATH="$HOME/.cargo/bin:$PATH" && \
    git clone https://github.com/iden3/circom.git && \
    cd circom && cargo build --release && cp target/release/circom /usr/local/bin/ && \
    npm install -g snarkjs

WORKDIR /app
