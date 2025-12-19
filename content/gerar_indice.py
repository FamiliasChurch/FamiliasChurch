import os
import json

def gerar_indice_pasta(pasta_relativa):
    caminho = os.path.join(pasta_relativa)
    if not os.path.exists(caminho):
        return
    
    # Busca arquivos .json válidos
    arquivos = [f for f in os.listdir(caminho) if f.endswith('.json') and f != 'index.json']
    
    with open(os.path.join(caminho, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(arquivos, f, ensure_ascii=False, indent=4)
    print(f"✅ Índice atualizado: {pasta_relativa}")

def executar_todos():
    pastas = [
        'content/eventos',
        'content/publicacoes/devocionais',
        'content/publicacoes/estudos'
    ]
    for p in pastas:
        gerar_indice_pasta(p)

if __name__ == "__main__":
    executar_todos()