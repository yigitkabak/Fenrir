using Avalonia.Controls;
using Avalonia.Interactivity;

namespace FenrirLinux.Views;

public partial class WelcomeView : UserControl
{
    public WelcomeView()
    {
        InitializeComponent();
        this.FindControl<Button>("NextButton").Click += OnNextButtonClick;
    }

    private void OnNextButtonClick(object? sender, RoutedEventArgs e)
    {
        var mainWindow = (Window)this.VisualRoot;
        if (mainWindow is MainWindow window)
        {
            window.NavigateToView(new InstallationView());
        }
    }
}