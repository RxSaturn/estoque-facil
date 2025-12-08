@echo off
SETLOCAL EnableDelayedExpansion
TITLE Estoque Facil - Inicializador v1.2
COLOR 0B

REM ================================================================
REM SCRIPT DE EXECUCAO - ESTOQUE FACIL
REM Versao: 1.2
REM Descricao: Inicia o sistema completo (backend + frontend)
REM ================================================================

ECHO.
ECHO ======================================================
ECHO     INICIALIZADOR DO ESTOQUE FACIL - v1.2
ECHO     Data: %date% %time%
ECHO     Usuario: %username%
ECHO ======================================================
ECHO.

REM ================================================================
REM ETAPA 1: Verificar Node.js
REM ================================================================

ECHO [*] Verificando Node.js...
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO [ERRO] Node.js nao esta instalado ou nao esta no PATH!
    ECHO.
    ECHO Para instalar o Node.js:
    ECHO 1. Acesse: https://nodejs.org
    ECHO 2. Baixe a versao LTS ^(recomendada^)
    ECHO 3. Execute o instalador
    ECHO 4. Reinicie o computador
    ECHO 5. Execute este script novamente
    ECHO.
    ECHO Ou execute 'instalacao_inicial.bat' para instalar todas as dependencias.
    ECHO.
    PAUSE
    EXIT /B 1
)

REM Verificar versao do Node.js
FOR /F "tokens=*" %%a IN ('node -v') DO SET NODE_VERSION=%%a
ECHO     [OK] Node.js encontrado: !NODE_VERSION!

REM Verificar NPM
where npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO     [ERRO] NPM nao encontrado!
    PAUSE
    EXIT /B 1
)

FOR /F "tokens=*" %%a IN ('npm -v') DO SET NPM_VERSION=%%a
ECHO     [OK] NPM encontrado: v!NPM_VERSION!
ECHO.

REM ================================================================
REM ETAPA 2: Verificar estrutura de pastas
REM ================================================================

ECHO [*] Verificando estrutura de pastas...

IF NOT EXIST "backend" (
    COLOR 0C
    ECHO     [ERRO] Pasta 'backend' nao encontrada!
    ECHO     Execute este script na pasta raiz do projeto.
    PAUSE
    EXIT /B 1
)

IF NOT EXIST "frontend" (
    COLOR 0C
    ECHO     [ERRO] Pasta 'frontend' nao encontrada!
    ECHO     Execute este script na pasta raiz do projeto.
    PAUSE
    EXIT /B 1
)

ECHO     [OK] Estrutura de pastas validada!
ECHO.

REM ================================================================
REM ETAPA 3: Verificar dependencias instaladas
REM ================================================================

ECHO [*] Verificando dependencias...

SET DEPENDENCIAS_OK=1

IF NOT EXIST "backend\node_modules" (
    COLOR 0E
    ECHO     [AVISO] Dependencias do backend nao encontradas!
    SET DEPENDENCIAS_OK=0
)

IF NOT EXIST "frontend\node_modules" (
    COLOR 0E
    ECHO     [AVISO] Dependencias do frontend nao encontradas!
    SET DEPENDENCIAS_OK=0
)

IF !DEPENDENCIAS_OK! EQU 0 (
    COLOR 0E
    ECHO.
    ECHO ======================================================
    ECHO [AVISO] Dependencias nao estao instaladas!
    ECHO ======================================================
    ECHO.
    ECHO Parece que e a primeira vez que executa o sistema
    ECHO ou as dependencias nao foram instaladas corretamente.
    ECHO.
    ECHO Opcoes:
    ECHO.
    ECHO 1. Instalar automaticamente agora ^(recomendado^)
    ECHO    - Vai executar 'npm install' nas pastas backend e frontend
    ECHO    - Pode demorar varios minutos
    ECHO.
    ECHO 2. Cancelar e executar 'instalacao_inicial.bat' manualmente
    ECHO    - Instalacao mais completa e detalhada
    ECHO    - Cria pastas e faz verificacoes adicionais
    ECHO.
    
    SET /P INSTALAR_AGORA="Deseja instalar as dependencias agora? (S/N): "
    
    IF /I "!INSTALAR_AGORA!" EQU "S" (
        COLOR 0B
        ECHO.
        ECHO [*] Instalando dependencias...
        ECHO     Isso pode demorar varios minutos. Aguarde...
        ECHO.
        
        REM Instalar backend
        IF NOT EXIST "backend\node_modules" (
            ECHO [*] Instalando backend...
            cd backend
            call npm install
            IF !ERRORLEVEL! NEQ 0 (
                COLOR 0C
                ECHO [ERRO] Falha ao instalar dependencias do backend!
                PAUSE
                cd ..
                EXIT /B 1
            )
            cd ..
            ECHO     [OK] Backend instalado!
        )
        
        REM Instalar frontend
        IF NOT EXIST "frontend\node_modules" (
            ECHO [*] Instalando frontend...
            cd frontend
            call npm install
            IF !ERRORLEVEL! NEQ 0 (
                COLOR 0C
                ECHO [ERRO] Falha ao instalar dependencias do frontend!
                PAUSE
                cd ..
                EXIT /B 1
            )
            cd ..
            ECHO     [OK] Frontend instalado!
        )
        
        COLOR 0A
        ECHO.
        ECHO [OK] Dependencias instaladas com sucesso!
        COLOR 0B
        ECHO.
    ) ELSE (
        ECHO.
        ECHO Instalacao cancelada.
        ECHO Execute 'instalacao_inicial.bat' e depois tente novamente.
        ECHO.
        PAUSE
        EXIT /B 1
    )
) ELSE (
    ECHO     [OK] Dependencias encontradas!
)

ECHO.

REM ================================================================
REM ETAPA 4: Verificar arquivo .env
REM ================================================================

ECHO [*] Verificando configuracoes...

IF NOT EXIST "backend\.env" (
    COLOR 0E
    ECHO     [AVISO] Arquivo .env nao encontrado!
    ECHO.
    ECHO     O sistema pode nao funcionar sem as configuracoes corretas.
    ECHO     Certifique-se de que o arquivo backend\.env existe.
    ECHO.
    
    SET /P CONTINUAR_SEM_ENV="Deseja continuar mesmo assim? (S/N): "
    IF /I "!CONTINUAR_SEM_ENV!" NEQ "S" (
        ECHO.
        ECHO Execucao cancelada.
        PAUSE
        EXIT /B 1
    )
    COLOR 0B
) ELSE (
    ECHO     [OK] Arquivo .env encontrado!
)

ECHO.

REM ================================================================
REM ETAPA 5: Verificar se start-estoque-facil.js existe
REM ================================================================

IF NOT EXIST "start-estoque-facil.js" (
    COLOR 0C
    ECHO [ERRO] Arquivo 'start-estoque-facil.js' nao encontrado!
    ECHO.
    ECHO O arquivo de inicializacao esta faltando.
    ECHO Verifique se extraiu o ZIP completo.
    ECHO.
    PAUSE
    EXIT /B 1
)

REM ================================================================
REM ETAPA 6: Executar o sistema
REM ================================================================

COLOR 0A
ECHO ======================================================
ECHO     INICIANDO ESTOQUE FACIL...
ECHO ======================================================
COLOR 0B
ECHO.

ECHO [*] Iniciando backend e frontend...
ECHO.
ECHO     IMPORTANTE: 
ECHO     - 2 janelas vao abrir ^(backend e frontend^)
ECHO     - NAO feche essas janelas enquanto usar o sistema!
ECHO     - O navegador abrira automaticamente
ECHO     - Use Ctrl+C nas janelas para encerrar o sistema
ECHO.

REM Executar o script principal
node start-estoque-facil.js

REM ================================================================
REM ETAPA 7: Capturar codigo de saida
REM ================================================================

IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO ======================================================
    ECHO [ERRO] Falha ao executar o Estoque Facil
    ECHO ======================================================
    ECHO.
    ECHO Codigo de erro: %ERRORLEVEL%
    ECHO.
    ECHO Possiveis causas:
    ECHO 1. Porta 5000 ou 3000 ja esta em uso
    ECHO 2. Erro de conexao com MongoDB
    ECHO 3. Arquivo .env com configuracoes incorretas
    ECHO 4. Dependencias corrompidas ou incompletas
    ECHO.
    ECHO Solucoes:
    ECHO 1. Verifique se nenhum outro programa usa as portas 5000 e 3000
    ECHO 2. Verifique a conexao com internet ^(se usa MongoDB Atlas^)
    ECHO 3. Confira as configuracoes no arquivo backend\.env
    ECHO 4. Execute 'instalacao_inicial.bat' novamente
    ECHO.
    ECHO Para diagnostico detalhado, consulte os logs acima.
    ECHO.
    ECHO Para ajuda, consulte:
    ECHO - GUIA_INSTALACAO_ZIP.md ^(Secao 6: Problemas Comuns^)
    ECHO - GUIA_INSTALACAO_USO.md ^(Secao 5: Resolucao de Problemas^)
    ECHO.
    PAUSE
    EXIT /B %ERRORLEVEL%
)

ECHO.
ECHO ======================================================
ECHO     Sistema encerrado normalmente
ECHO ======================================================
ECHO.
ECHO [*] Para iniciar novamente, execute este script.
ECHO.
PAUSE

ENDLOCAL
EXIT /B 0