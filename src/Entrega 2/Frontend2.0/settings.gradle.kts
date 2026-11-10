pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)

    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ProjetoPI"
include(":app")

gradle.beforeProject {
    val projectDirName = if (path == ":") "root" else path.replace(':', '_').trimStart('_')
    layout.buildDirectory.set(file("${System.getProperty("user.home")}/.gradle-builds/ProjetoPI/$projectDirName"))
}