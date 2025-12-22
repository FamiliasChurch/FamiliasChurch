import os
import json

# Caminho das pastas conforme sua estrutura no VS Code
CONTENT_DIR = "content/membros"
OUTPUT_FILE = "content/membros_all.json"

def bundle_membros():
    todos_membros = []
    
    for filename in os.listdir(CONTENT_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(CONTENT_DIR, filename), 'r', encoding='utf-8') as f:
                dados = json.load(f)
                
                # Garante que o novo campo WhatsApp e Nascimento sejam incluídos
                membro_validado = {
                    "id": dados.get("id"),
                    "nome": dados.get("full_name"),
                    "cargo": dados.get("cargo", "Membro"),
                    "whatsapp": dados.get("whatsapp", "Não informado"), # NOVO CAMPO
                    "nascimento": dados.get("nascimento"),
                    "avatar_url": dados.get("avatar_url", "https://www.w3schools.com/howto/img_avatar.png")
                }
                todos_membros.append(membro_validado)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(todos_membros, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {len(todos_membros)} membros consolidados com sucesso!")

if __name__ == "__main__":
    bundle_membros()