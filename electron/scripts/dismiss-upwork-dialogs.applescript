on run argv
  set processName to "Upwork"
  if (count of argv) > 0 then set processName to item 1 of argv

  set closedCount to 0
  set patterns to {"encountered", "error", "restart", "problem", "unexpected", "upwork"}

  tell application "System Events"
    repeat with proc in (every process whose name is processName)
      try
        tell proc
          repeat with w in (every window)
            set winTitle to my lowerText(name of w)
            set shouldClose to false

            repeat with pat in patterns
              if winTitle contains pat then
                set shouldClose to true
                exit repeat
              end if
            end repeat

            if shouldClose then
              try
                click button "OK" of w
                set closedCount to closedCount + 1
              on error
                try
                  click button "Close" of w
                  set closedCount to closedCount + 1
                on error
                  try
                    keystroke "w" using command down
                    set closedCount to closedCount + 1
                  end try
                end try
              end try
            end if
          end repeat
        end tell
      end try
    end repeat
  end tell

  return closedCount
end run

on lowerText(t)
  return do shell script "echo " & quoted form of t & " | tr '[:upper:]' '[:lower:]'"
end lowerText
