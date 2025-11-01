using Avalonia.Controls;
using FenrirWindows.Views;

namespace FenrirWindows;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        Content = new WelcomeView();
    }

    public void NavigateToView(UserControl view)
    {
        Content = view;
    }
}