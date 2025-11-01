using Avalonia.Controls;
using Avalonia.Interactivity;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace FenrirLinux.Views;

public partial class InstallationView : UserControl
{
    private bool _isInstallationStarted = false;
    private string? _sudoPassword;

    public InstallationView()
    {
        InitializeComponent();
        var closeButton = this.FindControl<Button>("CloseButton");
        if (closeButton != null)
        {
            closeButton.Click += OnCloseButtonClick;
        }

        this.Loaded += OnLoaded;
    }

    private async void OnLoaded(object? sender, RoutedEventArgs e)
    {
        if (!_isInstallationStarted)
        {
            _isInstallationStarted = true;
            await StartInstallationAsync();
        }
    }

    private async Task StartInstallationAsync()
    {
        Log("The setup wizard is starting...");

        _sudoPassword = await GetSudoPasswordAsync();
        if (string.IsNullOrEmpty(_sudoPassword))
        {
            Log("The sudo password was not entered or the operation was canceled. Installation has been stopped.");
            UpdateStatus("Error: Installation Cancelled.");
            return;
        }
        
        var packageManager = GetPackageManager();
        if (string.IsNullOrEmpty(packageManager))
        {
            Log("An unsupported Linux distribution was detected.");
            UpdateStatus("Error: Unsupported distribution.");
            return;
        }

        

        UpdateStatus("Cloning Git repository...");
        var homeDirectory = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var repoUrl = "https://github.com/yigitkabak/Fenrir.git";
        var projectPath = Path.Combine(homeDirectory, "Fenrir");

        if (Directory.Exists(projectPath))
        {
            Log("The project folder already exists, so it is skipped.");
        }
        else
        {
            await RunCommandAsync($"git clone {repoUrl} {projectPath}");
        }

        UpdateStatus("Running npm commands...");
        await RunSudoCommandAsync($"cd {projectPath} && npm run build");

        UpdateStatus("Running make commands...");
        await RunSudoCommandAsync($"cd {projectPath} && make");

        UpdateStatus("Setup completed successfully!");
        Log("Setup completed successfully!");

        var progressBar = this.FindControl<ProgressBar>("ProgressBar");
        if (progressBar != null)
        {
            progressBar.IsIndeterminate = false;
            progressBar.Value = 100;
        }

        var closeButton = this.FindControl<Button>("CloseButton");
        if (closeButton != null)
        {
            closeButton.IsEnabled = true;
        }
    }

    private async Task<string?> GetSudoPasswordAsync()
    {
        var passwordView = new PasswordView();
        var passwordWindow = new Window
        {
            Title = "Password Required",
            Content = passwordView,
            Width = 350,
            Height = 200,
            CanResize = false
        };

        var passwordTask = passwordView.GetPasswordAsync();
        
        passwordWindow.Show();
        var password = await passwordTask;
        passwordWindow.Close();
        return password;
    }

    private string? GetPackageManager()
    {
        if (File.Exists("/etc/debian_version")) return "apt";
        if (File.Exists("/etc/fedora-release")) return "dnf";
        if (File.Exists("/etc/redhat-release")) return "yum";
        if (File.Exists("/etc/arch-release")) return "pacman -S";
        return null;
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
            logBox.Text += $"{message}\n";
            ((ScrollViewer?)logBox.Parent)?.InvalidateVisual();
        }
    }
    
    private async Task RunCommandAsync(string command)
    {
        Log($"Command is running: {command}");
        await ExecuteProcessAsync("/bin/bash", $"-c \"{command}\"");
    }
    
    private async Task RunSudoCommandAsync(string command)
    {
        Log($"The sudo command is being executed.: {command}");
        
        await ExecuteProcessAsync("/bin/bash", $"-c \"echo {_sudoPassword} | sudo -S bash -c \\\"{command}\\\"\"");
    }

    private async Task ExecuteProcessAsync(string fileName, string arguments)
    {
        var process = new Process
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
        
        var outputReader = process.StandardOutput;
        var errorReader = process.StandardError;

        var outputTask = Task.Run(() =>
        {
            string? line;
            while ((line = outputReader.ReadLine()) != null)
            {
                Avalonia.Threading.Dispatcher.UIThread.InvokeAsync(() => Log(line));
            }
        });

        var errorTask = Task.Run(() =>
        {
            string? line;
            while ((line = errorReader.ReadLine()) != null)
            {
                Avalonia.Threading.Dispatcher.UIThread.InvokeAsync(() => Log($"ERROR: {line}"));
            }
        });

        await Task.WhenAll(outputTask, errorTask);
        await process.WaitForExitAsync();
        Log($"Command completed. Exit Code: {process.ExitCode}");
    }

    private void OnCloseButtonClick(object? sender, RoutedEventArgs e)
    {
        var window = (Window?)this.VisualRoot;
        window?.Close();
    }
}