@echo off
reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\singlefile_companion" /ve /t REG_SZ /d "%~dp0\singlefile_companion.json" /f