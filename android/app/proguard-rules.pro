# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep MainApplication class
-keep class com.yottascore.examfrontend.MainApplication { *; }
-keep class com.yottascore.examfrontend.MainActivity { *; }

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

# React Native - Keep native methods
-keepclassmembers class * {
  native <methods>;
}

# Expo
-keep class expo.modules.** { *; }
-keep class expo.interfaces.** { *; }
-dontwarn expo.modules.**

# Keep all classes in your package
-keep class com.yottascore.examfrontend.** { *; }

# Add any project specific keep options here:
