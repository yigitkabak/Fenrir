using Avalonia.Controls;
using Avalonia.Interactivity;

namespace FenrirWindows.Views;

public partial class WelcomeView : UserControl
{
    public WelcomeView()
    {
        InitializeComponent();
    }

    protected override void OnAttachedToVisualTree(Avalonia.VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);
        
        var nextButton = this.FindControl<Button>("NextButton");
        if (nextButton != null)
        {
            nextButton.Click += OnNextButtonClick;
        }
    }

    private void OnNextButtonClick(object? sender, RoutedEventArgs e)
    {
        if (this.VisualRoot is MainWindow window)
        {
            window.NavigateToView(new InstallationView());
        }
    }
}