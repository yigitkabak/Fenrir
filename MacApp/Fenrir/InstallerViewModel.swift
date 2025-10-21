import Foundation
import Combine
import AppKit

struct InstallationStep: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let command: String
}

class InstallerViewModel: ObservableObject {
    @Published var isInstalling = false
    @Published var installationComplete = false
    @Published var currentStep = 0
    @Published var hasError = false
    @Published var errorMessage = ""
    @Published var showScriptCreated = false
    @Published var scriptPath = ""
    
    let installationSteps = [
        InstallationStep(
            title: "Install Homebrew",
            description: "Package manager for macOS",
            command: "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        ),
        InstallationStep(
            title: "Install Node.js",
            description: "JavaScript runtime environment",
            command: "brew install node"
        ),
        InstallationStep(
            title: "Install Fenrir Runtime",
            description: "Fenrir programming language",
            command: "sudo npm install -g fenrir-runtime"
        )
    ]
    
    func startInstallation() {
        isInstalling = true
        currentStep = 0
    }
    
    func nextStep() {
        if currentStep < installationSteps.count - 1 {
            currentStep += 1
        } else {
            markAsComplete()
        }
    }
    
    func previousStep() {
        if currentStep > 0 {
            currentStep -= 1
        }
    }
    
    func markAsComplete() {
        isInstalling = false
        installationComplete = true
    }
    
    func copyCommand(_ command: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(command, forType: .string)
    }
    
    func openTerminal() {
        let script = """
        tell application "Terminal"
            activate
            do script ""
        end tell
        """
        
        if let appleScript = NSAppleScript(source: script) {
            appleScript.executeAndReturnError(nil)
        }
    }
}
