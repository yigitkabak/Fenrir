using Avalonia.Controls;

namespace FenrirLinux;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    public void NavigateToView(UserControl view)
    {
        Content = view;
    }
}