@echo off
TITLE Estoque Facil - Inicializador
COLOR 0B

ECHO ======================================================
ECHO     INICIALIZADOR DO ESTOQUE FACIL - v1.1
ECHO     Data: %date% %time%
ECHO     Usuario: %username%
ECHO ======================================================
ECHO.

REM Verificar se Node.js esta instalado
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO [ERRO] Node.js nao esta instalado ou nao esta no PATH.
    ECHO Por favor, instale o Node.js de https://nodejs.org
    PAUSE
    EXIT /B 1
)

REM Verificar versao do Node.js
FOR /F "tokens=*" %%a IN ('node -v') DO SET NODE_VERSION=%%a
ECHO [*] Node.js encontrado: %NODE_VERSION%
ECHO.

REM Verificar se as dependencias estao instaladas
IF NOT EXIST "backend\node_modules" (
    ECHO [*] Instalando dependencias do backend...
    cd backend
    call npm install
    cd ..
)

IF NOT EXIST "frontend\node_modules" (
    ECHO [*] Instalando dependencias do frontend...
    cd frontend
    call npm install
    cd ..
)

REM Executar o script principal
node start-estoque-facil.js

REM Capturar codigo de saida
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