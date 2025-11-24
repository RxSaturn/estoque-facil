@echo off
TITLE Estoque Facil - Inicializador
COLOR 0B
ECHO ======================================================
ECHO     INICIALIZADOR DO ESTOQUE FACIL - v1.0
ECHO     Data de inicializacao: %date% %time%
ECHO     Usuario: %username%
ECHO ======================================================
ECHO.

REM Executar o script JS para gerenciar os processos
node start-estoque-facil.js

REM Capturar código de saída
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO [ERRO] Falha ao executar o Estoque Facil.
    ECHO Codigo de erro: %ERRORLEVEL%
    ECHO.
    ECHO Verifique os logs acima para mais detalhes.
    ECHO Se o problema persistir, entre em contato com o suporte.
    ECHO.
    PAUSE
    EXIT /B %ERRORLEVEL%
)

ECHO.
ECHO [*] Encerrando...
PAUSE