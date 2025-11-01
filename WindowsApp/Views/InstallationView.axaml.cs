using Avalonia.Controls;
using Avalonia.Interactivity;
using System;
using System.Diagnostics;
using System.IO;
using System.Security.Principal;
using System.Threading.Tasks;

namespace FenrirWindows.Views;

public partial class InstallationView : UserControl
{
    private bool _isInstallationStarted = false;

    public InstallationView()
    {
        InitializeComponent();
    }

    protected override void OnAttachedToVisualTree(Avalonia.VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);
        
        var closeButton = this.FindControl<Button>("CloseButton");
        if (closeButton != null)
        {
            closeButton.Click += OnCloseButtonClick;
        }

        if (!_isInstallationStarted)
        {
            _isInstallationStarted = true;
            _ = StartInstallationAsync();
        }
    }

    private async Task StartInstallationAsync()
    {
        try
        {
            Log("The setup wizard is starting...");

            if (!IsRunningAsAdministrator())
            {
                Log("This application must be run with administrator privileges.");
                UpdateStatus("Error: Administrator privileges required.");
                
                if (await PromptRestartAsAdminAsync())
                {
                    RestartAsAdministrator();
                }
                else
                {
                    EnableCloseButton();
                }
                return;
            }

            Log("Administrator privileges verified.");

            if (!IsGitInstalled())
            {
                Log("Git is not installed. Please install Git from: https://git-scm.com/download/win");
                UpdateStatus("Error: Git not found.");
                EnableCloseButton();
                return;
            }

            if (!IsNodeInstalled())
            {
                Log("Node.js is not installed. Please install Node.js from: https://nodejs.org/");
                UpdateStatus("Error: Node.js not found.");
                EnableCloseButton();
                return;
            }

            UpdateStatus("Cloning Git repository...");
            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var repoUrl = "https://github.com/yigitkabak/Fenrir.git";
            var projectPath = Path.Combine(userProfile, "Fenrir");

            if (Directory.Exists(projectPath))
            {
                Log("The project folder already exists, skipping clone.");
            }
            else
            {
                var cloneResult = await RunCommandAsync($"git clone {repoUrl} \"{projectPath}\"");
                if (cloneResult != 0)
                {
                    Log("Failed to clone repository.");
                    UpdateStatus("Error: Repository clone failed.");
                    EnableCloseButton();
                    return;
                }
            }

            UpdateStatus("Running npm install...");
            var npmInstallResult = await RunCommandAsync($"cd /d \"{projectPath}\" && npm install");
            if (npmInstallResult != 0)
            {
                Log("npm install failed.");
                UpdateStatus("Error: npm install failed.");
                EnableCloseButton();
                return;
            }

            UpdateStatus("Running npm build...");
            var npmBuildResult = await RunCommandAsync($"cd /d \"{projectPath}\" && npm run build");
            if (npmBuildResult != 0)
            {
                Log("npm build failed.");
                UpdateStatus("Error: npm build failed.");
                EnableCloseButton();
                return;
            }

            UpdateStatus("Running make commands...");
            if (IsMakeInstalled())
            {
                var makeResult = await RunCommandAsync($"cd /d \"{projectPath}\" && make");
                if (makeResult != 0)
                {
                    Log("make command failed.");
                    UpdateStatus("Warning: make command failed.");
                }
            }
            else
            {
                Log("Make not found. If required, please install MinGW or alternative tools.");
                UpdateStatus("Warning: Make command skipped.");
            }

            UpdateStatus("Setup completed successfully!");
            Log("Setup completed successfully!");

            var progressBar = this.FindControl<ProgressBar>("ProgressBar");
            if (progressBar != null)
            {
                progressBar.IsIndeterminate = false;
                progressBar.Value = 100;
            }

            EnableCloseButton();
        }
        catch (Exception ex)
        {
            Log($"Installation error: {ex.Message}");
            UpdateStatus("Error: Installation failed.");
            EnableCloseButton();
        }
    }

    private void EnableCloseButton()
    {
        var closeButton = this.FindControl<Button>("CloseButton");
        if (closeButton != null)
        {
            closeButton.IsEnabled = true;
        }
    }

    private bool IsRunningAsAdministrator()
    {
        try
        {
            var identity = WindowsIdentity.GetCurrent();
            var principal = new WindowsPrincipal(identity);
            return principal.IsInRole(WindowsBuiltInRole.Administrator);
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> PromptRestartAsAdminAsync()
    {
        var dialog = new Window
        {
            Title = "Administrator Privileges Required",
            Width = 450,
            Height = 200,
            CanResize = false,
            WindowStartupLocation = WindowStartupLocation.CenterOwner
        };

        var panel = new StackPanel { Margin = new Avalonia.Thickness(20) };
        
        panel.Children.Add(new TextBlock 
        { 
            Text = "This application requires administrator privileges.\nWould you like to restart the application as administrator?",
            TextWrapping = Avalonia.Media.TextWrapping.Wrap,
            Margin = new Avalonia.Thickness(0, 0, 0, 20)
        });

        var buttonPanel = new StackPanel 
        { 
            Orientation = Avalonia.Layout.Orientation.Horizontal,
            HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center
        };

        bool result = false;
        var yesButton = new Button { Content = "Yes", Width = 100, Margin = new Avalonia.Thickness(0, 0, 10, 0) };
        var noButton = new Button { Content = "No", Width = 100 };

        yesButton.Click += (s, e) => { result = true; dialog.Close(); };
        noButton.Click += (s, e) => { result = false; dialog.Close(); };

        buttonPanel.Children.Add(yesButton);
        buttonPanel.Children.Add(noButton);
        panel.Children.Add(buttonPanel);

        dialog.Content = panel;
        
        var owner = this.VisualRoot as Window;
        if (owner != null)
        {
            await dialog.ShowDialog(owner);
        }

        return result;
    }

    private void RestartAsAdministrator()
    {
        try
        {
            var currentProcess = Process.GetCurrentProcess();
            var mainModule = currentProcess.MainModule;
            
            if (mainModule?.FileName == null)
            {
                Log("Error: Unable to determine application path.");
                return;
            }

            var processInfo = new ProcessStartInfo
            {
                FileName = mainModule.FileName,
                UseShellExecute = true,
                Verb = "runas"
            };

            Process.Start(processInfo);
            Environment.Exit(0);
        }
        catch (Exception ex)
        {
            Log($"Error restarting as administrator: {ex.Message}");
        }
    }

    private bool IsGitInstalled()
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = "git",
                Arguments = "--version",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            });
            return process != null;
        }
        catch
        {
            return false;
        }
    }

    private bool IsNodeInstalled()
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = "node",
                Arguments = "--version",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            });
            return process != null;
        }
        catch
        {
            return false;
        }
    }

    private bool IsMakeInstalled()
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = "make",
                Arguments = "--version",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            });
            return process != null;
        }
        catch
        {
            return false;
        }
    }

    private void UpdateStatus(string status)
    {
        var statusText = this.FindControl<TextBlock>("StatusText");
        if (statusText != null)
        {
            statusText.Text = status;
        }
    }

    private void Log(string message)
    {
        var logBox = this.FindControl<TextBlock>("LogOutput");
        if (logBox != null)
        {
            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            logBox.Text += $"[{timestamp}] {message}\n";
            
            var scrollViewer = logBox.Parent as ScrollViewer;
            scrollViewer?.ScrollToEnd();
        }
    }
    
    private async Task<int> RunCommandAsync(string command)
    {
        Log($"Running: {command}");
        return await ExecuteProcessAsync("cmd.exe", $"/c {command}");
    }

    private async Task<int> ExecuteProcessAsync(string fileName, string arguments)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        process.Start();
        
        var outputTask = Task.Run(async () =>
        {
            while (await process.StandardOutput.ReadLineAsync() is { } line)
            {
                await Avalonia.Threading.Dispatcher.UIThread.InvokeAsync(() => Log(line));
            }
        });

        var errorTask = Task.Run(async () =>
        {
            while (await process.StandardError.ReadLineAsync() is { } line)
            {
                await Avalonia.Threading.Dispatcher.UIThread.InvokeAsync(() => Log($"ERROR: {line}"));
            }
        });

        await Task.WhenAll(outputTask, errorTask);
        await process.WaitForExitAsync();
        
        Log($"Exit Code: {process.ExitCode}");
        return process.ExitCode;
    }

    private void OnCloseButtonClick(object? sender, RoutedEventArgs e)
    {
        var window = (Window?)this.VisualRoot;
        window?.Close();
    }
}