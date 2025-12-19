import os
import json

def gerar_indice_eventos():
    # Caminho da pasta de eventos
    caminho_eventos = os.path.join('content', 'eventos')
    
    # Lista todos os arquivos .json na pasta, ignorando o próprio index.json e .gitkeep
    arquivos = [
        f for f in os.listdir(caminho_eventos) 
        if f.endswith('.json') and f != 'index.json'
    ]
    
    # Salva a lista em um arquivo chamado index.json dentro da pasta eventos
    caminho_saida = os.path.join(caminho_eventos, 'index.json')
    
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        json.dump(arquivos, f, ensure_ascii=False, indent=4)
    
    print(f"Sucesso! Índice gerado com {len(arquivos)} eventos em: {caminho_saida}")

if __name__ == "__main__":
    gerar_indice_eventos()