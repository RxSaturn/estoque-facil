@echo off
SETLOCAL EnableDelayedExpansion
TITLE Instalacao Inicial - Estoque Facil v1.0
COLOR 0B

REM ================================================================
REM SCRIPT DE INSTALACAO INICIAL - ESTOQUE FACIL
REM Versao: 1.0
REM Descricao: Instala todas as dependencias necessarias
REM ================================================================

ECHO.
ECHO ======================================================
ECHO     INSTALACAO INICIAL DO ESTOQUE FACIL - v1.0
ECHO     Data: %date% %time%
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
    ECHO Por favor, instale o Node.js antes de continuar:
    ECHO 1. Acesse: https://nodejs.org
    ECHO 2. Baixe a versao LTS ^(recomendada^)
    ECHO 3. Execute o instalador
    ECHO 4. IMPORTANTE: Marque "Add to PATH" durante a instalacao
    ECHO 5. Reinicie o computador apos instalar
    ECHO 6. Execute este script novamente
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
    ECHO     Reinstale o Node.js e tente novamente.
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
    ECHO     Certifique-se de executar este script na pasta raiz do projeto.
    ECHO     Estrutura esperada:
    ECHO       estoque-facil\
    ECHO       - backend\
    ECHO       - frontend\
    ECHO       - instalacao_inicial.bat ^(este arquivo^)
    PAUSE
    EXIT /B 1
)

IF NOT EXIST "frontend" (
    COLOR 0C
    ECHO     [ERRO] Pasta 'frontend' nao encontrada!
    ECHO     Certifique-se de executar este script na pasta raiz do projeto.
    PAUSE
    EXIT /B 1
)

ECHO     [OK] Estrutura de pastas validada!
ECHO.

REM ================================================================
REM ETAPA 3: Verificar arquivo .env
REM ================================================================

ECHO [*] Verificando arquivo de configuracao ^(.env^)...

IF NOT EXIST "backend\.env" (
    COLOR 0E
    ECHO     [AVISO] Arquivo .env nao encontrado em backend\
    ECHO.
    ECHO     O arquivo .env contem configuracoes importantes como:
    ECHO     - Conexao com banco de dados MongoDB
    ECHO     - Chave secreta JWT
    ECHO     - Configuracoes de portas
    ECHO.
    ECHO     Se voce recebeu o sistema em ZIP, o arquivo .env deve estar incluido.
    ECHO.
    
    SET /P CONTINUAR="Deseja continuar mesmo assim? (S/N): "
    IF /I "!CONTINUAR!" NEQ "S" (
        ECHO.
        ECHO Instalacao cancelada. Configure o .env e tente novamente.
        PAUSE
        EXIT /B 1
    )
) ELSE (
    ECHO     [OK] Arquivo .env encontrado!
)
ECHO.

REM ================================================================
REM ETAPA 4: Criar pastas necessarias
REM ================================================================

ECHO [*] Criando pastas necessarias...

REM Criar pasta uploads
IF NOT EXIST "backend\uploads" (
    mkdir "backend\uploads" 2>nul
    IF %ERRORLEVEL% EQU 0 (
        ECHO     [OK] Pasta 'uploads' criada com sucesso!
    ) ELSE (
        COLOR 0E
        ECHO     [AVISO] Nao foi possivel criar pasta 'uploads'
    )
) ELSE (
    ECHO     [OK] Pasta 'uploads' ja existe
)

REM Criar pasta uploads/produtos
IF NOT EXIST "backend\uploads\produtos" (
    mkdir "backend\uploads\produtos" 2>nul
    IF %ERRORLEVEL% EQU 0 (
        ECHO     [OK] Pasta 'uploads\produtos' criada com sucesso!
    ) ELSE (
        COLOR 0E
        ECHO     [AVISO] Nao foi possivel criar pasta 'uploads\produtos'
    )
) ELSE (
    ECHO     [OK] Pasta 'uploads\produtos' ja existe
)

ECHO.

REM ================================================================
REM ETAPA 5: Instalar dependencias do BACKEND
REM ================================================================

ECHO ======================================================
ECHO [*] INSTALANDO DEPENDENCIAS DO BACKEND
ECHO     Isso pode demorar alguns minutos...
ECHO     Por favor, aguarde e NAO feche esta janela!
ECHO ======================================================
ECHO.

cd backend

REM Verificar se package.json existe
IF NOT EXIST "package.json" (
    COLOR 0C
    ECHO [ERRO] Arquivo package.json nao encontrado em backend\
    PAUSE
    cd ..
    EXIT /B 1
)

REM Executar npm install
ECHO [*] Executando npm install no backend...
ECHO.

call npm install

IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO ======================================================
    ECHO [ERRO] Falha ao instalar dependencias do backend!
    ECHO ======================================================
    ECHO.
    ECHO Possiveis causas:
    ECHO 1. Conexao com internet instavel ou ausente
    ECHO 2. Antivirus bloqueando instalacao
    ECHO 3. Falta de espaco em disco
    ECHO 4. Versao do Node.js incompativel
    ECHO.
    ECHO Solucoes:
    ECHO 1. Verifique sua conexao com a internet
    ECHO 2. Temporariamente desative o antivirus
    ECHO 3. Libere espaco em disco ^(minimo 1GB^)
    ECHO 4. Use Node.js versao 18 ou superior
    ECHO.
    ECHO Para tentar novamente, execute este script outra vez.
    ECHO.
    PAUSE
    cd ..
    EXIT /B 1
)

ECHO.
COLOR 0A
ECHO ======================================================
ECHO     [OK] Backend instalado com sucesso!
ECHO ======================================================
COLOR 0B
ECHO.

cd ..

REM ================================================================
REM ETAPA 6: Instalar dependencias do FRONTEND
REM ================================================================

ECHO ======================================================
ECHO [*] INSTALANDO DEPENDENCIAS DO FRONTEND
ECHO     Isso pode demorar varios minutos ^(5-15min^)...
ECHO     Por favor, aguarde e NAO feche esta janela!
ECHO ======================================================
ECHO.

cd frontend

REM Verificar se package.json existe
IF NOT EXIST "package.json" (
    COLOR 0C
    ECHO [ERRO] Arquivo package.json nao encontrado em frontend\
    PAUSE
    cd ..
    EXIT /B 1
)

REM Executar npm install
ECHO [*] Executando npm install no frontend...
ECHO.

call npm install

IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO ======================================================
    ECHO [ERRO] Falha ao instalar dependencias do frontend!
    ECHO ======================================================
    ECHO.
    ECHO Possiveis causas:
    ECHO 1. Conexao com internet instavel ou ausente
    ECHO 2. Antivirus bloqueando instalacao
    ECHO 3. Falta de espaco em disco
    ECHO 4. Versao do Node.js incompativel
    ECHO.
    ECHO Solucoes:
    ECHO 1. Verifique sua conexao com a internet
    ECHO 2. Temporariamente desative o antivirus
    ECHO 3. Libere espaco em disco ^(minimo 2GB^)
    ECHO 4. Use Node.js versao 18 ou superior
    ECHO.
    ECHO Para tentar novamente, execute este script outra vez.
    ECHO.
    PAUSE
    cd ..
    EXIT /B 1
)

ECHO.
COLOR 0A
ECHO ======================================================
ECHO     [OK] Frontend instalado com sucesso!
ECHO ======================================================
COLOR 0B
ECHO.

cd ..

REM ================================================================
REM ETAPA 7: Atualizar browserslist ^(opcional mas recomendado^)
REM ================================================================

ECHO [*] Atualizando browserslist...
ECHO.

cd frontend
call npx browserslist@latest --update-db >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    ECHO     [OK] Browserslist atualizado com sucesso!
) ELSE (
    COLOR 0E
    ECHO     [AVISO] Nao foi possivel atualizar browserslist ^(nao e critico^)
    COLOR 0B
)
cd ..

ECHO.

REM ================================================================
REM ETAPA 8: Verificar instalacao
REM ================================================================

ECHO [*] Verificando instalacao...

SET INSTALL_OK=1

REM Verificar node_modules do backend
IF NOT EXIST "backend\node_modules" (
    ECHO     [ERRO] Pasta backend\node_modules nao encontrada!
    SET INSTALL_OK=0
)

REM Verificar node_modules do frontend
IF NOT EXIST "frontend\node_modules" (
    ECHO     [ERRO] Pasta frontend\node_modules nao encontrada!
    SET INSTALL_OK=0
)

IF !INSTALL_OK! EQU 0 (
    COLOR 0C
    ECHO.
    ECHO [ERRO] A instalacao nao foi concluida corretamente!
    ECHO Execute este script novamente.
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO     [OK] Instalacao verificada com sucesso!
ECHO.

REM ================================================================
REM CONCLUSAO
REM ================================================================

COLOR 0A
ECHO.
ECHO ======================================================
ECHO ======================================================
ECHO.
ECHO     INSTALACAO CONCLUIDA COM SUCESSO! ^(^_^^)
ECHO.
ECHO ======================================================
ECHO ======================================================
ECHO.
COLOR 0B

ECHO Resumo da instalacao:
ECHO   [OK] Node.js: !NODE_VERSION!
ECHO   [OK] NPM: v!NPM_VERSION!
ECHO   [OK] Backend: Dependencias instaladas
ECHO   [OK] Frontend: Dependencias instaladas
ECHO   [OK] Pastas: Criadas e verificadas
ECHO.

ECHO Proximos passos:
ECHO   1. Execute 'executar-estoque-facil.bat' para iniciar o sistema
ECHO   2. O navegador abrira automaticamente em http://localhost:3000
ECHO   3. Crie sua conta na primeira vez
ECHO   4. Consulte GUIA_INSTALACAO_ZIP.md para mais informacoes
ECHO.

REM ================================================================
REM Perguntar se deseja iniciar o sistema agora
REM ================================================================

SET /P INICIAR="Deseja iniciar o Estoque Facil agora? (S/N): "

IF /I "!INICIAR!" EQU "S" (
    ECHO.
    ECHO Iniciando Estoque Facil...
    ECHO.
    
    REM Verificar se o script executar existe
    IF EXIST "executar-estoque-facil.bat" (
        call executar-estoque-facil.bat
    ) ELSE (
        COLOR 0E
        ECHO [AVISO] Arquivo 'executar-estoque-facil.bat' nao encontrado!
        ECHO.
        ECHO Para iniciar o sistema manualmente:
        ECHO 1. Abra um terminal na pasta 'backend' e execute: npm run dev
        ECHO 2. Abra outro terminal na pasta 'frontend' e execute: npm start
        ECHO.
        PAUSE
    )
) ELSE (
    ECHO.
    ECHO Para iniciar o sistema posteriormente, execute:
    ECHO   executar-estoque-facil.bat
    ECHO.
    PAUSE
)

ENDLOCAL
EXIT /B 0
