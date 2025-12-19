#!/bin/bash
echo "[1/3] Gerando indice de eventos com Python..."
python3 gerar_indice.py

echo ""
echo "[2/3] Preparando arquivos para o GitHub..."
git add .
read -p "Digite a mensagem do commit: " msg
if [ -z "$msg" ]; then
    msg="Atualizacao automatica de eventos"
fi

git commit -m "$msg"

echo ""
echo "[3/3] Enviando para o servidor..."
git push origin main

echo ""
echo "Finalizado com sucesso!"
