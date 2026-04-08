@echo off
title eSocial SST - Terminal
color 0A
cls

echo.
echo  ==========================================
echo   eSocial SST ^| Terminal de Desenvolvimento
echo  ==========================================
echo.

:: Entrar na pasta do projeto
cd /d C:\esocial-sst

:: Corrigir URL do repositorio
git remote set-url origin https://github.com/dsegia/esocial-sst.git >nul 2>&1

:: Sincronizar com GitHub
echo  Sincronizando com GitHub...
git pull origin main --rebase >nul 2>&1
if %errorlevel% equ 0 (
  echo  [OK] Projeto atualizado!
) else (
  echo  [AVISO] Sem conexao com GitHub agora.
)

echo.
echo  Pasta: C:\esocial-sst
echo  Site:  esocial-sst.vercel.app
echo.
echo  ==========================================
echo   COMANDOS RAPIDOS:
echo  ==========================================
echo.
echo  [1] Enviar atualizacoes ao GitHub + Vercel:
echo      git add -A ^&^& git commit -m "msg" ^&^& git push origin main
echo.
echo  [2] Rodar site localmente (http://localhost:3000):
echo      npm run dev
echo.
echo  [3] Ver o que mudou:
echo      git status
echo.
echo  [4] Ver ultimos commits:
echo      git log --oneline -5
echo.
echo  [5] Instalar pacotes novos:
echo      npm install nome-do-pacote --save
echo  ==========================================
echo.

:: Abrir VS Code
start code . >nul 2>&1

cmd /k "cd /d C:\esocial-sst && echo Pronto! Digite seu comando abaixo:"