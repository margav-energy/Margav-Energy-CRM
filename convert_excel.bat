@echo off
echo Installing required packages...
pip install pandas openpyxl

echo.
echo Excel to JSON Converter for Margav Energy CRM
echo ============================================
echo.

if "%1"=="" (
    echo Usage: convert_excel.bat ^<excel_file^> [json_file]
    echo.
    echo Example:
    echo   convert_excel.bat leads_data.xlsx
    echo   convert_excel.bat leads_data.xlsx output.json
    echo.
    pause
    exit /b 1
)

python excel_to_json_converter.py %1 %2

echo.
echo Press any key to exit...
pause > nul
echo Installing required packages...
pip install pandas openpyxl

echo.
echo Excel to JSON Converter for Margav Energy CRM
echo ============================================
echo.

if "%1"=="" (
    echo Usage: convert_excel.bat ^<excel_file^> [json_file]
    echo.
    echo Example:
    echo   convert_excel.bat leads_data.xlsx
    echo   convert_excel.bat leads_data.xlsx output.json
    echo.
    pause
    exit /b 1
)

python excel_to_json_converter.py %1 %2

echo.
echo Press any key to exit...
pause > nul






