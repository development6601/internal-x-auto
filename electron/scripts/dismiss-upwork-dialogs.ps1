# Dismiss Upwork crash / restart dialogs by sending WM_CLOSE to matching windows.
param(
  [string]$ProcessName = 'Upwork'
)

Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class UpworkWin32 {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc proc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint msg, IntPtr w, IntPtr lParam);
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  public const uint WM_CLOSE = 0x0010;
}
"@

$patterns = @('encountered', 'error', 'restart', 'upwork', 'problem', 'unexpected')
$closed = 0

$callback = {
  param($hWnd, $lParam)
  if (-not [UpworkWin32]::IsWindowVisible($hWnd)) { return $true }

  $pid = [uint32]0
  [UpworkWin32]::GetWindowThreadProcessId($hWnd, [ref]$pid) | Out-Null

  $isUpwork = $false
  try {
    $p = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($p.ProcessName -eq $ProcessName) { $isUpwork = $true }
  } catch {}

  $sb = New-Object System.Text.StringBuilder 512
  [UpworkWin32]::GetWindowText($hWnd, $sb, 512) | Out-Null
  $title = $sb.ToString().ToLower()

  $matchTitle = $false
  foreach ($pat in $patterns) {
    if ($title -like "*$pat*") { $matchTitle = $true; break }
  }

  if ($isUpwork -or $matchTitle) {
    [UpworkWin32]::PostMessage($hWnd, [UpworkWin32]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
    $script:closed++
  }

  return $true
}

$delegate = [UpworkWin32+EnumWindowsProc]$callback
[UpworkWin32]::EnumWindows($delegate, [IntPtr]::Zero) | Out-Null

Get-Process -Name $ProcessName -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } |
  ForEach-Object {
    $_.CloseMainWindow() | Out-Null
    $script:closed++
  }

Write-Output $closed
