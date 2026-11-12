import java.net.URI

plugins {
    alias(libs.plugins.android.application)
}

// URL da API Próxima Etapa hospedada no Render
val defaultApiUrl = "https://projeto2-krn7.onrender.com"

// Permite configurar outra URL HTTPS para Release
val releaseApiUrl = providers
    .gradleProperty("proximaReleaseApiUrl")
    .orElse(defaultApiUrl)
    .get()
    .trim()
    .trimEnd('/')

// Validação da URL de produção
val uri = URI(releaseApiUrl)

require(
    uri.scheme == "https" &&
    uri.host != null &&
    uri.userInfo == null &&
    uri.query == null &&
    uri.fragment == null
) {
    "proximaReleaseApiUrl deve ser uma URL HTTPS válida."
}

abstract class ValidateReleaseApiUrl : DefaultTask() {
    @get:Input
    abstract val apiUrl: Property<String>

    @TaskAction
    fun validate() {
        require(apiUrl.get().isNotEmpty()) {
            "Informe -PproximaReleaseApiUrl=https://... para gerar um APK ou AAB de release."
        }
    }
}

val validateReleaseApiUrl = tasks.register<ValidateReleaseApiUrl>("validateReleaseApiUrl") {
    apiUrl.set(releaseApiUrl)
}

tasks.matching { it.name == "packageRelease" || it.name == "packageReleaseBundle" }.configureEach {
    dependsOn(validateReleaseApiUrl)
}

android {
    namespace = "com.example.projetopi"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.example.projetopi"
        minSdk = 24

        // Versão do aplicativo
        versionCode = 2
        versionName = "1.1.0"

        testInstrumentationRunner =
            "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {

        // Ambiente de desenvolvimento
        debug {
            buildConfigField(
                "String",
                "API_BASE_URL",
                "\"$defaultApiUrl\""
            )
        }

        // Ambiente de produção
        release {
            buildConfigField(
                "String",
                "API_BASE_URL",
                "\"$releaseApiUrl\""
            )

            optimization {
                enable = false
            }
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.activity.ktx)
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.material)

    testImplementation(libs.junit)
    testImplementation("org.json:json:20240303")

    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)

    implementation("de.hdodenhof:circleimageview:3.1.0")
    implementation("com.android.volley:volley:1.2.1")
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")
}
