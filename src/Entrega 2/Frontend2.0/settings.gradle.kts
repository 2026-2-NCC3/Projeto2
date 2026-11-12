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

val externalBuildRoot = providers.environmentVariable("PROXIMA_ANDROID_BUILD_ROOT").orNull
if (!externalBuildRoot.isNullOrBlank()) {
    val outputRoot = file(externalBuildRoot)
    gradle.beforeProject {
        val projectDirName = if (path == ":") "root" else path.replace(':', '_').trimStart('_')
        layout.buildDirectory.set(outputRoot.resolve(projectDirName))
    }
}
