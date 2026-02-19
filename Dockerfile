FROM eclipse-temurin:17-jdk-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/engine

COPY engine/src /app/engine/src

RUN mkdir -p /app/engine/out && \
    javac --add-modules jdk.jdi \
    -d /app/engine/out \
    /app/engine/src/visualizer/*.java

RUN useradd -r -s /bin/false sandbox
USER sandbox

WORKDIR /sandbox

ENTRYPOINT ["java", "--add-modules", "jdk.jdi", \
  "-XX:+TieredCompilation", "-XX:TieredStopAtLevel=1", \
  "-XX:+UseSerialGC", "-Xms32m", "-Xmx128m", \
  "-cp", "/app/engine/out", "visualizer.Main"]
