// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NyvloCapture",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "NyvloCapture",
            path: ".",
            sources: ["NyvloCapture.swift"],
            linkerSettings: [
                .linkedFramework("CoreAudio"),
                .linkedFramework("AudioToolbox"),
                .linkedFramework("AVFoundation"),
                .linkedFramework("ScreenCaptureKit"),
                .linkedFramework("AppKit"),
                .linkedFramework("CoreImage"),
            ]
        )
    ]
)
