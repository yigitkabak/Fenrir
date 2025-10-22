import SwiftUI

struct ContentView: View {
    @StateObject private var installer = InstallerViewModel()
    @State private var licenseAccepted = false
    @State private var showingAlert = false
    @State private var showingCommandsSheet = false
    
    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                HeaderView()
                
                ScrollView {
                    VStack(spacing: 24) {
                        if installer.installationComplete {
                            CompletionView(onClose: {
                                NSApplication.shared.terminate(nil)
                            })
                        } else if installer.isInstalling {
                            InstallationGuideView(
                                installer: installer
                            )
                        } else {
                            LicenseSection(isAccepted: $licenseAccepted)
                            
                            CommandInfoButton(onShowCommands: {
                                showingCommandsSheet = true
                            })
                            
                            InstallButton(
                                isEnabled: licenseAccepted,
                                action: { installer.startInstallation() }
                            )
                        }
                    }
                    .padding(32)
                }
                .frame(maxHeight: .infinity)
            }
        }
        .frame(minWidth: 650, idealWidth: 700, minHeight: 650, idealHeight: 750)
        .alert("Error", isPresented: $showingAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(installer.errorMessage)
        }
        .onChange(of: installer.hasError) { hasError in
            showingAlert = hasError
        }
        .sheet(isPresented: $showingCommandsSheet) {
            CommandsSheet()
        }
    }
}

struct InstallationGuideView: View {
    @ObservedObject var installer: InstallerViewModel
    @State private var commandCopied = false
    
    var currentStepData: InstallationStep {
        installer.installationSteps[installer.currentStep]
    }
    
    var body: some View {
        VStack(spacing: 24) {
            HStack(spacing: 16) {
                ForEach(0..<installer.installationSteps.count, id: \.self) { index in
                    Circle()
                        .fill(index <= installer.currentStep ? Color.white : Color.white.opacity(0.2))
                        .frame(width: 12, height: 12)
                    
                    if index < installer.installationSteps.count - 1 {
                        Rectangle()
                            .fill(index < installer.currentStep ? Color.white : Color.white.opacity(0.2))
                            .frame(height: 2)
                    }
                }
            }
            .padding(.horizontal, 40)
            
            VStack(spacing: 16) {
                Text("Step \(installer.currentStep + 1) of \(installer.installationSteps.count)")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
                
                Text(currentStepData.title)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
                
                Text(currentStepData.description)
                    .font(.system(size: 16))
                    .foregroundColor(.white.opacity(0.7))
            }
            
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Command to execute:")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Button(action: {
                        installer.copyCommand(currentStepData.command)
                        commandCopied = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            commandCopied = false
                        }
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: commandCopied ? "checkmark" : "doc.on.doc")
                                .font(.system(size: 12))
                            Text(commandCopied ? "Copied!" : "Copy")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        Text("$")
                            .font(.system(size: 14, design: .monospaced))
                            .foregroundColor(.green)
                        
                        Text(currentStepData.command)
                            .font(.system(size: 14, design: .monospaced))
                            .foregroundColor(.white)
                    }
                    .padding(16)
                }
                .background(Color(white: 0.05))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
            }
            
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Text("1.")
                        .fontWeight(.bold)
                    Text("Click 'Open Terminal' button below")
                }
                HStack(spacing: 8) {
                    Text("2.")
                        .fontWeight(.bold)
                    Text("Paste the command (⌘+V) and press Enter")
                }
                HStack(spacing: 8) {
                    Text("3.")
                        .fontWeight(.bold)
                    Text("Wait for the installation to complete")
                }
                HStack(spacing: 8) {
                    Text("4.")
                        .fontWeight(.bold)
                    Text("Click 'Next Step' when done")
                }
            }
            .font(.system(size: 14))
            .foregroundColor(.white.opacity(0.9))
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)
            
            VStack(spacing: 12) {
                Button(action: {
                    installer.openTerminal()
                    installer.copyCommand(currentStepData.command)
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: "terminal.fill")
                            .font(.system(size: 18))
                        Text("Open Terminal & Copy Command")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.white)
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                HStack(spacing: 12) {
                    if installer.currentStep > 0 {
                        Button(action: {
                            installer.previousStep()
                        }) {
                            HStack(spacing: 8) {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 14))
                                Text("Previous")
                                    .font(.system(size: 15, weight: .medium))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    
                    Button(action: {
                        installer.nextStep()
                    }) {
                        HStack(spacing: 8) {
                            Text(installer.currentStep == installer.installationSteps.count - 1 ? "Finish" : "Next Step")
                                .font(.system(size: 15, weight: .medium))
                            Image(systemName: "chevron.right")
                                .font(.system(size: 14))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.green.opacity(0.3))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.green.opacity(0.5), lineWidth: 1)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
        .padding(32)
        .background(Color(white: 0.08))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}

struct HeaderView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "terminal.fill")
                .font(.system(size: 64))
                .foregroundColor(.white)
                .padding(.top, 40)
            
            Text("Fenrir Runtime")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)
            
            Text("Professional Installation Assistant")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.white.opacity(0.6))
                .padding(.bottom, 20)
        }
        .frame(maxWidth: .infinity)
        .background(Color(white: 0.05))
    }
}

struct LicenseSection: View {
    @Binding var isAccepted: Bool
    
    let licenseText = "GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007\n\nCopyright (C) 2007 Free Software Foundation, Inc.\n\nThis program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License along with this program. If not, see https://www.gnu.org/licenses/"
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("License Agreement")
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(.white)
            
            VStack(alignment: .leading, spacing: 12) {
                Text("This software is licensed under GPL-3.0")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.8))
                
                ScrollView {
                    Text(licenseText)
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(.white.opacity(0.6))
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(height: 200)
                .background(Color(white: 0.05))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
            }
            
            Button(action: { isAccepted.toggle() }) {
                HStack(spacing: 12) {
                    Image(systemName: isAccepted ? "checkmark.square.fill" : "square")
                        .font(.system(size: 20))
                        .foregroundColor(isAccepted ? .white : .white.opacity(0.3))
                    
                    Text("I accept the GPL-3.0 License Agreement")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                }
                .padding(.vertical, 8)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(24)
        .background(Color(white: 0.08))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}

struct CommandInfoButton: View {
    let onShowCommands: () -> Void
    
    var body: some View {
        Button(action: onShowCommands) {
            HStack(spacing: 12) {
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 18))
                
                Text("What will Fenrir install?")
                    .font(.system(size: 15, weight: .medium))
            }
            .foregroundColor(.white.opacity(0.8))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.05))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .padding(.horizontal, 24)
    }
}

struct CommandsSheet: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 24) {
                HStack {
                    Text("Installation Commands")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 32)
                .padding(.top, 32)
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        Text("Fenrir will guide you through executing the following commands:")
                            .font(.system(size: 14))
                            .foregroundColor(.white.opacity(0.8))
                            .padding(.horizontal, 32)
                        
                        CommandBlock(
                            title: "1. Install Homebrew",
                            description: "Package manager for macOS",
                            commands: [
                                "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                            ]
                        )
                        
                        CommandBlock(
                            title: "2. Install Node.js",
                            description: "JavaScript runtime environment",
                            commands: [
                                "brew install node"
                            ]
                        )
                        
                        CommandBlock(
                            title: "3. Install Fenrir Runtime",
                            description: "Fenrir programming language globally",
                            commands: [
                                "sudo npm install -g fenrir-runtime"
                            ]
                        )
                        
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.yellow)
                                Text("Administrator Permission Required")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                            }
                            
                            Text("You will be prompted to enter your password to grant installation permissions.")
                                .font(.system(size: 13))
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.yellow.opacity(0.1))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
                        )
                        .padding(.horizontal, 32)
                    }
                    .padding(.bottom, 32)
                }
                
                Button(action: { dismiss() }) {
                    Text("I Understand")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.horizontal, 32)
                .padding(.bottom, 32)
            }
        }
        .frame(width: 600, height: 500)
    }
}

struct CommandBlock: View {
    let title: String
    let description: String
    let commands: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                
                Text(description)
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.6))
            }
            
            VStack(alignment: .leading, spacing: 8) {
                ForEach(commands, id: \.self) { command in
                    HStack(spacing: 8) {
                        Text("$")
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(.green)
                        
                        Text(command)
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.vertical, 6)
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(white: 0.05))
            .cornerRadius(6)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
        }
        .padding(.horizontal, 32)
    }
}

struct InstallButton: View {
    let isEnabled: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: "arrow.down.circle.fill")
                    .font(.system(size: 20))
                
                Text("Start Installation")
                    .font(.system(size: 18, weight: .semibold))
            }
            .foregroundColor(.black)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(isEnabled ? Color.white : Color.white.opacity(0.3))
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(!isEnabled)
        .padding(.horizontal, 24)
    }
}

struct CompletionView: View {
    let onClose: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 72))
                .foregroundColor(.white)
            
            Text("Installation Complete!")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)
            
            Text("Fenrir Language has been successfully installed on your system.")
                .font(.system(size: 16))
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Button(action: onClose) {
                Text("Close")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.black)
                    .frame(width: 200)
                    .padding(.vertical, 14)
                    .background(Color.white)
                    .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
            .padding(.top, 8)
        }
        .padding(32)
        .background(Color(white: 0.08))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}
