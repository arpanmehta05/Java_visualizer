package visualizer;

import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Main {

    public static void main(String[] args) {
        if (args.length < 1) {
            emit("{\"type\":\"error\",\"message\":\"No source file provided\"}");
            System.exit(1);
        }

        String sourcePath = args[0];
        Path path = Paths.get(sourcePath);
        String fileName = path.getFileName().toString();
        String className = fileName.replace(".java", "");

        Path sandboxRoot = path.getParent();
        if (sandboxRoot == null) sandboxRoot = Paths.get(".");

        List<String> javaFiles = new ArrayList<>();
        try {
            javaFiles = Files.walk(sandboxRoot)
                    .filter(p -> p.toString().endsWith(".java"))
                    .map(Path::toString)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            javaFiles.add(sourcePath);
        }

        String classDir = sandboxRoot.toString();

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            emit("{\"type\":\"error\",\"message\":\"No Java compiler available\"}");
            System.exit(1);
        }

        List<String> compilerArgs = new ArrayList<>();
        compilerArgs.add("-g");
        compilerArgs.add("-d");
        compilerArgs.add(classDir);
        compilerArgs.add("-sourcepath");
        compilerArgs.add(classDir);
        compilerArgs.addAll(javaFiles);

        ByteArrayOutputStream errStream = new ByteArrayOutputStream();
        int result = compiler.run(
                null, null, new PrintStream(errStream),
                compilerArgs.toArray(new String[0])
        );

        if (result != 0) {
            String error = escapeJson(errStream.toString());
            emit("{\"type\":\"compile_error\",\"message\":\"" + error + "\"}");
            System.exit(1);
        }

        emit("{\"type\":\"start\",\"className\":\"" + className + "\",\"files\":" + javaFiles.size() + "}");

        try {
            JDIDebugger debugger = new JDIDebugger(className, classDir);
            debugger.start();
        } catch (Exception e) {
            emit("{\"type\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
        }

        emit("{\"type\":\"end\"}");
    }

    private static void emit(String json) {
        System.out.println(json);
        System.out.flush();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
