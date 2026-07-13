@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
if "%1"=="-y" shift
"C:\Program Files\nodejs\npm.cmd" exec %*
