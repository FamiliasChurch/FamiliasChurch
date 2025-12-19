@echo off
echo [1/3] Gerando indice de eventos com Python...
python gerar_indice.py

echo.
echo [2/3] Preparando arquivos para o GitHub...
git add .
set /p msg="Digite a mensagem do commit (ou aperte Enter para padrao): "
if "%msg%"=="" set msg="Atualizacao automatica de eventos"

git commit -m "%msg%"

echo.
echo [3/3] Enviando para o servidor...
git push origin main

echo.
echo Finalizado com sucesso!
pause
