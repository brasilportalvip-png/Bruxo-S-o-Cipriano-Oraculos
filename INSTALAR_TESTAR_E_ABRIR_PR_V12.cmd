@echo off
setlocal EnableExtensions
title BRUXO SAO CIPRIANO ORACULOS - V12
echo.
echo ========================================================
echo   BRUXO SAO CIPRIANO ORACULOS - V12
echo   ORACULO DE SAO CIPRIANO (11o ORACULO) + BRUXO CIPRIANO
echo ========================================================
echo.

set "PACOTE=%~dp0"
set "PACOTE=%PACOTE:~0,-1%"
set "ARQUIVOS=%PACOTE%\V12_ARQUIVOS"
set "PATCH=%PACOTE%\v12-oraculo-sao-cipriano.patch"
set "PROJETO=%PACOTE%\Bruxo-Cipriano-V12"
set "BRANCH=feat/v12-oraculo-sao-cipriano"
set "REPO=brasilportalvip-png/Bruxo-S-o-Cipriano-Oraculos"

echo Pasta do pacote : "%PACOTE%"
echo Pasta do projeto: "%PROJETO%"
echo.

where git >nul 2>nul || goto :git_error
where node >nul 2>nul || goto :node_error
if not exist "%ARQUIVOS%\src\oracle-engine\profiles\sao-cipriano.ts" goto :zip_error

echo [1/11] Baixando o projeto atualizado do GitHub...
if exist "%PROJETO%\.git\" goto :atualizar_clone
if exist "%PROJETO%\" rmdir /S /Q "%PROJETO%"
git clone "https://github.com/%REPO%.git" "%PROJETO%" || goto :clone_error
goto :clone_ok
:atualizar_clone
git -C "%PROJETO%" fetch origin main || goto :clone_error
git -C "%PROJETO%" checkout -f -B main origin/main || goto :clone_error
git -C "%PROJETO%" clean -fd -e node_modules || goto :clone_error
:clone_ok

cd /d "%PROJETO%" || goto :repo_error

echo [2/11] Abrindo a branch da V12...
git switch -C "%BRANCH%" || goto :branch_error

echo [3/11] Aplicando as atualizacoes da V12 (preserva o que mudou no site)...
git apply --3way --whitespace=nowarn "%PATCH%" >nul 2>nul
if not errorlevel 1 goto :aplicado
echo   O projeto mudou desde o pacote; usando copia direta dos arquivos.
git reset --hard -q
robocopy "%ARQUIVOS%" "%PROJETO%" /E /NFL /NDL /NJH /NJS /NP /R:2 /W:1
if errorlevel 8 goto :copy_error
:aplicado
copy /Y "%~f0" "%PROJETO%\INSTALAR_TESTAR_E_ABRIR_PR_V12.cmd" >nul
copy /Y "%PACOTE%\LEIA-ME-CORRECAO-V12.txt" "%PROJETO%\LEIA-ME-CORRECAO-V12.txt" >nul

echo [4/11] Instalando dependencias (pode demorar alguns minutos)...
call npx -y npm@10.9.2 ci --no-audit --no-fund || goto :fail
echo [5/11] Conferindo seguranca das dependencias (mesma regra do GitHub)...
call npx -y npm@10.9.2 audit --omit=dev --audit-level=high || goto :audit_error
echo       Atualizando os sitemaps com o novo oraculo...
call npm run seo:sitemaps || goto :fail
echo [6/11] Verificando TypeScript...
call npm run lint || goto :fail
echo [7/11] Executando todos os testes automaticos...
call npm test || goto :fail
echo [8/11] Validando imagens e arquivos oficiais...
call npm run validate:assets || goto :fail
echo [9/11] Gerando versao de producao...
call npm run build || goto :fail
call npm run smoke:serverless || goto :fail
call npm run smoke:production || goto :fail

echo [10/11] TESTE DE USUARIO REAL (navegador de verdade, computador e celular)...
call npx -y npm@10.9.2 install --no-save --no-audit --no-fund playwright@1 || goto :e2e_setup_error
call npx playwright install chromium || goto :e2e_setup_error
call node scripts\e2e-usuario-real.cjs
set "E2E=%errorlevel%"
if exist "TESTE_USUARIO_REAL\relatorio.html" start "" "TESTE_USUARIO_REAL\relatorio.html"
if not "%E2E%"=="0" goto :e2e_error

echo [11/11] Enviando ao GitHub e abrindo o Pull Request...
git config user.email >nul 2>nul || git config user.email "279750991+brasilportalvip-png@users.noreply.github.com"
git config user.name >nul 2>nul || git config user.name "brasilportalvip-png"
git config core.autocrlf false
git add -A
git commit -m "feat: Oraculo de Sao Cipriano - 11o oraculo + consultor Bruxo Cipriano (V12)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01VZGem6phDhDezYVwwvUSXX" || goto :commit_error
git push -u --force origin "%BRANCH%" || goto :push_error

where gh >nul 2>nul || goto :pr_browser
gh pr create --repo "%REPO%" --base main --head "%BRANCH%" --title "V12: Oraculo de Sao Cipriano (11o oraculo) + consultor Bruxo Cipriano" --body-file "LEIA-ME-CORRECAO-V12.txt" >nul 2>nul
gh pr view "%BRANCH%" --repo "%REPO%" --web && goto :done
:pr_browser
start "" "https://github.com/%REPO%/compare/main...%BRANCH%?expand=1"
echo No GitHub, clique em "Create pull request".

:done
echo.
echo ========================================================
echo   CONCLUIDO COM SUCESSO
echo ========================================================
echo O relatorio do teste de usuario real foi aberto no navegador.
echo Aguarde os testes do GitHub ficarem verdes e clique em "Merge pull request".
echo Depois que a Vercel publicar, abra /oraculos/sao-cipriano e faca uma consulta com o Bruxo Cipriano.
pause
exit /b 0

:e2e_setup_error
echo ERRO: nao foi possivel instalar o navegador de teste (Playwright/Chromium). Verifique a internet e rode de novo.
goto :stop
:e2e_error
echo ERRO: o teste de usuario real encontrou problema GRAVE (veja o relatorio que abriu). Nada foi enviado ao GitHub.
echo Me mande o print do relatorio para eu corrigir.
goto :stop
:audit_error
echo ERRO: ha vulnerabilidade alta/critica nas dependencias (veja a lista acima). Nada foi enviado ao GitHub.
goto :stop
:git_error
echo ERRO: Git nao encontrado. Instale em https://git-scm.com e rode de novo.
goto :stop
:node_error
echo ERRO: Node.js nao encontrado. Instale a versao 22 em https://nodejs.org e rode de novo.
goto :stop
:zip_error
echo ERRO: a pasta V12_ARQUIVOS nao foi encontrada ao lado deste instalador.
echo Extraia o ZIP inteiro (use "Extrair tudo") e rode o instalador de dentro da pasta extraida.
goto :stop
:clone_error
echo ERRO: nao foi possivel baixar o projeto do GitHub. Verifique a internet e o login do GitHub.
goto :stop
:copy_error
echo ERRO: falha ao copiar os arquivos da V12. Feche programas abertos nessa pasta e rode de novo.
goto :stop
:repo_error
echo ERRO: nao foi possivel abrir a pasta do projeto.
goto :stop
:branch_error
echo ERRO: nao foi possivel abrir a branch.
goto :stop
:commit_error
echo ERRO: nao foi possivel criar o commit.
goto :stop
:push_error
echo ERRO: nao foi possivel enviar ao GitHub. Confira se esta logado (git / gh auth login).
goto :stop
:fail
echo ERRO: uma verificacao falhou (veja a mensagem acima). Nada foi enviado ao GitHub.
:stop
echo.
pause
exit /b 1
