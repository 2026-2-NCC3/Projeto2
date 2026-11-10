package com.example.projetopi;

import org.junit.Test;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;
import static org.junit.Assert.*;

/** Teste de conformidade dos XMLs versionados; nao substitui testes em dispositivo. */
public class ConstraintLayoutStructureTest {
    private Path layouts() {
        Path path = Paths.get("").toAbsolutePath();
        for (int i = 0; i < 6 && path != null; i++, path = path.getParent()) {
            Path direct = path.resolve("src/main/res/layout");
            if (Files.isDirectory(direct)) return direct;
            Path nested = path.resolve("app/src/main/res/layout");
            if (Files.isDirectory(nested)) return nested;
        }
        throw new AssertionError("Nao foi encontrada a pasta de layouts do modulo Android");
    }

    @Test public void todosOsLayoutsNaoDevemTerLinearLayout() throws IOException {
        try (Stream<Path> files = Files.list(layouts())) {
            Path[] xmls = files.filter(p -> p.toString().endsWith(".xml")).toArray(Path[]::new);
            assertTrue("Nenhum layout encontrado", xmls.length >= 18);
            for (Path path : xmls) {
                String xml = Files.readString(path, StandardCharsets.UTF_8);
                assertFalse(path.getFileName() + " possui LinearLayout",
                        xml.contains("<LinearLayout") || xml.contains("</LinearLayout>"));
            }
        }
    }

    @Test public void activitiesDevemUsarConstraintLayoutNaRaiz() throws IOException {
        try (Stream<Path> files = Files.list(layouts())) {
            Path[] xmls = files.filter(p -> p.getFileName().toString().startsWith("activity_")
                    && p.toString().endsWith(".xml")).toArray(Path[]::new);
            assertTrue("Nenhuma Activity encontrada", xmls.length >= 11);
            for (Path path : xmls) {
                String xml = Files.readString(path, StandardCharsets.UTF_8);
                String withoutDeclaration = xml.replaceFirst("(?s)^\\s*<\\?xml[^>]*>\\s*", "");
                assertTrue(path.getFileName() + " nao usa ConstraintLayout na raiz",
                        withoutDeclaration.startsWith("<androidx.constraintlayout.widget.ConstraintLayout"));
            }
        }
    }
}
