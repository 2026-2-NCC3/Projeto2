plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.projetopi"
    compileSdk = 37



    defaultConfig {
        applicationId = "com.example.projetopi"
        minSdk = 24
        // Maior valor comprovado no Git/APKs historicos: 1 (1.0).
        // A publicacao exige conferir o maior codigo da loja; veja VERSIONING.md.
        versionCode = 2
        versionName = "1.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
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
}