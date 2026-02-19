package visualizer;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.event.*;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.StepRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class JDIDebugger {

    private VirtualMachine vm;
    private final String targetClass;
    private final String classPath;
    private int stepCount;
    private static final int MAX_STEPS = 500;
    private final StringBuilder stdoutBuffer;
    private BufferedReader processReader;

    public JDIDebugger(String targetClass, String classPath) {
        this.targetClass = targetClass;
        this.classPath = classPath;
        this.stepCount = 0;
        this.stdoutBuffer = new StringBuilder();
    }

    public void start() throws Exception {
        LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> args = connector.defaultArguments();
        args.get("main").setValue(targetClass);
        args.get("options").setValue("-cp " + classPath);

        vm = connector.launch(args);
        processReader = new BufferedReader(new InputStreamReader(vm.process().getInputStream()));

        ClassPrepareRequest cpr = vm.eventRequestManager().createClassPrepareRequest();
        cpr.addClassFilter(targetClass);
        cpr.enable();

        processEvents();
    }

    private void drainProcessOutput() {
        try {
            while (processReader.ready()) {
                int ch = processReader.read();
                if (ch == -1) break;
                stdoutBuffer.append((char) ch);
            }
        } catch (IOException ignored) {
        }
    }

    private void processEvents() throws Exception {
        EventQueue queue = vm.eventQueue();
        boolean running = true;

        while (running && stepCount <= MAX_STEPS) {
            EventSet eventSet;
            try {
                eventSet = queue.remove(5000);
            } catch (InterruptedException e) {
                break;
            }

            if (eventSet == null) break;

            for (Event event : eventSet) {
                if (event instanceof ClassPrepareEvent) {
                    handleClassPrepare((ClassPrepareEvent) event);
                } else if (event instanceof StepEvent) {
                    StepEvent se = (StepEvent) event;
                    if (se.location().declaringType().name().equals(targetClass)) {
                        handleStep(se);
                    }
                } else if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                    running = false;
                }
            }

            if (running) {
                eventSet.resume();
            }
        }

        drainProcessOutput();
        if (stdoutBuffer.length() > 0) {
            String output = escapeJson(stdoutBuffer.toString());
            System.out.println("{\"type\":\"stdout\",\"output\":\"" + output + "\"}");
            System.out.flush();
        }
    }

    private void handleClassPrepare(ClassPrepareEvent event) {
        ThreadReference thread = event.thread();
        StepRequest sr = vm.eventRequestManager().createStepRequest(
                thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO
        );
        sr.addClassFilter(targetClass);
        sr.enable();
    }

    private void handleStep(StepEvent event) {
        stepCount++;
        if (stepCount > MAX_STEPS) {
            System.out.println("{\"type\":\"error\",\"message\":\"Execution exceeded maximum step limit (" + MAX_STEPS + ")\"}");
            System.out.flush();
            vm.exit(0);
            return;
        }

        drainProcessOutput();
        ThreadReference thread = event.thread();
        Location location = event.location();

        try {
            Map<Long, ObjectReference> heapObjects = new HashMap<>();
            StringBuilder json = new StringBuilder(1024);
            json.append("{\"type\":\"frame\",\"step\":");
            json.append(stepCount);
            json.append(",\"line\":");
            json.append(location.lineNumber());
            json.append(",\"className\":\"");
            json.append(escapeJson(location.declaringType().name()));
            json.append("\",\"methodName\":\"");
            json.append(escapeJson(location.method().name()));
            json.append("\",");

            buildCallStack(json, thread);
            json.append(",");
            buildVariables(json, thread, heapObjects);
            json.append(",");
            buildStatics(json, location, heapObjects);
            json.append(",");
            buildHeap(json, heapObjects);
            json.append(",\"stdout\":\"");
            json.append(escapeJson(stdoutBuffer.toString()));
            json.append("\"}");

            System.out.println(json.toString());
            System.out.flush();
        } catch (Exception ignored) {
        }
    }

    private void buildCallStack(StringBuilder json, ThreadReference thread) throws IncompatibleThreadStateException {
        json.append("\"callStack\":[");
        List<StackFrame> frames = thread.frames();
        boolean first = true;
        for (StackFrame frame : frames) {
            String className = frame.location().declaringType().name();
            if (!className.equals(targetClass)) continue;
            if (!first) json.append(",");
            first = false;
            json.append("{\"className\":\"");
            json.append(escapeJson(className));
            json.append("\",\"methodName\":\"");
            json.append(escapeJson(frame.location().method().name()));
            json.append("\",\"line\":");
            json.append(frame.location().lineNumber());
            json.append(",\"params\":{");
            try {
                List<LocalVariable> vars = frame.visibleVariables();
                boolean firstVar = true;
                for (LocalVariable v : vars) {
                    if (v.isArgument()) {
                        Value val = frame.getValue(v);
                        if (!firstVar) json.append(",");
                        firstVar = false;
                        json.append("\"");
                        json.append(escapeJson(v.name()));
                        json.append("\":\"");
                        json.append(escapeJson(valueToString(val)));
                        json.append("\"");
                    }
                }
            } catch (AbsentInformationException ignored) {
            }
            json.append("}}");
        }
        json.append("]");
    }

    private void buildVariables(StringBuilder json, ThreadReference thread, Map<Long, ObjectReference> heap)
            throws IncompatibleThreadStateException {
        json.append("\"variables\":{");
        StackFrame topFrame = thread.frame(0);
        try {
            List<LocalVariable> vars = topFrame.visibleVariables();
            boolean first = true;
            for (LocalVariable v : vars) {
                Value val = topFrame.getValue(v);
                if (!first) json.append(",");
                first = false;
                json.append("\"");
                json.append(escapeJson(v.name()));
                json.append("\":");
                json.append(serializeValue(val, heap));
            }
        } catch (AbsentInformationException ignored) {
        }
        json.append("}");
    }

    private void buildStatics(StringBuilder json, Location location, Map<Long, ObjectReference> heap) {
        json.append("\"statics\":{");
        ReferenceType type = location.declaringType();
        List<Field> fields = type.visibleFields();
        boolean first = true;
        for (Field f : fields) {
            if (!f.isStatic()) continue;
            Value val = type.getValue(f);
            if (!first) json.append(",");
            first = false;
            json.append("\"");
            json.append(escapeJson(f.name()));
            json.append("\":");
            json.append(serializeValue(val, heap));
        }
        json.append("}");
    }

    private void buildHeap(StringBuilder json, Map<Long, ObjectReference> heap) {
        json.append("\"heap\":{");
        boolean first = true;
        for (Map.Entry<Long, ObjectReference> entry : heap.entrySet()) {
            if (!first) json.append(",");
            first = false;
            json.append("\"ref@").append(entry.getKey()).append("\":");
            ObjectReference obj = entry.getValue();

            if (obj instanceof ArrayReference) {
                ArrayReference arr = (ArrayReference) obj;
                json.append("{\"type\":\"").append(escapeJson(arr.type().name()));
                json.append("\",\"elements\":[");
                List<Value> elements = arr.getValues();
                for (int i = 0; i < elements.size(); i++) {
                    if (i > 0) json.append(",");
                    json.append("\"").append(escapeJson(valueToString(elements.get(i)))).append("\"");
                }
                json.append("]}");
            } else {
                json.append("{\"type\":\"").append(escapeJson(obj.type().name()));
                json.append("\",\"fields\":{");
                ReferenceType refType = obj.referenceType();
                List<Field> fields = refType.visibleFields();
                boolean firstField = true;
                for (Field field : fields) {
                    if (field.isStatic()) continue;
                    Value val = obj.getValue(field);
                    if (!firstField) json.append(",");
                    firstField = false;
                    json.append("\"").append(escapeJson(field.name())).append("\":\"");
                    json.append(escapeJson(valueToString(val))).append("\"");
                }
                json.append("}}");
            }
        }
        json.append("}");
    }

    private String serializeValue(Value value, Map<Long, ObjectReference> heap) {
        if (value == null) return "{\"type\":\"null\",\"value\":\"null\"}";

        if (value instanceof BooleanValue) {
            return "{\"type\":\"boolean\",\"value\":\"" + ((BooleanValue) value).value() + "\"}";
        }
        if (value instanceof ByteValue) {
            return "{\"type\":\"byte\",\"value\":\"" + ((ByteValue) value).value() + "\"}";
        }
        if (value instanceof CharValue) {
            return "{\"type\":\"char\",\"value\":\"'" + ((CharValue) value).value() + "'\"}";
        }
        if (value instanceof ShortValue) {
            return "{\"type\":\"short\",\"value\":\"" + ((ShortValue) value).value() + "\"}";
        }
        if (value instanceof IntegerValue) {
            return "{\"type\":\"int\",\"value\":\"" + ((IntegerValue) value).value() + "\"}";
        }
        if (value instanceof LongValue) {
            return "{\"type\":\"long\",\"value\":\"" + ((LongValue) value).value() + "\"}";
        }
        if (value instanceof FloatValue) {
            return "{\"type\":\"float\",\"value\":\"" + ((FloatValue) value).value() + "\"}";
        }
        if (value instanceof DoubleValue) {
            return "{\"type\":\"double\",\"value\":\"" + ((DoubleValue) value).value() + "\"}";
        }
        if (value instanceof StringReference) {
            String str = escapeJson(((StringReference) value).value());
            return "{\"type\":\"String\",\"value\":\"\\\"" + str + "\\\"\"}";
        }
        if (value instanceof ArrayReference) {
            ArrayReference arr = (ArrayReference) value;
            long id = arr.uniqueID();
            heap.put(id, arr);
            StringBuilder sb = new StringBuilder();
            sb.append("{\"type\":\"").append(escapeJson(arr.type().name()));
            sb.append("\",\"value\":\"[");
            List<Value> elements = arr.getValues();
            for (int i = 0; i < elements.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(valueToString(elements.get(i)));
            }
            sb.append("]\",\"id\":\"ref@").append(id).append("\"}");
            return sb.toString();
        }
        if (value instanceof ObjectReference) {
            ObjectReference obj = (ObjectReference) value;
            long id = obj.uniqueID();
            heap.put(id, obj);
            return "{\"type\":\"" + escapeJson(obj.type().name())
                    + "\",\"value\":\"@" + id
                    + "\",\"id\":\"ref@" + id + "\"}";
        }

        return "{\"type\":\"unknown\",\"value\":\"" + escapeJson(value.toString()) + "\"}";
    }

    private String valueToString(Value value) {
        if (value == null) return "null";
        if (value instanceof StringReference) return "\"" + ((StringReference) value).value() + "\"";
        if (value instanceof CharValue) return "'" + ((CharValue) value).value() + "'";
        if (value instanceof ObjectReference) return "@" + ((ObjectReference) value).uniqueID();
        return value.toString();
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
