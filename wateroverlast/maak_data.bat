@echo off
cd /d "%~dp0"
echo Omzetten van het FCAB-GeoPackage naar de map data...
python maak_data.py %*
pause
