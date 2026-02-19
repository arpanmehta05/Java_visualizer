const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const os = require("os");

class DockerManager {
  constructor() {
    this.docker = new Docker();
    this.IMAGE_NAME = process.env.DOCKER_IMAGE || "java-visualizer-engine";
    this.TIMEOUT_MS = 15000;
  }

  async execute(code, onData) {
    const runId =
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const tempDir = path.join(os.tmpdir(), `jv-${runId}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const className = this.extractClassName(code);
    const fileName = `${className}.java`;
    fs.writeFileSync(path.join(tempDir, fileName), code, "utf8");

    let container;
    let timeout;

    try {
      container = await this.docker.createContainer({
        Image: this.IMAGE_NAME,
        Cmd: [`/sandbox/${fileName}`],
        Tty: false,
        AttachStdin: false,
        OpenStdin: false,
        HostConfig: {
          Binds: [`${tempDir}:/sandbox`],
          Memory: 256 * 1024 * 1024,
          MemorySwap: 256 * 1024 * 1024,
          CpuPeriod: 100000,
          CpuQuota: 80000, // 80% CPU (was 50%)
          NetworkMode: "none",
          PidsLimit: 64,
          SecurityOpt: ["no-new-privileges"],
        },
        NetworkDisabled: true,
        StopTimeout: 2,
      });

      await container.start();

      timeout = setTimeout(async () => {
        try {
          await container.kill();
        } catch (_) {}
        onData({
          type: "error",
          message: "Execution timed out (15s limit)",
        });
      }, this.TIMEOUT_MS);

      // Attach to running container for real-time streaming (faster than logs)
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      await new Promise((resolve, reject) => {
        let buffer = "";

        // Demux stdout/stderr from the raw Docker stream
        const passThrough = new (require("stream").PassThrough)();
        container.modem.demuxStream(stream, passThrough, passThrough);

        passThrough.on("data", (chunk) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const raw of lines) {
            const cleaned = raw.trim();
            if (!cleaned) continue;
            try {
              const parsed = JSON.parse(cleaned);
              onData(parsed);
            } catch (_) {}
          }
        });

        passThrough.on("end", () => {
          if (buffer.trim()) {
            try {
              onData(JSON.parse(buffer.trim()));
            } catch (_) {}
          }
          resolve();
        });

        passThrough.on("error", reject);
        stream.on("error", reject);
      });

      clearTimeout(timeout);

      try {
        await container.wait();
      } catch (_) {}
    } finally {
      clearTimeout(timeout);
      try {
        await container.remove({ force: true });
      } catch (_) {}
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_) {}
    }
  }

  extractClassName(code) {
    const match = code.match(/public\s+class\s+(\w+)/);
    return match ? match[1] : "UserCode";
  }
}

module.exports = DockerManager;
