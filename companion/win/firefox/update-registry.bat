@echo off
reg add "HKCU\Software\Mozilla\NativeMessagingHosts\singlefile_companion" /ve /t REG_SZ /d "%~dp0\singlefile_companion.json" /f
reg add "HKLM\Software\Mozilla\NativeMessagingHosts\singlefile_companion" /ve /t REG_SZ /d "%~dp0\singlefile_companion.json" /f