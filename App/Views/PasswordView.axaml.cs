using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using System.Threading.Tasks;

namespace FenrirLinux.Views;

public partial class PasswordView : UserControl
{
    private TaskCompletionSource<string?> _tcs = new TaskCompletionSource<string?>();

    public PasswordView()
    {
        InitializeComponent();
        
        var confirmButton = this.FindControl<Button>("ConfirmButton");
        var cancelButton = this.FindControl<Button>("CancelButton");
        var passwordTextBox = this.FindControl<TextBox>("PasswordTextBox");
        
        confirmButton!.Click += OnConfirmClick;
        cancelButton!.Click += OnCancelClick;
        
        passwordTextBox!.KeyDown += OnPasswordTextBoxKeyDown;
    }

    public Task<string?> GetPasswordAsync()
    {
        return _tcs.Task;
    }

    private void OnPasswordTextBoxKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            OnConfirmClick(sender, e);
            e.Handled = true; 
        }
    }

    private void OnConfirmClick(object? sender, RoutedEventArgs e)
    {
        var passwordBox = this.FindControl<TextBox>("PasswordTextBox");
        try
        {
            _tcs.SetResult(passwordBox?.Text);
        }
        catch (System.InvalidOperationException)
        {
        }
    }

    private void OnCancelClick(object? sender, RoutedEventArgs e)
    {
        try
        {
            _tcs.SetResult(null);
        }
        catch (System.InvalidOperationException)
        {
        }
    }
}